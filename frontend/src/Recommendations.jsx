import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/* Helper: decode JWT payload without verification */
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

export default function Recommendations({ token: propToken }) {
  console.log("Recommendations mounted"); // <-- add this
  const navigate = useNavigate();
  const token = propToken || localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tiers, setTiers] = useState({ strong: [], moderate: [], weak: [] });
  const [expanded, setExpanded] = useState({}); // track which course_code is expanded
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    // main flow:
    // 1) try GET /auth/me to obtain completedCourses
    // 2) if not available, try to decode token and GET /user/:id
    // 3) POST /recommendations with { completedCourses }
    let cancelled = false;

    async function fetchUserCompletedCourses() {
      setLoading(true);
      setError("");
      try {
        // Try /auth/me first
        if (token) {
          try {
            const meRes = await fetch("http://localhost:5000/auth/me", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (meRes.ok) {
              const meData = await meRes.json();
              // expecting meData.completedCourses as either [{courseId: 'CODE'}] or ['CODE', ...]
              if (meData) {
                // normalize to array of strings
                let completed = [];
                if (Array.isArray(meData.completedCourses)) {
                  // handle array of objects or array of strings
                  completed = meData.completedCourses.map((c) =>
                    typeof c === "string" ? c : c.courseId || c.course_code || ""
                  ).filter(Boolean);
                } else if (Array.isArray(meData.courses)) {
                  completed = meData.courses.map(c => c.course_code || c).filter(Boolean);
                }
                if (completed.length) return completed;
              }
            }
          } catch (err) {
            // ignore and fallback
          }
        }

        // fallback: try /user/:id if token contains id
        const decodedId = token ? extractUserIdFromJwt(token) : null;
        if (decodedId) {
          try {
            const uRes = await fetch(`http://localhost:5000/user/${encodeURIComponent(decodedId)}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (uRes.ok) {
              const u = await uRes.json();
              if (u) {
                if (Array.isArray(u.completedCourses)) {
                  const completed = u.completedCourses.map(c =>
                    typeof c === "string" ? c : c.courseId || c.course_code || ""
                  ).filter(Boolean);
                  if (completed.length) return completed;
                }
              }
            }
          } catch (err) {
            // ignore and fallback
          }
        }

        // final fallback: try read from localStorage (e.g. dev)
        const local = localStorage.getItem("completedCourses");
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length) return parsed;
          } catch (err) {}
        }

        return [];
      } catch (err) {
        console.error("Failed to fetch user completed courses", err);
        return [];
      }
    }

    async function loadRecommendations() {
      const completed = await fetchUserCompletedCourses();
      if (cancelled) return;

      if (!completed || completed.length === 0) {
        setError("No completed courses found for this user. Please run the init flow first.");
        setTiers({ strong: [], moderate: [], weak: [] });
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/recommendations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ completedCourses: completed }),
        });

        if (!res.ok) {
          let msg = `Recommendations request failed (${res.status})`;
          try {
            const d = await res.json();
            if (d?.error || d?.message) msg = d.error || d.message;
          } catch (err) {}
          setError(msg);
          setTiers({ strong: [], moderate: [], weak: [] });
        } else {
          const data = await res.json();
          // expect data.strong/.moderate/.weak arrays
          setTiers({
            strong: Array.isArray(data.strong) ? data.strong : [],
            moderate: Array.isArray(data.moderate) ? data.moderate : [],
            weak: Array.isArray(data.weak) ? data.weak : [],
          });
        }
      } catch (err) {
        console.error(err);
        setError("Network error while fetching recommendations.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [token, refreshKey, navigate]);

  const toggleExpand = (code) => {
    setExpanded((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const renderCourseCard = (c) => {
    const code = c.course_code || c.value || c.courseId || c.course_code;
    const name = c.course_name || c.label || "";
    const score = typeof c.score !== "undefined" ? c.score : null;

    return (
      <div key={code} className="mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-gray-600 px-4 py-2 rounded-full font-semibold text-sm">
            {code}
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-300">{name}</div>
            <button
              type="button"
              onClick={() => toggleExpand(code)}
              className="text-xs text-blue-400 hover:underline mt-1"
            >
              {expanded[code] ? "Hide details" : "Show details"}
            </button>
          </div>
          {score !== null && (
            <div className="text-xs text-gray-400 ml-2">{Number(score).toFixed(2)}</div>
          )}
        </div>

        {expanded[code] && (
          <div className="mt-2 ml-16 p-3 bg-gray-700 rounded text-sm">
            <div><span className="font-semibold">Name: </span>{c.course_name || c.label || "—"}</div>
            <div><span className="font-semibold">Faculty: </span>{c.faculty || "—"}</div>
            <div><span className="font-semibold">School: </span>{c.school || "—"}</div>
            <div><span className="font-semibold">Campus: </span>{c.campus || "—"}</div>
            <div><span className="font-semibold">Career: </span>{c.career || "—"}</div>
            {typeof c.score !== "undefined" && <div><span className="font-semibold">Score: </span>{Number(c.score).toFixed(4)}</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-900 text-white px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold">Recommendations</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setRefreshKey((k) => k + 1); setLoading(true); }}
              className="py-2 px-3 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                setTiers({ strong: [], moderate: [], weak: [] });
                setExpanded({});
              }}
              className="py-2 px-3 bg-gray-600 hover:bg-gray-500 rounded text-sm"
            >
              Clear
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-300 py-12">Loading recommendations…</div>
        ) : error ? (
          <div className="text-center text-red-400 py-6">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Strong */}
            <section className="bg-gray-800 p-4 rounded">
              <h2 className="text-xl font-semibold mb-3">Strong</h2>
              {tiers.strong.length === 0 ? (
                <div className="text-sm text-gray-400">No strong recommendations.</div>
              ) : (
                tiers.strong.map((c) => renderCourseCard(c))
              )}
            </section>

            {/* Moderate */}
            <section className="bg-gray-800 p-4 rounded">
              <h2 className="text-xl font-semibold mb-3">Moderate</h2>
              {tiers.moderate.length === 0 ? (
                <div className="text-sm text-gray-400">No moderate recommendations.</div>
              ) : (
                tiers.moderate.map((c) => renderCourseCard(c))
              )}
            </section>

            {/* Weak */}
            <section className="bg-gray-800 p-4 rounded">
              <h2 className="text-xl font-semibold mb-3">Weak</h2>
              {tiers.weak.length === 0 ? (
                <div className="text-sm text-gray-400">No weak recommendations.</div>
              ) : (
                tiers.weak.map((c) => renderCourseCard(c))
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
