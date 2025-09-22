"""
executor.py — CodeVision Python execution engine (v3)

Runs user-submitted Python code inside a sys.settrace hook and produces
a step-by-step execution trace suitable for the CodeVision visualizer.

Architecture
------------
The key design challenge with function tracing is that Python's "line"
event fires BEFORE a line executes, not after.  To capture the state
AFTER a line runs we use a "pending" pattern:

  • When we see "line N", we flush (record) the PREVIOUS pending line
    for that frame (because it has now fully executed), then mark line N
    as the new pending.
  • When "return" fires for a frame, we flush the last pending line for
    that frame, then record the return itself.

Critically, each frame gets its OWN pending entry (keyed by frame id).
The old single-global prev_lineno approach broke on function calls
because a "call" event switches the active frame without flushing the
caller's pending correctly.  Per-frame tracking fixes this completely.

Each step contains:
  step        — sequential index (1-based)
  line        — source line number
  code        — stripped source text of that line
  memory      — { name: {value, size_bytes, type} } for the current scope
  event       — "line" | "call" | "return" | "exception"
  scope       — "global" or function name
  call_stack  — [ {name, locals}, … ] outermost → current
  annotations — [ {type, detail}, … ]  educational hints

Annotation types:
  call       – entering a user function
  return     – function returning a value
  input      – input() simulated
  type_cast  – int() / str() / float() etc.
  builtin    – len() / range() / type() etc.
  exception  – runtime error
"""

import sys
import io
import re
import traceback
from typing import Any, Dict, List, Optional
from collections import deque

MAX_STEPS = 500


# ── Value serialization ──────────────────────────────────────────────

def serialize_value(v: Any) -> Any:
    try:
        if v is None:
            return None
        elif isinstance(v, bool):          # must precede int check
            return v
        elif isinstance(v, (int, float)):
            return v
        elif isinstance(v, str):
            return v
        elif isinstance(v, (list, tuple)):
            return [serialize_value(i) for i in list(v)[:20]]
        elif isinstance(v, dict):
            return {str(k): serialize_value(val) for k, val in list(v.items())[:20]}
        elif isinstance(v, set):
            return sorted([serialize_value(i) for i in list(v)[:20]], key=str)
        elif isinstance(v, range):
            return list(v)[:20]
        else:
            return repr(v)
    except Exception:
        return str(v)


def get_memory_size(v: Any) -> int:
    try:
        return sys.getsizeof(v)
    except Exception:
        return 0


def get_python_type(v: Any) -> str:
    if v is None:
        return "NoneType"
    return type(v).__name__


# ── Variable extraction ──────────────────────────────────────────────

_EXCLUDED_NAMES = {
    "__builtins__", "__name__", "__doc__", "__package__",
    "__loader__", "__spec__", "__annotations__", "__file__",
    "__cached__", "__build_class__", "__return__",
}


def get_user_vars(f_locals: Dict) -> Dict:
    """Return a snapshot of user-defined variables from a frame's locals."""
    result = {}
    for k, v in f_locals.items():
        if k in _EXCLUDED_NAMES or k.startswith("__"):
            continue
        # Exclude callables (functions, lambdas, classes) — keep data values
        if callable(v) and not isinstance(
            v, (int, float, str, bool, list, dict, tuple, set, type(None))
        ):
            continue
        result[k] = {
            "value":      serialize_value(v),
            "size_bytes": get_memory_size(v),
            "type":       get_python_type(v),
        }
    return result


# ── Annotation helpers ────────────────────────────────────────────────

_TYPE_CAST_RE  = re.compile(r'\b(int|float|str|bool|list|dict|set|tuple)\s*\(')
_BUILTIN_RE    = re.compile(
    r'\b(len|type|range|abs|max|min|sum|sorted|reversed|enumerate|'
    r'zip|map|filter|round|pow|chr|ord|hex|oct|bin|isinstance)\s*\('
)
_INPUT_RE      = re.compile(r'\binput\s*\(')


def detect_annotations(line_code: str) -> List[Dict]:
    """Produce educational annotation tags for notable constructs on a line."""
    ann = []
    for m in _TYPE_CAST_RE.finditer(line_code):
        ann.append({"type": "type_cast",
                    "detail": f"{m.group(1)}() — converts the value to {m.group(1)}"})
    for m in _BUILTIN_RE.finditer(line_code):
        ann.append({"type": "builtin",
                    "detail": f"{m.group(1)}() called"})
    if _INPUT_RE.search(line_code):
        ann.append({"type": "input",
                    "detail": "input() — reads user input"})
    return ann


# ── Main execution engine ─────────────────────────────────────────────

