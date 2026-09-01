// src/components/RegistroUsuario.jsx
import React from "react";
import ModalReutilizable from "./ModalReutilizable";
import CampoFormulario from "./CampoFormulario";

/* ======================
   LISTA DE ROLES
====================== */
const roles = [
  "Administrador",
  "Coordinador",
  "Supervisor",
  "Usuario",
];

/* ======================
   FORMULARIO
====================== */
const FormularioRegistro = ({ formData, onInputChange }) => {
  return (
    <>
      <CampoFormulario
        label="Nombre"
        placeholder="Nombre"
        name="nombre"
        value={formData.nombre || ""}
        onChange={onInputChange}
        required
      />

      <CampoFormulario
        label="Usuario"
        placeholder="Usuario"
        name="usuario"
        value={formData.usuario || ""}
        onChange={onInputChange}
        required
      />

      <CampoFormulario
        label="Número de trabajador"
        placeholder="Número de trabajador"
        name="numTrabajador"
        value={formData.numTrabajador || ""}
        onChange={onInputChange}
        required
      />

      <CampoFormulario
        label="Correo electrónico"
        type="email"
        placeholder="Correo electrónico"
        name="correo"
        value={formData.correo || ""}
        onChange={onInputChange}
        required
      />

      <CampoFormulario
        label="Contraseña"
        type="password"
        placeholder="Contraseña"
        name="password"
        value={formData.password || ""}
        onChange={onInputChange}
        required
      />

      <CampoFormulario
        label="Rol"
        isSelect
        name="rol"
        value={formData.rol || ""}
        onChange={onInputChange}
        required
      >
        <option value="" disabled>Rol</option>
        {roles.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </CampoFormulario>
    </>
  );
};

/* ==========================
   COMPONENTE CONTROLADO
=========================== */
const RegistroUsuario = ({ isOpen, onClose, onRegister }) => {
  const [formData, setFormData] = React.useState({
    nombre: "",
    usuario: "",
    numTrabajador: "",
    correo: "",
    password: "",
    rol: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAccept = () => {
    if (
      !formData.nombre ||
      !formData.usuario ||
      !formData.numTrabajador ||
      !formData.correo ||
      !formData.password ||
      !formData.rol
    ) {
      alert("Por favor completa todos los campos.");
      return;
    }

    onRegister(formData); // ← se envía al padre

    // limpiar
    setFormData({
      nombre: "",
      usuario: "",
      numTrabajador: "",
      correo: "",
      password: "",
      rol: "",
    });

    onClose(); // cierra modal
  };

  return (
    <ModalReutilizable
      title="Registro"
      isOpen={isOpen}
      onClose={onClose}
      onAccept={handleAccept}
      acceptButtonText="Aceptar"
      cancelButtonText="Cancelar"
    >
      <FormularioRegistro
        formData={formData}
        onInputChange={handleInputChange}
      />
    </ModalReutilizable>
  );
};

export default RegistroUsuario;
