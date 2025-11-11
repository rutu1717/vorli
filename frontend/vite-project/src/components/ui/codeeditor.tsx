import { Box } from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import { useRef, useState } from "react";
import LanguageSelector from "./languageselector";

function MyCodeEditor () {
    const [value,setValue] = useState('');
    const [language,setLanguage] = useState("javascript");
   const editorRef = useRef<any>(null);
    const onMount = (editor:any) =>{
        editorRef.current = editor;
        editor.focus();
    }
    const onSelect = (language:string) =>{
        setLanguage(language);
    }
    return (
        <Box>
        <LanguageSelector onSelect={onSelect} language={language}/>
        <Editor 
        height = "75vh"
        theme = "vs-dark"
        language={language}
        defaultLanguage="javascript"
        defaultValue="// some comment"
        value={value}
        onMount={onMount}
        onChange={()=>{setValue(value)}}
        />
        </Box>
    )
}
export default MyCodeEditor