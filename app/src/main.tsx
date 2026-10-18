import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./i18n"; // Must be imported before App so i18n is ready
import "./styles/design-system.css";
import App from "./App";

// Log app opened event (fire-and-forget, best effort)
import { logEvent, getOrCreateDefaultPatient } from "./db/db";

getOrCreateDefaultPatient()
  .then((p) => logEvent("app_opened", p.id, { ua: navigator.userAgent.slice(0, 80) }))
  .catch(() => {}); // Never block render on DB error

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
