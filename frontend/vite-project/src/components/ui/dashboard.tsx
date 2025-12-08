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
    Collapsible,
} from "@chakra-ui/react";
import { LuClock, LuDatabase, LuCircleCheck, LuLightbulb, LuInfo, LuTriangleAlert, LuBug, LuChevronDown } from "react-icons/lu";
import { useState } from "react";

type aiAnalysis = {
    status: string;
    time_complexity: string;
    time_complexity_explanation: string;
    space_complexity: string;
    space_complexity_explanation: string;
    summary: string;
    detailed_review: string;
    key_tips: string[];
    hints: string[];
    potential_bugs: string[];
};

type DashboardProps = {
    aiAnalysis: aiAnalysis;
};

const Dashboard = ({ aiAnalysis }: DashboardProps) => {
    const [timeExpanded, setTimeExpanded] = useState(false);
    const [spaceExpanded, setSpaceExpanded] = useState(false);

    // Helper function to get status color
    const getStatusColor = (status: string) => {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus.includes("excellent") || lowerStatus.includes("correct")) {
            return "green";
        } else if (lowerStatus.includes("incomplete")) {
            return "orange";
        } else if (lowerStatus.includes("inefficient") || lowerStatus.includes("moderate")) {
            return "yellow";
        } else if (lowerStatus.includes("error") || lowerStatus.includes("incorrect") || lowerStatus.includes("buggy")) {
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
                <Box textAlign="center" py={12}>
                    <Icon boxSize={12} color="gray.500" mb={4}>
                        <LuLightbulb />
                    </Icon>
                    <Text fontSize="lg" color="gray.400" fontFamily="'Inter', sans-serif">
                        No Analysis Available
                    </Text>
                    <Text fontSize="sm" color="gray.500" mt={2} fontFamily="'Inter', sans-serif">
                        Click the "Analyze with AI" button to get detailed insights about your code
                    </Text>
                </Box>
            ) : (
                <Box w="100%" p={4} fontFamily="'Inter', sans-serif">
                    <VStack gap={4} align="stretch">
                        {/* Status Card */}
                        <Card.Root
                            bg="linear-gradient(135deg, rgba(26, 32, 44, 0.95) 0%, rgba(45, 55, 72, 0.95) 100%)"
                            borderWidth="1px"
                            borderColor={`${statusColor}.500`}
                            boxShadow={`0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px ${statusColor === 'green' ? 'rgba(72, 187, 120, 0.2)' : statusColor === 'red' ? 'rgba(245, 101, 101, 0.2)' : 'rgba(237, 137, 54, 0.2)'}`}
                            _hover={{
                                transform: "translateY(-2px)",
                                boxShadow: `0 8px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px ${statusColor === 'green' ? 'rgba(72, 187, 120, 0.4)' : statusColor === 'red' ? 'rgba(245, 101, 101, 0.4)' : 'rgba(237, 137, 54, 0.4)'}`
                            }}
                            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                        >
                            <Card.Body>
                                <HStack justify="space-between" align="center">
                                    <HStack gap={3}>
                                        <Box
                                            p={3}
                                            bg={`${statusColor}.900`}
                                            borderRadius="lg"
                                            borderWidth="1px"
                                            borderColor={`${statusColor}.700`}
                                        >
                                            <Icon boxSize={6} color={`${statusColor}.400`}>
                                                {statusColor === "green" ? (
                                                    <LuCircleCheck />
                                                ) : statusColor === "orange" ? (
                                                    <LuTriangleAlert />
                                                ) : (
                                                    <LuLightbulb />
                                                )}
                                            </Icon>
                                        </Box>
                                        <VStack align="start" gap={0}>
                                            <Text fontSize="xs" color="gray.500" fontWeight="500" letterSpacing="wider" textTransform="uppercase">
                                                Code Status
                                            </Text>
                                            <Text fontSize="2xl" fontWeight="700" color="white" letterSpacing="tight">
                                                {aiAnalysis.status || "N/A"}
                                            </Text>
                                        </VStack>
                                    </HStack>
                                    <Badge
                                        colorScheme={statusColor}
                                        fontSize="sm"
                                        px={4}
                                        py={2}
                                        borderRadius="full"
                                        fontWeight="600"
                                    >
                                        {statusColor === "green" ? "✓ Passed" : statusColor === "orange" ? "⚠ Needs Work" : "✗ Review"}
                                    </Badge>
                                </HStack>
                            </Card.Body>
                        </Card.Root>

                        {/* Complexity Cards Grid */}
                        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                            {/* Time Complexity */}
                            <Card.Root
                                bg="linear-gradient(135deg, rgba(26, 32, 44, 0.95) 0%, rgba(45, 55, 72, 0.95) 100%)"
                                borderWidth="1px"
                                borderColor="purple.700"
                                boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
                                _hover={{
                                    borderColor: "purple.500",
                                    transform: "translateY(-2px)",
                                    boxShadow: "0 8px 30px rgba(128, 90, 213, 0.3)"
                                }}
                                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                            >
                                <Card.Body>
                                    <VStack align="stretch" gap={3}>
                                        <HStack justify="space-between">
                                            <HStack gap={2}>
                                                <Box
                                                    p={2}
                                                    bg="purple.900"
                                                    borderRadius="md"
                                                    borderWidth="1px"
                                                    borderColor="purple.700"
                                                >
                                                    <Icon boxSize={5} color="purple.400">
                                                        <LuClock />
                                                    </Icon>
                                                </Box>
                                                <Text fontSize="xs" color="gray.500" fontWeight="500" letterSpacing="wider" textTransform="uppercase">
                                                    Time Complexity
                                                </Text>
                                            </HStack>
                                            {aiAnalysis.time_complexity_explanation && (
                                                <Icon
                                                    boxSize={4}
                                                    color="purple.400"
                                                    cursor="pointer"
                                                    onClick={() => setTimeExpanded(!timeExpanded)}
                                                    transform={timeExpanded ? "rotate(180deg)" : "rotate(0deg)"}
                                                    transition="transform 0.2s"
                                                >
                                                    <LuChevronDown />
                                                </Icon>
                                            )}
                                        </HStack>
                                        <Text fontSize="2xl" fontWeight="700" color="purple.300" letterSpacing="tight">
                                            {aiAnalysis.time_complexity || "N/A"}
                                        </Text>
                                        <Progress.Root
                                            value={timeComplexityScore}
                                            colorScheme={timeComplexityScore > 70 ? "red" : timeComplexityScore > 50 ? "yellow" : "green"}
                                            size="sm"
                                        >
                                            <Progress.Track bg="gray.800">
                                                <Progress.Range />
                                            </Progress.Track>
                                        </Progress.Root>

                                        {aiAnalysis.time_complexity_explanation && (
                                            <Collapsible.Root open={timeExpanded}>
                                                <Collapsible.Content>
                                                    <Box
                                                        mt={2}
                                                        p={3}
                                                        bg="purple.950"
                                                        borderRadius="md"
                                                        borderWidth="1px"
                                                        borderColor="purple.800"
                                                    >
                                                        <Text fontSize="sm" color="purple.200" lineHeight="1.7">
                                                            {aiAnalysis.time_complexity_explanation}
                                                        </Text>
                                                    </Box>
                                                </Collapsible.Content>
                                            </Collapsible.Root>
                                        )}
                                    </VStack>
                                </Card.Body>
                            </Card.Root>

                            {/* Space Complexity */}
                            <Card.Root
                                bg="linear-gradient(135deg, rgba(26, 32, 44, 0.95) 0%, rgba(45, 55, 72, 0.95) 100%)"
                                borderWidth="1px"
                                borderColor="cyan.700"
                                boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
                                _hover={{
                                    borderColor: "cyan.500",
                                    transform: "translateY(-2px)",
                                    boxShadow: "0 8px 30px rgba(6, 182, 212, 0.3)"
                                }}
                                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                            >
                                <Card.Body>
                                    <VStack align="stretch" gap={3}>
                                        <HStack justify="space-between">
                                            <HStack gap={2}>
                                                <Box
                                                    p={2}
                                                    bg="cyan.900"
                                                    borderRadius="md"
                                                    borderWidth="1px"
                                                    borderColor="cyan.700"
                                                >
                                                    <Icon boxSize={5} color="cyan.400">
                                                        <LuDatabase />
                                                    </Icon>
                                                </Box>
                                                <Text fontSize="xs" color="gray.500" fontWeight="500" letterSpacing="wider" textTransform="uppercase">
                                                    Space Complexity
                                                </Text>
                                            </HStack>
                                            {aiAnalysis.space_complexity_explanation && (
                                                <Icon
                                                    boxSize={4}
                                                    color="cyan.400"
                                                    cursor="pointer"
                                                    onClick={() => setSpaceExpanded(!spaceExpanded)}
                                                    transform={spaceExpanded ? "rotate(180deg)" : "rotate(0deg)"}
                                                    transition="transform 0.2s"
                                                >
                                                    <LuChevronDown />
                                                </Icon>
                                            )}
                                        </HStack>
                                        <Text fontSize="2xl" fontWeight="700" color="cyan.300" letterSpacing="tight">
                                            {aiAnalysis.space_complexity || "N/A"}
                                        </Text>
                                        <Progress.Root
                                            value={spaceComplexityScore}
                                            colorScheme={spaceComplexityScore > 70 ? "red" : spaceComplexityScore > 50 ? "yellow" : "green"}
                                            size="sm"
                                        >
                                            <Progress.Track bg="gray.800">
                                                <Progress.Range />
                                            </Progress.Track>
                                        </Progress.Root>

                                        {aiAnalysis.space_complexity_explanation && (
                                            <Collapsible.Root open={spaceExpanded}>
                                                <Collapsible.Content>
                                                    <Box
                                                        mt={2}
                                                        p={3}
                                                        bg="cyan.950"
                                                        borderRadius="md"
                                                        borderWidth="1px"
                                                        borderColor="cyan.800"
                                                    >
                                                        <Text fontSize="sm" color="cyan.200" lineHeight="1.7">
                                                            {aiAnalysis.space_complexity_explanation}
                                                        </Text>
                                                    </Box>
                                                </Collapsible.Content>
                                            </Collapsible.Root>
                                        )}
                                    </VStack>
                                </Card.Body>
                            </Card.Root>
                        </Grid>

                        {/* Hints Card - Only show if there are hints */}
                        {aiAnalysis.hints && aiAnalysis.hints.length > 0 && (
                            <Card.Root
                                bg="linear-gradient(135deg, rgba(237, 100, 166, 0.1) 0%, rgba(155, 81, 224, 0.1) 100%)"
                                borderWidth="2px"
                                borderColor="orange.500"
                                boxShadow="0 4px 20px rgba(237, 137, 54, 0.2)"
                                _hover={{
                                    borderColor: "orange.400",
                                    boxShadow: "0 8px 30px rgba(237, 137, 54, 0.3)"
                                }}
                                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                            >
                                <Card.Body>
                                    <VStack align="stretch" gap={3}>
                                        <HStack gap={2}>
                                            <Box
                                                p={2}
                                                bg="orange.900"
                                                borderRadius="md"
                                                borderWidth="1px"
                                                borderColor="orange.700"
                                            >
                                                <Icon boxSize={5} color="orange.400">
                                                    <LuTriangleAlert />
                                                </Icon>
                                            </Box>
                                            <Text fontSize="md" fontWeight="700" color="orange.300" letterSpacing="tight">
                                                💡 Hints - Your Code Needs Attention
                                            </Text>
                                        </HStack>
                                        <List.Root gap={2} variant="plain">
                                            {aiAnalysis.hints.map((hint: string, index: number) => (
                                                <List.Item key={index}>
                                                    <HStack align="start" gap={3} p={2} bg="orange.950" borderRadius="md">
                                                        <Text color="orange.400" mt={0.5} fontWeight="bold">
                                                            {index + 1}.
                                                        </Text>
                                                        <Text fontSize="sm" color="orange.100" lineHeight="1.7" fontWeight="500">
                                                            {hint}
                                                        </Text>
                                                    </HStack>
                                                </List.Item>
                                            ))}
                                        </List.Root>
                                    </VStack>
                                </Card.Body>
                            </Card.Root>
                        )}

                        {/* Potential Bugs Card - Only show if there are bugs */}
                        {aiAnalysis.potential_bugs && aiAnalysis.potential_bugs.length > 0 && (
                            <Card.Root
                                bg="linear-gradient(135deg, rgba(245, 101, 101, 0.1) 0%, rgba(229, 62, 62, 0.1) 100%)"
                                borderWidth="2px"
                                borderColor="red.500"
                                boxShadow="0 4px 20px rgba(245, 101, 101, 0.2)"
                                _hover={{
                                    borderColor: "red.400",
                                    boxShadow: "0 8px 30px rgba(245, 101, 101, 0.3)"
                                }}
                                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                            >
                                <Card.Body>
                                    <VStack align="stretch" gap={3}>
                                        <HStack gap={2}>
                                            <Box
                                                p={2}
                                                bg="red.900"
                                                borderRadius="md"
                                                borderWidth="1px"
                                                borderColor="red.700"
                                            >
                                                <Icon boxSize={5} color="red.400">
                                                    <LuBug />
                                                </Icon>
                                            </Box>
                                            <Text fontSize="md" fontWeight="700" color="red.300" letterSpacing="tight">
                                                🐛 Potential Bugs & Edge Cases
                                            </Text>
                                        </HStack>
                                        <List.Root gap={2} variant="plain">
                                            {aiAnalysis.potential_bugs.map((bug: string, index: number) => (
                                                <List.Item key={index}>
                                                    <HStack align="start" gap={3} p={2} bg="red.950" borderRadius="md">
                                                        <Text color="red.400" mt={0.5} fontWeight="bold">
                                                            ⚠
                                                        </Text>
                                                        <Text fontSize="sm" color="red.100" lineHeight="1.7" fontWeight="500">
                                                            {bug}
                                                        </Text>
                                                    </HStack>
                                                </List.Item>
                                            ))}
                                        </List.Root>
                                    </VStack>
                                </Card.Body>
                            </Card.Root>
                        )}

                        {/* Summary Card */}
                        {aiAnalysis.summary && (
                            <Card.Root
                                bg="linear-gradient(135deg, rgba(26, 32, 44, 0.95) 0%, rgba(45, 55, 72, 0.95) 100%)"
                                borderWidth="1px"
                                borderColor="blue.700"
                                boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
                                _hover={{
                                    borderColor: "blue.500",
                                    boxShadow: "0 8px 30px rgba(66, 153, 225, 0.2)"
                                }}
                                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                            >
                                <Card.Body>
                                    <VStack align="stretch" gap={3}>
                                        <HStack gap={2}>
                                            <Box
                                                p={2}
                                                bg="blue.900"
                                                borderRadius="md"
                                                borderWidth="1px"
                                                borderColor="blue.700"
                                            >
                                                <Icon boxSize={5} color="blue.400">
                                                    <LuInfo />
                                                </Icon>
                                            </Box>
                                            <Text fontSize="md" fontWeight="700" color="blue.300" letterSpacing="tight">
                                                Summary
                                            </Text>
                                        </HStack>
                                        <Text fontSize="sm" color="gray.200" lineHeight="1.8" fontWeight="500">
                                            {aiAnalysis.summary}
                                        </Text>
                                    </VStack>
                                </Card.Body>
                            </Card.Root>
                        )}

                        {/* Detailed Review Card */}
                        {aiAnalysis.detailed_review && (
                            <Card.Root
                                bg="linear-gradient(135deg, rgba(26, 32, 44, 0.95) 0%, rgba(45, 55, 72, 0.95) 100%)"
                                borderWidth="1px"
                                borderColor="gray.700"
                                boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
                                _hover={{
                                    borderColor: "gray.600",
                                    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)"
                                }}
                                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                            >
                                <Card.Body>
                                    <VStack align="stretch" gap={3}>
                                        <HStack gap={2}>
                                            <Box
                                                p={2}
                                                bg="gray.800"
                                                borderRadius="md"
                                                borderWidth="1px"
                                                borderColor="gray.700"
                                            >
                                                <Icon boxSize={5} color="gray.400">
                                                    <LuLightbulb />
                                                </Icon>
                                            </Box>
                                            <Text fontSize="md" fontWeight="700" color="gray.300" letterSpacing="tight">
                                                Detailed Review
                                            </Text>
                                        </HStack>
                                        <Text
                                            fontSize="sm"
                                            color="gray.200"
                                            lineHeight="1.8"
                                            whiteSpace="pre-wrap"
                                            fontWeight="400"
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
                                bg="linear-gradient(135deg, rgba(26, 32, 44, 0.95) 0%, rgba(45, 55, 72, 0.95) 100%)"
                                borderWidth="1px"
                                borderColor="yellow.700"
                                boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
                                _hover={{
                                    borderColor: "yellow.500",
                                    boxShadow: "0 8px 30px rgba(236, 201, 75, 0.2)"
                                }}
                                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                            >
                                <Card.Body>
                                    <VStack align="stretch" gap={3}>
                                        <HStack gap={2}>
                                            <Box
                                                p={2}
                                                bg="yellow.900"
                                                borderRadius="md"
                                                borderWidth="1px"
                                                borderColor="yellow.700"
                                            >
                                                <Icon boxSize={5} color="yellow.400">
                                                    <LuLightbulb />
                                                </Icon>
                                            </Box>
                                            <Text fontSize="md" fontWeight="700" color="yellow.300" letterSpacing="tight">
                                                Key Tips for Improvement
                                            </Text>
                                        </HStack>
                                        <List.Root gap={2} variant="plain">
                                            {aiAnalysis.key_tips.map((tip: string, index: number) => (
                                                <List.Item key={index}>
                                                    <HStack align="start" gap={3} p={2} bg="yellow.950" borderRadius="md">
                                                        <Text color="yellow.400" mt={0.5} fontWeight="bold">
                                                            💡
                                                        </Text>
                                                        <Text fontSize="sm" color="yellow.100" lineHeight="1.7" fontWeight="500">
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
