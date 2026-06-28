import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../components/fashion-home.css";

export default function PaymentRedirectPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const actionUrl = location.state?.actionUrl;
  const formFields = location.state?.formFields;

  useEffect(() => {
    if (!actionUrl || !formFields) {
      navigate("/subscription", { replace: true });
      return;
    }
    const timer = setTimeout(() => {
      formRef.current?.submit();
    }, 400);
    return () => clearTimeout(timer);
  }, [actionUrl, formFields, navigate]);

  if (!actionUrl || !formFields) {
    return null;
  }

  return (
    <div className="fashion-app">
      <div className="fashion-container payment-redirect-wrap">
        <div className="card">
          <h2>Redirecting to eSewa…</h2>
          <p className="empty-note">Please wait while we open the secure payment page.</p>
          <form ref={formRef} method="POST" action={actionUrl}>
            {Object.entries(formFields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
          </form>
        </div>
      </div>
    </div>
  );
}
