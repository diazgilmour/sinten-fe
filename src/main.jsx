import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast"; // Import Toaster

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AuthProvider>
        <App />
        <Toaster position="top-center" reverseOrder={false} />{" "}
        {/* Tambahkan Toaster di sini */}
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
