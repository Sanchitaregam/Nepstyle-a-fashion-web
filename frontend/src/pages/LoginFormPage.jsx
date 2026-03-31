import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AuthShell from "../components/AuthShell";

export default function LoginFormPage() {
  const navigate = useNavigate();
  const { doLogin } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      await doLogin({ username, password });
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Login failed");
    }
  }

  return (
    <AuthShell>
      <div className="auth-card-header">
        <h1 className="auth-card-title">Welcome back</h1>
        <p className="auth-card-subtitle">Enter your credentials to sign in to your account.</p>
      </div>
      {error ? <div className="auth-error">{typeof error === "string" ? error : "Something went wrong."}</div> : null}
      <form onSubmit={onSubmit} className="auth-form">
        <div className="auth-field">
          <label htmlFor="login-username">Username</label>
          <input
            id="login-username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="auth-field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button type="submit" className="auth-btn auth-btn-primary auth-btn-block">
          Sign in
        </button>
      </form>
      <p className="auth-card-muted">
        New here? <Link to="/register">Create an account</Link>
      </p>
      <Link to="/login" className="auth-text-link auth-text-link-back">
        ← Other sign-in options
      </Link>
    </AuthShell>
  );
}
