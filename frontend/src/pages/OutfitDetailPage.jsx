import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import CommentList from "../components/CommentList";
import VerifiedBadge from "../components/VerifiedBadge";
import "../components/fashion-home.css";

const BOOST_OPTIONS = [
  { key: "24h", label: "24 hours — NPR 99" },
  { key: "3d", label: "3 days — NPR 249" },
  { key: "1w", label: "1 week — NPR 499" },
];

export default function OutfitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [outfit, setOutfit] = useState(null);
  const [comments, setComments] = useState([]);
  const [liked, setLiked] = useState(false);
  const [boostOpen, setBoostOpen] = useState(false);
  const [boostDuration, setBoostDuration] = useState("24h");
  const [boosting, setBoosting] = useState(false);

  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [posting, setPosting] = useState(false);

  const likeToggleEnabled = useMemo(() => isAuthenticated, [isAuthenticated]);
  const isOwner = useMemo(
    () => Boolean(outfit?.is_own_post || (user && outfit?.author?.id === user.id)),
    [outfit, user]
  );

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

  async function handleBoost() {
    if (!isAuthenticated) {
      navigate("/login/form");
      return;
    }
    setBoosting(true);
    try {
      const res = await api.post("/api/payments/boost/initiate/", {
        outfit_id: Number(id),
        duration: boostDuration,
      });
      navigate("/payment/redirect", {
        state: {
          actionUrl: res.data.action_url,
          formFields: res.data.form_fields,
        },
      });
    } catch (e) {
      alert(e?.response?.data?.detail || "Could not start boost payment");
      setBoosting(false);
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
          {outfit.is_boosted ? <span className="boost-badge boost-badge-large">Boosted post</span> : null}

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
                {outfit.author?.is_verified ? <VerifiedBadge /> : null}
              </h2>
              {outfit.caption ? <p className="post-caption">{outfit.caption}</p> : null}
            </div>
          </header>

          {outfit.shop_url ? (
            <a href={outfit.shop_url} className="shop-now-btn shop-now-btn-large" target="_blank" rel="noopener noreferrer">
              Shop Now
            </a>
          ) : null}

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
            {isOwner ? (
              <button type="button" className="mini-btn boost-trigger-btn" onClick={() => setBoostOpen(true)}>
                Boost Post
              </button>
            ) : null}
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

      {boostOpen ? (
        <div className="modal-overlay" onClick={() => setBoostOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Boost this post</h3>
              <button type="button" onClick={() => setBoostOpen(false)}>
                Close
              </button>
            </div>
            <p className="empty-note">
              Boosted posts appear more often in feeds. Pay once via eSewa — no subscription required.
            </p>
            <div className="boost-options">
              {BOOST_OPTIONS.map((opt) => (
                <label key={opt.key} className="boost-option">
                  <input
                    type="radio"
                    name="boost-duration"
                    value={opt.key}
                    checked={boostDuration === opt.key}
                    onChange={() => setBoostDuration(opt.key)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <button type="button" className="primary-btn" onClick={handleBoost} disabled={boosting}>
              {boosting ? "Redirecting…" : "Pay with eSewa"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
