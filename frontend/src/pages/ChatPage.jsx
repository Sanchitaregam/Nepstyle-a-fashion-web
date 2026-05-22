import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, MoreHorizontal, Check, CheckCheck, Paperclip } from "lucide-react";
import api from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import Navbar from "../components/Navbar";
import { startConversationWithUsername, markAllRead } from "../chatActions";
import "../components/ChatPopover.css";

function getTimeLabel(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 604_800_000) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function CheckIcon({ read_ }) {
  return read_ ? <CheckCheck size={13} className="msg-msg-read" /> : <Check size={13} className="msg-msg-sent" />;
}

export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const messagesEndRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);

  // Start or open a 1:1 conversation by username
  async function startConversation(username) {
    if (!isAuthenticated || !user || user.username === username) return;
    setError(null);
    try {
      const cid = await startConversationWithUsername(username, navigate);
      if (cid) {
        setActiveConv({ id: cid, participants: [] });
        loadMessages(cid);
        await loadConversations();
      }
    } catch (e) {
      if (e?.response?.status !== 401) {
        setError(e?.response?.data?.detail || "Could not open chat.");
      }
    }
  }

  // Send a message
  async function sendMessage() {
    if (!activeConv) return;
    const trimmed = text.trim();
    if (!trimmed && !file) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("content", trimmed);
      if (file) fd.append("attachment", file);
      await api.post(`/api/chat/conversations/${activeConv.id}/send_message/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setText("");
      setFile(null);
      await loadMessages(activeConv.id);
      await loadConversations(); // refresh last message
    } catch (e) {
      if (e?.response?.status !== 401) {
        setError(e?.response?.data?.detail || "Failed to send message.");
      }
    } finally {
      setSending(false);
    }
  }

  // Switch conversation
  function onSelectConversation(c) {
    setActiveConv(c);
    setMessages([]);
    navigate(`/messages/${c.id}`);
    markRead();
    loadMessages(c.id);
  }

  // Poll for new messages every 8 seconds
  const poll = useCallback(async () => {
    if (!activeConv) return;
    try {
      const res = await api.get(`/api/chat/conversations/${activeConv.id}/`);
      setMessages(res.data.messages || []);
    } catch { /* ignore */ }
  }, [activeConv]);

  const loadMessages = useCallback(async (cid, activate = false) => {
    setMsgLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/chat/conversations/${cid}/`);
      setMessages(res.data.messages || []);
      if (activate) {
        setActiveConv(res.data);
      }
    } catch (e) {
      if (e?.response?.status !== 401) {
        setError(e?.response?.data?.detail || "Failed to load messages.");
      }
    } finally {
      setMsgLoading(false);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/chat/conversations/");
      const list = res.data?.results ?? res.data ?? [];
      setConversations(list);
      const cid = conversationId ? Number(conversationId) : null;
      if (cid) {
        const found = list.find((c) => c.id === cid);
        if (found) {
          setActiveConv(found);
          return;
        }
      }
      setActiveConv((prev) => prev ?? (list.length > 0 ? list[0] : null));
    } catch (e) {
      if (e?.response?.status !== 401) {
        setError(e?.response?.data?.detail || "Failed to load conversations.");
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, conversationId]);

  const markRead = useCallback(async () => {
    if (!activeConv) return;
    await markAllRead(activeConv.id);
    // Update UI state locally instead of making it a dependency
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConv.id ? { ...c, unread_count: 0 } : c))
    );
    setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
  }, [activeConv]);

  // New conversation from sidebar
  async function createNewConv() {
    const raw = prompt("Enter the other person's username:");
    if (!raw) return;
    const username = raw.trim().replace(/^@/, "");
    if (!username || !user || username === user.username) return;
    await startConversation(username);
  }

  useEffect(() => {
    loadConversations();
  }, [isAuthenticated, loadConversations]);

  useEffect(() => {
    if (!conversationId) return;
    const cid = Number(conversationId);
    
    // Try to find in existing list
    const found = conversations.find((c) => c.id === cid);
    if (found) {
      setActiveConv(found);
      loadMessages(cid, true);
      // Mark as read after a brief delay to ensure state is updated
      setTimeout(() => markAllRead(cid), 100);
    } else if (cid > 0) {
      // If not found, try to load the conversation directly
      loadMessages(cid, true);
    }
  }, [conversationId, conversations, loadMessages]);

  useEffect(() => {
    if (!activeConv) return;
    const iv = setInterval(poll, 8_000);
    return () => clearInterval(iv);
  }, [activeConv, poll]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Allow Enter to send
  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="fashion-app">
        <div className="fashion-container">
          <Navbar />
          <div className="chat-auth-hint">
            <h2>Messages</h2>
            <p>You need to log in to send and receive messages.</p>
            <Link to="/login/form" className="mini-btn">Log in</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fashion-app">
        <div className="fashion-container">
          <Navbar />
          <p className="empty-note" style={{ padding: 24 }}>Loading conversations…</p>
        </div>
      </div>
    );
  }

  const otherUser = activeConv
    ? activeConv.participants.find((p) => p.id !== user?.id)
    : null;

  return (
    <div className="fashion-app">
      <div className="fashion-container">
        <Navbar />
        <div className="chat-layout">
          {/* Sidebar — conversation list */}
          <aside className="chat-list-col">
            <div className="chat-list-head">
              <h2>Conversations</h2>
              <button type="button" className="chat-new-btn" onClick={createNewConv} title="New conversation">
                <Paperclip size={16} />
              </button>
            </div>
            {!conversations.length ? (
              <div className="chat-empty-list">
                <p className="empty-note">No conversations yet.</p>
                <button type="button" className="mini-btn" onClick={createNewConv}>
                  Start a conversation
                </button>
              </div>
            ) : (
              <ul className="chat-list">
                {conversations.map((c) => {
                  const them = c.participants.find((p) => p.id !== user?.id);
                  const isActive = activeConv?.id === c.id;
                  const lname = c.last_message;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`chat-list-row${isActive ? " active" : ""}`}
                        onClick={() => onSelectConversation(c)}
                      >
                        <div className="chat-list-avatar">
                          {them?.avatar_url ? (
                            <img src={them.avatar_url} alt={them.username} />
                          ) : (
                            <span>{them?.username?.slice(0, 1).toUpperCase() || "?"}</span>
                          )}
                          {c.unread_count > 0 && (
                            <span className="chat-list-badge">{c.unread_count}</span>
                          )}
                        </div>
                        <div className="chat-list-info">
                          <span className="chat-list-name">@{them?.username || "Unknown"}</span>
                          {lname && (
                            <span className="chat-list-preview">
                              {lname.sender?.username === user?.username ? "You: " : ""}
                              {lname.content?.slice(0, 48)}
                              {lname.content?.length > 48 ? "…" : ""}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {/* Message pane */}
          <section className="chat-message-col">
            {activeConv ? (
              <>
                <div className="chat-message-head">
                  <button
                    type="button"
                    className="chat-message-back"
                    onClick={() => navigate("/messages")}
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="chat-message-head-info">
                    <Link
                      to={`/u/${otherUser?.username}`}
                      className="chat-message-head-name"
                    >
                     @{otherUser?.username || "Unknown"}
                    </Link>
                  </div>
                  <button type="button" className="icon-btn" aria-label="More">
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                {msgLoading ? (
                  <p className="empty-note" style={{ padding: 24, textAlign: "center" }}>Loading messages…</p>
                ) : (
                  <div className="chat-messages-scroll">
                    <div className="chat-messages-list">
                      {messages.map((m) => {
                        const mine = m.sender?.id === user?.id;
                        return (
                          <div
                            key={m.id}
                            className={`chat-bubble-row${mine ? " mine" : " theirs"}`}
                          >
                            {mine ? null : (
                              <div className="chat-bubble-avatar">
                                <Link to={`/u/${m.sender?.username}`}>
                                  {otherUser?.avatar_url ? (
                                    <img src={otherUser.avatar_url} alt={m.sender?.username} />
                                  ) : (
                                    <span>{(m.sender?.username || "?").slice(0, 1).toUpperCase()}</span>
                                  )}
                                </Link>
                              </div>
                            )}
                            <div className={`chat-bubble${mine ? " mine" : " theirs"}`}>
                              <p className="chat-bubble-text">{m.content}</p>
                              {m.attachment && (
                                <a
                                  className="chat-bubble-attachment"
                                  href={m.attachment_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  📎 Attachment
                                </a>
                              )}
                              <div className="chat-bubble-meta">
                                <span>{getTimeLabel(m.created_at)}</span>
                                {mine && (
                                  <CheckIcon read_={m.read} />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                )}

                {/* Compose */}
                {file && (
                  <div className="chat-attach-preview">
                    <span className="chat-attach-name">{file.name}</span>
                    <button type="button" className="chat-attach-remove" onClick={() => setFile(null)}>
                      Remove
                    </button>
                  </div>
                )}
                <div className="chat-compose-bar">
                  <label className="chat-attach-btn" title="Attach file">
                    <Paperclip size={18} />
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      style={{ display: "none" }}
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="Message…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={onKeyDown}
                    className="chat-compose-input"
                    disabled={sending}
                  />
                  <button
                    type="button"
                    className="chat-send-btn"
                    onClick={sendMessage}
                    disabled={sending || (!text.trim() && !file)}
                    aria-label="Send"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div className="chat-no-selection">
                <Send size={32} strokeWidth={1.5} />
                <h3>Your messages</h3>
                <p>Select a conversation to start chatting.</p>
                <button type="button" className="mini-btn" onClick={createNewConv}>
                  New conversation
                </button>
              </div>
            )}
          </section>
        </div>
        {error && <p className="auth-error">{error}</p>}
      </div>
    </div>
  );
}
