import { Link } from "react-router-dom";
import { Eye, Heart, MessageCircle } from "lucide-react";

export default function TopPostsCard({ posts = [] }) {
  return (
    <section className="analytics-panel analytics-panel--stretch">
      <div className="analytics-panel-title-row">
        <h2>Top posts</h2>
        <Link to="/profile" className="analytics-panel-link">
          View all
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="analytics-empty-state">Publish outfits to see performance data here.</p>
      ) : (
        <div className="analytics-post-table-wrap">
          <table className="analytics-post-table">
            <thead>
              <tr>
                <th>Post</th>
                <th>Likes</th>
                <th>Comments</th>
                <th>Views</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <Link to={`/outfits/${post.id}`} className="analytics-post-cell">
                      {post.image_url ? (
                        <img src={post.image_url} alt="" className="analytics-post-thumb" />
                      ) : (
                        <div className="analytics-post-thumb-empty" />
                      )}
                      <div>
                        <p className="analytics-post-title">{post.title}</p>
                        <p className="analytics-post-date">{post.date}</p>
                      </div>
                    </Link>
                  </td>
                  <td>
                    <span className="analytics-metric-inline">
                      <Heart size={12} color="#f472b6" />
                      {post.likes >= 1000 ? `${(post.likes / 1000).toFixed(1)}K` : post.likes}
                    </span>
                  </td>
                  <td>
                    <span className="analytics-metric-inline">
                      <MessageCircle size={12} color="#60a5fa" />
                      {post.comments}
                    </span>
                  </td>
                  <td>
                    <span className="analytics-metric-inline">
                      <Eye size={12} color="#a78bfa" />
                      {post.views >= 1000 ? `${(post.views / 1000).toFixed(1)}K` : post.views}
                    </span>
                  </td>
                  <td>
                    <span className="analytics-engagement-badge">{post.engagement}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
