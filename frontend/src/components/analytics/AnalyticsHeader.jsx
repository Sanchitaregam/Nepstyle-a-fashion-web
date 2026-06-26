import { Calendar, Crown, Download } from "lucide-react";

export default function AnalyticsHeader({ periodLabel = "Last 30 days" }) {
  return (
    <header className="analytics-dashboard-header">
      <div>
        <h1>
          Overview
          <span className="analytics-premium-pill">
            <Crown size={10} />
            Premium
          </span>
        </h1>
        <p className="analytics-dashboard-subtitle">Your account performance · {periodLabel}</p>
      </div>

      <div className="analytics-header-actions">
        <div className="analytics-period-btn">
          <Calendar size={15} />
          <span>{periodLabel}</span>
        </div>
        <button type="button" className="analytics-export-btn">
          <Download size={15} />
          Export
        </button>
      </div>
    </header>
  );
}
