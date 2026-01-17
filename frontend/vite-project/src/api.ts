import axios from "axios"
import type { Language } from "./components/ui/codeeditor"
import { LANGUAGE_VERSIONS } from "./constants"


export const executeCode = async (sourceCode:any,language:Language,stdin:string="") =>{
    // const response = await API.post("/execute",{
    //     "language":language,
    //     "version": LANGUAGE_VERSIONS[language],
    //     "files":[{
    //         "content": sourceCode
    //     },],
    //     "stdin": stdin
    // });
    // return response.data;
    // Dynamic API URL - works with AWS backend in production
    const apiBase = window.location.hostname === 'localhost' 
        ? 'http://localhost:8080' 
        : 'http://52.66.246.154:8080';  // AWS EC2 backend
    const response = await axios.post(`${apiBase}/api/execute`,{
        "code":sourceCode,
        "version":LANGUAGE_VERSIONS[language],
        "language":language,
        "stdin":stdin
    })
    console.log(response.data)
    return response.data;
}