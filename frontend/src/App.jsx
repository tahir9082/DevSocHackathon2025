import { useState, useEffect } from "react";
import Login from "./Login.jsx";
import Register from "./Register.jsx";
import Init from "./Init.jsx";

function App() {
  const [token, setToken] = useState(null); // JWT token
  const [flagCompletedInit, setFlagCompletedInit] = useState(null); // null = not loaded yet
  const [showRegister, setShowRegister] = useState(false);
  const [courses, setCourses] = useState([]);

  // --- On mount, restore from localStorage ---
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedFlag = localStorage.getItem("flagCompletedInit");

    if (storedToken) setToken(storedToken);

    if (storedFlag === "true") setFlagCompletedInit(true);
    else setFlagCompletedInit(false);
  }, []);

  // --- Fetch courses only if logged in and onboarding complete ---
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

  // --- Handle login/register success ---
  const handleAuth = (tok, flag) => {
    setToken(tok);
    setFlagCompletedInit(flag);
    localStorage.setItem("token", tok);
    localStorage.setItem("flagCompletedInit", flag);
  };

  // --- Handle Init completion ---
  const handleInitComplete = () => {
    setFlagCompletedInit(true);
    localStorage.setItem("flagCompletedInit", true);
  };

  // --- Logout ---
  const handleLogout = () => {
    setToken(null);
    setFlagCompletedInit(false);
    setCourses([]);
    localStorage.removeItem("token");
    localStorage.removeItem("flagCompletedInit");
  };

  // --- Routing logic ---

  // If still loading localStorage, render nothing
  if (flagCompletedInit === null) return null;

  // 1️⃣ Not logged in -> show login/register
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

  // 2️⃣ Logged in but onboarding incomplete -> show Init page
  if (!flagCompletedInit) {
    return <Init token={token} onInitComplete={handleInitComplete} />;
  }

  // 3️⃣ Logged in and onboarding complete -> show dashboard
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-4">
      <h1 className="text-4xl font-bold mb-4">Dashboard - Courses</h1>
      <ul className="text-lg mb-6">
        {courses.map((course) => (
          <li key={course._id}>
            {course.course_code}: {course.course_name}
          </li>
        ))}
      </ul>

      <button
        onClick={handleLogout}
        className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded font-semibold transition-colors"
      >
        Logout
      </button>
    </div>
  );
}

export default App;
