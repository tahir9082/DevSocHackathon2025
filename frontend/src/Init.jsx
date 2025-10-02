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
  const [degree, setDegree] = useState(""); // e.g. "BSc Computer Science"
  const [interestInput, setInterestInput] = useState("");
  const [interests, setInterests] = useState([]); // array of strings for "Personal Interests"
  const [courseType, setCourseType] = useState("Free Elective"); // default selection
  const addInterest = (raw) => {
    const val = (raw || "").trim();
    if (!val) return;
    const up = val;
    if (interests.includes(up)) return;
    setInterests((p) => [...p, up]);
    setInterestInput("");
  };

  // remove interest
  const removeInterest = (idx) => {
    setInterests((p) => p.filter((_, i) => i !== idx));
  };

  const handleInterestKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      if (interestInput.trim()) addInterest(interestInput);
    } else if (e.key === "Backspace" && interestInput === "" && interests.length) {
      removeInterest(interests.length - 1);
    }
  };

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
      <div className="glass-card card-entrance p-6 rounded-2xl shadow-2xl w-full max-w-lg">
        <h2 className="text-3xl font-extrabold mb-4 text-center">
          Add your completed courses
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Completed Courses */}
          <label className="block mb-2 font-semibold">Completed Courses</label>
          <div className="relative min-h-[56px] mb-4 p-2 rounded bg-gray-700 flex flex-wrap gap-2 items-center overflow-visible">
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
                >
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
              aria-autocomplete="list"
              aria-controls="course-suggestions"
            />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <ul
              id="course-suggestions"
              role="listbox"
              className="absolute left-0 right-0 z-50 mt-2 bg-gray-700 rounded p-2 max-h-44 overflow-y-auto shadow-lg"
              style={{ listStyleType: "none" }}
            >
              {suggestions.map((s) => (
                <li
                  key={s.value}
                  role="option"
                  tabIndex={0}
                  className="p-2 hover:bg-gray-600 cursor-pointer rounded"
                  onClick={() => addCourse(s.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addCourse(s.value); }}
                >
                  {s.label || s.value}
                </li>
              ))}
            </ul>
          )}


          {/* Extra onboarding (UI-only) */}
          <div className="mt-4 p-4 rounded bg-gray-800 border border-gray-700">
            {/* Degree */}
            <label className="block text-sm font-semibold mb-2">
              Degree (optional)
            </label>
            <input
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="e.g. BSc (Computer Science)"
              className="w-full mb-3 px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Personal Interests */}
            <label className="block text-sm font-semibold mb-2">
              Personal interests (optional)
            </label>
            <div className="min-h-[44px] mb-3 p-2 rounded bg-gray-700 flex flex-wrap gap-2 items-center">
              {interests.map((it, i) => (
                <div
                  key={it + i}
                  className="flex items-center space-x-2 bg-gray-600 px-3 py-1 rounded-full text-sm"
                >
                  <span className="font-semibold">{it}</span>
                  <button
                    type="button"
                    onClick={() => removeInterest(i)}
                    className="text-gray-300 hover:text-white leading-none"
                    aria-label={`Remove ${it}`}
                  >
                    ×
                  </button>
                </div>
              ))}

              <input
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={handleInterestKeyDown}
                placeholder="Add an interest (press Enter)"
                className="flex-1 min-w-[140px] bg-transparent outline-none px-2 py-1 text-white"
              />
            </div>

            {/* Type of course */}
            <label className="block text-sm font-semibold mb-2">
              Type of course (optional)
            </label>
            <select
              value={courseType}
              onChange={(e) => setCourseType(e.target.value)}
              className="w-full mb-1 px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Free Elective</option>
              <option>General Education</option>
              <option>Core Course</option>
              <option>Degree Elective</option>
            </select>

            <p className="text-xs text-gray-400 mt-2">
              These options are for demo purposes only — they won't be saved to
              the server yet.
            </p>
          </div>

          {/* Error */}
          {error && <p className="text-red-500 mb-4">{error}</p>}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 rounded font-semibold text-white bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 transition-colors disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="py-2 px-4 bg-gray-600 hover:bg-gray-500 rounded font-semibold transition-colors"
            >
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
