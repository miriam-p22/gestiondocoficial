import React from 'react';
import '../styles/GrupoEntrada.css';

const GrupoEntrada = ({ label, id, children }) => {
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      {/* children será el <input>, <textarea> o <select> */}
      {children}
    </div>
  );
};

export default GrupoEntrada;