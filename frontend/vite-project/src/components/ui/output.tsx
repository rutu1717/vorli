import { Box, Button, Text } from "@chakra-ui/react";

const Output = () =>{
    return (
        <Box w='50%'>
            <Text mb={2}>Output</Text>
            <Button
            variant='outline'
            colorScheme='green'
            mb={4}
            >
                Run Code 
            </Button>
            <Box h='75vh' p={2} border='1px solid' borderRadius={4} borderColor='#333'>
        test
            </Box>
        </Box>
    )
}
export default Output;