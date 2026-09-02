import React from "react";
import "../styles/EtiquetaEstado.css";

const EtiquetaEstado = ({ estatus, className = "" }) => {
  if (!estatus) {
    return null;
  }

  const statusKey = estatus.toLowerCase().replace(/\s/g, "-");

  return (
    <span
      className={`status-badge status-badge-${statusKey} ${className}`}
      data-current-status={estatus}
    >
      {estatus}
    </span>
  );
};

export default EtiquetaEstado;
