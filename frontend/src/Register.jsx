// src/Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register({ onRegister, switchToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Registration failed");
        return;
      }

      const data = await res.json();
      onRegister(data.token, data.flagCompletedInit);

      // Navigate based on flag
      if (data.flagCompletedInit) {
        navigate("/recommendations", { replace: true });
      } else {
        navigate("/init", { replace: true });
      }
    } catch (err) {
      setError("Registration failed");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-4">
      <h1 className="text-5xl font-extrabold mb-6 text-center text-accent">Register</h1>

      <form
        onSubmit={handleSubmit}
        className="glass-card card-entrance p-6 rounded-2xl shadow-2xl w-full max-w-sm"
      >
        <label className="block mb-2 font-semibold">Email</label>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <label className="block mb-2 font-semibold">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <button
          type="submit"
          className="w-full py-2 rounded font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 transition-colors"
        >
          Register
        </button>

        <p className="mt-4 text-center">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-blue-400 hover:underline"
          >
            Login
          </button>
        </p>
      </form>
    </div>
  );
}

export default Register;
