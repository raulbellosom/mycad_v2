import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./styles/app.css";
import { RootProvider } from "./app/providers/RootProvider";
import { AppRouter } from "./app/router/AppRouter";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <RootProvider>
        <AppRouter />
      </RootProvider>
    </BrowserRouter>
  </React.StrictMode>
);
