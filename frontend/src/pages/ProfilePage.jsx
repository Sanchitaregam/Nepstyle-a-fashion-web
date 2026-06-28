import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MessageCircle, Share2 } from "lucide-react";
import api from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import { startConversationWithUsername } from "../chatActions";
import Navbar from "../components/Navbar";
import VerifiedBadge from "../components/VerifiedBadge";
import "../components/fashion-home.css";

function FollowersModal({ title, users, open, onClose, onToggleFollow, currentUsername }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-scroll" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button onClick={onClose} type="button">Close</button>
        </div>
        <div className="user-list">
          {users.map((u) => (
            <div key={u.id} className="user-row">
              {u.avatar_url ? <img src={u.avatar_url} alt="" className="avatar-sm" /> : <div className="avatar-sm avatar-placeholder">{u.username?.slice(0, 1)?.toUpperCase()}</div>}
              <Link to={`/u/${u.username}`} className="brand-link">@{u.username}</Link>
              {currentUsername !== u.username ? (
                <button type="button" className="mini-btn" onClick={() => onToggleFollow(u)}>
                  {u.is_following ? "Following" : "Follow"}
                </button>
              ) : null}
            </div>
          ))}
          {!users.length ? <p className="empty-note">No users yet.</p> : null}
        </div>
      </div>
    </div>
  );
}

