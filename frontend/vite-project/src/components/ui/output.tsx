import { Box, Button, Text, VStack } from "@chakra-ui/react";
import type { Language } from "./codeeditor";
import { RefObject, useState } from "react";
import { executeCode } from "@/api";
import axios from "axios";

type Outputprops = {
  editorRef: RefObject<any>;
  language: Language;
};

const Output = ({ editorRef, language }: Outputprops) => {
  const [output, setOutput] = useState<any>(null);
  const [isLoading, setisLoading] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

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
    } catch (error:any) {
        console.error(error)
        // let message = "Something went wrong with the above code.";
        let message = error.message;
        setOutput(message)
    } finally {
      setisLoading(false);
    }
  };

  const analyzeCode = async () => {
    const sourceCode = editorRef.current?.getValue();
    if (!sourceCode) return;
    
    try {
      setIsAnalyzing(true);
      setAiAnalysis("Analyzing your code...");
      
      const response = await axios.post("http://localhost:8080/api/analyze", {
        code: sourceCode,
        language: language
      });

      if (response.data.error) {
        setAiAnalysis(`Error: ${response.data.error}`);
      } else {
        setAiAnalysis(response.data.analysis);
      }
    } catch (error: any) {
      console.error(error);
      setAiAnalysis(`Error: ${error.message || "Failed to analyze code"}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Box w="50%">
      <Text mb={2}>Output</Text>
      <VStack gap={2} mb={4} align="stretch">
        <Button
          variant="outline"
          colorScheme="green"
          loading={isLoading}
          loadingText="Running..."
          onClick={runCode}
        >
          Run Code
        </Button>
        <Button
          variant="outline"
          colorScheme="blue"
          loading={isAnalyzing}
          loadingText="Analyzing..."
          onClick={analyzeCode}
        >
          Analyze with AI
        </Button>
      </VStack>
      <Box
        h="75vh"
        p={2}
        border="1px solid"
        borderRadius={4}
        borderColor="#333"
        overflowY="auto"
        whiteSpace="pre-wrap"
      >
        {aiAnalysis ? (
          <Box>
            <Text fontWeight="bold" color="blue.400" mb={2}>AI Analysis:</Text>
            <Text>{aiAnalysis}</Text>
            {output && (
              <>
                <Text fontWeight="bold" color="green.400" mt={4} mb={2}>Code Output:</Text>
                <Text>{output}</Text>
              </>
            )}
          </Box>
        ) : output ? (
          <Box>
            <Text fontWeight="bold" color="green.400" mb={2}>Code Output:</Text>
            <Text>{output}</Text>
          </Box>
        ) : (
          'Click "Run Code" to execute or "Analyze with AI" to understand your code'
        )}
      </Box>
    </Box>
  );
};
export default Output;
