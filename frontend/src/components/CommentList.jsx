import { Link } from "react-router-dom";

function timeAgo(iso) {
  if (!iso) return "";
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return new Date(iso).toLocaleDateString();
}

export default function CommentList({ comments = [], emptyText = "No comments yet." }) {
  if (!comments.length) {
    return <p className="comments-empty">{emptyText}</p>;
  }

  return (
    <ul className="comments-list">
      {comments.map((comment) => {
        const username = comment.author?.username || "unknown";
        return (
          <li key={comment.id} className="comment-row">
            <span className="comment-avatar" aria-hidden>
              {username.slice(0, 1).toUpperCase()}
            </span>
            <div className="comment-body">
              <div className="comment-meta">
                <Link to={`/u/${username}`} className="comment-author">
                  @{username}
                </Link>
                <span className="comment-time">{timeAgo(comment.created_at)}</span>
              </div>
              <p className="comment-text">{comment.text}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
