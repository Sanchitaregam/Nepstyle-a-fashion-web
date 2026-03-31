import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AuthShell from "../components/AuthShell";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { doRegister } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      await doRegister({ username, email, password, password2 });
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data || err.message || "Registration failed");
    }
  }

  return (
    <AuthShell>
      <div className="auth-card-header">
        <h1 className="auth-card-title">Create your account</h1>
        <p className="auth-card-subtitle">Join NepStyle to share outfits and connect with the community.</p>
      </div>
      <form onSubmit={onSubmit} className="auth-form-card">
        {error ? (
          <div className="auth-error">{typeof error === "string" ? error : JSON.stringify(error)}</div>
        ) : null}
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <button type="submit" className="auth-btn auth-btn-primary auth-btn-block">
          Create account
        </button>
      </form>
      <p className="auth-card-muted">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
      <Link to="/" className="auth-text-link auth-text-link-back">
        ← Back to home
      </Link>
    </AuthShell>
  );
}
