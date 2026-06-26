import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../components/fashion-home.css";

export default function PaymentFailurePage() {
  const [params] = useSearchParams();
  const reason = params.get("reason");

  return (
    <div className="fashion-app">
      <div className="fashion-container">
        <Navbar />
        <main className="payment-result-page">
          <div className="card payment-result-card payment-result-failure">
            <h1>Payment failed</h1>
            <p>Your payment was not completed. No charges were applied.</p>
            {reason ? <p className="empty-note">Reason: {reason.replace(/_/g, " ")}</p> : null}
            <div className="payment-result-actions">
              <Link to="/subscription" className="primary-btn">
                Try again
              </Link>
              <Link to="/" className="mini-btn">
                Back to feed
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
