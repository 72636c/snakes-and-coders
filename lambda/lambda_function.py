"""Runs arbitrary code and provides details of its execution."""

from io import StringIO
from multiprocessing import Process
from numbers import Number
import json
import sys
import textwrap

# Timeout for code execution.
TIMEOUT_SECONDS = 3

# Other pre-defined variables.
ASSERT_CONTENT_TYPE = "Content-Type should be application/json"
ERROR_TIMEOUT = "took too long to run :("


def lambda_handler(event, _=None):

    """Handles invocation from AWS Lambda."""

    print(event)

    try:
        headers = dict((k.lower(), v) for k, v in event["headers"].items())
        content_type = headers["content-type"].lower()
        assert content_type == "application/json", ASSERT_CONTENT_TYPE
    except (AssertionError, KeyError) as exc:
        status_code = 400
        exc.__traceback__
        status = "{}: {}".format(exc.__class__.__name__, exc)
        body = _assemble_response_body(status)
    else:
        (status_code, body) = service_request(event)

    response = {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": body,
    }

    print(response)
    return response


def service_request(request):

    """Runs code per a JSON request and captures execution details."""

    assert_tests = {}
    print_tests = {}
    stdout_ = StringIO()
    variables = {}

    try:
        body = json.loads(request["body"])
        setup = body["setup"]
        main = body["main"]
        assert_tests = body["tests"]["asserts"]
        print_tests = body["tests"]["prints"]
        code = _assemble_code(setup, main, assert_tests)
        _validate_timebox(code)
        _exec_with_redirect(code, variables, stdout_)
    except BaseException as exc:
        status_code = 400
        status = "{}: {}".format(exc.__class__.__name__, exc)
    else:
        status_code = 200
        status = "OK"

    prints = stdout_.getvalue()
    str_vars = _stringify_variables(variables)
    tests = _eval_tests(variables, prints, print_tests)
    body = _assemble_response_body(status, prints, str_vars, tests)

    return (status_code, body)


def _assemble_code(setup, main, tests):

    """Pieces together and compiles some source code."""

    # Provide "correct" line number in SyntaxErrors.
    compile(setup, filename="<string>", mode="exec", optimize=0)
    compile(main, filename="<string>", mode="exec", optimize=0)

    source = textwrap.dedent(
        """\
        {setup}
        {main}
        asserts = []
        """
    ).format(main=main, setup=setup)

    for expression in tests:
        source += textwrap.dedent(
            """\
            try:
                assert {expression}
            except:
                asserts.append(False)
            else:
                asserts.append(True)
            """
        ).format(expression=expression)

    return compile(source, filename="<string>", mode="exec", optimize=0)


def _assemble_response_body(status="", stdout="", variables=None, tests=None):

    """Assembles the JSON response body based on execution details."""

    if variables is None:
        variables = {}

    if tests is None:
        tests = {
            "asserts": {},
            "prints": {},
        }

    return json.dumps({
        "status": status,
        "stdout": stdout,
        "variables": variables,
        "tests": tests,
    })


def _eval_tests(variables, prints, print_tests):

    """Evaluates whether tests were passed by the executed code."""

    try:
        result_asserts = variables["asserts"]
        assert isinstance(result_asserts, list)
    except (AssertionError, KeyError):
        result_asserts = []

    result_prints = [value in prints for value in print_tests]

    return {
        "asserts": result_asserts,
        "prints": result_prints,
    }


def _exec_with_redirect(code, variables=None, stdout_=None):

    """Wraps an `exec()` call with `sys.stdout` redirection."""

    if variables is None:
        variables = {}

    old_stdout = sys.stdout
    sys.stdout = stdout_

    try:
        exec(code, variables, variables)
    except BaseException:
        sys.stdout = old_stdout
        raise
    else:
        sys.stdout = old_stdout


def _stringify_variables(variables):

    """Converts values in a variable dictionary into numerics and strings."""

    result = {}

    for (key, value) in variables.items():
        if key in ("__builtins__", "asserts"):
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


def _validate_timebox(code, timeout=TIMEOUT_SECONDS):

    """Validates that code execution completes within a timebox."""

    process = Process(target=_exec_with_redirect, name="Exec", args=(code,))
    process.start()
    process.join(timeout)

    if process.is_alive():
        process.terminate()
        process.join()
        raise TimeoutError(ERROR_TIMEOUT)
