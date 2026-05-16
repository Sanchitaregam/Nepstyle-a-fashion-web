import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import CommentList from "../components/CommentList";
import "../components/fashion-home.css";

export default function OutfitDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();

  const [outfit, setOutfit] = useState(null);
  const [comments, setComments] = useState([]);
  const [liked, setLiked] = useState(false);

  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [posting, setPosting] = useState(false);

  const likeToggleEnabled = useMemo(() => isAuthenticated, [isAuthenticated]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const outfitRes = await api.get(`/api/outfits/${id}/`);
        if (cancelled) return;
        setOutfit(outfitRes.data);

        if (likeToggleEnabled) {
          const likedRes = await api.get(`/api/outfits/${id}/like-status/`);
          if (cancelled) return;
          setLiked(!!likedRes.data.liked);
        }

        await api.post(`/api/outfits/${id}/view/`);

        const commentsRes = await api.get(`/api/outfits/${id}/comments/`);
        if (cancelled) return;
        setComments(commentsRes.data || []);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.detail || e.message || "Failed to load outfit");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, likeToggleEnabled]);

  async function toggleLike() {
    if (!isAuthenticated) {
      alert("Please login to like outfits.");
      return;
    }
    const res = await api.post(`/api/outfits/${id}/like/`);
    setLiked(res.data.liked);
    setOutfit((prev) => (prev ? { ...prev, like_count: res.data.like_count } : prev));
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Please login to comment.");
      return;
    }
    const text = newComment.trim();
    if (!text) return;

    setPosting(true);
    try {
      const res = await api.post(`/api/outfits/${id}/comments/`, { text });
      setComments((prev) => [...prev, res.data]);
      setNewComment("");
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return (
      <div className="fashion-app">
        <div className="fashion-container">
          <p className="empty-note">Loading outfit…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fashion-app">
        <div className="fashion-container">
          <p className="auth-error">{error}</p>
        </div>
      </div>
    );
  }

  if (!outfit) {
    return (
      <div className="fashion-app">
        <div className="fashion-container">
          <p className="empty-note">Outfit not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fashion-app">
      <div className="fashion-container outfit-detail-wrap">
        <Link to="/" className="outfit-detail-back">
          ← Back to feed
        </Link>

        <article className="card outfit-detail-card">
          {outfit.image_url ? (
            <img src={outfit.image_url} alt={outfit.caption || "Outfit"} className="outfit-detail-image" />
          ) : null}

          <header className="post-header outfit-detail-head">
            <div className="avatar-sm avatar-placeholder" aria-hidden>
              {(outfit.author?.username || "?").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h2 className="outfit-detail-username">
                <Link to={`/u/${outfit.author?.username || ""}`} className="brand-link">
                  @{outfit.author?.username}
                </Link>
              </h2>
              {outfit.caption ? <p className="post-caption">{outfit.caption}</p> : null}
            </div>
          </header>

          <div className="post-actions-bar outfit-detail-actions">
            <button
              type="button"
              className={`post-action-btn ${liked ? "is-liked" : ""}`}
              onClick={toggleLike}
              disabled={!likeToggleEnabled}
            >
              {liked ? "Liked" : "Like"} ({outfit.like_count ?? 0})
            </button>
            <span className="outfit-detail-views">Views: {outfit.view_count ?? 0}</span>
          </div>

          <section className="outfit-detail-comments">
            <h3>Comments</h3>
            <CommentList comments={comments} emptyText="No comments yet." />

            <form className="comments-compose outfit-detail-compose" onSubmit={submitComment}>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={isAuthenticated ? "Add a comment…" : "Login to comment"}
                disabled={!isAuthenticated}
                maxLength={500}
                aria-label="Write a comment"
              />
              <button type="submit" className="comments-post-btn" disabled={!isAuthenticated || posting || !newComment.trim()}>
                {posting ? "Posting…" : "Post"}
              </button>
            </form>
          </section>
        </article>
      </div>
    </div>
  );
}
