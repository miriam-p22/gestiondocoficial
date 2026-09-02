import React from "react";

const FormularioPrivilegios = ({
  privilegios = [],
  seleccionados = [],
  onChange,
  loading = false,
}) => {
  if (loading) {
    return <div className="privilegios-loading">Cargando privilegios...</div>;
  }

  if (privilegios.length === 0) {
    return (
      <div className="privilegios-empty">
        No existen privilegios registrados.
      </div>
    );
  }

  return (
    <div className="privilegios-lista">
      {privilegios.map((privilegio) => {
        const seleccionado = seleccionados.includes(privilegio.id);

        return (
          <label
            key={privilegio.id}
            className={`privilegio-item ${
              seleccionado ? "privilegio-seleccionado" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={seleccionado}
              onChange={() => onChange(privilegio.id)}
            />

            <span className="privilegio-checkbox-text">
              {privilegio.titulo_privilegio}
            </span>
          </label>
        );
      })}
    </div>
  );
};

export default FormularioPrivilegios;
