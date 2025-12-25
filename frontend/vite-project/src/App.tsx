import MyCodeEditor from './components/ui/codeeditor'
import './App.css'
import { Box, Button } from '@chakra-ui/react'
import WelcomeDialog, { useWelcomeDialog } from './components/ui/WelcomeDialog'

function App() {
  const { showWelcome, closeWelcome, openWelcome } = useWelcomeDialog();

  return (
    <>
      {showWelcome && <WelcomeDialog onClose={closeWelcome} />}
      <Box minH="100vh" bg="#0f0a19" color="grey.500" px={6} py={8} position="relative">
        {/* Help button to reopen welcome dialog */}
        <Button
          position="absolute"
          top={4}
          right={4}
          size="sm"
          colorScheme="purple"
          variant="ghost"
          onClick={openWelcome}
          title="Show help & features"
        >
          ❓ User Guide
        </Button>
        <MyCodeEditor/>
      </Box>
    </>
  )
}

export default App

