import { BarChart3, Eye, FileText, Heart, MessageCircle, Users } from "lucide-react";

const ICONS = { Eye, FileText, BarChart3, Heart, MessageCircle, Users };

const ICON_CLASS = {
  Eye: "analytics-kpi-icon--violet",
  FileText: "analytics-kpi-icon--blue",
  Heart: "analytics-kpi-icon--pink",
  MessageCircle: "analytics-kpi-icon--amber",
  Users: "analytics-kpi-icon--green",
  BarChart3: "analytics-kpi-icon--violet",
};

export default function KpiCard({ title, value, change, icon }) {
  const Icon = ICONS[icon] || Eye;
  const isPositive = !change?.startsWith("-");

  return (
    <article className="analytics-kpi-card">
      <div className="analytics-kpi-top">
        <div className={`analytics-kpi-icon ${ICON_CLASS[icon] || "analytics-kpi-icon--violet"}`}>
          <Icon size={17} strokeWidth={2} />
        </div>
        {change ? (
          <span
            className={`analytics-kpi-change ${
              isPositive ? "analytics-kpi-change--up" : "analytics-kpi-change--down"
            }`}
          >
            {change}
          </span>
        ) : null}
      </div>
      <p className="analytics-kpi-value">{value ?? "0"}</p>
      <p className="analytics-kpi-label">{title}</p>
    </article>
  );
}
