import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "sonner";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <>
      <App />
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
        duration={4000}
      />
    </>
  );
} else {
  console.error('Root element not found: #root');
}
  