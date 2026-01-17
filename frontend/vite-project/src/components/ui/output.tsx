import { Box, Button, Tabs, Text, VStack, Input } from "@chakra-ui/react";
import type { Language } from "./codeeditor";
import { RefObject, useState, useRef } from "react";
import axios from "axios";
import Dashboard from "./dashboard";
import { InteractiveExecutor } from "@/websocket";

type aiAnalysis = {
  status: string,
  time_complexity: string,
  time_complexity_explanation: string,
  space_complexity: string,
  space_complexity_explanation: string,
  summary: string,
  detailed_review: string,
  key_tips: string[],
  hints: string[],
  potential_bugs: string[]
}
type Outputprops = {
  editorRef: RefObject<any>;
  language: Language;
};

const Output = ({ editorRef, language }: Outputprops) => {
  const [aiAnalysis, setAiAnalysis] = useState<aiAnalysis>({
    status: "",
    time_complexity: "",
    time_complexity_explanation: "",
    space_complexity: "",
    space_complexity_explanation: "",
    summary: "",
    detailed_review: "",
    key_tips: [],
    hints: [],
    potential_bugs: []
  });
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Interactive execution state
  const [isInteractive, setIsInteractive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("output");
  const [interactiveOutput, setInteractiveOutput] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const executorRef = useRef<InteractiveExecutor | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);


  const analyzeCode = async () => {
    const sourceCode = editorRef.current?.getValue();
    if (!sourceCode) return;

    try {
      setIsAnalyzing(true);

      // Dynamic API URL - Cloudflare tunnel for production
      const apiBase = window.location.hostname === 'localhost' 
        ? 'http://localhost:8080' 
        : 'https://dow-hugh-motivation-ripe.trycloudflare.com';
      const response = await axios.post(`${apiBase}/api/analyze`, {
        code: sourceCode,
        language: language
      });
      // console.log(response)
      // console.log(response.data)
      if (response.data.error) {
        console.error("AI Analysis error:", response.data.error);
      } else {
        console.log(response.data);
        setAiAnalysis(response.data);
      }
    } catch (error: any) {
      console.error(error);
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-scroll output to bottom when new content arrives
  const scrollToBottom = () => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  };

  // Start interactive code execution via WebSocket
  const runInteractive = () => {
    const sourceCode = editorRef.current?.getValue();
    if (!sourceCode) return;

    // C++ now uses Docker PTY-based handler, so interactive mode works!
    setIsInteractive(true);
    setInteractiveOutput("");  // Clear previous output
    setActiveTab("output");  // Switch to output tab

    // Create executor with callbacks
    executorRef.current = new InteractiveExecutor({
      onOutput: (text) => {
        setInteractiveOutput(prev => prev + text);
        setTimeout(scrollToBottom, 10);  // Scroll after state update
      },
      onExit: (code) => {
        setInteractiveOutput(prev => prev + `\n\n[Program exited with code ${code}]`);
        setIsInteractive(false);
        setTimeout(scrollToBottom, 10);
      },
      onError: (message) => {
        setInteractiveOutput(prev => prev + `\n[Error: ${message}]`);
        setIsInteractive(false);
      },
      onReady: () => {
        console.log("Program started running");
      }
    });

    // Start execution
    executorRef.current.start(sourceCode, language);
  };

  // Send input to the running program
  const handleSendInput = () => {
    if (executorRef.current && inputValue.trim()) {
      executorRef.current.sendInput(inputValue);
      setInteractiveOutput(prev => prev + inputValue + "\n");  // Echo input in output
      setInputValue("");
      setTimeout(scrollToBottom, 10);
    }
  };

  // Handle Enter key in input field
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendInput();
    }
  };

  // Stop the running program
  const stopExecution = () => {
    executorRef.current?.stop();
    setIsInteractive(false);
    setInteractiveOutput(prev => prev + "\n[Program terminated]");
  };

  return (
    <Box flex="1" minW={{ base: "100%", lg: "0" }}>
      <Text mb={2}>Output</Text>
      {/* Responsive button layout */}
      <VStack gap={2} mb={4} display={"flex"} flexDirection={{ base: "column", sm: "row" }}>
        <Button
          variant="outline"
          colorScheme="green"
          onClick={isInteractive ? stopExecution : runInteractive}
          disabled={isAnalyzing}
          width={{ base: "100%", sm: "auto" }}
        >
          {isInteractive ? "⏹ Stop" : "▶ Run"}
        </Button>
        <Button
          variant="outline"
          colorScheme="blue"
          loading={isAnalyzing}
          loadingText="Analyzing..."
          onClick={analyzeCode}
          width={{ base: "100%", sm: "auto" }}
        >
          Analyze with AI
        </Button>
      </VStack>
      <Box
        h={{ base: "50vh", md: "60vh", lg: "75vh" }}
        p={2}
        border="1px solid"
        borderRadius={4}
        borderColor="#333"
        overflowY="auto"
        whiteSpace="pre-wrap"
      >
        <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)} variant="plain">
          <Tabs.List bg="bg.muted" rounded="l3" p="1">
            <Tabs.Trigger value="output">
              Output {isInteractive && "🟢"}
            </Tabs.Trigger>
            <Tabs.Trigger value="ai">
              AI Analysis
            </Tabs.Trigger>
            <Tabs.Indicator rounded="l2" />
          </Tabs.List>
          <Tabs.Content value="output">
            {/* Terminal-like interface with inline input */}
            <Box
              ref={outputRef}
              bg="black"
              color="green.400"
              p={3}
              fontFamily="monospace"
              fontSize="sm"
              minH="300px"
              maxH="450px"
              overflowY="auto"
              borderRadius="md"
              cursor="text"
              onClick={() => {
                // Focus the hidden input when clicking anywhere in terminal
                const input = document.getElementById('terminal-input');
                if (input) input.focus();
              }}
            >
              {/* Output content */}
              <Text as="span" whiteSpace="pre-wrap">
                {interactiveOutput ? interactiveOutput : (isInteractive ? "" : 'Click "Run" to execute your code')}
              </Text>
              
              {/* Inline input - appears right after output */}
              {isInteractive && (
                <Input
                  id="terminal-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  variant="flushed"
                  bg="transparent"
                  color="white"
                  fontFamily="monospace"
                  fontSize="sm"
                  display="inline-block"
                  width={inputValue.length > 0 ? `${inputValue.length + 2}ch` : "1ch"}
                  border="none"
                  outline="none"
                  padding="0"
                  height="1.2em"
                  _focus={{ boxShadow: "none", outline: "none" }}
                  autoFocus
                  style={{
                    caretColor: "lime",
                  }}
                />
              )}
            </Box>
            
            {/* Help text */}
            <Text fontSize="xs" color="gray.500" mt={2}>
              {isInteractive 
                ? "Type your input and press Enter to send" 
                : "Press Run to execute your code"}
            </Text>
          </Tabs.Content>
          <Tabs.Content value="ai">
            <Dashboard aiAnalysis={aiAnalysis} />
          </Tabs.Content>

        </Tabs.Root>
      </Box>
    </Box>
  );
};
export default Output;
