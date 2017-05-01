/*global
    $, console, monaco, require, window
*/

// Python API endpoint.
var API_URL = "https://rqbnzw6j8k.execute-api.ap-southeast-2.amazonaws.com/prod/arbitrary-execution";
var API_KEY = "OGOkeZSQ1S8w6sJDtfAHq5MvUqUqLPTyywIIhUO6";

// Other predefined variables.
var EMPTY_LIST = "[]";
var NEWLINE = "\n";

// Remove newline from the end of a string.
function trimTrailingNewline(text) {
    "use strict";
    return text.replace(/\n$/, "");
}

// Remove forward slash from the end of a string.
function trimTrailingSlash(text) {
    "use strict";
    return text.replace(/\/$/, "");
}

// Add a hyphen to the start of a string if it is non-empty.
function addLeadingHyphen(text) {
    "use strict";
    if (text && text.length > 0) {
        return "-" + text;
    } else {
        return text;
    }
}

// Add newlines to the end of a string if it is non-empty.
function addTrailingNewlines(text, count) {
    "use strict";
    var result = trimTrailingNewline(text);
    if (result && result.length > 0) {
        result += NEWLINE.repeat(count);
    }
    return result;
}

// Convert variables dictionary to multi-line string.
function stringifyVariables(variables) {
    "use strict";
    var result = "";
    $.each(variables, function (key, value) {
        result += key + " = " + JSON.stringify(value).replace(/\\"/g, "\"") + "\n";
    });
    return trimTrailingNewline(result);
}

// Remove test details from view.
function removeTests() {
    "use strict";
    $("ul#code-exec-tests>li").not(":first").remove();
    $("div#tests-container").addClass("hide");
}

