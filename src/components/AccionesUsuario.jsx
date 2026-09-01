import React from "react";
import BotonDesplegable from "./BotonDesplegable";

const AccionesUsuario = ({ user, onEdit, onStatusChange }) => {
  return (
    <div className="actions-cell-content">

      <button
        className="btn-action edit"
        onClick={() => onEdit(user)}
      >
        Editar
      </button>

      <BotonDesplegable
        title="Estado"
        options={[
          {
            label: "Activo",
            onClick: () => onStatusChange(user.id, "Activo")
          },
          {
            label: "Inactivo",
            onClick: () => onStatusChange(user.id, "Inactivo")
          }
        ]}
      />

    </div>
  );
};

export default AccionesUsuario;
