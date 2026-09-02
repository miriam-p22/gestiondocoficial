import React from "react";
import { FiAlertTriangle, FiCheckCircle, FiInfo } from "react-icons/fi";

const ICONOS = {
  warning: <FiAlertTriangle />,
  success: <FiCheckCircle />,
  info: <FiInfo />,
};

const DashboardAlert = ({ type = "info", title, text }) => {
  return (
    <div className={`dashboard-alert dashboard-alert-${type}`}>
      <div className="dashboard-alert-icon">{ICONOS[type] || ICONOS.info}</div>

      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
};

export default DashboardAlert;
