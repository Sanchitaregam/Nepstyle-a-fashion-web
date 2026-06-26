import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Navbar from "../components/Navbar";
import "../components/fashion-home.css";

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const { refreshUser } = useAuth();
  const type = params.get("type");
  const plan = params.get("plan");

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const message =
    type === "boost"
      ? "Your post boost is now active and will appear more often in feeds."
      : "Your subscription is active. Enjoy premium features!";

  return (
    <div className="fashion-app">
      <div className="fashion-container">
        <Navbar />
        <main className="payment-result-page">
          <div className="card payment-result-card payment-result-success">
            <h1>Payment successful</h1>
            <p>{message}</p>
            {plan ? <p className="empty-note">Plan: {plan}</p> : null}
            <div className="payment-result-actions">
              <Link to="/" className="primary-btn">
                Back to feed
              </Link>
              {type === "subscription" ? (
                <Link to="/subscription" className="mini-btn">
                  View subscription
                </Link>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
