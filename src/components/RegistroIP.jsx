import React, { useEffect, useState } from "react";

import ModalReutilizable from "./ModalReutilizable";
import CampoFormulario from "./CampoFormulario";

const esIpv4Valida = (valor) => {
  const texto = String(valor || "").trim();
  const partes = texto.split(".");

  if (partes.length !== 4) {
    return false;
  }

  return partes.every((parte) => {
    if (parte === "" || !/^\d+$/.test(parte)) {
      return false;
    }

    const numero = Number(parte);

    return numero >= 0 && numero <= 255;
  });
};

const estadoInicial = {
  id_area: "",
  ip_areas: "",
  grupo: "",
  ip_rh: false,
};

const RegistroIP = ({
  isOpen,
  onClose,
  onRegister,
  onUpdate,
  areas = [],
  registro = null,
  saving = false,
}) => {
  const [formData, setFormData] = useState(estadoInicial);
  const [error, setError] = useState("");
  const esEdicion = Boolean(registro?.id);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (registro) {
      setFormData({
        id_area: String(registro.id_area || ""),
        ip_areas: registro.ip_areas || "",
        grupo: registro.grupo || "",
        ip_rh: Boolean(registro.ip_rh),
      });
    } else {
      setFormData(estadoInicial);
    }

    setError("");
  }, [isOpen, registro]);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAccept = async () => {
    if (saving) {
      return;
    }

    setError("");

    try {
      if (!formData.id_area) {
        throw new Error("Seleccione un área.");
      }

      if (!formData.ip_areas.trim()) {
        throw new Error("Capture una dirección IP.");
      }

      if (!esIpv4Valida(formData.ip_areas)) {
        throw new Error("La dirección IP no tiene un formato IPv4 válido.");
      }

      const datos = {
        id_area: Number(formData.id_area),
        ip_areas: formData.ip_areas.trim(),
        grupo: formData.grupo.trim() || null,
        ip_rh: Boolean(formData.ip_rh),
      };

      if (esEdicion) {
        await onUpdate(registro.id, datos);
      } else {
        await onRegister(datos);
      }

      setFormData(estadoInicial);
      onClose();
    } catch (err) {
      setError(err?.message || "No fue posible guardar la dirección IP.");
    }
  };

  return (
    <ModalReutilizable
      title={esEdicion ? "Editar dirección IP" : "Registrar dirección IP"}
      isOpen={isOpen}
      onClose={onClose}
      onAccept={handleAccept}
      acceptButtonText={
        saving ? "Guardando..." : esEdicion ? "Actualizar" : "Guardar"
      }
      cancelButtonText="Cancelar"
    >
      <div className="registro-ip-form">
        {error && <div className="registro-ip-error">{error}</div>}

        <CampoFormulario
          label="Área"
          isSelect
          name="id_area"
          value={formData.id_area}
          onChange={handleInputChange}
          required
        >
          <option value="">Seleccione un área</option>

          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.nombre_area}
            </option>
          ))}
        </CampoFormulario>

        <CampoFormulario
          label="Dirección IP"
          placeholder="Ej. 192.168.1.10"
          name="ip_areas"
          value={formData.ip_areas}
          onChange={handleInputChange}
          required
        />

        <CampoFormulario
          label="Grupo"
          placeholder="Ej. Secretaría / Recepción"
          name="grupo"
          value={formData.grupo}
          onChange={handleInputChange}
        />

        <label className="registro-ip-check">
          <input
            type="checkbox"
            name="ip_rh"
            checked={formData.ip_rh}
            onChange={handleInputChange}
          />

          <span>Marcar como equipo de Recursos Humanos</span>
        </label>

        <div className="registro-ip-help">
          La dirección IP quedará asociada al área seleccionada.
        </div>
      </div>
    </ModalReutilizable>
  );
};

export default RegistroIP;
