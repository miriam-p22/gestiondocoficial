import React, { useEffect, useState } from "react";

import {
  FiCheckCircle,
  FiDatabase,
  FiMail,
  FiRefreshCw,
  FiServer,
  FiShield,
  FiWifi,
} from "react-icons/fi";

import Card from "../components/Card";
import CampoFormulario from "../components/CampoFormulario";
import BotonReutilizable from "../components/BotonReutilizable";
import useConfiguracion from "../hooks/useConfiguracion";
import usePermisosUsuario from "../hooks/usePermisosUsuario";
import "../styles/NotificacionConexionBD.css";

const NotificacionConexionBD = () => {
  const {
    loading: loadingPermisos,
    error: errorPermisos,
    tienePrivilegio,
  } = usePermisosUsuario();

  const permisosCargados = !loadingPermisos;
  const puedeNotificaciones = permisosCargados && tienePrivilegio("Gestionar Notificaciones");
  const puedeEstadoSistema = permisosCargados && tienePrivilegio("Gestionar Configuración del Sistema");
  const puedeAcceder = puedeNotificaciones || puedeEstadoSistema;

  const {
    configuracion,
    estadoSistema,
    loading,
    saving,
    checking,
    error,
    guardarConfiguracion,
    probarSmtp,
    refreshEstado,
    limpiarError,
  } = useConfiguracion({
    puedeNotificaciones,
    puedeEstadoSistema,
    permisosCargados,
  });

  const [formData, setFormData] = useState({
    correo_remitente: "",
    contrasenia: "",
    smtp: "",
    puerto: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");

  useEffect(() => {
    if (configuracion) {
      setFormData({
        correo_remitente: configuracion.correo_remitente || "",
        contrasenia: "",
        smtp: configuracion.smtp || "",
        puerto: configuracion.puerto ? String(configuracion.puerto) : "",
      });
    }
  }, [configuracion]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    limpiarError();
    setMensaje("");
    setErrorFormulario("");

    setFormData((actual) => ({
      ...actual,
      [name]: value,
    }));
  };

  const handleGuardar = async () => {
    limpiarError();
    setMensaje("");
    setErrorFormulario("");

    if (!formData.correo_remitente.trim()) {
      setErrorFormulario("El correo remitente es obligatorio.");
      return;
    }

    if (!formData.smtp.trim()) {
      setErrorFormulario("El servidor SMTP es obligatorio.");
      return;
    }

    const puerto = Number(formData.puerto);

    if (!Number.isInteger(puerto) || puerto <= 0 || puerto > 65535) {
      setErrorFormulario("Capture un puerto SMTP válido.");
      return;
    }

    if (!configuracion?.tiene_contrasenia && !formData.contrasenia.trim()) {
      setErrorFormulario(
        "La contraseña SMTP es obligatoria en la primera configuración.",
      );
      return;
    }

    try {
      const datos = {
        correo_remitente: formData.correo_remitente.trim(),
        smtp: formData.smtp.trim(),
        puerto,
        contrasenia: formData.contrasenia.trim() || undefined,
      };

      await guardarConfiguracion(datos);

      setFormData((actual) => ({
        ...actual,
        contrasenia: "",
      }));

      setMensaje("La configuración de notificaciones se guardó correctamente.");
    } catch {

    }
  };

  const handleProbarSmtp = async () => {
    limpiarError();
    setMensaje("");
    setErrorFormulario("");

    try {
      const resultado = await probarSmtp();

      setMensaje(
        resultado?.mensaje || "El servidor SMTP respondió correctamente.",
      );
    } catch {
      
    }
  };

  const fechaVerificacion = estadoSistema?.api?.fecha_verificacion
    ? new Date(estadoSistema.api.fecha_verificacion).toLocaleString("es-MX")
    : "—";

  const estadoBd = estadoSistema?.base_datos?.estado === "conectada";

  return (
    <main className="content-area">
      <section className="content-section configuracion-page">
        <div className="configuracion-header">
          <div>
            <h2 className="card-title">Configuración del Sistema</h2>

            <p className="configuracion-subtitle">
              Administra las notificaciones y consulta el estado técnico del
              sistema.
            </p>
          </div>
        </div>

        {(mensaje || errorFormulario || error || errorPermisos) && (
          <div
            className={
              errorFormulario || error || errorPermisos
                ? "page-message page-message-error"
                : "page-message page-message-success"
            }
          >
            {errorFormulario || error || errorPermisos || mensaje}
          </div>
        )}

        {loadingPermisos ? (
          <div className="configuracion-loading">Verificando permisos...</div>
        ) : !puedeAcceder ? (
          <Card className="configuracion-card">
            <div className="configuracion-card-header">
              <div className="configuracion-card-icon">
                <FiShield />
              </div>

              <div>
                <h3>Acceso restringido</h3>

                <p>
                  No cuenta con privilegios para administrar las notificaciones
                  ni consultar la configuración técnica del sistema.
                </p>
              </div>
            </div>
          </Card>
        ) : loading ? (
          <div className="configuracion-loading">Cargando configuración...</div>
        ) : (
          <div className="configuracion-grid">
            {puedeNotificaciones && (
              <Card className="configuracion-card">
                <div className="configuracion-card-header">
                  <div className="configuracion-card-icon">
                    <FiMail />
                  </div>

                  <div>
                    <h3>Notificaciones por correo</h3>

                    <p>
                      Configuración SMTP utilizada para el envío de
                      notificaciones del sistema.
                    </p>
                  </div>
                </div>

                <div className="configuracion-form">
                  <CampoFormulario
                    label="Correo remitente"
                    type="email"
                    name="correo_remitente"
                    placeholder="notificaciones@tlahuapan.gob.mx"
                    value={formData.correo_remitente}
                    onChange={handleChange}
                    required
                  />

                  <CampoFormulario
                    label="Servidor SMTP"
                    name="smtp"
                    placeholder="smtp.gmail.com"
                    value={formData.smtp}
                    onChange={handleChange}
                    required
                  />

                  <CampoFormulario
                    label="Puerto"
                    type="number"
                    name="puerto"
                    placeholder="587"
                    value={formData.puerto}
                    onChange={handleChange}
                    required
                  />

                  <CampoFormulario
                    label="Contraseña SMTP"
                    type="password"
                    name="contrasenia"
                    placeholder={
                      configuracion?.tiene_contrasenia
                        ? "Dejar vacío para conservar la actual"
                        : "Capture la contraseña SMTP"
                    }
                    value={formData.contrasenia}
                    onChange={handleChange}
                  />

                  {configuracion?.tiene_contrasenia && (
                    <div className="configuracion-security-note">
                      <FiShield />

                      <span>
                        Contraseña guardada.
                      </span>
                    </div>
                  )}

                  <div className="configuracion-actions">
                    <BotonReutilizable
                      className="btn-secondary-ip"
                      onClick={handleProbarSmtp}
                      disabled={checking || saving}
                    >
                      <FiWifi />
                      {checking ? "Probando..." : "Probar servidor SMTP"}
                    </BotonReutilizable>

                    <BotonReutilizable
                      onClick={handleGuardar}
                      disabled={saving || checking}
                    >
                      <FiCheckCircle />
                      {saving ? "Guardando..." : "Guardar"}
                    </BotonReutilizable>
                  </div>

                  <div className="configuracion-help">
                    La prueba SMTP verifica conectividad con el servidor
                    configurado. No envía correos ni valida todavía las
                    credenciales.
                  </div>
                </div>
              </Card>
            )}

            {puedeEstadoSistema && (
              <Card className="configuracion-card">
                <div className="configuracion-card-header">
                  <div className="configuracion-card-icon">
                    <FiDatabase />
                  </div>

                  <div>
                    <h3>Estado del sistema</h3>

                    <p>
                      Consulta segura de la API y de la conexión actual con
                      MySQL.
                    </p>
                  </div>
                </div>

                <div className="estado-sistema-list">
                  <div className="estado-sistema-item">
                    <div>
                      <FiServer />
                      <span>API</span>
                    </div>
                    <strong className="estado-ok">Conectada</strong>
                  </div>

                  <div className="estado-sistema-item">
                    <div>
                      <FiDatabase />
                      <span>Base de datos</span>
                    </div>
                    <strong className={estadoBd ? "estado-ok" : "estado-error"}>
                      {estadoBd ? "Conectada" : "Sin conexión"}
                    </strong>
                  </div>

                  <div className="estado-sistema-item">
                    <span>Motor</span>
                    <strong>{estadoSistema?.base_datos?.motor || "—"}</strong>
                  </div>

                  <div className="estado-sistema-item">
                    <span>Versión</span>
                    <strong>{estadoSistema?.base_datos?.version || "—"}</strong>
                  </div>

                  <div className="estado-sistema-item">
                    <span>Host</span>
                    <strong>{estadoSistema?.base_datos?.host || "—"}</strong>
                  </div>

                  <div className="estado-sistema-item">
                    <span>Puerto</span>
                    <strong>{estadoSistema?.base_datos?.puerto || "—"}</strong>
                  </div>

                  <div className="estado-sistema-item">
                    <span>Base activa</span>
                    <strong>{estadoSistema?.base_datos?.nombre || "—"}</strong>
                  </div>

                  <div className="estado-sistema-item">
                    <span>Tiempo de respuesta</span>
                    <strong>
                      {estadoSistema?.base_datos?.tiempo_respuesta_ms ?? "—"}
                      {estadoSistema?.base_datos?.tiempo_respuesta_ms !== null
                        ? " ms"
                        : ""}
                    </strong>
                  </div>
                </div>

                <div className="estado-sistema-footer">
                  <span>Última comprobación: {fechaVerificacion}</span>

                  <BotonReutilizable
                    className="btn-secondary-ip"
                    onClick={() => refreshEstado().catch(() => {})}
                    disabled={checking}
                  >
                    <FiRefreshCw />
                    {checking ? "Comprobando..." : "Comprobar conexión"}
                  </BotonReutilizable>
                </div>

                <div className="configuracion-security-note">
                  <FiShield />
                </div>
              </Card>
            )}
          </div>
        )}
      </section>
    </main>
  );
};

export default NotificacionConexionBD;
