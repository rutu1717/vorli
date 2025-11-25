import { Box, Button, Text } from "@chakra-ui/react";
import type { Language } from "./codeeditor";
import { RefObject, useState } from "react";
import { executeCode } from "@/api";
type Outputprops = {
  editorRef: RefObject<any>;
  language: Language;
};
const Output = ({ editorRef, language }: Outputprops) => {
  const [output, setOutput] = useState<any>(null);
  const [isLoading, setisLoading] = useState<boolean>(false);
  const runCode = async () => {
    const sourceCode = editorRef.current?.getValue();
    if (!sourceCode) return;
    try {
      setisLoading(true);
      const { run: result } = await executeCode(sourceCode, language);
      const text =
        [result.stdout, result.stderr].filter(Boolean).join("\n") ||
        "No output";

      setOutput(text);
    } catch (error) {
    } finally {
      setisLoading(false);
    }
  };
  return (
    <Box w="50%">
      <Text mb={2}>Output</Text>
      <Button
        variant="outline"
        colorScheme="green" // in v3 it's `colorPalette`, but `colorScheme` still often works as alias
        mb={4}
        loading={isLoading}
        loadingText="Running..." // optional
        onClick={runCode}
      >
        Run Code
      </Button>
      <Box
        h="75vh"
        p={2}
        border="1px solid"
        borderRadius={4}
        borderColor="#333"
      >
        {output ? output : 'Click "Run Code" to see the output here'}
      </Box>
    </Box>
  );
};
export default Output;
