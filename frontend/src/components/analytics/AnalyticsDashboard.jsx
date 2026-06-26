import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Lock } from "lucide-react";
import api from "../../api/apiClient";
import { useAuth } from "../../auth/AuthContext";
import Navbar from "../Navbar";
import VerifiedBadge from "../VerifiedBadge";
import AnalyticsHeader from "./AnalyticsHeader";
import ChartsSection from "./ChartsSection";
import KpiCard from "./KpiCard";
import PremiumInsightsCard from "./PremiumInsightsCard";
import RecentViewersCard from "./RecentViewersCard";
import TopPostsCard from "./TopPostsCard";
import "../fashion-home.css";

const PREMIUM_TIERS = new Set(["silver", "gold", "business"]);

const TIER_LABELS = {
  silver: "Silver",
  gold: "Gold",
  business: "Business",
};

function UpgradeGate() {
  return (
    <div className="fashion-app">
      <div className="fashion-container">
        <Navbar />
        <div className="analytics-gate">
          <div className="analytics-gate-icon">
            <Lock size={22} />
          </div>
          <h1>Premium Analytics</h1>
          <p>Subscribe to unlock your creator analytics dashboard.</p>
          <Link to="/subscription" className="primary-btn" style={{ marginTop: 20, display: "inline-flex", gap: 8 }}>
            <Crown size={15} />
            View plans
          </Link>
          <div style={{ marginTop: 12 }}>
            <Link to="/" className="sidebar-link">
              ← Back to feed
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tier = user?.subscription_tier || "free";
  const hasAccess = isAuthenticated && PREMIUM_TIERS.has(tier);

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await api.get("/api/payments/analytics/");
        if (!cancelled) {
          setData(res.data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.detail || "Could not load analytics");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [hasAccess]);

  if (!hasAccess) {
    return <UpgradeGate />;
  }

  const tierLabel = TIER_LABELS[tier] || "Premium";

  return (
    <div className="fashion-app">
      <div className="fashion-container analytics-dashboard">
        <Navbar />

        {user?.username ? (
          <div className="analytics-user-strip">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="analytics-avatar" />
            ) : (
              <div className="analytics-avatar-fallback">
                {user.username.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className="analytics-user-strip-name">
                @{user.username}
                {user.is_verified ? <VerifiedBadge /> : null}
              </p>
              <span className="analytics-tier-badge">{tierLabel}</span>
            </div>
          </div>
        ) : null}

        <AnalyticsHeader />

        {loading ? (
          <p className="empty-note" style={{ padding: "32px 0", textAlign: "center" }}>
            Loading your analytics…
          </p>
        ) : error ? (
          <div className="card" style={{ marginTop: 16 }}>
            <p className="auth-error" style={{ margin: 0 }}>
              {error}
            </p>
          </div>
        ) : (
          <>
            <section className="analytics-kpi-grid">
              {(data?.kpis || []).map((metric) => (
                <KpiCard key={metric.id} {...metric} />
              ))}
            </section>

            <ChartsSection
              profileViewsTrend={data?.profile_views_trend}
              engagementTrend={data?.engagement_trend}
              audienceInterests={data?.audience_interests}
            />

            <section className="analytics-bottom-grid">
              <RecentViewersCard
                viewers={data?.has_gold_insights ? data?.recent_viewers : []}
                locked={!data?.has_gold_insights}
              />
              <TopPostsCard posts={data?.top_posts} />
              <PremiumInsightsCard unlocked={data?.has_gold_insights} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
