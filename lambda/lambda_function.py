"""Runs arbitrary code and provides details of its execution."""

import contextlib
import io
import json
import numbers
import sys


@contextlib.contextmanager
def stdout_eater():

    """Redirects `sys.stdout` output to a string buffer."""

    old_stdout = sys.stdout
    new_stdout = io.StringIO()
    sys.stdout = new_stdout
    yield new_stdout
    sys.stdout = old_stdout


def lambda_handler(event, _context):

    """Handles invocation from AWS Lambda."""

    print(event)
    locals_dict = {}

    try:
        code = compile(event["body"], "<string>", "exec")
        with stdout_eater() as eater:
            exec(code, locals_dict, locals_dict)
    except Exception as exc:
        status_code = 400
        response = "{}: {}".format(exc.__class__.__name__, exc)
        output = ""
    else:
        status_code = 200
        response = "OK"
        output = eater.getvalue()

    locals_serialised = {}
    for (key, value) in locals_dict.items():
        if key == "__builtins__":
            continue
        if isinstance(value, (str, numbers.Number)):
            value_serialised = value
        else:
            try:
                value_serialised = json.dumps(value)
            except TypeError:
                value_serialised = str(value)
        locals_serialised[key] = value_serialised

    body = json.dumps({
        "response": response,
        "stdout": output,
        "locals": locals_serialised,
    })

    output = {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": body,
    }

    print(output)
    return output
