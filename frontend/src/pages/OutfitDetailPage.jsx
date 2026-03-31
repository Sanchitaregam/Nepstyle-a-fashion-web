import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";

export default function OutfitDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();

  const [outfit, setOutfit] = useState(null);
  const [comments, setComments] = useState([]);
  const [liked, setLiked] = useState(false);

  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        // Track a view when user opens the detail page.
        await api.post(`/api/outfits/${id}/view/`);

        const commentsRes = await api.get(`/api/outfits/${id}/comments/`);
        if (cancelled) return;
        setComments(commentsRes.data);
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

    const res = await api.post(`/api/outfits/${id}/comments/`, { text });
    setComments((prev) => [...prev, res.data]);
    setNewComment("");
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!outfit) return <div>Not found</div>;

  return (
    <div>
      <div style={{ padding: 16, textAlign: "left" }}>
        <Link to="/">← Back</Link>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 16, textAlign: "left" }}>
        {outfit.image_url ? (
          <img src={outfit.image_url} alt={outfit.caption || "Outfit"} style={{ width: "100%", maxHeight: 520, objectFit: "cover", borderRadius: 12 }} />
        ) : null}
        <h2 style={{ marginTop: 12 }}>{outfit.author?.username}</h2>
        {outfit.caption ? <p>{outfit.caption}</p> : null}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            type="button"
            onClick={toggleLike}
            style={{
              cursor: likeToggleEnabled ? "pointer" : "not-allowed",
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid rgba(170, 59, 255, 0.5)",
              background: liked ? "rgba(170, 59, 255, 0.15)" : "transparent",
            }}
          >
            {liked ? "Liked" : "Like"} ({outfit.like_count})
          </button>
          <div style={{ color: "#6b6375" }}>Views: {outfit.view_count}</div>
        </div>

        <h3 style={{ marginTop: 24 }}>Comments</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(comments || []).map((c) => (
            <div key={c.id} style={{ border: "1px solid #e5e4e7", borderRadius: 10, padding: 10 }}>
              <div style={{ fontWeight: 600 }}>{c.author?.username}</div>
              <div>{c.text}</div>
              <div style={{ color: "#6b6375", fontSize: 13 }}>{new Date(c.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>

        <form onSubmit={submitComment} style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isAuthenticated ? "Write a comment..." : "Login to comment"}
            rows={3}
            disabled={!isAuthenticated}
          />
          <button type="submit" disabled={!isAuthenticated}>
            Post Comment
          </button>
        </form>
      </div>
    </div>
  );
}

