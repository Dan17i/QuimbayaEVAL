import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "./contexts/ThemeContext";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <ThemeProvider>
      <App />
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4000}
      />
    </ThemeProvider>
  );
} else {
  console.error('Root element not found: #root');
}
  