import Editor from "@monaco-editor/react";

function CodeEditor() {
  function handleEditorChange(value: string | undefined) {
    console.log("Code changed:", value);
  }

  return (
    <Editor
      height="400px"
      defaultLanguage="javascript"
      defaultValue="// Start coding here..."
      theme="vs-dark"
      onChange={handleEditorChange}
    />
  );
}

export default CodeEditor;
