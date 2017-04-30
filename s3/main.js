/*global
    $, console, monaco, require, window
*/

// Python API endpoint.
var API_URL = "https://rqbnzw6j8k.execute-api.ap-southeast-2.amazonaws.com/prod/arbitrary-execution";
var API_KEY = "OGOkeZSQ1S8w6sJDtfAHq5MvUqUqLPTyywIIhUO6";

// Other predefined variables.
var NEWLINE = "\n";

// Remove newline from the end of a string.
function trimTrailingNewline(text) {
    "use strict";
    return text.replace(/\n$/, "");
}

// Adds newlines to the end of a string if it is non-empty.
function addTrailingNewlines(text, count) {
    "use strict";
    var result = trimTrailingNewline(text);
    if (result && result.length > 0) {
        result += NEWLINE.repeat(count);
    }
    return result;
}

// Convert locals dictionary to multi-line string.
function stringifyLocals(locals) {
    "use strict";
    var result = "";
    $.each(locals, function (key, value) {
        result += key + " = " + JSON.stringify(value) + "\n";
        return;
    });
    return trimTrailingNewline(result);
}

// Handle XMLHttpRequest from AJAX request.
function handleResponse(xhr) {
    "use strict";
    var data = xhr.responseJSON;
    try {
        $("div#code-exec-response").text(
            addTrailingNewlines(data.stdout, 2)
            + "["
            + xhr.status
            + "] "
            + trimTrailingNewline(data.response)
        );
        $("div#code-exec-variables").text(stringifyLocals(data.locals));
    } catch (err) {
        $("div#code-exec-response").text(
            "["
            + xhr.status
            + "] "
            + err.name
            + ": "
            + err.message
        );
        $("div#code-exec-variables").text("");
    }
    $("input#code-editor-run").prop("disabled", false);
}

// Run when DOM is ready for execution.
$(document).ready(function () {
    "use strict";
    // Get initial input.
    var editorValue = window.localStorage.getItem("editorValue");
    if (editorValue === null) {
        editorValue = $("code#code-editor-value").text();
        console.log(editorValue);
    }
    // Set up the Monaco Editor.
    require.config({paths: {"vs": "node_modules/monaco-editor/min/vs"}});
    require(["vs/editor/editor.main"], function () {
        var editor = monaco.editor.create(document.getElementById("code-editor-container"), {
            value: editorValue,
            theme: "vs-dark",
            language: "python",
            automaticLayout: true
        });
        // Auto-save input every second.
        window.setInterval(function () {
            window.localStorage.setItem("editorValue", editor.getValue());
        }, 1000);
    });
});

// Submit form when F9 is hit.
$(document).keyup(function (event) {
    "use strict";
    if (event.keyCode === 120) {
        event.stopPropagation();
        $("form#code-editor-form").submit();
    }
});

// Process code when form is submitted.
$("form#code-editor-form").submit(function (event) {
    "use strict";
    event.preventDefault();
    $("input#code-editor-run").prop("disabled", true);
    $.ajax({
        contentType: "text/plain",
        data: monaco.editor.getModels()[0].getValue(),
        processData: false,
        type: "POST",
        url: API_URL,
        beforeSend: function (request) {
            request.setRequestHeader("X-Api-Key", API_KEY);
            request.setRequestHeader("X-Amz-Invocation-Type", "Event");
        },
        complete: function (xhr) {
            handleResponse(xhr);
        }
    });
});
