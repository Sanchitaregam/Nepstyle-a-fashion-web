import { Link } from "react-router-dom";
import "../pages/AuthLandingPage.css";

export default function AuthShell({ children }) {
  return (
    <div className="auth-shell">
      <aside className="auth-shell-aside">
        <Link to="/" className="auth-shell-logo-link">
          <span className="auth-shell-logo-mark" aria-hidden>
            N
          </span>
          <span className="auth-shell-logo-text">NepStyle</span>
        </Link>
        <p className="auth-shell-eyebrow">Fashion community</p>
        <h2 className="auth-shell-headline">Your next outfit starts here.</h2>
        <p className="auth-shell-lede">
          Share looks, discover trends, and build a profile that showcases your style.
        </p>
        <ul className="auth-shell-features">
          <li>
            <span className="auth-shell-feature-icon" aria-hidden>
              ✦
            </span>
            Curated feeds and trending looks
          </li>
          <li>
            <span className="auth-shell-feature-icon" aria-hidden>
              ✦
            </span>
            Portfolio-style profiles
          </li>
          <li>
            <span className="auth-shell-feature-icon" aria-hidden>
              ✦
            </span>
            Built for creators and enthusiasts
          </li>
        </ul>
      </aside>

      <main className="auth-shell-main">
        <div className="auth-card">{children}</div>
      </main>
    </div>
  );
}
