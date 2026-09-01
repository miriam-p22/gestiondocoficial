import React from "react";

const DashboardWelcome = ({ nombre, area, rol, mensaje }) => {
  return (
    <section className="dashboard-welcome">
      <div>
        <span className="dashboard-welcome-label">Centro de Control</span>
        <h1>Bienvenido{nombre ? `, ${nombre}` : ""}</h1>
        <p>{mensaje}</p>
      </div>

      <div className="dashboard-welcome-meta">
        {area && (
          <span>
            <strong>Área</strong>
            {area}
          </span>
        )}

        {rol && (
          <span>
            <strong>Rol</strong>
            {rol}
          </span>
        )}
      </div>
    </section>
  );
};

export default DashboardWelcome;