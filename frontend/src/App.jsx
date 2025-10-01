import { useState, useEffect } from "react";

function App() {
  const [count, setCount] = useState(0);
  const [courses, setCourses] = useState([]);
  const [backendStatus, setBackendStatus] = useState("Checking...");

  useEffect(() => {
    fetch("http://localhost:5000/api/courses")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        setCourses(data);
        setBackendStatus("Backend connected ✅");
      })
      .catch((err) => {
        console.error(err);
        setBackendStatus("Backend not reachable ❌");
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
      <h1 className="text-5xl font-extrabold mb-4 text-center">
        Welcome to DevSoc Hackathon 2025!
      </h1>

      <button
        onClick={() => setCount(count + 1)}
        className="px-6 py-3 mb-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
      >
        Click Me
      </button>
      <p className="mb-6 text-xl">
        Button clicked: <span className="font-bold">{count}</span> times
      </p>


      <p className="mb-4 text-green-400">{backendStatus}</p>
      <h2 className="text-3xl font-bold mb-2">Courses</h2>

      <ul className="text-lg space-y-1">
        {courses.map((course) => (
          <li key={course.id} className="px-4 py-2 bg-gray-800 rounded">
            {course.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

