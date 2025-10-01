import { useState, useEffect } from "react";
import Login from "./Login.jsx";
import Register from "./Register.jsx";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [courses, setCourses] = useState([]);
  const [showRegister, setShowRegister] = useState(false);

  // Fetch courses only if logged in
  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:5000/api/courses", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized or failed to fetch");
        return res.json();
      })
      .then((data) => setCourses(data))
      .catch((err) => console.error(err));
  }, [token]);

  if (!token) {
    return showRegister ? (
      <Register switchToLogin={() => setShowRegister(false)} />
    ) : (
      <Login
        onLogin={(tok) => {
          setToken(tok);
          localStorage.setItem("token", tok);
        }}
        switchToRegister={() => setShowRegister(true)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-4">
      <h1 className="text-4xl font-bold mb-4">Courses</h1>
      <ul className="text-lg mb-6">
        {courses.map((course) => (
          <li key={course.id}>{course.name}</li>
        ))}
      </ul>

      <button
        onClick={() => {
          setToken(null);
          localStorage.removeItem("token");
        }}
        className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded font-semibold transition-colors"
      >
        Logout
      </button>
    </div>
  );
}

export default App;
