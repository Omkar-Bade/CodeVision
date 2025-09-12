"""
executor.py — CodeVision Python execution engine

Runs user-submitted Python code inside a sys.settrace hook so every
line executed produces a snapshot of the interpreter state.

Each snapshot (step) contains:
  - line       : line number that just executed
  - code       : source text of that line
  - memory     : dict of user variables  →  { value, size_bytes, type }
  - event      : "line" or "return"

Memory size is measured with sys.getsizeof() which returns the
*shallow* footprint of the object itself in CPython (bytes).
For containers (list, dict, set) this is the size of the container
shell only — it does NOT recursively count the contained items.
This is intentional: it matches what CPython actually allocates for
the variable binding and is a useful educational approximation.

Typical shallow sizes on CPython 3.11 (64-bit):
  int   (small)  : 28 bytes
  float          : 24 bytes
  bool           : 28 bytes
  str  (1 char)  : 50 bytes  + 1 byte per extra character
  list (empty)   : 56 bytes  + 8 bytes per extra slot
  dict (empty)   : 184 bytes
  set  (empty)   : 216 bytes
"""

import sys
import io
import traceback
from typing import Any, Dict, List

# Hard cap on the number of execution steps to prevent infinite loops
MAX_STEPS = 500


# ── Value serialization ──────────────────────────────────────────────────────

def serialize_value(v: Any) -> Any:
    """
    Recursively convert a Python value to a JSON-serializable form.
    Containers are truncated to 20 items to keep payloads small.
    Falls back to repr() for any type not handled explicitly.
    """
    try:
        if v is None:
            return None
        elif isinstance(v, bool):
            # Must be checked before int because bool is a subclass of int
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
            # Sets are unordered — sort for stable display
            return sorted([serialize_value(i) for i in list(v)[:20]], key=str)
        else:
            return repr(v)
    except Exception:
        return str(v)


def get_memory_size(v: Any) -> int:
    """
    Return the shallow memory footprint of v in bytes using sys.getsizeof().
    Returns 0 if the measurement fails for any reason.
    """
    try:
        return sys.getsizeof(v)
    except Exception:
        return 0


def get_python_type(v: Any) -> str:
    """
    Return a clean, human-readable Python type name for v.
    Uses the actual runtime type so subclasses (e.g. bool) are named correctly.
    """
    if v is None:
        return "NoneType"
    return type(v).__name__


# ── Variable extraction ──────────────────────────────────────────────────────

# Built-in names that are always present in a module frame but are NOT
# user-defined variables — skip them when building the memory snapshot.
_EXCLUDED_NAMES = {
    "__builtins__", "__name__", "__doc__", "__package__",
    "__loader__", "__spec__", "__annotations__", "__file__",
    "__cached__", "__build_class__",
}


def get_user_vars(f_locals: Dict) -> Dict:
    """
    Extract user-defined variables from a frame's local namespace and return
    a structured snapshot that includes the serialized value, its memory size,
    and its Python type name.

    Each entry in the returned dict looks like:
        {
            "value"     : <JSON-serializable representation>,
            "size_bytes": <int — shallow sys.getsizeof() in bytes>,
            "type"      : <str — Python type name, e.g. "int", "str", "list">
        }

    Functions and other callables are excluded because they clutter the
    visualization without adding educational value for beginners.
    """
    result = {}
    for k, v in f_locals.items():
        # Skip dunder names and known built-in frame attributes
        if k in _EXCLUDED_NAMES or k.startswith("__"):
            continue
        # Skip functions / lambdas / classes but keep all data types
        if callable(v) and not isinstance(
            v, (int, float, str, bool, list, dict, tuple, set, type(None))
        ):
            continue

        result[k] = {
            "value"     : serialize_value(v),
            "size_bytes": get_memory_size(v),
            "type"      : get_python_type(v),
        }
    return result


# ── Main execution engine ────────────────────────────────────────────────────

def execute_code(code: str) -> Dict:
    """
    Execute Python source code and capture a step-by-step execution trace.

    Strategy
    --------
    1. Compile the source with a custom filename ("<codevision>") so the
       tracer can distinguish user code from stdlib frames.
    2. Install a sys.settrace hook that fires on every "line" and "return"
       event inside the user's code.
    3. On each "line" event, record the state of the *previous* line
       (memory reflects what that line produced after it ran).
    4. On the final "return" event, record the very last line's state.
    5. Redirect stdout/stderr to a StringIO buffer so print() output is
       captured and returned separately rather than written to the terminal.

    Returns
    -------
    {
        "steps"      : list of step dicts,
        "output"     : captured stdout string,
        "error"      : error message string or None,
        "total_steps": int
    }
    """
    steps: List[Dict] = []
    code_lines = code.split("\n")

    # Mutable container so the inner tracer closure can update it
    prev_lineno = [None]

    def tracer(frame, event, arg):
        # Ignore any frames not belonging to user-submitted code
        if frame.f_code.co_filename != "<codevision>":
            return tracer

        # Safety guard: stop tracing if we've hit the step limit
        if len(steps) >= MAX_STEPS:
            raise RuntimeError(
                f"Execution exceeded {MAX_STEPS} steps. "
                "Possible infinite loop detected."
            )

        lineno = frame.f_lineno

        if event == "line":
            # When we move to a new line, the PREVIOUS line has fully executed.
            # Record its state now so memory reflects what that line produced.
            if prev_lineno[0] is not None:
                prev = prev_lineno[0]
                line_code = (
                    code_lines[prev - 1].strip()
                    if 0 < prev <= len(code_lines)
                    else ""
                )
                steps.append({
                    "step"  : len(steps) + 1,
                    "line"  : prev,
                    "code"  : line_code,
                    "memory": get_user_vars(frame.f_locals),
                    "event" : "line",
                })
            prev_lineno[0] = lineno

        elif event == "return":
            # The function is about to return — capture the final line's state
            line_code = (
                code_lines[lineno - 1].strip()
                if 0 < lineno <= len(code_lines)
                else ""
            )
            steps.append({
                "step"  : len(steps) + 1,
                "line"  : lineno,
                "code"  : line_code,
                "memory": get_user_vars(frame.f_locals),
                "event" : "return",
            })

        return tracer

    # Redirect stdout/stderr so print() output is captured, not printed
    old_stdout, old_stderr = sys.stdout, sys.stderr
    sys.stdout = io.StringIO()
    sys.stderr = io.StringIO()
    error_info = None

    try:
        compiled = compile(code, "<codevision>", "exec")
        sys.settrace(tracer)
        exec(compiled, {})  # noqa: S102
    except SyntaxError as e:
        error_info = f"SyntaxError on line {e.lineno}: {e.msg}"
    except RuntimeError as e:
        error_info = str(e)
    except Exception:
        error_info = traceback.format_exc()
    finally:
        sys.settrace(None)          # always remove the trace hook
        output        = sys.stdout.getvalue()
        sys.stdout    = old_stdout
        sys.stderr    = old_stderr

    # Remove consecutive identical steps that can appear during nested calls
    unique_steps: List[Dict] = []
    for step in steps:
        if (
            unique_steps
            and unique_steps[-1]["line"]   == step["line"]
            and unique_steps[-1]["memory"] == step["memory"]
            and unique_steps[-1]["event"]  == step["event"]
        ):
            continue
        unique_steps.append(step)

    # Re-number steps sequentially after deduplication
    for i, step in enumerate(unique_steps):
        step["step"] = i + 1

    return {
        "steps"      : unique_steps,
        "output"     : output,
        "error"      : error_info,
        "total_steps": len(unique_steps),
    }
