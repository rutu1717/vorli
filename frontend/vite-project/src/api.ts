import axios from "axios"
import type { Language } from "./components/ui/codeeditor"
import { LANGUAGE_VERSIONS } from "./constants"
const API = axios.create({
    baseURL:"https://emkc.org/api/v2/piston"
})

export const executeCode = async (sourceCode:any,language:Language) =>{
    const response = await API.post("/execute",{
        "language":language,
        "version": LANGUAGE_VERSIONS[language],
        "files":[{
            "content": sourceCode
        },
    ]
    });
    return response.data;
}