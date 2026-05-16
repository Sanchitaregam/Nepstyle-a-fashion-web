import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import CommentList from "./CommentList";

export default function FeedCommentsModal({ outfitId, open, onClose, onCountChange }) {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !outfitId) return;
    let cancelled = false;

    async function loadComments() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/outfits/${outfitId}/comments/`);
        if (!cancelled) {
          setComments(res.data || []);
        }
      } catch {
        if (!cancelled) {
          setComments([]);
          setError("Could not load comments.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadComments();
    return () => {
      cancelled = true;
    };
  }, [open, outfitId]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isAuthenticated) return;
    const text = newComment.trim();
    if (!text) return;

    setPosting(true);
    setError(null);
    try {
      const res = await api.post(`/api/outfits/${outfitId}/comments/`, { text });
      const created = res.data;
      setComments((prev) => {
        const next = [...prev, created];
        onCountChange?.(next.length);
        return next;
      });
      setNewComment("");
    } catch {
      setError("Could not post comment. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-card comments-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="comments-modal-title"
      >
        <header className="comments-modal-head">
          <div>
            <h3 id="comments-modal-title">Comments</h3>
            <p className="comments-modal-subtitle">{comments.length} total</p>
          </div>
          <button type="button" className="comments-modal-close" onClick={onClose} aria-label="Close comments">
            Close
          </button>
        </header>

        <div className="comments-modal-body">
          {loading ? (
            <p className="comments-empty">Loading comments…</p>
          ) : error && !comments.length ? (
            <p className="auth-error">{error}</p>
          ) : (
            <CommentList comments={comments} emptyText="No comments yet. Be the first to comment." />
          )}
        </div>

        <footer className="comments-modal-footer">
          {error && comments.length ? <p className="auth-error comments-inline-error">{error}</p> : null}
          {isAuthenticated ? (
            <form className="comments-compose" onSubmit={handleSubmit}>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment…"
                maxLength={500}
                aria-label="Write a comment"
              />
              <button type="submit" className="comments-post-btn" disabled={posting || !newComment.trim()}>
                {posting ? "Posting…" : "Post"}
              </button>
            </form>
          ) : (
            <p className="comments-login-hint">
              <Link to="/login/form">Sign in</Link> to add a comment.
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}
