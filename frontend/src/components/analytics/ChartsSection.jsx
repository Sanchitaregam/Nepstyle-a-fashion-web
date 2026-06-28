import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "./mockData";

function Panel({ title, subtitle, children }) {
  return (
    <section className="analytics-panel">
      <div className="analytics-panel-head">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function EmptyChart({ message }) {
  return <div className="analytics-empty-chart">{message}</div>;
}

const tooltipStyle = {
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
  fontSize: "12px",
};

export default function ChartsSection({
  profileViewsTrend = [],
  engagementTrend = [],
  audienceInterests = [],
}) {
  const interests = audienceInterests.length > 0 ? audienceInterests : [];

  return (
    <div className="analytics-charts-grid">
      <Panel title="Profile views" subtitle="Daily visits to your profile">
        {profileViewsTrend.length ? (
          <div className="analytics-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profileViewsTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="profileFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="url(#profileFill)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="No profile views in this period yet" />
        )}
      </Panel>

      <Panel title="Engagement" subtitle="Likes, comments & views on your posts">
        {engagementTrend.length ? (
          <>
            <div className="analytics-chart-legend">
              <span>
                <i className="analytics-legend-dot analytics-legend-dot--likes" /> Likes
              </span>
              <span>
                <i className="analytics-legend-dot analytics-legend-dot--comments" /> Comments
              </span>
              <span>
                <i className="analytics-legend-dot analytics-legend-dot--views" /> Views
              </span>
            </div>
            <div className="analytics-chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="likes" stackId="a" fill="#8b5cf6" maxBarSize={28} />
                  <Bar dataKey="comments" stackId="a" fill="#6366f1" maxBarSize={28} />
                  <Bar dataKey="views" stackId="a" fill="#ddd6fe" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <EmptyChart message="Post engagement will appear once you have activity" />
        )}
      </Panel>

      <Panel title="Content categories" subtitle="Tags on your outfit posts">
        {interests.length ? (
          <div className="analytics-pie-layout">
            <div className="analytics-pie-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={interests}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={68}
                    paddingAngle={2}
                  >
                    {interests.map((entry, i) => (
                      <Cell key={entry.name} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                    <Label value="Tags" position="center" className="fill-gray-400 text-[10px]" dy={-4} />
                    <Label value="used" position="center" className="fill-gray-700 text-[11px] font-medium" dy={10} />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, "Share"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="analytics-pie-legend">
              {interests.map((item, i) => (
                <li key={item.name}>
                  <span
                    className="analytics-legend-dot"
                    style={{ backgroundColor: item.color || CHART_COLORS[i] }}
                  />
                  <span style={{ textTransform: "capitalize" }}>{item.name}</span>
                  <strong>{item.value}%</strong>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <EmptyChart message="Add tags to outfits to see category breakdown" />
        )}
      </Panel>
    </div>
  );
}
