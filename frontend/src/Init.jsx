// src/Init.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Init.jsx
 * - POSTs to: POST http://localhost:5000/user/:id/completed-courses
 * - Calls onInitComplete() on success so parent flips flagCompletedInit.
 */

export default function Init({ token: propToken, onInitComplete }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const token = propToken || localStorage.getItem("token");

  const [courses, setCourses] = useState([]); // array of course codes (strings)
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]); // backend shape: {value, label}
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    } else {
      const extracted = extractUserIdFromJwt(token);
      if (extracted) {
        setUserId(extracted);
      } else {
        (async () => {
          try {
            const res = await fetch("http://localhost:5000/auth/me", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            const id = data?.id || data?._id || data?.userId;
            if (id) setUserId(id);
          } catch (err) {
            console.warn("Could not fetch /auth/me for user id", err);
          }
        })();
      }
    }
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

  // Suggestions: call GET /courses/search?q=
  useEffect(() => {
    const fetchSuggestions = async () => {
      const q = input.trim();
      if (!q) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/courses/search?q=${encodeURIComponent(q)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) {
          setSuggestions([]);
          return;
        }
        const data = await res.json(); // expected shape: [{ value, label }, ...]
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Suggestion fetch failed:", err);
        setSuggestions([]);
      }
    };

    const t = setTimeout(fetchSuggestions, 250); // debounce
    return () => clearTimeout(t);
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

    if (!token) {
      setError("Authentication required.");
      return navigate("/login", { replace: true });
    }

    if (!userId) {
      setError("Could not determine current user. Please ensure you are logged in.");
      return;
    }

    if (courses.length === 0) {
      setError("Please add at least one course.");
      inputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/user/${encodeURIComponent(userId)}/completed-courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courses }),
      });

      if (!res.ok) {
        let msg = "Failed to save courses";
        try {
          const data = await res.json();
          if (data?.error || data?.message) msg = data.error || data.message;
        } catch (err) {}
        setError(msg);
        setSubmitting(false);
        return;
      }

      // Success: notify parent, stop submitting, then navigate to recommendations
      if (typeof onInitComplete === "function") onInitComplete();
      setSubmitting(false);
      navigate("/recommendations", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Mark onboarding done and go straight to recommendations
    if (typeof onInitComplete === "function") onInitComplete();
    navigate("/recommendations", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-lg">
        <h2 className="text-3xl font-extrabold mb-4 text-center">Add your completed courses</h2>

        <form onSubmit={handleSubmit}>
          <label className="block mb-2 font-semibold">Completed Courses</label>

          {/* Tags */}
          <div className="min-h-[56px] mb-4 p-2 rounded bg-gray-700 flex flex-wrap gap-2 items-center">
            {courses.map((c, i) => (
              <div key={c + i} className="flex items-center space-x-2 bg-gray-600 px-3 py-1 rounded-full text-sm">
                <span className="font-semibold">{c}</span>
                <button type="button" onClick={() => removeCourse(i)} className="text-gray-300 hover:text-white leading-none">
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
              placeholder="Type course code (or choose a suggestion)"
              className="flex-1 min-w-[150px] bg-transparent outline-none px-2 py-1 text-white"
            />
          </div>

          {/* Suggestions (backend gives {value, label}) */}
          {suggestions.length > 0 && (
            <ul className="bg-gray-700 rounded p-2 mb-4 max-h-40 overflow-y-auto">
              {suggestions.map((s) => (
                <li
                  key={s.value}
                  className="p-1 hover:bg-gray-600 cursor-pointer"
                  onClick={() => addCourse(s.value)}
                >
                  {s.label || s.value}
                </li>
              ))}
            </ul>
          )}

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition-colors disabled:opacity-60">
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <button type="button" onClick={handleSkip} className="py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded font-semibold transition-colors">
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */
function extractUserIdFromJwt(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.id || payload._id || payload.userId || payload.sub || null;
  } catch (err) {
    return null;
  }
}
