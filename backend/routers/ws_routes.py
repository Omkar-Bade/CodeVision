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

        # ── Custom input() replacement ───────────────────────────────────
        def _interactive_input(prompt: str = "") -> str:
            if cancelled.is_set():
                raise SystemExit("Execution cancelled")

            # Send the prompt to stdout (like real Python) and request input
            if prompt:
                streaming_stdout.write(prompt)

            loop.call_soon_threadsafe(
                send_queue.put_nowait,
                {"type": "input_request", "prompt": prompt},
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

            exec_globals = {"input": _interactive_input}
            compiled = compile(code, "<codevision>", "exec")
            exec(compiled, exec_globals)  # noqa: S102

            # Success
            loop.call_soon_threadsafe(
                send_queue.put_nowait,
                {"type": "done"},
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
