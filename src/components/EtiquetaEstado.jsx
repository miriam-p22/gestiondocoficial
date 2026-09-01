import React from 'react';
import '../styles/EtiquetaEstado.css';

const EtiquetaEstado = ({ estatus, className = '' }) => {
  if (!estatus) {
    return null; // No renderizar si no hay estatus
  }
    
  const statusKey = estatus.toLowerCase().replace(/\s/g, '-');
  
  return (
    // La clase base 'status-badge' maneja la forma y el tamaño uniforme.
    // statusKey se mapeará a una clase CSS específica para el color 
    <span className={`status-badge status-badge-${statusKey} ${className}`} data-current-status={estatus}>
      {estatus}
    </span>
  );
};

export default EtiquetaEstado;