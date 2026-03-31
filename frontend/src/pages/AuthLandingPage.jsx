import { Link } from "react-router-dom";
import AuthShell from "../components/AuthShell";

export default function AuthLandingPage() {
  return (
    <AuthShell>
      <div className="auth-card-header">
        <h1 className="auth-card-title">Sign in to NepStyle</h1>
        <p className="auth-card-subtitle">Access your profile, saved looks, and community feed.</p>
      </div>
      <div className="auth-card-actions">
        <Link to="/login/form" className="auth-btn auth-btn-primary auth-btn-block">
          Continue with email
        </Link>
        <p className="auth-card-muted">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
      <Link to="/" className="auth-text-link auth-text-link-back">
        ← Back to home
      </Link>
    </AuthShell>
  );
}
