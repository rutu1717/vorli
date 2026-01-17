import MyCodeEditor from './components/ui/codeeditor'
import './App.css'
import { Box, Button, Text } from '@chakra-ui/react'
import WelcomeDialog, { useWelcomeDialog } from './components/ui/WelcomeDialog'

function App() {
  const { showWelcome, closeWelcome, openWelcome } = useWelcomeDialog();

  return (
    <>
      {showWelcome && <WelcomeDialog onClose={closeWelcome} />}
      <Box minH="100vh" bg="#0f0a19" color="grey.500" px={{ base: 2, md: 4, lg: 6 }} py={{ base: 4, md: 8 }} position="relative">
        {/* Help button to reopen welcome dialog */}
        <Button
          position="absolute"
          top={{ base: 2, md: 4 }}
          right={{ base: 2, md: 4 }}
          size={{ base: "xs", md: "sm" }}
          colorScheme="purple"
          variant="ghost"
          onClick={openWelcome}
          title="Show help & features"
        >
          ❓ <Text display={{ base: "none", sm: "inline" }}>User Guide</Text>
        </Button>
        <MyCodeEditor/>
      </Box>
    </>
  )
}

export default App

