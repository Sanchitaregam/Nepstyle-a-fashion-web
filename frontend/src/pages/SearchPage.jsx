import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/apiClient";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import "../components/fashion-home.css";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setError(null);
      return;
    }

    let cancelled = false;

    async function runSearch() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/api/feed/search/", { params: { q: query, limit: 30 } });
        if (cancelled) return;
        setResults(res.data?.results || []);
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.detail || e.message || "Search failed");
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    runSearch();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const title = query ? `Results for “${query}”` : "Search outfits";
  const emptyMessage = query
    ? "No outfits match your search. Try different words, tags, or a username."
    : "Use the search bar above to find outfits by caption, tags, or creator.";

  return (
    <div className="fashion-app">
      <div className="fashion-container search-page">
        <Navbar />
        <main className="search-page-main">
          {loading ? <p className="empty-note search-status">Searching…</p> : null}
          {error ? <p className="auth-error search-status">{error}</p> : null}
          {!loading && !error ? (
            <PostCard
              outfits={results}
              title={title}
              emptyMessage={emptyMessage}
              showCount={Boolean(query)}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}
