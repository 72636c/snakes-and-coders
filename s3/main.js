var editorForm = $("form#ide");
var runButton = $("input#run");

$(document).ready(function() {
  // Get initial input.
  var cached = localStorage.getItem("editorValue")
  var editorValue = cached
  if (editorValue === null) {
    editorValue = "print(\"Hello there\")"
  }
  // Set up the Monaco Editor.
  require.config({ paths: { "vs": "node_modules/monaco-editor/min/vs" }});
  require(["vs/editor/editor.main"], function() {
    var editor = monaco.editor.create(document.getElementById("editor-container"), {
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

$(document).keyup(function(event) {
  if ((event.ctrlKey || event.metaKey) && (event.keyCode == 120)) {
    event.stopPropagation();
    editorForm.submit();
  }
});

editorForm.submit(function(event) {
  event.preventDefault();
  runButton.prop("disabled", true);
  var $form = $(this),
      url = $form.attr("action");
  $.ajax({
    contentType: "text/plain",
    data: monaco.editor.getModels()[0].getValue(),
    processData: false,
    type: "POST",
    url: "https://rqbnzw6j8k.execute-api.ap-southeast-2.amazonaws.com/prod/arbitrary-execution",
    beforeSend: function(request) {
      request.setRequestHeader("X-Api-Key", "OGOkeZSQ1S8w6sJDtfAHq5MvUqUqLPTyywIIhUO6");
      request.setRequestHeader("X-Amz-Invocation-Type", "Event");
    },
    success: function(data) {
      $("div#response").text(data.response).trigger("change");
      var stdout = data.stdout.replace(/\n$/, "");
      $("div#stdout").text(stdout).trigger("change");
      var locals = "";
      for (var key in data.locals) {
        locals += key + " = " + JSON.stringify(data.locals[key]) + "\n";
      }
      locals = locals.replace(/\n$/, "")
      $("div#locals").text(locals).trigger("change");
      console.log(data);
      runButton.prop("disabled", false);
    },
    error: function(jqxhr) {
      var error = jqxhr.responseJSON;
      $("div#response").text(error.response).trigger("change");
      var stdout = error.stdout.replace(/\n$/, "")
      $("div#stdout").text(stdout).trigger("change");
      var locals = "";
      for (var key in error.locals) {
        locals += key + " = " + JSON.stringify(error.locals[key]) + "\n";
      }
      locals = locals.replace(/\n$/, "")
      $("div#locals").text(locals).trigger("change");
      console.log(jqxhr);
      runButton.prop("disabled", false);
    }
  });
});