// Helper function for processTests().
function processTestsAuxiliary(tests, results, type) {
    "use strict";
    var testsContainer = $("div#tests-container");
    $.each(tests, function (index) {
        var test = $("ul#code-exec-tests>li").first().clone();
        if (results !== undefined && results[index] !== undefined) {
            if (results[index] === false) {
                test.addClass("fail");
            } else {
                test.addClass("pass");
            }
        }
        test.removeClass("hide");
        testsContainer.removeClass("hide");
        var message = "";
        if (type === "asserts") {
            message = tests[index].description.replace(/`([^`]*)`/g, "<code class=\"variable\">$1</code>");
        } else if (type === "prints") {
            message = "<code class=\"variable\">" + tests[index] + "</code> should be printed.";
        }
        test.html(message);
        $("ul#code-exec-tests").append(test);
    });
}

// Process test details and bring into view.
function processTests(results) {
    "use strict";
    removeTests();
    if (results === undefined) {
        results = {
            "asserts": undefined,
            "prints": undefined
        };
    }
    try {
        var tests_asserts = JSON.parse($("textarea#code-editor-tests-asserts").val());
        processTestsAuxiliary(tests_asserts, results.asserts, "asserts");
    } catch (ignore) {
        removeTests();
    }
    try {
        var tests_prints = JSON.parse($("textarea#code-editor-tests-prints").val());
        processTestsAuxiliary(tests_prints, results.prints, "prints");
    } catch (ignore) {
        removeTests();
    }
}

// Combines a status code and message for viewing.
function combineStatus(code, message) {
    "use strict";
    return "[" + code + "] " + message;
}

// Handle XMLHttpRequest response from AJAX request.
function handleResponse(xhr) {
    "use strict";
    var body = xhr.responseJSON;
    try {
        $("div#code-exec-response").text(addTrailingNewlines(body.stdout, 2) + combineStatus(xhr.status, trimTrailingNewline(body.status)));
        $("div#code-exec-variables").text(stringifyVariables(body.variables));
        processTests(body.tests);
    } catch (err) {
        $("div#code-exec-response").text(combineStatus(xhr.status, err.name + ": " + err.message));
        $("div#code-exec-variables").text("");
        removeTests();
    }
    $("input#code-editor-run").prop("disabled", false);
}

// Perform text processing on a config for "runtime variability".
function preprocessConfig(config) {
    "use strict";
    var stringified_config = JSON.stringify(config);
    // Substitute in random integers.
    try {
        var randomInts = config.replacements.random.int;
        $.each(randomInts, function (index) {
            var re = new RegExp(randomInts[index], "g");
            var randomInt = Math.floor(Math.random() * 100) + 1;
            stringified_config = stringified_config.replace(re, randomInt);
        });
    } catch (ignore) {
        return config;
    }
    return JSON.parse(stringified_config);
}

// Set up the Monaco Editor.
function setupMonacoEditor(localStorageKey) {
    "use strict";
    var editorValue = window.localStorage.getItem(localStorageKey);
    if (editorValue === null) {
        editorValue = $("code#code-editor-value").text();
    }
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
            window.localStorage.setItem(localStorageKey, editor.getValue());
        }, 1000);
    });
}

// Set up page according to retrieved config.
function setupPage(param, config) {
    "use strict";
    var localStorageKey = "editor-value";
    if (config === undefined) {
        $("textarea#code-editor-tests-asserts").val(EMPTY_LIST);
        $("textarea#code-editor-tests-prints").val(EMPTY_LIST);
        localStorageKey += addLeadingHyphen(param);
    } else {
        // Pre-process page configuration.
        config = preprocessConfig(config);
        // Set up the page configuration.
        var editorSetup = $("textarea#code-editor-setup");
        editorSetup.val(config.setup);
        if (editorSetup.val() === "") {
            editorSetup.addClass("hide");
        } else {
            editorSetup.removeClass("hide");
        }
        $("code#code-editor-value").text(config.main);
        $("textarea#code-editor-tests-asserts").val(JSON.stringify(config.tests.asserts));
        $("textarea#code-editor-tests-prints").val(JSON.stringify(config.tests.prints));
        processTests();
        localStorageKey += addLeadingHyphen(config.grouping);
    }
    setupMonacoEditor(localStorageKey);
}

// Run when DOM is ready for execution.
$(document).ready(function () {
    "use strict";
    // Retrieve config from URL parameter.
    var param = trimTrailingSlash(window.location.search.substring(1));
    var pathJSON = ("/config/" + param + ".json");
    $.ajax({
        dataType: "json",
        url: pathJSON,
        success: function (config) {
            setupPage(param, config);
        },
        error: function () {
            setupPage(param);
        }
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

// Re-process tests upon edits.
$("textarea#code-editor-tests-asserts").on("input change", processTests);
$("textarea#code-editor-tests-prints").on("input change", processTests);

// Toggle configuration fields when secret switch is hit.
$("span#secret-switch").click(function () {
    "use strict";
    if ($("section#secret-config").hasClass("hide")) {
        $("textarea#code-editor-setup").prop("disabled", false);
        $("textarea#code-editor-setup").removeClass("hide");
        $("section#secret-config").removeClass("hide");
    } else {
        $("textarea#code-editor-setup").prop("disabled", true);
        if ($("textarea#code-editor-setup").val() === "") {
            $("textarea#code-editor-setup").addClass("hide");
        }
        $("section#secret-config").addClass("hide");
    }
});

// Process code when form is submitted.
$("form#code-editor-form").submit(function (event) {
    "use strict";
    event.preventDefault();
    $("input#code-editor-run").prop("disabled", true);
    var tests_asserts;
    var tests_prints;
    var values_asserts = [];
    try {
        tests_asserts = JSON.parse($("textarea#code-editor-tests-asserts").val());
        $.each(tests_asserts, function (index) {
            values_asserts.push(tests_asserts[index].expression);
        });
        tests_prints = JSON.parse($("textarea#code-editor-tests-prints").val());
    } catch (ignore) {
        removeTests();
        $("div#code-exec-response").text(combineStatus("-1", "Bad Configuration"));
        $("input#code-editor-run").prop("disabled", false);
        return;
    }
    var body = {
        "setup": $("textarea#code-editor-setup").val(),
        "main": monaco.editor.getModels()[0].getValue(),
        "tests": {
            "asserts": values_asserts,
            "prints": tests_prints
        }
    };
    $.ajax({
        contentType: "application/json",
        data: JSON.stringify(body),
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
