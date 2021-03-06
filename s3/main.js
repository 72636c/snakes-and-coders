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

// Remove surrounding quotes from a string.
function trimQuotes(text) {
    "use strict";
    return text.replace(/^"/, "").replace(/"$/, "");
}

// Add a character to the start of a string if it is non-empty.
function prependLeadingCharacter(text, char) {
    "use strict";
    if (text && text.length > 0) {
        return char + text;
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
        var cleansedValue = JSON.stringify(value.value).replace(/\\"/g, "\"");
        if (!value.isString) {
            cleansedValue = trimQuotes(cleansedValue);
        }
        result += key + " = " + cleansedValue + "\n";
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
        } else if (type === "prints-positives") {
            message = "<code class=\"variable\">" + tests[index] + "</code> is printed.";
        } else if (type === "prints-negatives") {
            message = "<code class=\"variable\">" + tests[index] + "</code> is not printed.";
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
            "prints": {
                "positives": undefined,
                "negatives": undefined
            }
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
        processTestsAuxiliary(tests_prints.positives, results.prints.positives, "prints-positives");
        processTestsAuxiliary(tests_prints.negatives, results.prints.negatives, "prints-negatives");
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
        if (soundEnabled()) {
            var utterance = new SpeechSynthesisUtterance(body.stdout);
            window.speechSynthesis.speak(utterance);
        }
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
            var randomInt = Math.floor(Math.random() * 50) + 1;
            stringified_config = stringified_config.replace(re, randomInt);
        });
    } catch (ignore) {
        return config;
    }
    return JSON.parse(stringified_config);
}

// Set up the Monaco Editor.
function setupMonacoEditor(localStorageKey, setupValue) {
    "use strict";
    var editorValue = window.localStorage.getItem(localStorageKey);
    if (editorValue === null) {
        editorValue = $("code#code-editor-value").text();
    }
    require.config({paths: {"vs": "node_modules/monaco-editor/min/vs"}});
    require(["vs/editor/editor.main"], function () {
        monaco.editor.create(document.getElementById("code-editor-setup-container"), {
            automaticLayout: true,
            language: "python",
            readOnly: true,
            theme: "vs-dark",
            value: setupValue,
            wrappingColumn: 0
        });
        var mainEditor = monaco.editor.create(document.getElementById("code-editor-main-container"), {
            automaticLayout: true,
            language: "python",
            theme: "vs-dark",
            value: editorValue,
            wrappingColumn: 0
        });
        // Auto-save input every second.
        window.setInterval(function () {
            window.localStorage.setItem(localStorageKey, mainEditor.getValue());
        }, 1000);
        $("form#code-editor-form").submit();
    });
}

// Set up page according to retrieved config.
function setupPage(param, config) {
    "use strict";
    if (soundEnabled()) {
        $("button#toggle-sound").removeClass("off");
    }
    var localStorageKey = "editor-value";
    if (config === undefined) {
        $("textarea#code-editor-tests-asserts").val(EMPTY_LIST);
        $("textarea#code-editor-tests-prints").val(EMPTY_LIST);
        localStorageKey += prependLeadingCharacter(param, "-");
    } else {
        // Pre-process page configuration.
        config = preprocessConfig(config);
        // Set up the page configuration.
        if (config.shorthand !== undefined && config.shorthand !== "") {
            $("span#page-subtitle").text("\u2002(" + config.shorthand + ")");
        }
        var editorSetup = $("div#code-editor-setup-container");
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
        localStorageKey += prependLeadingCharacter(config.grouping, "-");
    }
    setupMonacoEditor(localStorageKey, config.setup);
}

// Set up navigation buttons according to the retrieved config..
function setupNavigation(param, config) {
    "use strict";
    var prevLink = config[param].prev;
    var nextLink = config[param].next;
    $("a#nav-prev").attr("href", "?" + prevLink);
    $("a#nav-next").attr("href", "?" + nextLink);
}

// Run when DOM is ready for execution.
$(document).ready(function () {
    "use strict";
    // Retrieve config from URL parameter.
    var param = trimTrailingSlash(window.location.search.substring(1));
    $.ajax({
        dataType: "json",
        url: "navigation.json",
        success: function (config) {
            setupNavigation(param, config);
        }
    });
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

// Stop text-to-speech on close.
$(window).on("unload", function () {
    window.speechSynthesis.cancel();
});

// Submit form when F9 is hit.
$(document).keyup(function (event) {
    "use strict";
    if (event.keyCode === 120) {
        event.stopPropagation();
        $("form#code-editor-form").submit();
    }
});

// Checks if sound is enabled.
function soundEnabled() {
    "use strict";
    var sound = window.localStorage.getItem("sound");
    if (sound === null) {
        return false;
    }
    try {
        return JSON.parse(sound);
    } catch (ignore) {
        return false;
    }
}

// Toggle sound.
$("button#toggle-sound").click(function () {
    "use strict";
    var enabled = true;
    if (soundEnabled()) {
        enabled = false;
        $("button#toggle-sound").addClass("off");
    } else {
        $("button#toggle-sound").removeClass("off");
    }
    window.localStorage.setItem("sound", JSON.stringify(enabled));
});

// Re-process tests upon edits.
$("textarea#code-editor-tests-asserts").on("input change", processTests);
$("textarea#code-editor-tests-prints").on("input change", processTests);

// Toggle configuration fields when secret switch is hit.
$("span#secret-switch").click(function () {
    "use strict";
    if ($("section#secret-config").hasClass("hide")) {
        $("div#code-editor-setup-container").removeClass("hide");
        $("section#secret-config").removeClass("hide");
    } else {
        if (monaco.editor.getModels()[0].getValue() === "") {
            $("div#code-editor-setup-container").addClass("hide");
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
        "setup": monaco.editor.getModels()[0].getValue(),
        "main": monaco.editor.getModels()[1].getValue(),
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
