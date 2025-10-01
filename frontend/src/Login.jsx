import { useState } from "react";

function Login({ onLogin, switchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError("Invalid credentials");
        return;
      }

      const data = await res.json();
      onLogin(data.token, data.flagCompletedInit); // pass JWT token to App
    } catch (err) {
      setError("Login failed");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white px-4">
      <h1 className="text-5xl font-extrabold mb-8 text-center">
        Welcome to DevSoc Hackathon 2025
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-sm"
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
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition-colors"
        >
          Login
        </button>

        <p className="mt-4 text-center">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={switchToRegister}
            className="text-blue-400 hover:underline"
          >
            Register
          </button>
        </p>
      </form>
    </div>
  );
}

export default Login;
