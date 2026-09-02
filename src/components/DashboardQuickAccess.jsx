import React from "react";

const DashboardQuickAccess = ({ items = [] }) => {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-header">
        <div>
          <h3>Accesos rápidos</h3>
          <p>Atajos a los módulos más utilizados.</p>
        </div>
      </div>

      <div className="dashboard-quick-grid">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="dashboard-quick-button"
            onClick={item.onClick}
            disabled={!item.onClick}
            title={item.title}
          >
            <span className="dashboard-quick-icon">{item.icon}</span>
            <span>{item.title}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default DashboardQuickAccess;
