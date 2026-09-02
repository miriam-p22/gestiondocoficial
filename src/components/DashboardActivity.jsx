import React from "react";

const DashboardActivity = ({ items = [] }) => {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-header">
        <div>
          <h3>Actividad reciente</h3>
          <p>Últimos movimientos relevantes del sistema.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="dashboard-empty-state">
          Todavía no hay actividad reciente para mostrar.
        </div>
      ) : (
        <div className="dashboard-activity-list">
          {items.map((item) => (
            <div key={item.id} className="dashboard-activity-item">
              <span className="dashboard-activity-dot" />

              <div>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
                {item.date && <small>{item.date}</small>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default DashboardActivity;
