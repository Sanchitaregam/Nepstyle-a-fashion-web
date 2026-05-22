import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import api from "../api/apiClient";
import "./ChatPopover.css";

function timeLabel(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { weekday: "short" });
}

export default function ChatPopover() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.get("/api/chat/conversations/");
      setConversations(res.data?.results ?? res.data ?? []);
    } catch (e) {
      // ignore errors for UI loader
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [sendingTo, setSendingTo] = useState(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function h(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  // Note: `loadConversations` is memoized with `useCallback` above so
  // it's stable across renders and won't trigger repeated effects.

  // Debounced user search
  useEffect(() => {
    if (!cmdQuery.trim()) { setUsers([]); }
    const timer = setTimeout(() => {
      if (!cmdQuery.trim()) return;
      if (!isAuthenticated) {
        setUsers([]);
        return;
      }
      api.get("/api/auth/users/", { params: { search: cmdQuery.trim(), limit: 8, followed_only: true } })
        .then((res) => (res.data || []).filter((u) => u.username !== user?.username))
        .then(setUsers)
        .catch((err) => {
          console.error("User search error:", err);
          setUsers([]);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [cmdQuery, user, isAuthenticated]);

  // Unread total
  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);

  // Expose a stable global so inline @username clicks can immediately open chat
  useEffect(() => {
    async function _start(username) {
      if (!isAuthenticated || !username || user?.username === username) return false;
      try {
        const res = await api.get("/api/chat/conversations/get_or_create/", {
          params: { username },
        });
        navigate(`/messages/${res.data.id}`);
        return true;
      } catch {
        return false;
      }
    }
    window.startConversationWithUsername = _start;
    return () => { delete window.startConversationWithUsername; };
  }, [isAuthenticated, user, navigate]);

  // Load conversations when panel opens
  useEffect(() => {
    if (open) loadConversations();
  }, [open, loadConversations]);

  // Open a conversation by id
  async function openConversation(c) {
    setOpen(false);
    setCmdOpen(false);
    navigate(`/messages/${c.id}`);
    try {
      await api.post(`/api/chat/conversations/${c.id}/mark_as_read/`);
      setConversations((prev) => prev.map((x) => (x.id === c.id ? { ...x, unread_count: 0 } : x)));
    } catch { /* ignore */ }
  }

  // Start conversation from search result
  async function startWith(u) {
    if (!u?.username || sendingTo) return;
    setSendingTo(u.username);
    setCmdOpen(false);
    setOpen(false);
    setCmdQuery("");
    try {
      const res = await api.get("/api/chat/conversations/get_or_create/", {
        params: { username: u.username },
      });
      navigate(`/messages/${res.data.id}`);
    } catch { /* ignore */ }
    setSendingTo(null);
  }

  // Navigate to full chat page
  function goFullChat() {
    setOpen(false);
    navigate("/messages");
  }

  return (
    <div className="nav-dropdown-wrap" ref={panelRef}>
      <button
        type="button"
        className={`nav-icon-btn${open === "messages" ? " active" : ""}`}
        aria-label="Messages"
        aria-expanded={open === "messages"}
        onClick={() => {
          setOpen((o) => (o === "messages" ? null : "messages"));
          setCmdOpen(false);
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {totalUnread > 0 && <span className="nav-badge">{totalUnread > 9 ? "9+" : totalUnread}</span>}
      </button>

      {open && (
        <div className="chat-nav-panel" role="dialog" aria-label="Messages">
          {/* Header */}
          <div className="chat-nav-head">
            <span className="chat-nav-title">Messages</span>
            <div className="chat-nav-actions">
              <button
                type="button"
                className="chat-nav-cmd-toggle"
                title="New message"
                onClick={() => setCmdOpen((v) => !v)}
              >
                ✏️
              </button>
              <button type="button" className="chat-nav-all-btn" onClick={goFullChat}>
                See all
              </button>
            </div>
          </div>

          {/* New message composer */}
          {cmdOpen && (
            <div className="chat-nav-compose">
              <input
                type="text"
                placeholder="Search a user to message…"
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                className="chat-nav-input"
                autoFocus
              />
              {users.length > 0 && (
                <ul className="chat-nav-user-list">
                  {users.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        className="chat-nav-user-row"
                        onClick={() => startWith(u)}
                        disabled={sendingTo === u.username}
                      >
                        <div className="chat-nav-user-avatar">
                          {u.avatar_url ? <img src={u.avatar_url} alt={u.username} /> : <span>{u.username.slice(0, 1).toUpperCase()}</span>}
                        </div>
                        <span className="chat-nav-user-name">@{u.username}</span>
                        {u.full_name && <span className="chat-nav-user-full">{u.full_name}</span>}
                        <span className="chat-nav-user-msg">Message</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {cmdQuery && !users.length && (
                <p className="chat-nav-empty">No users found.</p>
              )}
            </div>
          )}

          {/* Conversation list */}
          {loading ? (
            <p className="chat-nav-loading">Loading…</p>
          ) : conversations.length === 0 ? (
            <div className="chat-nav-empty-state">
              <p>No conversations yet</p>
              <button
                type="button"
                className="mini-btn"
                onClick={() => { setCmdOpen(true); setCmdQuery(""); }}
              >
                Start chatting
              </button>
            </div>
          ) : (
            <ul className="chat-nav-list">
              {conversations.map((c) => {
                const them = c.participants.find((p) => p.id !== user?.id);
                const isActive = false;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={`chat-nav-row${isActive ? " active" : ""}`}
                      onClick={() => openConversation(c)}
                    >
                      <div className="chat-nav-row-avatar">
                        {them?.avatar_url ? (
                          <img src={them.avatar_url} alt={them.username} />
                        ) : (
                          <span>{them?.username?.slice(0, 1).toUpperCase() || "?"}</span>
                        )}
                        {c.unread_count > 0 && <span className="chat-nav-row-badge">{c.unread_count}</span>}
                      </div>
                      <div className="chat-nav-row-info">
                        <span className="chat-nav-row-name">@{them?.username || "Unknown"}</span>
                        {c.last_message && (
                          <span className="chat-nav-row-preview">
                            {c.last_message.sender?.username === user?.username ? "You: " : ""}
                            {c.last_message.content?.slice(0, 40)}
                            {c.last_message.content?.length > 40 ? "…" : ""}
                          </span>
                        )}
                      </div>
                      {c.last_message && (
                        <span className="chat-nav-row-time">
                          {timeLabel(c.last_message.created_at)}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
