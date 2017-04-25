"""Runs arbitrary code and provides details of its execution."""

from io import StringIO
from multiprocessing import Process
from numbers import Number
import json
import sys

TIMEOUT_SECONDS = 3


def validate_timebox(obj, locals_):

    """Validate that execution completes within a timebox."""

    process = Process(target=exec, name="Exec", args=(obj, locals_, locals_))
    process.start()
    process.join(TIMEOUT_SECONDS)

    if process.is_alive():
        process.terminate()
        process.join()
        raise TimeoutError("took too long to run :(")


def serialise_locals(locals_):

    """Converts `locals()` values into numerics and strings."""

    result = {}

    for (key, value) in locals_.items():
        if key == "__builtins__":
            continue
        if isinstance(value, (Number, str)):
            new_value = value
        else:
            try:
                new_value = json.dumps(value)
            except TypeError:
                new_value = str(value)
        result[key] = new_value

    return result


def lambda_handler(event, _context=None):

    """Handles invocation from AWS Lambda."""

    print(event)
    old_stdout = sys.stdout
    new_stdout = StringIO()
    sys.stdout = new_stdout
    locals_ = {}

    try:
        code = compile(event["body"], "<string>", "exec")
        validate_timebox(code, locals_)
        exec(code, locals_, locals_)
    except Exception as exc:
        status_code = 400
        response = "{}: {}".format(exc.__class__.__name__, exc)
    else:
        status_code = 200
        response = "OK"

    body = json.dumps({
        "response": response,
        "stdout": new_stdout.getvalue(),
        "locals": serialise_locals(locals_),
    })

    output = {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": body,
    }

    sys.stdout = old_stdout
    print(output)
    return output