def execute_code(code: str, inputs: Optional[List[str]] = None) -> Dict:
    """
    Execute Python source and return a full step-by-step trace.

    Parameters
    ----------
    code   : Python source string.
    inputs : Values fed to input() calls, in order.

    Returns
    -------
    { steps, output, error, total_steps }
    """

    steps: List[Dict] = []
    code_lines = code.split("\n")

    # ── Per-frame state ───────────────────────────────────────────
    # frame_pending : frame_id → lineno that has been entered but not yet
    #                 flushed (i.e. the line that most recently fired a
    #                 "line" event and is currently executing).
    frame_pending: Dict[int, int] = {}

    # frame_names   : frame_id → scope label ("global" or function name)
    frame_names: Dict[int, str] = {}

    # call_stack    : ordered list of active function frames (excluding global).
    #                 Each entry: { "name": str, "locals": dict }
    call_stack: List[Dict] = []

    # ── Helpers ───────────────────────────────────────────────────

    def line_text(lineno: int) -> str:
        """Return the stripped source text for a 1-based line number."""
        if 0 < lineno <= len(code_lines):
            return code_lines[lineno - 1].strip()
        return ""

    def stack_snapshot() -> List[Dict]:
        """Immutable snapshot of the current call stack for embedding in a step."""
        return [{"name": f["name"], "locals": dict(f["locals"])}
                for f in call_stack]

    def record(frame, lineno: int, event: str,
               extra_ann: Optional[List[Dict]] = None) -> None:
        """Append one step to the trace."""
        if len(steps) >= MAX_STEPS:
            return
        lc = line_text(lineno)
        scope = frame_names.get(id(frame), "global")
        all_ann = (extra_ann or []) + detect_annotations(lc)
        steps.append({
            "step":        len(steps) + 1,
            "line":        lineno,
            "code":        lc,
            "memory":      get_user_vars(frame.f_locals),
            "event":       event,
            "scope":       scope,
            "call_stack":  stack_snapshot(),
            "annotations": all_ann,
        })

    def flush_pending(frame) -> None:
        """
        If this frame has a pending (entered-but-not-yet-recorded) line,
        record it as a 'line' step now.  This is called when a LATER event
        confirms that the pending line has fully completed.
        """
        fid = id(frame)
        if fid in frame_pending:
            ln = frame_pending.pop(fid)
            record(frame, ln, "line")

    # ── Tracer ────────────────────────────────────────────────────

    def tracer(frame, event, arg):
        # Only trace user-submitted code, not stdlib/built-ins
        if frame.f_code.co_filename != "<codevision>":
            return tracer

        if len(steps) >= MAX_STEPS:
            raise RuntimeError(
                f"Execution exceeded {MAX_STEPS} steps. "
                "Possible infinite loop detected."
            )

        fid       = id(frame)
        lineno    = frame.f_lineno
        func_name = frame.f_code.co_name

        # ── CALL ─────────────────────────────────────────────────
        if event == "call":
            if func_name == "<module>":
                # Top-level module frame — label it "global", no step emitted
                frame_names[fid] = "global"
            else:
                # Entering a user-defined function:
                #   1. Label the new frame
                #   2. Push it onto the call stack
                #   3. Emit a "call" step so the visualizer shows the entry point
                frame_names[fid] = func_name
                call_stack.append({"name": func_name, "locals": {}})
                record(frame, lineno, "call", [
                    {"type": "call",
                     "detail": f"Calling {func_name}() — new stack frame created"}
                ])
            return tracer

        # ── LINE ─────────────────────────────────────────────────
        if event == "line":
            # Keep the call-stack locals in sync with the current frame
            scope = frame_names.get(fid, "global")
            if call_stack and scope != "global":
                call_stack[-1]["locals"] = get_user_vars(frame.f_locals)

            # The previously pending line for THIS frame has now finished —
            # record its post-execution state and mark the new line as pending.
            flush_pending(frame)
            frame_pending[fid] = lineno
            return tracer

        # ── RETURN ───────────────────────────────────────────────
        if event == "return":
            scope = frame_names.get(fid, "global")

            # Sync locals one final time
            if call_stack and scope != "global":
                call_stack[-1]["locals"] = get_user_vars(frame.f_locals)

            # Flush the last line inside this function (it fully executed)
            flush_pending(frame)

            # Emit a "return" step for user functions (not the module frame)
            if scope not in ("global", "<module>"):
                ret_str = repr(arg) if arg is not None else "None"
                record(frame, lineno, "return", [
                    {"type":   "return",
                     "detail": f"{scope}() returned {ret_str}"}
                ])
                # Remove this frame from the call stack
                if call_stack:
                    call_stack.pop()

            return tracer

        # ── EXCEPTION ────────────────────────────────────────────
        if event == "exception":
            exc_msg = str(arg[1]) if arg else "Unknown error"
            record(frame, lineno, "exception", [
                {"type": "exception", "detail": exc_msg}
            ])
            return tracer

        return tracer

    # ── Simulated input() ─────────────────────────────────────────
    input_queue = deque(inputs or [])

    def fake_input(prompt=""):
        val = input_queue.popleft() if input_queue else ""
        # Echo prompt + value to stdout so it appears in console output
        sys.stdout.write(f"{prompt}{val}\n")
        return val

    # ── Execute ───────────────────────────────────────────────────
    old_stdout, old_stderr = sys.stdout, sys.stderr
    sys.stdout  = io.StringIO()
    sys.stderr  = io.StringIO()
    error_info  = None

    exec_globals = {"input": fake_input}

    try:
        compiled = compile(code, "<codevision>", "exec")
        sys.settrace(tracer)
        exec(compiled, exec_globals)  # noqa: S102
    except SyntaxError as e:
        error_info = f"SyntaxError on line {e.lineno}: {e.msg}"
    except RuntimeError as e:
        error_info = str(e)
    except Exception:
        error_info = traceback.format_exc()
    finally:
        sys.settrace(None)
        output     = sys.stdout.getvalue()
        sys.stdout = old_stdout
        sys.stderr = old_stderr

    # ── Deduplication ─────────────────────────────────────────────
    # Remove consecutive identical steps (same line + memory + event + scope).
    # "call" and "return" steps are NEVER deduplicated — they carry distinct
    # educational meaning even when memory hasn't changed.
    unique: List[Dict] = []
    for step in steps:
        if (
            unique
            and step["event"] not in ("call", "return", "exception")
            and unique[-1]["line"]   == step["line"]
            and unique[-1]["memory"] == step["memory"]
            and unique[-1]["event"]  == step["event"]
            and unique[-1]["scope"]  == step["scope"]
        ):
            continue
        unique.append(step)

    for i, s in enumerate(unique):
        s["step"] = i + 1

    return {
        "steps":       unique,
        "output":      output,
        "error":       error_info,
        "total_steps": len(unique),
    }
