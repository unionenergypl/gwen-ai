
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import App from "./App.jsx";
import GwenSales from "./sales/GwenSales.jsx";
import AuthProvider from "./auth/AuthProvider";

const currentPath =
  window.location.pathname.replace(/\/+$/, "") || "/";

const CurrentApp = currentPath === "/sales" ? GwenSales : App;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <CurrentApp />
    </AuthProvider>
  </StrictMode>
);
