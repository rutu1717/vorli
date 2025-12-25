import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Heading,
  Badge,
  CloseButton,
} from "@chakra-ui/react";

interface WelcomeDialogProps {
  onClose: () => void;
}

const WelcomeDialog = ({ onClose }: WelcomeDialogProps) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="rgba(0, 0, 0, 0.75)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex="1000"
      onClick={onClose}
    >
      <Box
        bg="linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"
        borderRadius="lg"
        p={6}
        maxW="480px"
        w="90%"
        maxH="90vh"
        overflowY="auto"
        boxShadow="0 20px 40px rgba(0, 0, 0, 0.5)"
        border="1px solid"
        borderColor="purple.600"
        onClick={(e) => e.stopPropagation()}
        animation="slideIn 0.3s ease-out"
      >
        {/* Header */}
        <HStack justify="space-between" mb={4}>
          <HStack>
            <Heading size="md" color="white">
              🚀 Vorli
            </Heading>
            <Badge colorScheme="purple" fontSize="xs">Beta</Badge>
          </HStack>
          <CloseButton color="gray.400" size="sm" onClick={onClose} />
        </HStack>

        <Text color="gray.400" fontSize="sm" mb={4}>
          Your Interactive DSA Practice Companion
        </Text>
        {/* Features */}
        <VStack gap={2} align="stretch" mb={4}>
          <Text color="gray.300" fontWeight="semibold" fontSize="sm">Features:</Text>
          <Feature icon="⚡" text="Interactive C++, Java & Python execution" />
          <Feature icon="🤖" text="AI-powered code analysis & complexity insights" />
          <Feature icon="💡" text="Real-time input/output like local IDE" />
          <Feature icon="📊" text="Get time & space complexity explanations" />
          <Feature icon="🐛" text="Detect potential bugs & edge cases" />
        </VStack>

        {/* How to use */}
        <Box bg="whiteAlpha.100" p={3} borderRadius="md" mb={4}>
          <Text color="gray.300" fontWeight="semibold" fontSize="sm" mb={2}>
            📖 How to Use
          </Text>
          <VStack align="start" gap={1}>
            <Step num="1" text="Write your code in the editor" />
            <Step num="2" text='Click "Run" to execute' />
            <Step num="3" text="When prompted, type input and press Enter" />
            <Step num="4" text='Click "Analyze with AI" for feedback' />
          </VStack>
        </Box>

        {/* Supported Languages */}
        <HStack justify="center" gap={3} mb={4}>
          <Badge colorScheme="blue" px={2} py={1}>C++</Badge>
          <Badge colorScheme="orange" px={2} py={1}>Java</Badge>
          <Badge colorScheme="green" px={2} py={1}>Python</Badge>
        </HStack>

        {/* CTA */}
        <Button colorScheme="purple" size="md" w="full" onClick={onClose}>
          Start Coding 🎉
        </Button>

        <Text color="gray.600" fontSize="xs" textAlign="center" mt={2}>
          Press ESC or click outside to close
        </Text>
      </Box>
    </Box>
  );
};

// Compact feature row
const Feature = ({ icon, text }: { icon: string; text: string }) => (
  <HStack>
    <Text fontSize="sm">{icon}</Text>
    <Text color="gray.300" fontSize="xs">{text}</Text>
  </HStack>
);

// Step component
const Step = ({ num, text }: { num: string; text: string }) => (
  <HStack>
    <Badge colorScheme="purple" borderRadius="full" size="sm">{num}</Badge>
    <Text color="gray.400" fontSize="xs">{text}</Text>
  </HStack>
);

// Hook to manage welcome dialog visibility
export const useWelcomeDialog = () => {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("vorli-welcome-seen");
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  const closeWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem("vorli-welcome-seen", "true");
  };

  const openWelcome = () => setShowWelcome(true);

  return { showWelcome, closeWelcome, openWelcome };
};

export default WelcomeDialog;
