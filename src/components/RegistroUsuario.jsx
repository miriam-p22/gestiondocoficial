import React from "react";
import ModalReutilizable from "./ModalReutilizable";
import CampoFormulario from "./CampoFormulario";

const FormularioRegistro = ({ formData, onInputChange, errorMessage }) => {
  return (
    <>
      <CampoFormulario
        label="Nombre"
        placeholder="Nombre completo"
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

      {errorMessage ? (
        <div
          style={{
            marginTop: "12px",
            color: "#b42318",
            fontSize: "14px",
          }}
        >
          {errorMessage}
        </div>
      ) : null}
    </>
  );
};

const RegistroUsuario = ({
  isOpen,
  onClose,
  onRegister,
  loading = false,
  errorMessage = "",
}) => {
  const [formData, setFormData] = React.useState({
    nombre: "",
    usuario: "",
    numTrabajador: "",
    correo: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const limpiarFormulario = () => {
    setFormData({
      nombre: "",
      usuario: "",
      numTrabajador: "",
      correo: "",
      password: "",
    });
  };

  const handleClose = () => {
    if (loading) return;
    limpiarFormulario();
    onClose();
  };

  const handleAccept = async () => {
    if (loading) return;

    const nombre = String(formData.nombre || "").trim();
    const usuario = String(formData.usuario || "").trim();
    const numeroTrabajador = String(formData.numTrabajador || "").trim();
    const correo = String(formData.correo || "").trim();
    const password = String(formData.password || "");

    if (!nombre || !usuario || !numeroTrabajador || !correo || !password.trim()) {
      return;
    }

    const numeroTrab = Number(numeroTrabajador);

    if (!Number.isInteger(numeroTrab)) {
      return;
    }

    try {
      await onRegister({
        nombre_completo: nombre,
        nombre_usuario: usuario,
        numero_trab: numeroTrab,
        correo_electronico: correo,
        contrasenia: password,
      });

      limpiarFormulario();
      onClose();
    } catch (error) {
      
    }
  };

  return (
    <ModalReutilizable
      title="Registro inicial de Recursos Humanos"
      isOpen={isOpen}
      onClose={handleClose}
      onAccept={handleAccept}
      acceptButtonText={loading ? "Registrando..." : "Aceptar"}
      cancelButtonText="Cancelar"
    >
      <FormularioRegistro
        formData={formData}
        onInputChange={handleInputChange}
        errorMessage={errorMessage}
      />
    </ModalReutilizable>
  );
};

export default RegistroUsuario;
