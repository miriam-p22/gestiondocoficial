import React from "react";

const DashboardProgress = ({
  title,
  value = 0,
  subtitle = "",
}) => {
  const porcentaje =
    Math.max(
      0,
      Math.min(
        100,
        Number(value) || 0
      )
    );

  const tone =
    porcentaje >= 90
      ? "alto"
      : porcentaje >= 70
        ? "medio"
        : "bajo";

  return (
    <section className="dashboard-panel dashboard-progress-panel">
      <div className="dashboard-panel-header">
        <div>
          <h3>{title}</h3>

          {subtitle && (
            <p>{subtitle}</p>
          )}
        </div>

        <strong
          className={`dashboard-progress-value dashboard-progress-value-${tone}`}
        >
          {porcentaje}%
        </strong>
      </div>

      <div className="dashboard-progress-track">
        <div
          className={`dashboard-progress-bar dashboard-progress-bar-${tone}`}
          style={{
            width:
              `${porcentaje}%`,
          }}
        />
      </div>
    </section>
  );
};

export default DashboardProgress;