import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

function timeAgo(iso) {
  if (!iso) return "";
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function RecentViewersCard({ viewers = [], locked = false }) {
  return (
    <section className="analytics-panel analytics-panel--stretch">
      <div className="analytics-panel-title-row">
        <h2>Profile viewers</h2>
        {!locked && viewers.length > 0 ? (
          <span className="analytics-panel-link">{viewers.length} recent</span>
        ) : null}
      </div>

      {locked ? (
        <p className="analytics-empty-state">Upgrade to Gold to see who viewed your profile.</p>
      ) : viewers.length === 0 ? (
        <p className="analytics-empty-state">
          When someone views your profile, they&apos;ll show up here.
        </p>
      ) : (
        <div>
          {viewers.map((viewer) => (
            <Link
              key={`${viewer.username}-${viewer.viewed_at}`}
              to={`/u/${viewer.username}`}
              className="analytics-viewer-row"
            >
              {viewer.avatar_url ? (
                <img src={viewer.avatar_url} alt="" className="analytics-avatar" />
              ) : (
                <div className="analytics-avatar-fallback">
                  {viewer.username?.slice(0, 1)?.toUpperCase()}
                </div>
              )}
              <div className="analytics-viewer-meta">
                <p className="analytics-viewer-name">@{viewer.username}</p>
                {viewer.location ? (
                  <p className="analytics-viewer-location">
                    <MapPin size={10} />
                    {viewer.location}
                  </p>
                ) : null}
              </div>
              <span className="analytics-viewer-time">{timeAgo(viewer.viewed_at)}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
