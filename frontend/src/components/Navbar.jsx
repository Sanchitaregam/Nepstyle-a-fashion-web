import { useEffect, useRef, useState } from "react";
import { Bell, Mail, Search, User, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./fashion-home.css";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, doLogout } = useAuth();
  const [open, setOpen] = useState(null);

  const messagesRef = useRef(null);
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e) {
      const t = e.target;
      if (
        messagesRef.current?.contains(t) ||
        notificationsRef.current?.contains(t) ||
        profileRef.current?.contains(t)
      ) {
        return;
      }
      setOpen(null);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function toggle(panel) {
    setOpen((o) => (o === panel ? null : panel));
  }

  function onViewProfile() {
    setOpen(null);
    navigate(isAuthenticated ? "/profile" : "/login/form");
  }

  function onLogout() {
    setOpen(null);
    doLogout();
    navigate("/login");
  }

  const username = user?.username ?? "Guest";

  return (
    <header className="top-navbar">
      <Link to="/" className="brand-wrap brand-link">
        <div className="brand-icon">N</div>
        <span className="brand-text">NepStyle</span>
      </Link>

      <div className="search-wrap">
        <Search size={18} />
        <input placeholder="Search..." readOnly aria-label="Search" />
      </div>

      <div className="nav-actions">
        <div className="nav-dropdown-wrap" ref={messagesRef}>
          <button
            type="button"
            className={`icon-btn${open === "messages" ? " icon-btn-active" : ""}`}
            aria-label="Messages"
            aria-expanded={open === "messages"}
            onClick={() => toggle("messages")}
          >
            <Mail size={20} />
          </button>
          {open === "messages" && (
            <div className="nav-popover nav-popover-messages" role="dialog" aria-label="Messages">
              <div className="nav-coming-soon-card">
                <div className="nav-coming-soon-icon-wrap" aria-hidden>
                  <MessageCircle size={22} strokeWidth={1.75} />
                </div>
                <p className="nav-coming-soon-text">Messaging feature coming soon.</p>
              </div>
            </div>
          )}
        </div>

        <div className="nav-dropdown-wrap" ref={notificationsRef}>
          <button
            type="button"
            className={`icon-btn icon-bell${open === "notifications" ? " icon-btn-active" : ""}`}
            aria-label="Notifications"
            aria-expanded={open === "notifications"}
            onClick={() => toggle("notifications")}
          >
            <Bell size={20} />
            <span className="notif-badge">3</span>
          </button>
          {open === "notifications" && (
            <div className="nav-popover nav-popover-notifications" role="dialog" aria-label="Notifications">
              <div className="nav-notifications-inner">
                <Bell size={28} strokeWidth={1.5} className="nav-notifications-bell" aria-hidden />
                <p className="nav-coming-soon-text nav-notifications-copy">
                  Notifications feature coming soon.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="nav-dropdown-wrap" ref={profileRef}>
          <button
            type="button"
            className={`icon-btn avatar-nav-btn${open === "profile" ? " icon-btn-active" : ""}`}
            aria-label={isAuthenticated ? "Account menu" : "Open account menu"}
            aria-haspopup="menu"
            aria-expanded={open === "profile"}
            onClick={() => toggle("profile")}
          >
            {isAuthenticated && user?.avatar_url ? (
              <img className="avatar-sm" src={user.avatar_url} alt="" />
            ) : (
              <div className="avatar-sm avatar-placeholder" title={username}>
                {user?.username ? user.username.slice(0, 1).toUpperCase() : <User size={18} />}
              </div>
            )}
          </button>
          {open === "profile" && (
            <div className="nav-popover nav-profile-menu" role="menu">
              <div className="nav-profile-menu-header">
                {isAuthenticated && user?.avatar_url ? (
                  <img className="nav-profile-menu-avatar" src={user.avatar_url} alt="" />
                ) : (
                  <div className="nav-profile-menu-avatar nav-profile-menu-avatar-placeholder">
                    {user?.username ? user.username.slice(0, 1).toUpperCase() : <User size={20} />}
                  </div>
                )}
                <span className="nav-profile-menu-username">{username}</span>
              </div>
              <button type="button" className="nav-profile-menu-item" role="menuitem" onClick={onViewProfile}>
                View Profile
              </button>
              {isAuthenticated && (
                <button type="button" className="nav-profile-menu-item" role="menuitem" onClick={onLogout}>
                  Logout
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
