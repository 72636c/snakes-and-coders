// Python API endpoint.
const API_URL = "https://rqbnzw6j8k.execute-api.ap-southeast-2.amazonaws.com/prod/arbitrary-execution"
const API_KEY = "OGOkeZSQ1S8w6sJDtfAHq5MvUqUqLPTyywIIhUO6"

// Run when DOM is ready for execution.
$(document).ready(function() {
  // Get initial input.
  var editorValue = localStorage.getItem("editorValue");
  if (editorValue === null) {
    editorValue = $("code#code-editor-value").text();
    console.log(editorValue);
  }
  // Set up the Monaco Editor.
  require.config({ paths: { "vs": "node_modules/monaco-editor/min/vs" }});
  require(["vs/editor/editor.main"], function() {
    var editor = monaco.editor.create(document.getElementById("code-editor-container"), {
      value: editorValue,
      theme: "vs-dark",
      language: "python",
      automaticLayout: true
    });
    // Auto-save input every second.
    window.setInterval(function() {
      localStorage.setItem("editorValue", editor.getValue());
    }, 1000);
  });
});

// Submit form when Cmd/Ctrl + F9 is hit.
$(document).keyup(function(event) {
  if ((event.ctrlKey || event.metaKey) && (event.keyCode == 120)) {
    event.stopPropagation();
    $("form#code-editor-form").submit();
  }
});

// Process code when form is submitted.
$("form#code-editor-form").submit(function(event) {
  event.preventDefault();
  $("input#code-editor-run").prop("disabled", true);
  $.ajax({
    contentType: "text/plain",
    data: monaco.editor.getModels()[0].getValue(),
    processData: false,
    type: "POST",
    url: API_URL,
    beforeSend: function(request) {
      request.setRequestHeader("X-Api-Key", API_KEY);
      request.setRequestHeader("X-Amz-Invocation-Type", "Event");
    },
    success: function(data) {
      handleResponse(data);
      console.log(data);
    },
    error: function(xhr) {
      handleResponse(xhr.responseJSON);
      console.log(xhr);
    }
  });
});

// Handle JSON response from AJAX request.
function handleResponse(data) {
  $("div#code-exec-response").text(trimTrailingNewline(data.response)).trigger("change");
  $("div#code-exec-stdout").text(trimTrailingNewline(data.stdout)).trigger("change");
  $("div#code-exec-locals").text(stringifyLocals(data.locals)).trigger("change");
  $("input#code-editor-run").prop("disabled", false);
}

// Convert locals dictionary to multi-line string.
function stringifyLocals(locals) {
  var result = "";
  for (var key in locals) {
    result += key + " = " + JSON.stringify(locals[key]) + "\n";
  }
  return trimTrailingNewline(result);
}

// Remove newline from the end of a string.
function trimTrailingNewline(text) {
  return text.replace(/\n$/, "");
}
