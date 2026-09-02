import React, { useState } from "react";
import "../styles/CampoFormulario.css";

import { FiEye, FiEyeOff } from "react-icons/fi";

const CampoFormulario = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  children,

  isSelect = false,
  isTextarea = false,

  ...props
}) => {
  const [mostrarPassword, setMostrarPassword] = useState(false);

  let InputElement = "input";

  if (isSelect) {
    InputElement = "select";
  }

  if (isTextarea) {
    InputElement = "textarea";
  }

  const inputType =
    type === "password" ? (mostrarPassword ? "text" : "password") : type;

  return (
    <label
      className="field"
      style={{
        position: "relative",
      }}
    >
      <span className="label-text">{label}</span>

      <InputElement
        className="input"
        type={isTextarea ? undefined : inputType}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        {...props}
      >
        {children}
      </InputElement>

      {type === "password" && !isTextarea && !isSelect && (
        <span
          className="password-icon-formulario"
          onClick={() => setMostrarPassword(!mostrarPassword)}
        >
          {mostrarPassword ? <FiEye /> : <FiEyeOff />}
        </span>
      )}
    </label>
  );
};

export default CampoFormulario;
