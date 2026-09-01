import React from "react";
import DropdownReutilizable from "./DropdownReutilizable";
import "../styles/DashboardFiltros.css";

const DashboardFiltros = ({ anio, mes, setAnio, setMes, onActualizar }) => {
  const opcionesAnio = [
    { status: "2025", label: "2025" },
    { status: "2024", label: "2024" },
    { status: "2023", label: "2023" },
    { status: "2022", label: "2022" },
  ];

  const opcionesMes = [
    { status: "1", label: "Enero" },
    { status: "2", label: "Febrero" },
    { status: "3", label: "Marzo" },
    { status: "4", label: "Abril" },
    { status: "5", label: "Mayo" },
    { status: "6", label: "Junio" },
    { status: "7", label: "Julio" },
    { status: "8", label: "Agosto" },
    { status: "9", label: "Septiembre" },
    { status: "10", label: "Octubre" },
    { status: "11", label: "Noviembre" },
    { status: "12", label: "Diciembre" },
  ];

  return (
    <div className="dashboard-filtros">
      <div className="periodo-filtros">
        
        <DropdownReutilizable
          label="Año:"
          value={anio}
          onChange={setAnio}
          options={opcionesAnio}
        />

        <DropdownReutilizable
          label="Mes:"
          value={mes}
          onChange={setMes}
          options={opcionesMes}
        />

        <button className="btn-actualizar" onClick={onActualizar}>
          <i className="fas fa-sync-alt"></i> Actualizar
        </button>

      </div>
    </div>
  );
};

export default DashboardFiltros;
