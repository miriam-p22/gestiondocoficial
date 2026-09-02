// src/components/BotonAzul.jsx
import React from "react";
import "../styles/BotonReutilizable.css";

const BotonReutilizable = ({ children, onClick, className = "", ...props }) => {
  return (
    <button
      className={`btn-add-user ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default BotonReutilizable;
