import React from "react";

import CampoFormulario from "./CampoFormulario";

const FormularioUsuario = ({
  userData,
  onInputChange,
  areas = [],
  roles = [],
  isEdit = false,
}) => {
  return (
    <div className="usuario-form-grid">
      <div className="usuario-form-field usuario-form-full">
        <CampoFormulario
          label="Nombre completo"
          placeholder="Nombre completo"
          name="nombre_completo"
          value={userData.nombre_completo || ""}
          onChange={onInputChange}
          required
        />
      </div>

      <div className="usuario-form-field">
        <CampoFormulario
          label="Número de trabajador"
          type="number"
          placeholder="Número de trabajador"
          name="numero_trab"
          value={userData.numero_trab ?? ""}
          onChange={onInputChange}
        />
      </div>

      <div className="usuario-form-field">
        <CampoFormulario
          label="Correo electrónico"
          type="email"
          placeholder="Correo electrónico"
          name="correo_electronico"
          value={userData.correo_electronico || ""}
          onChange={onInputChange}
        />
      </div>

      <div className="usuario-form-field">
        <CampoFormulario
          label="Nombre de usuario"
          placeholder="Nombre de usuario"
          name="nombre_usuario"
          value={userData.nombre_usuario || ""}
          onChange={onInputChange}
          required
        />
      </div>

      <div className="usuario-form-field">
        <CampoFormulario
          label={isEdit ? "Nueva contraseña" : "Contraseña"}
          type="password"
          placeholder={isEdit ? "Dejar vacío para conservarla" : "Contraseña"}
          name="contrasenia"
          value={userData.contrasenia || ""}
          onChange={onInputChange}
          required={!isEdit}
        />
      </div>

      <div className="usuario-form-field">
        <CampoFormulario
          label="Área de adscripción"
          isSelect
          name="id_area"
          value={userData.id_area || ""}
          onChange={onInputChange}
          required
        >
          <option value="" disabled>
            Seleccione un área
          </option>

          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.nombre_area}
            </option>
          ))}
        </CampoFormulario>
      </div>

      <div className="usuario-form-field">
        <CampoFormulario
          label="Rol"
          isSelect
          name="id_rol"
          value={userData.id_rol || ""}
          onChange={onInputChange}
          required
        >
          <option value="" disabled>
            Seleccione un rol
          </option>

          {roles.map((rol) => (
            <option key={rol.id} value={rol.id}>
              {rol.nombre_rol}
            </option>
          ))}
        </CampoFormulario>
      </div>

      <div className="usuario-form-field usuario-form-full">
        <CampoFormulario
          label="Estatus"
          isSelect
          name="status"
          value={String(userData.status ?? true)}
          onChange={onInputChange}
        >
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </CampoFormulario>
      </div>
    </div>
  );
};

export default FormularioUsuario;
