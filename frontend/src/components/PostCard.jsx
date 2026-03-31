import { Heart, MessageCircle, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
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

export default function PostCard({ outfits = [] }) {
  if (!outfits.length) {
    return (
      <section className="card">
        <h2 className="section-title">Latest Outfits</h2>
        <p className="empty-note">No outfits posted yet.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2 className="section-title">Latest Outfits</h2>

      {outfits.map((outfit) => (
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

          <footer className="post-actions">
            <div>
              <Heart size={18} /> <span>{outfit.like_count ?? 0}</span>
            </div>
            <div>
              <MessageCircle size={18} /> <span>{outfit.comment_count ?? 0}</span>
            </div>
            <Link to={`/outfits/${outfit.id}`} className="post-share-link">
              <Share2 size={17} /> View
            </Link>
          </footer>
        </article>
      ))}
    </section>
  );
}
