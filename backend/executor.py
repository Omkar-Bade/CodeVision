import sys
import io
import traceback
from copy import deepcopy
from typing import Any, Dict, List

MAX_STEPS = 500


def serialize_value(v: Any) -> Any:
    """Convert Python value to JSON-serializable format."""
    try:
        if v is None:
            return None
        elif isinstance(v, bool):
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
        else:
            return repr(v)
    except Exception:
        return str(v)


def get_user_vars(f_locals: Dict) -> Dict:
    """Extract user-defined variables from frame locals."""
    excluded = {
        "__builtins__", "__name__", "__doc__", "__package__",
        "__loader__", "__spec__", "__annotations__", "__file__",
        "__cached__", "__build_class__",
    }
    result = {}
    for k, v in f_locals.items():
        if k in excluded:
            continue
        if k.startswith("__"):
            continue
        if callable(v) and not isinstance(v, (int, float, str, bool, list, dict, tuple, set, type(None))):
            continue
        result[k] = serialize_value(v)
    return result


def execute_code(code: str) -> Dict:
    """
    Execute Python code and capture step-by-step execution states.
    Uses sys.settrace to intercept line-by-line execution.
    Returns list of steps with line number, code text, and memory snapshot.
    """
    steps: List[Dict] = []
    code_lines = code.split("\n")
    prev_lineno = [None]

    def tracer(frame, event, arg):
        # Only trace code compiled from our source
        if frame.f_code.co_filename != "<codevision>":
            return tracer

        if len(steps) >= MAX_STEPS:
            raise RuntimeError(
                f"Execution exceeded {MAX_STEPS} steps. Possible infinite loop detected."
            )

        lineno = frame.f_lineno

        if event == "line":
            # Record state from previous line (memory reflects state after it executed)
            if prev_lineno[0] is not None:
                prev = prev_lineno[0]
                line_code = (
                    code_lines[prev - 1].strip()
                    if 0 < prev <= len(code_lines)
                    else ""
                )
                steps.append(
                    {
                        "step": len(steps) + 1,
                        "line": prev,
                        "code": line_code,
                        "memory": get_user_vars(frame.f_locals),
                        "event": "line",
                    }
                )
            prev_lineno[0] = lineno

        elif event == "return":
            # Capture final state after the last line
            line_code = (
                code_lines[lineno - 1].strip()
                if 0 < lineno <= len(code_lines)
                else ""
            )
            steps.append(
                {
                    "step": len(steps) + 1,
                    "line": lineno,
                    "code": line_code,
                    "memory": get_user_vars(frame.f_locals),
                    "event": "return",
                }
            )

        return tracer

    old_stdout = sys.stdout
    old_stderr = sys.stderr
    captured_stdout = io.StringIO()
    captured_stderr = io.StringIO()
    sys.stdout = captured_stdout
    sys.stderr = captured_stderr

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
        sys.settrace(None)
        sys.stdout = old_stdout
        sys.stderr = old_stderr

    output = captured_stdout.getvalue()

    # Deduplicate consecutive identical steps (can happen with nested calls)
    unique_steps = []
    for step in steps:
        if unique_steps and unique_steps[-1]["line"] == step["line"] and \
                unique_steps[-1]["memory"] == step["memory"] and \
                unique_steps[-1]["event"] == step["event"]:
            continue
        unique_steps.append(step)

    # Re-number steps
    for i, step in enumerate(unique_steps):
        step["step"] = i + 1

    return {
        "steps": unique_steps,
        "output": output,
        "error": error_info,
        "total_steps": len(unique_steps),
    }
