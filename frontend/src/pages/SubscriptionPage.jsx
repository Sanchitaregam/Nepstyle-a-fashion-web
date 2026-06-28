import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import Navbar from "../components/Navbar";
import VerifiedBadge from "../components/VerifiedBadge";
import "../components/fashion-home.css";

function PlanCard({ plan, currentTier, onSubscribe, loading }) {
  const isCurrent = plan.tier === currentTier;
  const isFree = plan.key === "free";

  return (
    <article className={`plan-card${isCurrent ? " plan-card-current" : ""}`}>
      <h3>{plan.label}</h3>
      <p className="plan-price">
        {isFree ? "Free" : <>NPR {plan.price} <span>/ month</span></>}
      </p>
      <ul className="plan-features">
        {plan.features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      {isFree ? (
        <span className="plan-badge">Default plan</span>
      ) : isCurrent ? (
        <span className="plan-badge plan-badge-active">Current plan</span>
      ) : (
        <button
          type="button"
          className="primary-btn plan-subscribe-btn"
          onClick={() => onSubscribe(plan.key)}
          disabled={loading}
        >
          {loading ? "Processing…" : "Subscribe with eSewa"}
        </button>
      )}
    </article>
  );
}

export default function SubscriptionPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    function formatApiError(e, fallback) {
      if (!e?.response) {
        const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
        return `Cannot reach the backend at ${base}. Start it with: cd backend && source .venv/bin/activate && python manage.py runserver`;
      }
      const detail = e.response?.data?.detail;
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail)) return detail.join(" ");
      return fallback;
    }

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const plansRes = await api.get("/api/payments/plans/");
        if (cancelled) return;
        setPlans(plansRes.data?.subscriptions || []);
      } catch (e) {
        if (!cancelled) {
          setError(formatApiError(e, "Failed to load plans"));
          setLoading(false);
        }
        return;
      }

      if (isAuthenticated) {
        try {
          const statusRes = await api.get("/api/payments/subscription/status/");
          if (!cancelled) setStatus(statusRes.data);
        } catch {
          // Plans can still be shown if status fails (e.g. expired login).
          if (!cancelled) setStatus(null);
        }
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  async function handleSubscribe(planKey) {
    if (!isAuthenticated) {
      navigate("/login/form");
      return;
    }
    setSubscribing(planKey);
    setError(null);
    try {
      const res = await api.post("/api/payments/subscription/initiate/", { plan: planKey });
      navigate("/payment/redirect", {
        state: {
          actionUrl: res.data.action_url,
          formFields: res.data.form_fields,
        },
      });
    } catch (e) {
      setError(e?.response?.data?.detail || "Could not start payment");
      setSubscribing(null);
    }
  }

  const currentTier = status?.subscription_tier || user?.subscription_tier || "free";

  return (
    <div className="fashion-app">
      <div className="fashion-container">
        <Navbar />
        <main className="subscription-page">
          <header className="subscription-header">
            <h1>Premium Plans</h1>
            <p>
              Upgrade for ad-free browsing, verified badge, analytics, and business tools.
              Payments use the eSewa sandbox for testing.
            </p>
            {status?.is_premium ? (
              <p className="subscription-status">
                Active: <strong>{status.subscription_tier}</strong>
                {status.is_verified ? (
                  <>
                    {" "}
                    <VerifiedBadge />
                  </>
                ) : null}
                {status.subscription_expires_at ? (
                  <> · Renews/expires {new Date(status.subscription_expires_at).toLocaleDateString()}</>
                ) : null}
              </p>
            ) : null}
          </header>

          {error ? <p className="auth-error">{error}</p> : null}

          {loading ? (
            <p className="empty-note">Loading plans…</p>
          ) : (
            <div className="plans-grid">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.key}
                  plan={plan}
                  currentTier={currentTier}
                  onSubscribe={handleSubscribe}
                  loading={subscribing === plan.key}
                />
              ))}
            </div>
          )}

          <section className="card esewa-test-note" style={{ marginTop: 24 }}>
            <h3 className="card-title">eSewa test credentials</h3>
            <p className="empty-note" style={{ margin: 0 }}>
              Use eSewa ID <strong>9806800001</strong>–<strong>9806800005</strong>, password{" "}
              <strong>Nepal@123</strong>, OTP <strong>123456</strong> in the sandbox.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