function PostPreviewModal({ open, onClose, item, type, comments, canDelete, onDelete, deleting }) {
  if (!open || !item) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{type === "photo" ? "Outfit" : "Video"}</h3>
          <button onClick={onClose} type="button">Close</button>
        </div>
        {type === "photo" ? (
          item.image_url ? <img src={item.image_url} alt="" className="preview-media" /> : <div className="preview-media look-placeholder" />
        ) : item.video_url ? (
          <video src={item.video_url} controls className="preview-media" />
        ) : (
          <div className="preview-media look-placeholder" />
        )}
        {item.caption ? <p className="post-caption">{item.caption}</p> : null}
        <div className="post-actions" style={{ marginTop: 0 }}>
          <div>❤️ {item.like_count ?? 0}</div>
          <div>💬 {item.comment_count ?? 0}</div>
        </div>
        {canDelete ? (
          <div className="profile-actions" style={{ marginTop: 8 }}>
            <button type="button" className="mini-btn danger-btn" onClick={onDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete this post"}
            </button>
          </div>
        ) : null}
        {type === "photo" ? (
          <div className="comment-block">
            <h4>Comments</h4>
            {(comments || []).map((c) => (
              <div key={c.id} className="comment-item">
                <strong>{c.author?.username}</strong> {c.text}
              </div>
            ))}
            {!comments?.length ? <p className="empty-note">No comments yet.</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EditProfileModal({ open, onClose, profile, onSaved }) {
  const [form, setForm] = useState({
    username: "",
    bio: "",
    location: "",
    website: "",
    avatar: null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !profile) return;
    setForm({
      username: profile.username || "",
      bio: profile.bio || "",
      location: profile.location || "",
      website: profile.website || "",
      avatar: null,
    });
  }, [open, profile]);

  if (!open) return null;

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("username", form.username);
      fd.append("bio", form.bio);
      fd.append("location", form.location);
      fd.append("website", form.website);
      if (form.avatar) fd.append("avatar", form.avatar);
      const res = await api.patch("/api/auth/me/edit/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onSaved(res.data);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Edit Profile</h3>
          <button onClick={onClose} type="button">Close</button>
        </div>
        <form className="edit-form" onSubmit={onSubmit}>
          <label>Profile Picture<input type="file" accept="image/*" onChange={(e) => setForm((s) => ({ ...s, avatar: e.target.files?.[0] || null }))} /></label>
          <label>Username<input value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} required /></label>
          <label>Bio<textarea value={form.bio} onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))} rows={3} /></label>
          <label>Location<input value={form.location} onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))} /></label>
          <label>Website<input value={form.website} onChange={(e) => setForm((s) => ({ ...s, website: e.target.value }))} /></label>
          <button type="submit" className="mini-btn">{saving ? "Saving..." : "Save"}</button>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { username: routeUsername } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const username = routeUsername || user?.username;

  const [profile, setProfile] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [tab, setTab] = useState("photos");
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const [preview, setPreview] = useState(null);
  const [comments, setComments] = useState([]);
  const [deletingPost, setDeletingPost] = useState(false);

  const isOwn = useMemo(() => Boolean(profile?.is_own_profile), [profile]);

  useEffect(() => {
    if (!routeUsername && !isAuthenticated) {
      navigate("/login/form");
    }
  }, [routeUsername, isAuthenticated, navigate]);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    async function load() {
      const [p, ph, vd] = await Promise.all([
        api.get(`/api/auth/profiles/${username}/`),
        api.get(`/api/auth/profiles/${username}/photos/`),
        api.get(`/api/auth/profiles/${username}/videos/`),
      ]);
      if (cancelled) return;
      setProfile(p.data);
      setPhotos(ph.data || []);
      setVideos(vd.data || []);
    }
    load().catch(() => {
      if (!cancelled) navigate("/");
    });
    return () => {
      cancelled = true;
    };
  }, [username, navigate]);

  async function openFollowers() {
    const res = await api.get(`/api/auth/profiles/${username}/followers/`);
    setFollowers(res.data || []);
    setFollowersOpen(true);
  }

  async function openFollowing() {
    const res = await api.get(`/api/auth/profiles/${username}/following/`);
    setFollowing(res.data || []);
    setFollowingOpen(true);
  }

  async function onToggleFollowTarget(targetUsername) {
    if (!isAuthenticated) {
      navigate("/login/form");
      return;
    }
    await api.post(`/api/auth/profiles/${targetUsername}/follow-toggle/`);
    const updated = await api.get(`/api/auth/profiles/${username}/`);
    setProfile(updated.data);
    if (followersOpen) openFollowers();
    if (followingOpen) openFollowing();
  }

  async function openPreview(item, type) {
    setPreview({ item, type });
    if (type === "photo") {
      const res = await api.get(`/api/outfits/${item.id}/comments/`);
      setComments(res.data || []);
    } else {
      setComments([]);
    }
  }

  async function shareProfile() {
    const url = `${window.location.origin}/u/${profile.username}`;
    await navigator.clipboard.writeText(url);
    setShareMsg("Profile link copied!");
    setTimeout(() => setShareMsg(""), 1500);
  }

  async function deleteCurrentPost() {
    if (!isOwn || !preview?.item?.id || deletingPost) return;
    const shouldDelete = window.confirm("Delete this post?");
    if (!shouldDelete) return;

    setDeletingPost(true);
    try {
      if (preview.type === "photo") {
        await api.delete(`/api/outfits/${preview.item.id}/`);
        setPhotos((prev) => prev.filter((p) => p.id !== preview.item.id));
      } else {
        await api.delete(`/api/reels/${preview.item.id}/`);
        setVideos((prev) => prev.filter((v) => v.id !== preview.item.id));
      }
      setPreview(null);
    } finally {
      setDeletingPost(false);
    }
  }

  if (!profile) {
    return (
      <div className="fashion-app">
        <div className="fashion-container">
          <Navbar />
          <p className="empty-note">{isAuthenticated || routeUsername ? "Loading profile..." : "Please login to view profile."}</p>
        </div>
      </div>
    );
  }

  const items = tab === "photos" ? photos : videos;

  return (
    <div className="fashion-app">
      <div className="fashion-container">
        <Navbar />
        <section className="card profile-header">
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="profile-avatar-xl" /> : (
            <div className="profile-avatar-xl avatar-placeholder">{profile.username?.slice(0, 1)?.toUpperCase()}</div>
          )}
          <div className="profile-main">
            <h2 className="profile-username">
              @{profile.username}
              {profile.is_verified ? <VerifiedBadge /> : null}
            </h2>
            {profile.bio ? <p className="empty-note">{profile.bio}</p> : null}
            <div className="profile-meta">
              {profile.location ? <span>{profile.location}</span> : null}
              {profile.website ? <a href={profile.website} target="_blank" rel="noreferrer">{profile.website}</a> : null}
            </div>
            <div className="profile-stats">
              <button type="button" onClick={() => setTab("photos")}><strong>{profile.posts_count}</strong> Posts</button>
              <button type="button" onClick={openFollowers}><strong>{profile.followers_count}</strong> Followers</button>
              <button type="button" onClick={openFollowing}><strong>{profile.following_count}</strong> Following</button>
            </div>
            <div className="profile-actions">
              {isOwn ? (
                <>
                  <button type="button" className="mini-btn" onClick={() => setEditOpen(true)}>Edit Profile</button>
                  <button type="button" className="mini-btn" onClick={shareProfile}><Share2 size={16} /> Share Profile</button>
                </>
              ) : (
                <>
                  <button type="button" className="mini-btn" onClick={() => onToggleFollowTarget(profile.username)}>
                    {profile.is_following ? "Unfollow" : "Follow"}
                  </button>
                  <button type="button" className="mini-btn" onClick={() => startConversationWithUsername(profile.username, navigate)}><MessageCircle size={16} /> Message</button>
                  <button type="button" className="mini-btn" onClick={shareProfile}><Share2 size={16} /> Share Profile</button>
                </>
              )}
            </div>
            {shareMsg ? <p className="empty-note">{shareMsg}</p> : null}
          </div>
        </section>

        <section className="card">
          <div className="tabs">
            <button className={tab === "photos" ? "active" : ""} onClick={() => setTab("photos")} type="button">Photos</button>
            <button className={tab === "videos" ? "active" : ""} onClick={() => setTab("videos")} type="button">Videos</button>
          </div>
          {!items.length ? (
            <div className="empty-state">
              <p>No posts yet</p>
              {isOwn ? <Link to="/create/outfit" className="mini-btn">Upload your first outfit</Link> : null}
            </div>
          ) : (
            <div className="profile-grid">
              {items.map((item) => (
                <article key={item.id} className="profile-grid-card" onClick={() => openPreview(item, tab === "photos" ? "photo" : "video")}>
                  {tab === "photos" ? (
                    item.image_url ? <img src={item.image_url} alt="" /> : <div className="look-placeholder" />
                  ) : item.video_url ? (
                    <video src={item.video_url} />
                  ) : (
                    <div className="look-placeholder" />
                  )}
                  <div className="grid-meta">
                    <span>❤️ {item.like_count ?? 0}</span>
                    <span>💬 {item.comment_count ?? 0}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <FollowersModal
          title="Followers"
          users={followers}
          open={followersOpen}
          onClose={() => setFollowersOpen(false)}
          onToggleFollow={(u) => onToggleFollowTarget(u.username)}
          currentUsername={user?.username}
        />
        <FollowersModal
          title="Following"
          users={following}
          open={followingOpen}
          onClose={() => setFollowingOpen(false)}
          onToggleFollow={(u) => onToggleFollowTarget(u.username)}
          currentUsername={user?.username}
        />
        <EditProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          profile={profile}
          onSaved={async () => {
            await refreshUser();
            const res = await api.get(`/api/auth/profiles/${username}/`);
            setProfile(res.data);
          }}
        />
        <PostPreviewModal
          open={Boolean(preview)}
          onClose={() => setPreview(null)}
          item={preview?.item}
          type={preview?.type}
          comments={comments}
          canDelete={isOwn}
          onDelete={deleteCurrentPost}
          deleting={deletingPost}
        />
      </div>
    </div>
  );
}

