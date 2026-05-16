import { useEffect, useState } from "react";
import api from "../api/apiClient";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import SidebarLeft from "../components/SidebarLeft";
import SidebarRight from "../components/SidebarRight";
import TrendingLooks from "../components/TrendingLooks";
import "../components/fashion-home.css";

export default function HomePage() {
  const [feed, setFeed] = useState(null);
  const [tags, setTags] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const [feedRes, tagsRes, creatorsRes] = await Promise.all([
          api.get("/api/feed/home/", { params: { limit: 10, trending_limit: 3 } }),
          api.get("/api/feed/trending-tags/", { params: { limit: 5 } }),
          api.get("/api/feed/top-creators/", { params: { limit: 5 } }),
        ]);
        if (cancelled) return;
        setFeed(feedRes.data);
        setTags(tagsRes.data?.tags || []);
        setCreators(creatorsRes.data?.creators || []);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.detail || e.message || "Failed to load feed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const trendingLooks = (feed?.trending_outfits || []).slice(0, 3).map((o) => ({
    id: o.id,
    title: o.caption?.trim() || "Trending look",
    image: o.image_url,
  }));

  const latestOutfits = feed?.latest_outfits || [];

  if (loading) {
    return (
      <div className="fashion-app">
        <div className="fashion-container">
          <Navbar />
          <p className="empty-note" style={{ padding: 24 }}>
            Loading…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fashion-app">
        <div className="fashion-container">
          <Navbar />
          <div className="card" style={{ marginTop: 16 }}>
            <p className="auth-error" style={{ margin: 0 }}>
              {error}
            </p>
            <p className="empty-note" style={{ marginTop: 12 }}>
              Make sure the backend is running at{" "}
              <code>{import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fashion-app">
      <div className="fashion-container">
        <Navbar />
        <main className="home-grid">
          <SidebarLeft tags={tags} />
          <section className="main-col side-stack">
            <TrendingLooks looks={trendingLooks} />
            <PostCard outfits={latestOutfits} />
          </section>
          <section className="right-col">
            <SidebarRight creators={creators} />
          </section>
        </main>
      </div>
    </div>
  );
}
