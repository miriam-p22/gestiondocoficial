import React from "react";

const DashboardCard = ({
  title,
  value,
  subtitle = "",
  icon = null,
  tone = "neutral",
  onClick = null,
}) => {
  const clickable = typeof onClick === "function";

  return (
    <button
      type="button"
      className={`dashboard-card dashboard-card-${tone} ${clickable ? "dashboard-card-clickable" : ""}`}
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
    >
      <div className="dashboard-card-icon">{icon}</div>

      <div className="dashboard-card-content">
        <span className="dashboard-card-title">{title}</span>
        <strong className="dashboard-card-value">{value}</strong>
        {subtitle && (
          <small className="dashboard-card-subtitle">{subtitle}</small>
        )}
      </div>
    </button>
  );
};

export default DashboardCard;
