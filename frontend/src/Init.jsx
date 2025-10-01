import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function Init({ token: propToken }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const token = propToken || localStorage.getItem("token");

  const [courses, setCourses] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  const normalise = (s) => s.trim().toUpperCase();

  const addCourse = (courseCode) => {
    const c = normalise(courseCode);
    if (!c) return;
    if (courses.includes(c)) {
      setError(`You've already added ${c}`);
      return;
    }
    setCourses((prev) => [...prev, c]);
    setInput("");
    setSuggestions([]);
    setError("");
  };

  const removeCourse = (i) => {
    setCourses((prev) => prev.filter((_, idx) => idx !== i));
  };

  // Fetch suggestions from backend as user types
useEffect(() => {
  const fetchSuggestions = async () => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/courses?query=${input}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch courses");
      let data = await res.json();

      const query = input.trim().toLowerCase();

      if (!query) {
        setSuggestions([]);
        return;
      }

      // Only matches where course_code starts with the query
      const codeMatches = data.filter(c =>
        c.course_code.toLowerCase().startsWith(query)
      );

      // Optional: matches where name includes query (secondary, after code matches)
      const nameMatches = data.filter(
        c =>
          !c.course_code.toLowerCase().startsWith(query) &&
          c.course_name.toLowerCase().includes(query)
      );

      // Combine code first, then name matches
      const sorted = [...codeMatches, ...nameMatches].slice(0, 10); // limit suggestions to top 10
      setSuggestions(sorted);


    } catch (err) {
      console.error(err);
    }
  };

  const delayDebounce = setTimeout(fetchSuggestions, 300); // debounce
  return () => clearTimeout(delayDebounce);
}, [input, token]);


  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (input.trim()) addCourse(input);
    } else if (e.key === "Backspace" && input === "" && courses.length) {
      removeCourse(courses.length - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) return navigate("/login", { replace: true });
    if (courses.length === 0) {
      setError("Please add at least one course.");
      inputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/auth/complete-init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completedCourses: courses, flagCompletedInit: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data?.message || "Failed to submit");
        setSubmitting(false);
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-lg">
        <h2 className="text-3xl font-extrabold mb-4 text-center">
          Add your completed courses
        </h2>

        <form onSubmit={handleSubmit}>
          <label className="block mb-2 font-semibold">Completed Courses</label>

          {/* Tags */}
          <div className="min-h-[56px] mb-4 p-2 rounded bg-gray-700 flex flex-wrap gap-2 items-center">
            {courses.map((c, i) => (
              <div
                key={c + i}
                className="flex items-center space-x-2 bg-gray-600 px-3 py-1 rounded-full text-sm"
              >
                <span className="font-semibold">{c}</span>
                <button type="button" onClick={() => removeCourse(i)}>
                  ×
                </button>
              </div>
            ))}

            {/* Input */}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type course code"
              className="flex-1 min-w-[150px] bg-transparent outline-none px-2 py-1 text-white"
            />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <ul className="bg-gray-700 rounded p-2 mb-4 max-h-40 overflow-y-auto">
              {suggestions.map((s) => (
                <li
                  key={s._id}
                  className="p-1 hover:bg-gray-600 cursor-pointer"
                  onClick={() => addCourse(s.course_code)}
                >
                  {s.course_code} - {s.course_name}
                </li>
              ))}
            </ul>
          )}

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded"
            >
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
