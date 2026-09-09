import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";

import "./index.css";

import App from "./App.jsx";

import { EmployeeAuthProvider } from "./context/EmployeeAuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// PWA: register the service worker in production builds only.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <EmployeeAuthProvider>
        <App />
        <Toaster position="top-right" reverseOrder={false} />
      </EmployeeAuthProvider>
    </ThemeProvider>
  </StrictMode>,
);