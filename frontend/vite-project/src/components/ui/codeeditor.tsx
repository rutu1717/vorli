import { Box, HStack } from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import { useState, useRef, useEffect } from "react";
import LanguageSelector from "./languageselector";
import { CODE_SNIPPETS } from "@/constants";
import Output from "./output";
export type Language = keyof typeof CODE_SNIPPETS;

function MyCodeEditor() {
    const [value, setValue] = useState<string>(`\nfunction greet(name) {\n\tconsole.log("Hello, " + name + "!");\n}\n\ngreet("Alex");\n`);
    const [language, setLanguage] = useState<Language>("javascript");
    const editorRef = useRef<any>(null);
    const onMount = (editor: any) => {
        editorRef.current = editor;
        editor.focus();
    }
    const getFromLocalStorage = () => {
        const code = localStorage.getItem("code");
        if (code) {
            setValue(code);
        }
    }
    const onSelect = (language: Language) => {
        setLanguage(language);
        setValue(CODE_SNIPPETS[language])
    }
    useEffect(() => {
        getFromLocalStorage();
    }, []);
    return (
        <Box>
            <HStack >
                <Box w='50%'>
                    <LanguageSelector onSelect={onSelect} language={language} />
                    <Editor
                        height="75vh"
                        theme="vs-dark"
                        language={language}
                        defaultLanguage="javascript"
                        defaultValue={CODE_SNIPPETS[language]}
                        value={value}
                        onMount={onMount}
                        onChange={(newValue) => { setValue(newValue || '') }}
                    />
                </Box>
                <Output editorRef={editorRef} language={language} />
            </HStack>
        </Box>
    )
}
export default MyCodeEditor