import { Provider } from "@/components/ui/provider"
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { Analytics } from "@vercel/analytics/react"
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider>
      <App />
      <Analytics />
    </Provider>
  </React.StrictMode>,
)