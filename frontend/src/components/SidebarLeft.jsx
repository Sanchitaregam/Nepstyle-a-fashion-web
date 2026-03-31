import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./fashion-home.css";

export default function SidebarLeft({ tags = [] }) {
  const { user, isAuthenticated } = useAuth();

  return (
    <aside className="side-stack">
      <section className="card">
        <div className="profile-top">
          {user?.avatar_url ? (
            <img className="avatar-lg" src={user.avatar_url} alt="" />
          ) : (
            <div className="avatar-lg avatar-placeholder">
              {(user?.username || "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <h3>{isAuthenticated && user?.username ? user.username : "Guest"}</h3>
          {!isAuthenticated ? (
            <Link to="/login/form" className="sidebar-link">
              Sign in
            </Link>
          ) : null}
        </div>
      </section>

      <section className="card">
        <h3 className="card-title">Trending Tags</h3>
        {tags.length ? (
          <ul className="simple-list tag-pill-list">
            {tags.map((t) => (
              <li key={t.name}>
                <span className="tag-pill">#{t.name}</span>
                {typeof t.post_count === "number" ? (
                  <span className="tag-count">{t.post_count}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-note">No tags yet. Add tags when you create an outfit.</p>
        )}
      </section>

      <section className="card">
        <h3 className="card-title">Style Challenges</h3>
        <ul className="simple-list">
          <li>Winter Outfit Contest</li>
          <li>Retro Fashion Week</li>
        </ul>
      </section>
    </aside>
  );
}
