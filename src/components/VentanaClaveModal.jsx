import React from "react";
import "../styles/VentanaClaveIP.css";
import CampoInicioSesion from "./CampoInicioSesion";


const VentanaClaveModal = ({ isOpen, onClose, onConfirm, clave, setClave, mensaje }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Ingresa la Clave Especial</h2>

       <CampoInicioSesion
  type="password"
  placeholder="Escribe la clave"
  value={clave}
  onChange={(e) => setClave(e.target.value)}
/>


        {mensaje && (
          <p className={mensaje.tipo === "ok" ? "msg-ok" : "msg-error"}>
            {mensaje.texto}
          </p>
        )}

        <div className="modal-buttons">
          <button className="modal-btn confirmar" onClick={onConfirm}>
            Confirmar
          </button>

          <button className="modal-btn cancelar" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default VentanaClaveModal;
