import MyCodeEditor from './components/ui/codeeditor'
import './App.css'
// import MyCodeEditor from './monaco'
import { Box } from '@chakra-ui/react'
function App() {

  return (
    <>
    <Box minH="100vh" bg="#0f0a19" color="grey.500" px={6} py={8} >
         <MyCodeEditor/>
    </Box>
    </>
  )
}

export default App
