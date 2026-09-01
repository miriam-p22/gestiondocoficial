import React from "react";

const DashboardChart = ({ title, subtitle = "", children = null }) => {
  return (
    <section className="dashboard-panel dashboard-chart-panel">
      <div className="dashboard-panel-header">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      <div className="dashboard-chart-content">
        {children || (
          <div className="dashboard-empty-state">
            La gráfica se conectará a datos reales en la siguiente etapa.
          </div>
        )}
      </div>
    </section>
  );
};

export default DashboardChart;