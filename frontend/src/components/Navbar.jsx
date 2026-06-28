import { useEffect, useRef, useState } from "react";
import { Plus, Search, User, LineChart } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import ChatPopover from "./ChatPopover";
import NotificationsPopover from "./NotificationsPopover";
import "./fashion-home.css";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, doLogout } = useAuth();
  const [open, setOpen] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const profileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e) {
      const t = e.target;
      if (profileRef.current?.contains(t)) {
        return;
      }
      setOpen(null);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (location.pathname === "/search") {
      const q = new URLSearchParams(location.search).get("q") || "";
      setSearchQuery(q);
    }
  }, [location.pathname, location.search]);

  function onSearchSubmit(e) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

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

  useEffect(() => {
    // Re-render nav on route change so ChatPopover unread counts stay fresh
    return () => {};
  }, []);

  const username = user?.username ?? "Guest";

  return (
    <header className="top-navbar">
      <Link to="/" className="brand-wrap brand-link">
        <div className="brand-icon">N</div>
        <span className="brand-text">NepStyle</span>
      </Link>

      <form className="search-wrap" role="search" onSubmit={onSearchSubmit}>
        <Search size={18} aria-hidden />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search outfits, tags, creators…"
          aria-label="Search outfits"
        />
      </form>

      <div className="nav-actions">
        <Link to="/create/outfit" className="icon-btn icon-btn-create" aria-label="Create outfit" title="Create outfit">
          <Plus size={20} strokeWidth={2.5} />
        </Link>
        <Link to="/subscription" className="nav-premium-link" title="Premium plans">
          Premium
        </Link>
        <ChatPopover />
        <NotificationsPopover />

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
                <Link
                  to="/analytics"
                  className="nav-profile-menu-item nav-profile-menu-link nav-profile-menu-analytics"
                  role="menuitem"
                  onClick={() => setOpen(null)}
                >
                  <LineChart size={16} />
                  Premium Analytics
                </Link>
              )}
              <Link to="/subscription" className="nav-profile-menu-item nav-profile-menu-link" role="menuitem" onClick={() => setOpen(null)}>
                Premium Plans
              </Link>
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
