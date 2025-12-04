import {
    Box,
    Grid,
    Text,
    VStack,
    HStack,
    Badge,
    Progress,
    Card,
    Icon,
    List,
} from "@chakra-ui/react";
import { LuClock, LuDatabase, LuCircleCheck, LuLightbulb, LuInfo } from "react-icons/lu";

type aiAnalysis = {
    status: string;
    time_complexity: string;
    space_complexity: string;
    summary: string;
    detailed_review: string;
    key_tips: string[];
};

type DashboardProps = {
    aiAnalysis: aiAnalysis;
};

const Dashboard = ({ aiAnalysis }: DashboardProps) => {
    // Helper function to get status color
    const getStatusColor = (status: string) => {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus.includes("excellent") || lowerStatus.includes("good")) {
            return "green";
        } else if (lowerStatus.includes("warning") || lowerStatus.includes("moderate")) {
            return "yellow";
        } else if (lowerStatus.includes("error") || lowerStatus.includes("poor")) {
            return "red";
        }
        return "blue";
    };

    // Helper function to get complexity score (for progress bar)
    const getComplexityScore = (complexity: string) => {
        const lowerComplexity = complexity.toLowerCase();
        if (lowerComplexity.includes("o(1)") || lowerComplexity.includes("constant")) {
            return 20;
        } else if (lowerComplexity.includes("o(log") || lowerComplexity.includes("logarithmic")) {
            return 40;
        } else if (lowerComplexity.includes("o(n)") && !lowerComplexity.includes("o(n^2)")) {
            return 60;
        } else if (lowerComplexity.includes("o(n log n)")) {
            return 70;
        } else if (lowerComplexity.includes("o(n^2)") || lowerComplexity.includes("quadratic")) {
            return 85;
        } else if (lowerComplexity.includes("o(2^n)") || lowerComplexity.includes("exponential")) {
            return 95;
        }
        return 50; // default
    };

    const statusColor = getStatusColor(aiAnalysis.status);
    const timeComplexityScore = getComplexityScore(aiAnalysis.time_complexity);
    const spaceComplexityScore = getComplexityScore(aiAnalysis.space_complexity);

    return (
        <>
            {!aiAnalysis.status ? (
                <Text textAlign="center" py={8}>No Analysis Available, Click the AI Analysis button to analyze your code</Text>
            ) : (
                <Box w="100%" p={4}>
                    <VStack gap={4} align="stretch">
                        {/* Status Card */}
                        <Card.Root
                            bg="gray.800"
                            borderWidth="1px"
                            borderColor="gray.700"
                            _hover={{ borderColor: "gray.600", transform: "translateY(-2px)" }}
                            transition="all 0.2s"
                        >
                            <Card.Body>
                                <HStack justify="space-between" align="center">
                                    <HStack gap={3}>
                                        <Icon boxSize={6} color={`${statusColor}.400`}>
                                            {statusColor === "green" ? (
                                                <LuCircleCheck />
                                            ) : (
                                                <LuLightbulb />
                                            )}
                                        </Icon>
                                        <VStack align="start" gap={0}>
                                            <Text fontSize="sm" color="gray.400">
                                                Code Status
                                            </Text>
                                            <Text fontSize="lg" fontWeight="bold" color="white">
                                                {aiAnalysis.status || "N/A"}
                                            </Text>
                                        </VStack>
                                    </HStack>
                                    <Badge colorScheme={statusColor} fontSize="md" px={3} py={1}>
                                        {statusColor === "green" ? "✓" : "⚠"}
                                    </Badge>
                                </HStack>
                            </Card.Body>
                        </Card.Root>

                        {/* Complexity Cards Grid */}
                        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                            {/* Time Complexity */}
                            <Card.Root
                                bg="gray.800"
                                borderWidth="1px"
                                borderColor="gray.700"
                                _hover={{ borderColor: "purple.600", transform: "translateY(-2px)" }}
                                transition="all 0.2s"
                            >
                                <Card.Body>
                                    <VStack align="stretch" gap={3}>
                                        <HStack gap={2}>
                                            <Icon boxSize={5} color="purple.400">
                                                <LuClock />
                                            </Icon>
                                            <Text fontSize="sm" color="gray.400">
                                                Time Complexity
                                            </Text>
                                        </HStack>
                                        <Text fontSize="xl" fontWeight="bold" color="purple.300">
                                            {aiAnalysis.time_complexity || "N/A"}
                                        </Text>
                                        <Progress.Root
                                            value={timeComplexityScore}
                                            colorScheme={timeComplexityScore > 70 ? "red" : timeComplexityScore > 50 ? "yellow" : "green"}
                                            size="sm"
                                        >
                                            <Progress.Track bg="gray.700">
                                                <Progress.Range />
                                            </Progress.Track>
                                        </Progress.Root>
                                    </VStack>
                                </Card.Body>
                            </Card.Root>

                            {/* Space Complexity */}
                            <Card.Root
                                bg="gray.800"
                                borderWidth="1px"
                                borderColor="gray.700"
                                _hover={{ borderColor: "cyan.600", transform: "translateY(-2px)" }}
                                transition="all 0.2s"
                            >
                                <Card.Body>
                                    <VStack align="stretch" gap={3}>
                                        <HStack gap={2}>
                                            <Icon boxSize={5} color="cyan.400">
                                                <LuDatabase />
                                            </Icon>
                                            <Text fontSize="sm" color="gray.400">
                                                Space Complexity
                                            </Text>
                                        </HStack>
                                        <Text fontSize="xl" fontWeight="bold" color="cyan.300">
                                            {aiAnalysis.space_complexity || "N/A"}
                                        </Text>
                                        <Progress.Root
                                            value={spaceComplexityScore}
                                            colorScheme={spaceComplexityScore > 70 ? "red" : spaceComplexityScore > 50 ? "yellow" : "green"}
                                            size="sm"
                                        >
                                            <Progress.Track bg="gray.700">
                                                <Progress.Range />
                                            </Progress.Track>
                                        </Progress.Root>
                                    </VStack>
                                </Card.Body>
                            </Card.Root>
                        </Grid>

                        {/* Summary Card */}
                        {aiAnalysis.summary && (
                            <Card.Root
                                bg="gray.800"
                                borderWidth="1px"
                                borderColor="gray.700"
                                _hover={{ borderColor: "blue.600" }}
                                transition="all 0.2s"
                            >
                                <Card.Body>
                                    <VStack align="stretch" gap={3}>
                                        <HStack gap={2}>
                                            <Icon boxSize={5} color="blue.400">
                                                <LuInfo />
                                            </Icon>
                                            <Text fontSize="md" fontWeight="semibold" color="blue.300">
                                                Summary
                                            </Text>
                                        </HStack>
                                        <Text fontSize="sm" color="gray.300" lineHeight="1.7">
                                            {aiAnalysis.summary}
                                        </Text>
                                    </VStack>
                                </Card.Body>
                            </Card.Root>
                        )}

                        {/* Detailed Review Card */}
                        {aiAnalysis.detailed_review && (
                            <Card.Root
                                bg="gray.800"
                                borderWidth="1px"
                                borderColor="gray.700"
                                _hover={{ borderColor: "gray.600" }}
                                transition="all 0.2s"
                            >
                                <Card.Body>
                                    <VStack align="stretch" gap={3}>
                                        <HStack gap={2}>
                                            <Icon boxSize={5} color="gray.400">
                                                <LuLightbulb />
                                            </Icon>
                                            <Text fontSize="md" fontWeight="semibold" color="gray.300">
                                                Detailed Review
                                            </Text>
                                        </HStack>
                                        <Text
                                            fontSize="sm"
                                            color="gray.300"
                                            lineHeight="1.7"
                                            whiteSpace="pre-wrap"
                                        >
                                            {aiAnalysis.detailed_review}
                                        </Text>
                                    </VStack>
                                </Card.Body>
                            </Card.Root>
                        )}

                        {/* Key Tips Card */}
                        {aiAnalysis.key_tips && aiAnalysis.key_tips.length > 0 && (
                            <Card.Root
                                bg="gray.800"
                                borderWidth="1px"
                                borderColor="gray.700"
                                _hover={{ borderColor: "yellow.600" }}
                                transition="all 0.2s"
                            >
                                <Card.Body>
                                    <VStack align="stretch" gap={3}>
                                        <HStack gap={2}>
                                            <Icon boxSize={5} color="yellow.400">
                                                <LuLightbulb />
                                            </Icon>
                                            <Text fontSize="md" fontWeight="semibold" color="yellow.300">
                                                Key Tips
                                            </Text>
                                        </HStack>
                                        <List.Root gap={2} variant="plain">
                                            {aiAnalysis.key_tips.map((tip: string, index: number) => (
                                                <List.Item key={index}>
                                                    <HStack align="start" gap={2}>
                                                        <Text color="yellow.400" mt={0.5}>
                                                            •
                                                        </Text>
                                                        <Text fontSize="sm" color="gray.300" lineHeight="1.7">
                                                            {tip}
                                                        </Text>
                                                    </HStack>
                                                </List.Item>
                                            ))}
                                        </List.Root>
                                    </VStack>
                                </Card.Body>
                            </Card.Root>
                        )}
                    </VStack>
                </Box>
            )}
        </>
    );
};

export default Dashboard;
