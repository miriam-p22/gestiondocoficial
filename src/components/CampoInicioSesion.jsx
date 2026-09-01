import React, { useState } from "react";
import "../styles/CampoInicioSesion.css";
import { FiEye, FiEyeOff } from "react-icons/fi";

const CampoInicioSesion = ({ type, value, onChange, placeholder }) => {
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const inputType =
  type === "password"
    ? (mostrarPassword ? "text" : "password")
    : type;


  return (
    <div className="campo-reutilizable" style={{ position: "relative" }}>
      <input
        className="input-reutilizable"
        type={inputType}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />

      {type === "password" && (
        <span
        className="password-icon"
          onClick={() => setMostrarPassword(!mostrarPassword)}
        >
          {mostrarPassword ? <FiEye /> : <FiEyeOff />}
        </span>
      )}
    </div>
  );
};

export default CampoInicioSesion;
