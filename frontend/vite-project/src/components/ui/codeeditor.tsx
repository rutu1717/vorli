import { Box, useBreakpointValue } from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import { useState, useRef, useEffect } from "react";
import LanguageSelector from "./languageselector";
import { CODE_SNIPPETS } from "@/constants";
import Output from "./output";
export type Language = keyof typeof CODE_SNIPPETS;

function MyCodeEditor() {
    const [value, setValue] = useState<string>(`#include <iostream>\n\nint main() {\n\tstd::cout << "Hello World" << std::endl;\n\treturn 0;\n}\n`);
    const [language, setLanguage] = useState<Language>("cpp");
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
    const editorHeight = useBreakpointValue({ base: "45vh", lg: "75vh" }); // Reduce height on mobile to prevent scroll trap
    const onSelect = (language: Language) => {
        setLanguage(language);
        setValue(CODE_SNIPPETS[language])
    }
    useEffect(() => {
        getFromLocalStorage();
    }, []);
    return (
        <Box>
            {/* Responsive layout: column on mobile, row on desktop */}
            <Box 
                display="flex" 
                flexDirection={{ base: "column", lg: "row" }}
                gap={4}
            >
                <Box flex="1" minW={{ base: "100%", lg: "0" }}>
                    <LanguageSelector onSelect={onSelect} language={language} />
                    <Editor
                        height={editorHeight}
                        theme="vs-dark"
                        language={language}
                        defaultLanguage="cpp"
                        defaultValue={CODE_SNIPPETS[language]}
                        value={value}
                        onMount={onMount}
                        onChange={(newValue) => { setValue(newValue || '') }}
                    />
                </Box>
                <Output editorRef={editorRef} language={language} />
            </Box>
        </Box>
    )
}
export default MyCodeEditor