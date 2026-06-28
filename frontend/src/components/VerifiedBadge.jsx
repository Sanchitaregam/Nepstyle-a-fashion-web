import "./fashion-home.css";

export default function VerifiedBadge({ title = "Verified" }) {
  return (
    <span className="verified-badge" title={title} aria-label={title}>
      ✓
    </span>
  );
}
