import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "./globals.css";
import App from "./app";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);