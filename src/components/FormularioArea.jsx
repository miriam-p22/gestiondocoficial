import React from "react";
import CampoFormulario from "./CampoFormulario";

const FormInsertarArea = () => (
  <div className="grid two">
    <CampoFormulario label="Nombre del área" placeholder="Ej. Secretaría Técnica" required />
    <CampoFormulario label="Nivel" isSelect required>
      <option value="">Selecciona nivel</option>
      {[1, 2, 3, 4].map((n) => (
        <option key={n} value={n}>{n}</option>
      ))}
    </CampoFormulario>
    <CampoFormulario label="Área superior" isSelect>
      <option value="Presidencia Municipal">Presidencia Municipal</option>
      <option value="Secretaría Técnica">Secretaría Técnica</option>
      <option value="Secretaría del Ayuntamiento">Secretaría del Ayuntamiento</option>
    </CampoFormulario>
  </div>
);

export default FormInsertarArea;
