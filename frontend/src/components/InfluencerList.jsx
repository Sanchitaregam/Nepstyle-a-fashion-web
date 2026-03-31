import "./fashion-home.css";

export default function InfluencerList({ creators = [] }) {
  return (
    <section className="card">
      <h3 className="card-title">Top Creators</h3>
      {creators.length ? (
        <ul className="influencer-list">
          {creators.map((c) => (
            <li key={c.id}>
              <div className="avatar-sm avatar-placeholder" aria-hidden>
                {(c.username || "?").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <strong>{c.username}</strong>
                <span>{c.total_likes ?? 0} total likes on outfits</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-note">No creators yet. Post outfits to appear here.</p>
      )}
    </section>
  );
}
