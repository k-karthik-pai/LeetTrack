import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SessionProvider } from "./lib/session.jsx";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./styles/styles.css";
import "./styles/leetcode.css";
import "./styles/react.css";

createRoot(document.getElementById("app")).render(
  <StrictMode>
    <SessionProvider>
      <ErrorBoundary><App /></ErrorBoundary>
    </SessionProvider>
  </StrictMode>,
);
