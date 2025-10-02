// src/App.jsx
import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Init from "./Init";
import Recommendations from "./Recommendations";

// Guards
function RequireAuth({ token, children }) {
  if (!token) return <Navigate to="/" replace />;
  return children;
}
function RequireInitComplete({ flagCompletedInit, children }) {
  if (!flagCompletedInit) return <Navigate to="/init" replace />;
  return children;
}

export default function App() {
  const [token, setToken] = useState(null);
  const [flagCompletedInit, setFlagCompletedInit] = useState(null);

  // restore from localStorage once
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedFlag = localStorage.getItem("flagCompletedInit");
    if (storedToken) setToken(storedToken);
    if (storedFlag === "true") setFlagCompletedInit(true);
    else setFlagCompletedInit(false);
  }, []);

  const handleAuth = (tok, flag = false) => {
    setToken(tok);
    setFlagCompletedInit(Boolean(flag));
    localStorage.setItem("token", tok);
    localStorage.setItem("flagCompletedInit", flag ? "true" : "false");
  };

  const handleInitComplete = () => {
    setFlagCompletedInit(true);
    localStorage.setItem("flagCompletedInit", "true");
  };

  const handleLogout = () => {
    setToken(null);
    setFlagCompletedInit(false);
    localStorage.removeItem("token");
    localStorage.removeItem("flagCompletedInit");
  };

  // wait until flagLoaded to avoid flicker
  if (flagCompletedInit === null) return null;

  return (
    <Routes>
      {/* Root "/" — show login/register UI (no redirect) */}
      <Route
        path="/"
        element={<Login onLogin={handleAuth} switchToRegister={() => { /* not used here */ }} />}
      />
      <Route
        path="/register"
        element={<Register onRegister={handleAuth} switchToLogin={() => { /* not used */ }} />}
      />

      {/* Init - protected */}
      <Route
        path="/init"
        element={
          <RequireAuth token={token}>
            <Init token={token} onInitComplete={handleInitComplete} />
          </RequireAuth>
        }
      />

      {/* Recommendations - protected and requires onboarding */}
      <Route
        path="/recommendations"
        element={
          <RequireAuth token={token}>
            <RequireInitComplete flagCompletedInit={flagCompletedInit}>
              <Recommendations token={token} />
            </RequireInitComplete>
          </RequireAuth>
        }
      />

      {/* Catch-all -> show login (keeps behaviour simple) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
