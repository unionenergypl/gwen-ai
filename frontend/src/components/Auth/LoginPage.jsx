import { useState } from "react";
import { useAuth } from "../../auth/AuthProvider";

export default function LoginPage() {
  const { login } = useAuth();

  const [username, setUsername] = useState("gwen-admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || "Unable to log in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#101827",
      padding: 20
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 380,
          padding: 32,
          borderRadius: 12,
          background: "#ffffff",
          color: "#172033",
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Gwen AI</h2>
        <p>Sign in to continue.</p>

        <label>Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          style={inputStyle}
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          style={inputStyle}
        />

        {error && (
          <p style={{ color: "#c62828" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 16,
            background: "#2563eb",
            color: "white",
            border: 0,
            borderRadius: 6,
            cursor: "pointer"
          }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  display: "block",
  boxSizing: "border-box",
  width: "100%",
  padding: 11,
  margin: "8px 0 18px",
  border: "1px solid #cbd5e1",
  borderRadius: 6
};