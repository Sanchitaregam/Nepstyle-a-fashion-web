import { Link } from "react-router-dom";
import "./fashion-home.css";

export default function TrendingLooks({ looks = [] }) {
  if (!looks.length) {
    return (
      <section className="card">
        <h2 className="section-title">Trending Looks</h2>
        <p className="empty-note">No trending outfits yet. Create a post with tags to climb the feed.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2 className="section-title">Trending Looks</h2>
      <div className="looks-grid">
        {looks.map((look) => (
          <Link to={`/outfits/${look.id}`} key={look.id} className="look-card-link">
            <article className="look-card">
              {look.image ? (
                <img src={look.image} alt={look.title} />
              ) : (
                <div className="look-placeholder" />
              )}
              <div className="look-overlay">{look.title}</div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
