import axios from "axios"
import type { Language } from "./components/ui/codeeditor"
import { LANGUAGE_VERSIONS } from "./constants"
import { version } from "react"
const API = axios.create({
    baseURL:"https://emkc.org/api/v2/piston"
})

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
    const response = await axios.post("http://localhost:8080/api/execute",{
        "code":sourceCode,
        "version":LANGUAGE_VERSIONS[language],
        "language":language,
        "stdin":stdin
    })
    console.log(response.data)
    return response.data;
}