import { useEffect, useMemo, useState } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import FeedCommentsModal from "./FeedCommentsModal";
import "./fashion-home.css";

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
  return d.toLocaleDateString();
}

export default function PostCard({
  outfits = [],
  title = "Latest Outfits",
  emptyMessage = "No outfits posted yet.",
  showCount = false,
}) {
  const { isAuthenticated } = useAuth();
  const [feedOutfits, setFeedOutfits] = useState(outfits);
  const [likedMap, setLikedMap] = useState({});
  const [commentsOpenFor, setCommentsOpenFor] = useState(null);

  useEffect(() => {
    setFeedOutfits(outfits);
  }, [outfits]);

  useEffect(() => {
    let cancelled = false;

    async function loadLikeStatuses() {
      if (!isAuthenticated || !outfits.length) {
        if (!cancelled) setLikedMap({});
        return;
      }
      try {
        const entries = await Promise.all(
          outfits.map(async (outfit) => {
            const res = await api.get(`/api/outfits/${outfit.id}/like-status/`);
            return [outfit.id, !!res.data?.liked];
          })
        );
        if (!cancelled) {
          setLikedMap(Object.fromEntries(entries));
        }
      } catch {
        if (!cancelled) setLikedMap({});
      }
    }

    loadLikeStatuses();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, outfits]);

  const activeOutfits = useMemo(() => feedOutfits || [], [feedOutfits]);

  async function onToggleLike(outfitId) {
    if (!isAuthenticated) return;
    try {
      const res = await api.post(`/api/outfits/${outfitId}/like/`);
      const liked = !!res.data?.liked;
      const likeCount = Number(res.data?.like_count ?? 0);
      setLikedMap((prev) => ({ ...prev, [outfitId]: liked }));
      setFeedOutfits((prev) =>
        prev.map((item) => (item.id === outfitId ? { ...item, like_count: likeCount } : item))
      );
    } catch {
      // no-op: keep current UI state if request fails
    }
  }

  function onOpenComments(outfitId) {
    setCommentsOpenFor(outfitId);
  }

  function onCommentCountChange(outfitId, count) {
    setFeedOutfits((prev) =>
      prev.map((item) => (item.id === outfitId ? { ...item, comment_count: count } : item))
    );
  }

  if (!outfits.length) {
    return (
      <section className="card">
        <h2 className="section-title">{title}</h2>
        <p className="empty-note">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="section-title-row">
        <h2 className="section-title">{title}</h2>
        {showCount ? <span className="section-title-meta">{outfits.length} found</span> : null}
      </div>

      {activeOutfits.map((outfit) => (
        <article className="post-card" key={outfit.id}>
          <header className="post-header">
            <div className="avatar-sm avatar-placeholder" aria-hidden>
              {(outfit.author?.username || "?").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h4>
                <Link to={`/u/${outfit.author?.username || ""}`} className="brand-link">
                  {outfit.author?.username || "User"}
                </Link>
              </h4>
              <span>{timeAgo(outfit.created_at)}</span>
            </div>
          </header>

          {outfit.caption ? <p className="post-caption">{outfit.caption}</p> : null}

          <div className="post-images post-images-single">
            <Link to={`/outfits/${outfit.id}`}>
              {outfit.image_url ? (
                <img src={outfit.image_url} alt={outfit.caption || "Outfit"} />
              ) : (
                <div className="look-placeholder" style={{ height: 240 }} />
              )}
            </Link>
          </div>

          <footer className="post-actions-bar">
            <div className="post-actions-group" aria-label="Post interactions">
              <button
                type="button"
                className={`post-action-btn ${likedMap[outfit.id] ? "is-liked" : ""}`}
                onClick={() => onToggleLike(outfit.id)}
                aria-label={likedMap[outfit.id] ? "Unlike post" : "Like post"}
                title={isAuthenticated ? "Like" : "Login required to like"}
              >
                <Heart size={17} strokeWidth={2} fill={likedMap[outfit.id] ? "currentColor" : "none"} />
                <span className="post-action-count">{outfit.like_count ?? 0}</span>
              </button>
              <button
                type="button"
                className="post-action-btn"
                onClick={() => onOpenComments(outfit.id)}
                aria-label="Open comments"
              >
                <MessageCircle size={17} strokeWidth={2} />
                <span className="post-action-count">{outfit.comment_count ?? 0}</span>
              </button>
            </div>
            <Link to={`/outfits/${outfit.id}`} className="post-action-view">
              <Share2 size={15} strokeWidth={2} />
              <span>View</span>
            </Link>
          </footer>
        </article>
      ))}

      <FeedCommentsModal
        outfitId={commentsOpenFor}
        open={Boolean(commentsOpenFor)}
        onClose={() => setCommentsOpenFor(null)}
        onCountChange={(count) => onCommentCountChange(commentsOpenFor, count)}
      />
    </section>
  );
}
