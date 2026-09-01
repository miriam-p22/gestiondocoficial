// src/components/BotonAzul.jsx
import React from 'react';
import '../styles/BotonReutilizable.css';

const BotonReutilizable = ({ children, onClick, className = '', ...props }) => {
  // Las clases se basan en el HTML provisto. 'btn-add-user' para los de la cabecera.
  // Se usa 'btn-action edit' para el botón de 'Editar' dentro de la tabla si es necesario.
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