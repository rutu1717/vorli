import { Box, Button, Tabs, Text, VStack } from "@chakra-ui/react";
import type { Language } from "./codeeditor";
import { RefObject, useState } from "react";
import { executeCode } from "@/api";
import axios from "axios";
import Dashboard from "./dashboard";

type aiAnalysis = {
  status: string,
  time_complexity: string,
  space_complexity: string,
  summary: string,
  detailed_review: string,
  key_tips: string[]
}
type Outputprops = {
  editorRef: RefObject<any>;
  language: Language;
};

const Output = ({ editorRef, language }: Outputprops) => {
  const [output, setOutput] = useState<any>(null);
  const [isLoading, setisLoading] = useState<boolean>(false);
  const [aiError, setaiError] = useState<string>("")
  const [aiAnalysis, setAiAnalysis] = useState<aiAnalysis>({ status: "", time_complexity: "", space_complexity: "", summary: "", detailed_review: "", key_tips: [] });
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
    } catch (error: any) {
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

      const response = await axios.post("http://localhost:8080/api/analyze", {
        code: sourceCode,
        language: language
      });
      // console.log(response)
      // console.log(response.data)
      if (response.data.error) {
        setaiError(response.data.error)
      } else {
        console.log(response.data);
        setAiAnalysis(response.data);
      }
    } catch (error: any) {
      console.error(error);
      setaiError(error.message)
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Box w="50%">
      <Text mb={2}>Output</Text>
      <VStack gap={2} mb={4} display={"flex"} flexDirection={"row"}>
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
        {/* {aiAnalysis ? (
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
        )} */}
        <Tabs.Root defaultValue="output" variant="plain">
          <Tabs.List bg="bg.muted" rounded="l3" p="1">
            <Tabs.Trigger value="output">
              Output
            </Tabs.Trigger>
            <Tabs.Trigger value="ai">
              AI Analysis
            </Tabs.Trigger>
            <Tabs.Indicator rounded="l2" />
          </Tabs.List>
          <Tabs.Content value="output">{
            output ? (
              <Text>{output}</Text>
            ) : (
              'Click "Run Code" to execute or "Analyze with AI" to understand your code'
            )
            }</Tabs.Content>
          <Tabs.Content value="ai">
            <Dashboard aiAnalysis={aiAnalysis} />
          </Tabs.Content>

        </Tabs.Root>
      </Box>
    </Box>
  );
};
export default Output;
