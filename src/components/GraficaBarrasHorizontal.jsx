import React from "react";
import "../styles/GraficaBarrasHorizontal.css";

const datosAreas = [
  { area: "Recursos Humanos", verde: 50, amarillo: 20, rojo: 10 },
  { area: "Contabilidad Técnica", verde: 40, amarillo: 35, rojo: 15 },
  { area: "Presidencia", verde: 55, amarillo: 25, rojo: 20 },
  { area: "Obras Públicas", verde: 30, amarillo: 60, rojo: 70 },
  { area: "Ley de Archivo", verde: 20, amarillo: 40, rojo: 10 },
  { area: "Turismo", verde: 20, amarillo: 35, rojo: 10 },
];

const GraficaBarrasHorizontal = ({ onBarClick }) => {
  return (
    <div className="grafica-correspondencia">

      <p className="subtitulo-grafica">Documentos por Área y Estado</p>

      <div className="leyenda">
        <div className="leyenda-item">
          <span className="leyenda-color green" /> En Tiempo
        </div>
        <div className="leyenda-item">
          <span className="leyenda-color yellow" /> En Proceso
        </div>
        <div className="leyenda-item">
          <span className="leyenda-color red" /> Vencido
        </div>
      </div>

      {/* 🔥 CLIC EN TODA ESTA ÁREA ABRE EL MODAL */}
      <div
        className="grafico-horizontal-contenedor"
        onClick={() => onBarClick?.()}
        style={{ cursor: "pointer" }}
      >

        {/* Eje Y */}
        <div className="eje-y-areas">
          {datosAreas.map((item, idx) => (
            <div key={idx}>{item.area}</div>
          ))}
        </div>

        {/* Gráfico */}
        <div className="grafico-principal" id="graficoPrincipal">
          <div className="barras-contenedor-horizontal">
            {datosAreas.map((item, idx) => (
              <div key={idx} className="barra-area horizontal">
                <div className="segmento green" style={{ width: `${item.verde}%` }}></div>
                <div className="segmento yellow" style={{ width: `${item.amarillo}%` }}></div>
                <div className="segmento red" style={{ width: `${item.rojo}%` }}></div>
              </div>
            ))}
          </div>

          <div className="eje-x-labels">
            <div>0</div>
            <div>25</div>
            <div>50</div>
            <div>75</div>
            <div>100</div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GraficaBarrasHorizontal;
