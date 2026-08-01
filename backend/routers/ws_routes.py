"""
ws_routes.py — WebSocket-based interactive code execution for CodeVision.

Provides a WS /ws/execute endpoint that runs user Python code in a background
thread with TRUE interactive input() support.  Every print() is streamed to the
client in real time, and each input() call pauses execution until the user
sends a response over the WebSocket.

Protocol (JSON messages)
------------------------
Client → Server:
  {"type": "run",            "code": "..."}          — start execution
  {"type": "input_response", "value": "..."}         — reply to an input() prompt

Server → Client:
  {"type": "output",         "text": "..."}          — stdout chunk
  {"type": "input_request",  "prompt": "..."}        — code called input()
  {"type": "done"}                                   — execution finished normally
  {"type": "error",          "message": "..."}       — execution error or timeout

Design notes:
  • User code is synchronous, so it runs in a daemon thread (not asyncio).
  • Communication between the sync thread and the async WebSocket uses an
    asyncio.Queue (thread → WS) and a threading.Event (WS → thread).
  • A 30-second wall-clock timeout prevents infinite loops from hanging the
    server.  The thread is marked as a daemon so it cannot outlive the process.
  • On client disconnect, a cancelled flag is set and the custom input() raises
    SystemExit to unwind the user code cleanly.
"""

import asyncio
import json
import threading
import io
import traceback
import sys
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

# Same limits as the POST /execute endpoint in main.py.
MAX_CODE_LENGTH = 10_000
EXECUTION_TIMEOUT = 30  # seconds


# ── Streaming stdout wrapper ──────────────────────────────────────────────────

class _StreamingStdout(io.TextIOBase):
    """
    A file-like object that intercepts every write() call and pushes the text
    into an asyncio.Queue for the WebSocket sender loop to pick up.

    Uses loop.call_soon_threadsafe so it is safe to call from a non-async thread.
    """

    def __init__(self, queue: asyncio.Queue, loop: asyncio.AbstractEventLoop):
        self._queue = queue
        self._loop = loop

    def write(self, s: str) -> int:
        if s:  # skip empty writes
            self._loop.call_soon_threadsafe(
                self._queue.put_nowait,
                {"type": "output", "text": s},
            )
        return len(s)

    def flush(self) -> None:
        pass  # no buffering

    @property
    def encoding(self) -> str:
        return "utf-8"

    def writable(self) -> bool:
        return True


# ── WebSocket endpoint ────────────────────────────────────────────────────────

