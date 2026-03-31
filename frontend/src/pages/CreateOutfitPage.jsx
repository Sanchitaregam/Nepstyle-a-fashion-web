import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";

export default function CreateOutfitPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!imageFile) {
      setError("Please choose an image.");
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
    <div>
      <div style={{ padding: 24, textAlign: "left" }}>
        <h1>Create Outfit</h1>
        {error ? <div style={{ color: "red", marginBottom: 12 }}>{typeof error === "string" ? error : JSON.stringify(error)}</div> : null}
        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label>
            Image
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} required />
          </label>
          <label>
            Caption (optional)
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={4} />
          </label>
          <label>
            Tags (comma-separated, e.g., casual, streetwear)
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="casual, streetwear" />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Uploading..." : "Publish"}
          </button>
        </form>
      </div>
    </div>
  );
}

