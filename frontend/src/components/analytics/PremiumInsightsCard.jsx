import { CheckCircle2, Lock, Sparkles } from "lucide-react";
import { PREMIUM_INSIGHTS } from "./constants";

export default function PremiumInsightsCard({ unlocked = true }) {
  return (
    <section
      className={`analytics-panel analytics-panel--stretch analytics-insights-panel${
        unlocked ? "" : " analytics-insights-panel--locked"
      }`}
    >
      <div className="analytics-insights-head">
        <div className={`analytics-insights-icon${unlocked ? "" : " analytics-insights-icon--locked"}`}>
          {unlocked ? <CheckCircle2 size={18} /> : <Lock size={16} />}
        </div>
        <div>
          <h2>{unlocked ? "Insights unlocked" : "Gold insights"}</h2>
          <p>{unlocked ? "Available on your current plan" : "Upgrade for advanced metrics"}</p>
        </div>
      </div>

      <ul className="analytics-insights-list">
        {PREMIUM_INSIGHTS.map((insight) => (
          <li key={insight}>
            <Sparkles size={14} color="#8b5cf6" />
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