@router.websocket("/ws/execute")
async def ws_execute(ws: WebSocket):
    await ws.accept()

    # Shared state between the async WS handler and the sync execution thread.
    send_queue: asyncio.Queue = asyncio.Queue()
    input_event = threading.Event()       # signalled when input_response arrives
    input_value: list = [""]              # mutable container for the response
    cancelled = threading.Event()         # set on disconnect to abort the thread
    thread_done = threading.Event()       # set when the exec thread finishes

    loop = asyncio.get_running_loop()

    # ── Sender task — drains send_queue → WebSocket ──────────────────────────
    async def _sender():
        """Reads messages from the queue and sends them over the WebSocket."""
        while True:
            msg = await send_queue.get()
            if msg is None:
                break  # poison pill — thread finished
            try:
                await ws.send_json(msg)
            except Exception:
                break

    sender_task = asyncio.create_task(_sender())

    # ── Execution thread target ──────────────────────────────────────────────
    def _run_code(code: str):
        """Runs user code with custom stdout and input() in a daemon thread."""

        streaming_stdout = _StreamingStdout(send_queue, loop)

        # ── Step tracing state ──────────────────────────────────────────
        from executor import (
            verify_code_security, get_safe_builtins, SecurityError,
            get_user_vars, detect_annotations, MAX_STEPS
        )

        code_lines = code.split("\n")
        precomputed_annotations = {
            lineno: detect_annotations(line)
            for lineno, line in enumerate(code_lines, start=1)
        }

        frame_pending = {}
        frame_names = {}
        call_stack = []
        step_counter = [0]
        last_step_ref = [{}]

        def line_text(lineno: int) -> str:
            if 0 < lineno <= len(code_lines):
                return code_lines[lineno - 1].strip()
            return ""

        def stack_snapshot():
            return [{"name": f["name"], "locals": dict(f["locals"])} for f in call_stack]

        def emit_step(frame, lineno: int, event: str, extra_ann=None):
            if step_counter[0] >= MAX_STEPS:
                return
            step_counter[0] += 1
            lc = line_text(lineno)
            scope = frame_names.get(id(frame), "global")
            line_ann = precomputed_annotations.get(lineno, [])
            all_ann = (extra_ann or []) + line_ann
            user_vars = get_user_vars(frame.f_locals)

            step_data = {
                "step":        step_counter[0],
                "line":        lineno,
                "code":        lc,
                "memory":      user_vars,
                "event":       event,
                "scope":       scope,
                "call_stack":  stack_snapshot(),
                "annotations": all_ann,
            }
            last_step_ref[0] = step_data
            loop.call_soon_threadsafe(
                send_queue.put_nowait,
                {"type": "step", "step": step_data},
            )

        def flush_pending(frame):
            fid = id(frame)
            if fid in frame_pending:
                ln = frame_pending.pop(fid)
                emit_step(frame, ln, "line")

        def ws_tracer(frame, event, arg):
            if frame.f_code.co_filename != "<codevision>":
                return ws_tracer

            if step_counter[0] >= MAX_STEPS:
                raise RuntimeError(f"Execution exceeded {MAX_STEPS} steps.")

            fid = id(frame)
            lineno = frame.f_lineno
            func_name = frame.f_code.co_name

            if event == "call":
                if func_name == "<module>":
                    frame_names[fid] = "global"
                else:
                    frame_names[fid] = func_name
                    call_stack.append({"name": func_name, "locals": {}})
                    emit_step(frame, lineno, "call", [
                        {"type": "call", "detail": f"Calling {func_name}()"}
                    ])
                return ws_tracer

            if event == "line":
                scope = frame_names.get(fid, "global")
                if call_stack and scope != "global":
                    call_stack[-1]["locals"] = get_user_vars(frame.f_locals)
                flush_pending(frame)
                frame_pending[fid] = lineno
                return ws_tracer

            if event == "return":
                scope = frame_names.get(fid, "global")
                if call_stack and scope != "global":
                    call_stack[-1]["locals"] = get_user_vars(frame.f_locals)
                flush_pending(frame)
                if scope not in ("global", "<module>"):
                    ret_str = repr(arg) if arg is not None else "None"
                    emit_step(frame, lineno, "return", [
                        {"type": "return", "detail": f"{scope}() returned {ret_str}"}
                    ])
                    if call_stack:
                        call_stack.pop()
                return ws_tracer

            if event == "exception":
                exc_msg = str(arg[1]) if arg else "Unknown error"
                emit_step(frame, lineno, "exception", [
                    {"type": "exception", "detail": exc_msg}
                ])
                return ws_tracer

            return ws_tracer

        # ── Custom input() replacement ───────────────────────────────────
        def _interactive_input(prompt: str = "") -> str:
            if cancelled.is_set():
                raise SystemExit("Execution cancelled")

            loop.call_soon_threadsafe(
                send_queue.put_nowait,
                {
                    "type": "input_request",
                    "prompt": prompt,
                    "step": last_step_ref[0],
                },
            )

            # Block until the client sends a response (or cancel / timeout)
            input_event.clear()
            while not input_event.wait(timeout=0.5):
                if cancelled.is_set():
                    raise SystemExit("Execution cancelled")
            # The main handler wrote into input_value[0] before setting the event
            return input_value[0]

        # ── Execute ──────────────────────────────────────────────────────
        old_stdout = sys.stdout
        old_stderr = sys.stderr
        try:
            sys.stdout = streaming_stdout
            sys.stderr = streaming_stdout

            verify_code_security(code)

            safe_builtins = get_safe_builtins()
            safe_builtins['input'] = _interactive_input
            exec_globals = {
                "__builtins__": safe_builtins,
            }

            compiled = compile(code, "<codevision>", "exec")
            sys.settrace(ws_tracer)
            exec(compiled, exec_globals)  # noqa: S102
        except SecurityError as e:
            loop.call_soon_threadsafe(
                send_queue.put_nowait,
                {"type": "error", "message": f"SecurityError: {str(e)}"},
            )
        except SystemExit:
            # Cancelled or user called exit() — not an error to report
            if not cancelled.is_set():
                loop.call_soon_threadsafe(
                    send_queue.put_nowait,
                    {"type": "done"},
                )
        except SyntaxError as e:
            loop.call_soon_threadsafe(
                send_queue.put_nowait,
                {"type": "error", "message": f"SyntaxError on line {e.lineno}: {e.msg}"},
            )
        except Exception:
            loop.call_soon_threadsafe(
                send_queue.put_nowait,
                {"type": "error", "message": traceback.format_exc()},
            )
        finally:
            sys.settrace(None)
            sys.stdout = old_stdout
            sys.stderr = old_stderr
            # Poison pill to stop the sender task
            loop.call_soon_threadsafe(send_queue.put_nowait, None)
            thread_done.set()

    # ── Main receive loop ────────────────────────────────────────────────────
    exec_thread: Optional[threading.Thread] = None

    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await ws.send_json({"type": "error", "message": "Invalid JSON"})
                continue

            msg_type = msg.get("type")

            # ── "run" — start executing code ─────────────────────────────
            if msg_type == "run":
                code = msg.get("code", "").strip()
                if not code:
                    await ws.send_json({"type": "error", "message": "Code cannot be empty"})
                    continue
                if len(code) > MAX_CODE_LENGTH:
                    await ws.send_json({
                        "type": "error",
                        "message": f"Code is too long (max {MAX_CODE_LENGTH:,} characters)",
                    })
                    continue

                # If a previous run is still going, cancel it first
                if exec_thread is not None and exec_thread.is_alive():
                    cancelled.set()
                    input_event.set()  # unblock if waiting for input
                    exec_thread.join(timeout=2)

                # Reset shared state for the new run
                cancelled.clear()
                input_event.clear()
                thread_done.clear()
                input_value[0] = ""

                # Recreate the sender task (previous one stopped on poison pill)
                if sender_task.done():
                    sender_task = asyncio.create_task(_sender())

                # Start execution in a daemon thread
                exec_thread = threading.Thread(
                    target=_run_code, args=(code,), daemon=True
                )
                exec_thread.start()

                # Watchdog: enforce the timeout from the async side
                async def _watchdog(thread: threading.Thread):
                    """Cancel execution if it exceeds the timeout."""
                    await asyncio.sleep(EXECUTION_TIMEOUT)
                    if thread.is_alive() and not cancelled.is_set():
                        cancelled.set()
                        input_event.set()  # unblock input() if waiting
                        try:
                            await ws.send_json({
                                "type": "error",
                                "message": f"Execution timed out ({EXECUTION_TIMEOUT}s limit)",
                            })
                        except Exception:
                            pass

                asyncio.create_task(_watchdog(exec_thread))

            # ── "input_response" — user typed a value ────────────────────
            elif msg_type == "input_response":
                input_value[0] = msg.get("value", "")
                input_event.set()

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        # Clean up: signal the execution thread to stop
        cancelled.set()
        input_event.set()  # unblock if waiting
        if not sender_task.done():
            sender_task.cancel()
        if exec_thread is not None and exec_thread.is_alive():
            exec_thread.join(timeout=2)
