import React from "react";
import CampoFormulario from "./CampoFormulario";
const FormularioClasificacion = ({ datos = {} }) => {
  return (
    <form className="formulario-clasificacion">
      <div className="grid two">
        <CampoFormulario
          label="Área administrativa"
          placeholder="Ej. Secretaría del Ayuntamiento"
          defaultValue={datos.area || ""}
          required
        />
        <CampoFormulario
          label="Código asignado"
          placeholder="Ej. SEC-2025-001 C"
          defaultValue={datos.codigo || ""}
          required
        />
      </div>

      <div className="grid two">
        <CampoFormulario
          label="Ubicación (carpeta o archivador)"
          placeholder="Ej. Carpeta 2025 / Archivador B"
          defaultValue={datos.ubicacion || ""}
          required
        />
        <CampoFormulario label="Función (S/C)" isSelect defaultValue={datos.funcion || ""}>
          <option value="">Selecciona...</option>
          <option value="S">Sustantiva</option>
          <option value="C">Común</option>
        </CampoFormulario>
      </div>
    </form>
  );
};

export default FormularioClasificacion;
