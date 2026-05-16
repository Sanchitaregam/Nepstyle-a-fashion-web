import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ImagePlus, X } from "lucide-react";
import api from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import Navbar from "../components/Navbar";
import "../components/fashion-home.css";

export default function CreateOutfitPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  function onPickImage(e) {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setError(null);
  }

  function clearImage() {
    setImageFile(null);
    setError(null);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!imageFile) {
      setError("Please choose an image for your outfit.");
      return;
    }

    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("image", imageFile);
      fd.append("caption", caption);
      fd.append("tags", tags);

      const res = await api.post("/api/outfits/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate(`/outfits/${res.data.id}`);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data || err.message || "Failed to create outfit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fashion-app">
      <div className="fashion-container create-outfit-page">
        <Navbar />

        <Link to="/" className="outfit-detail-back">
          ← Back to feed
        </Link>

        <article className="card create-outfit-card">
          <header className="create-outfit-header">
            <h1 className="create-outfit-title">Create outfit</h1>
            <p className="create-outfit-subtitle">Upload a photo, add a caption, and tag your style for the feed.</p>
          </header>

          {!isAuthenticated ? (
            <p className="create-outfit-login-hint">
              <Link to="/login/form">Sign in</Link> to publish an outfit.
            </p>
          ) : null}

          {error ? (
            <div className="auth-error create-outfit-error">
              {typeof error === "string" ? error : JSON.stringify(error)}
            </div>
          ) : null}

          <form className="create-outfit-form" onSubmit={onSubmit}>
            <div className="create-field">
              <span className="create-label">Photo</span>
              <div className={`create-upload-zone${imagePreview ? " has-preview" : ""}`}>
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="create-upload-preview" />
                    <button
                      type="button"
                      className="create-upload-clear"
                      onClick={clearImage}
                      aria-label="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <label className="create-upload-label">
                    <ImagePlus size={32} strokeWidth={1.5} />
                    <span className="create-upload-title">Upload outfit photo</span>
                    <span className="create-upload-hint">JPG, PNG or WEBP · click to browse</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="create-upload-input"
                      onChange={onPickImage}
                    />
                  </label>
                )}
                {imagePreview ? (
                  <label className="create-upload-replace">
                    Replace photo
                    <input type="file" accept="image/*" className="create-upload-input" onChange={onPickImage} />
                  </label>
                ) : null}
              </div>
            </div>

            <div className="create-field">
              <label className="create-label" htmlFor="outfit-caption">
                Caption
                <span className="create-label-optional">optional</span>
              </label>
              <textarea
                id="outfit-caption"
                className="create-textarea"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                placeholder="Describe your look, occasion, or styling tips…"
                maxLength={500}
              />
            </div>

            <div className="create-field">
              <label className="create-label" htmlFor="outfit-tags">
                Tags
                <span className="create-label-optional">optional</span>
              </label>
              <input
                id="outfit-tags"
                className="create-input"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. casual, streetwear, summer"
              />
              <p className="create-field-hint">Separate tags with commas to help others discover your post.</p>
            </div>

            <div className="create-outfit-actions">
              <button type="button" className="create-btn-secondary" onClick={() => navigate("/")} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="create-btn-primary" disabled={loading || !isAuthenticated}>
                {loading ? "Publishing…" : "Publish outfit"}
              </button>
            </div>
          </form>
        </article>
      </div>
    </div>
  );
}
