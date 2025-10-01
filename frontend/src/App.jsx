import { useState, useEffect } from "react";
import Login from "./Login.jsx";
import Register from "./Register.jsx";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [flagCompletedInit, setFlagCompletedInit] = useState(
    localStorage.getItem("flagCompletedInit") === "true"
  );
  const [courses, setCourses] = useState([]);
  const [showRegister, setShowRegister] = useState(false);

  // Fetch courses only if logged in and on dashboard
  useEffect(() => {
    if (!token || !flagCompletedInit) return;

    fetch("http://localhost:5000/api/courses", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized or failed to fetch");
        return res.json();
      })
      .then((data) => setCourses(data))
      .catch((err) => console.error(err));
  }, [token, flagCompletedInit]);

  // Handles auth for both login and register
  const handleAuth = (tok, flag) => {
    setToken(tok);
    setFlagCompletedInit(flag);
    localStorage.setItem("token", tok);
    localStorage.setItem("flagCompletedInit", flag);
  };

  // ROUTING LOGIC:
  // Not logged in : show login/register
  if (!token) {
    return showRegister ? (
      <Register 
        onRegister={handleAuth}
        switchToLogin={() => setShowRegister(false)} 
      />
    ) : (
      <Login
        onLogin={handleAuth}
        switchToRegister={() => setShowRegister(true)}
      />
    );
  }

  // Logged in but flag is false : go to /init
  if (!flagCompletedInit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <h1 className="text-4xl font-bold">Welcome to /init - Complete your onboarding here!</h1>
        {/* TODO: Build actual onboarding form here */}
      </div>
    );
  }

  // Logged in and flag is true : go to /dashboard
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-4">
      <h1 className="text-4xl font-bold mb-4">Dashboard - Courses</h1>
      <ul className="text-lg mb-6">
        {courses.map((course) => (
          <li key={course.id}>{course.name}</li>
        ))}
      </ul>

      <button
        onClick={() => {
          setToken(null);
          setFlagCompletedInit(false);
          localStorage.clear();
        }}
        className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded font-semibold transition-colors"
      >
        Logout
      </button>
    </div>
  );
}

export default App;