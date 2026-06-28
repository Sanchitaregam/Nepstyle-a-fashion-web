import { Link } from "react-router-dom";
import VerifiedBadge from "./VerifiedBadge";
import "./fashion-home.css";

export default function InfluencerList({ creators = [] }) {
  return (
    <section className="card">
      <h3 className="card-title">Top Creators</h3>
      {creators.length ? (
        <ul className="influencer-list">
          {creators.map((c) => (
            <li key={c.id}>
              <Link to={`/u/${c.username}`} className="influencer-list-link">
                <div className="avatar-sm avatar-placeholder" aria-hidden>
                  {(c.username || "?").slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <strong>
                    @{c.username}
                    {c.is_verified ? <VerifiedBadge /> : null}
                    {c.is_featured ? <span className="featured-badge">Featured</span> : null}
                  </strong>
                  <span>{c.total_likes ?? 0} total likes on outfits</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-note">No creators yet. Post outfits to appear here.</p>
      )}
    </section>
  );
}
