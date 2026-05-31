import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import api from "../api/apiClient";
import "./NotificationsPopover.css";

function timeLabel(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { weekday: "short" });
}

export default function NotificationsPopover() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await api.get("/api/notifications/unread_count/");
      setUnreadCount(res.data?.unread_count ?? 0);
    } catch {
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.get("/api/notifications/");
      setItems(res.data?.results ?? res.data ?? []);
      await loadUnreadCount();
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, loadUnreadCount]);

  useEffect(() => {
    loadUnreadCount();
    if (!isAuthenticated) return undefined;
    const timer = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(timer);
  }, [isAuthenticated, loadUnreadCount]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open) loadNotifications();
  }, [open, loadNotifications]);

  async function openNotification(n) {
    setOpen(false);
    try {
      if (!n.read) {
        await api.post(`/api/notifications/${n.id}/mark_read/`);
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // ignore
    }
    if (n.link_path) navigate(n.link_path);
  }

  async function markAllRead() {
    try {
      await api.post("/api/notifications/mark_all_read/");
      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }

  if (!isAuthenticated) {
    return (
      <button type="button" className="icon-btn icon-bell" aria-label="Notifications" disabled>
        <Bell size={20} />
      </button>
    );
  }

  return (
    <div className="nav-dropdown-wrap" ref={panelRef}>
      <button
        type="button"
        className={`icon-btn icon-bell${open ? " icon-btn-active" : ""}`}
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={20} />
        {unreadCount > 0 ? (
          <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        ) : null}
      </button>

      {open ? (
        <div className="notif-nav-panel" role="dialog" aria-label="Notifications">
          <div className="notif-nav-head">
            <span className="notif-nav-title">Notifications</span>
            {unreadCount > 0 ? (
              <button type="button" className="notif-nav-all-btn" onClick={markAllRead}>
                Mark all read
              </button>
            ) : null}
          </div>

          {loading ? (
            <p className="notif-nav-loading">Loading…</p>
          ) : items.length === 0 ? (
            <div className="notif-nav-empty">
              <Bell size={28} strokeWidth={1.5} aria-hidden />
              <p>No notifications yet</p>
            </div>
          ) : (
            <ul className="notif-nav-list">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`notif-nav-row${n.read ? "" : " unread"}`}
                    onClick={() => openNotification(n)}
                  >
                    <div className="notif-nav-avatar">
                      {n.actor_avatar_url ? (
                        <img src={n.actor_avatar_url} alt="" />
                      ) : (
                        <span>{n.actor_username?.slice(0, 1)?.toUpperCase() || "?"}</span>
                      )}
                    </div>
                    <div className="notif-nav-info">
                      <span className="notif-nav-message">{n.message}</span>
                      <span className="notif-nav-time">{timeLabel(n.created_at)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
