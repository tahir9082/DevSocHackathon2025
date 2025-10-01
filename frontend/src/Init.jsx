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

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  const normalise = (s) => s.trim().toUpperCase();

  const addCourse = (raw) => {
    const c = normalise(raw);
    if (!c) return;
    if (courses.includes(c)) {
      setError(`You've already added ${c}`);
      return;
    }
    if (!/^[A-Z]{3,}\d{3,}$/i.test(c)) {
      // optional validation — currently ignored
    }
    setCourses((prev) => [...prev, c]);
    setInput("");
    setError("");
  };

  const removeCourse = (i) => {
    setCourses((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      if (input.trim()) addCourse(input);
    } else if (e.key === "Backspace" && input === "" && courses.length) {
      removeCourse(courses.length - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Authentication required.");
      return navigate("/login", { replace: true });
    }
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
        body: JSON.stringify({
          completedCourses: courses,
          flagCompletedInit: true,
        }),
      });

      if (!res.ok) {
        let msg = "Failed to submit. Please try again.";
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch (err) {}
        setError(msg);
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
        <p className="text-sm text-gray-300 mb-6 text-center">
          Add courses like <span className="font-mono">COMP1111</span>,{" "}
          <span className="font-mono">COMP2222</span>, etc. Press Enter or comma
          to add.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="block mb-2 font-semibold">Completed Courses</label>

          {/* Tag container */}
          <div className="min-h-[56px] mb-4 p-2 rounded bg-gray-700 flex flex-wrap gap-2 items-center">
            {courses.length === 0 && (
              <span className="text-gray-400 text-sm ml-2">
                No courses added yet
              </span>
            )}

            {courses.map((c, i) => (
              <div
                key={c + i}
                className="flex items-center space-x-2 bg-gray-600 px-3 py-1 rounded-full text-sm"
              >
                <span className="font-semibold">{c}</span>
                <button
                  type="button"
                  onClick={() => removeCourse(i)}
                  className="text-gray-300 hover:text-white leading-none"
                  aria-label={`Remove ${c}`}
                >
                  ×
                </button>
              </div>
            ))}

            {/* Input for new courses */}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type course code and press Enter"
              className="flex-1 min-w-[150px] bg-transparent outline-none px-2 py-1 text-white"
            />
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition-colors disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded font-semibold transition-colors"
            >
              Skip (go to dashboard)
            </button>
          </div>
        </form>

        <div className="mt-6 text-xs text-gray-400">
          Tip: you can remove tags with the × button or press Backspace when the
          input is empty to remove the last entry.
        </div>
      </div>
    </div>
  );
}
