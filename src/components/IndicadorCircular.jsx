import React from "react";
import "../styles/IndicadorCircular.css";

const IndicadorCircular = ({ valor, porcentaje, titulo, color }) => {
  const grados = (porcentaje / 100) * 360;

  return (
    <div className={`indicador ${color}`}>
      <div
        className="circulo-progreso"
        style={{
          background: `conic-gradient(var(--color-segmento) 0deg ${grados}deg, #e0e0e0 ${grados}deg)`
        }}
      >
        <span className="valor">{valor}</span>
      </div>

      <p className="titulo-indicador">{titulo}</p>
    </div>
  );
};

export default IndicadorCircular;
