import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./styles/app.css";
import { RootProvider } from "./app/providers/RootProvider";
import { AppRouter } from "./app/router/AppRouter";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <RootProvider>
        <AppRouter />
      </RootProvider>
    </BrowserRouter>
  </StrictMode>
);
