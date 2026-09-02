import React from "react";

const DashboardTable = ({ title, subtitle = "", columns = [], rows = [] }) => {
  return (
    <section className="dashboard-panel dashboard-table-panel">
      <div className="dashboard-panel-header">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="dashboard-empty-state">
          No hay información para mostrar.
        </div>
      ) : (
        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id || index}>
                  {columns.map((column) => (
                    <td key={column.key}>{row[column.key] ?? "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default DashboardTable;
