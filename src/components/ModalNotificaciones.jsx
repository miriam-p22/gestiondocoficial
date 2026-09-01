import React from "react";

import ModalReutilizable from "./ModalReutilizable";

import "../styles/NotificacionesModal.css";

// ======================================================
// FECHA RELATIVA
// ======================================================

const obtenerTiempoRelativo = (
  fecha
) => {
  if (!fecha) {
    return "";
  }

  const fechaNotificacion =
    new Date(fecha);

  if (
    Number.isNaN(
      fechaNotificacion.getTime()
    )
  ) {
    return "";
  }

  const ahora =
    new Date();

  const diferencia =
    ahora.getTime() -
    fechaNotificacion.getTime();

  if (diferencia < 0) {
    return "Ahora";
  }

  const segundos =
    Math.floor(
      diferencia / 1000
    );

  if (segundos < 60) {
    return "Ahora";
  }

  const minutos =
    Math.floor(
      segundos / 60
    );

  if (minutos < 60) {
    return `Hace ${minutos} ${
      minutos === 1
        ? "minuto"
        : "minutos"
    }`;
  }

  const horas =
    Math.floor(
      minutos / 60
    );

  if (horas < 24) {
    return `Hace ${horas} ${
      horas === 1
        ? "hora"
        : "horas"
    }`;
  }

  const dias =
    Math.floor(
      horas / 24
    );

  if (dias < 7) {
    return `Hace ${dias} ${
      dias === 1
        ? "día"
        : "días"
    }`;
  }

  return fechaNotificacion
    .toLocaleDateString(
      "es-MX",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
};

// ======================================================
// MODAL
// ======================================================

const ModalNotificaciones = ({
  isOpen,
  onClose,

  notifications = [],

  loading = false,
  saving = false,
  error = "",

  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  // ====================================================
  // CONTADOR REAL
  // ====================================================

  const unreadCount =
    notifications.filter(
      (notification) =>
        notification?.leida !==
        true
    ).length;

  // ====================================================
  // MARCAR UNA
  // ====================================================

  const handleNotificationClick =
    async (
      notification
    ) => {
      if (
        !notification ||
        notification.leida === true ||
        !onMarkAsRead
      ) {
        return;
      }

      try {
        await onMarkAsRead(
          notification.id
        );
      } catch (error) {
        console.error(
          "[ModalNotificaciones] Error al marcar como leída:",
          error
        );
      }
    };

  // ====================================================
  // MARCAR TODAS
  // ====================================================

  const handleMarkAll =
    async () => {
      if (
        !onMarkAllAsRead ||
        unreadCount === 0
      ) {
        return;
      }

      try {
        await onMarkAllAsRead();
      } catch (error) {
        console.error(
          "[ModalNotificaciones] Error al marcar todas:",
          error
        );
      }
    };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <ModalReutilizable
      id="modal-notificaciones"
      title={`Todas las notificaciones (${notifications.length})`}
      isOpen={isOpen}
      onClose={onClose}
      hideFooter={true}
    >
      {/* =================================================
          CABECERA
          ================================================= */}

      <div className="notif-modal-header">
        <div className="notif-subtitle">
          {unreadCount > 0 ? (
            <span>
              <strong>
                {unreadCount}
              </strong>{" "}
              {unreadCount === 1
                ? "sin leer"
                : "sin leer"}
            </span>
          ) : (
            <span>
              Todo está leído
            </span>
          )}
        </div>

        <button
          type="button"
          className="notif-action-btn"
          onClick={
            handleMarkAll
          }
          disabled={
            unreadCount === 0 ||
            saving
          }
          title="Marcar todas como leídas"
        >
          {saving
            ? "Procesando..."
            : "Marcar todas como leídas"}
        </button>
      </div>

      {/* =================================================
          ERROR
          ================================================= */}

      {error && (
        <div className="notif-error">
          {error}
        </div>
      )}

      {/* =================================================
          LISTA
          ================================================= */}

      <div className="notif-list">
        {loading ? (
          <div className="notif-empty">
            Cargando
            notificaciones...
          </div>
        ) : notifications.length >
          0 ? (
          notifications.map(
            (notification) => {
              const leida =
                notification?.leida ===
                true;

              return (
                <button
                  key={
                    notification.id
                  }
                  type="button"
                  className={`notif-item ${
                    leida
                      ? "read"
                      : "unread"
                  }`}
                  onClick={() =>
                    handleNotificationClick(
                      notification
                    )
                  }
                  disabled={
                    saving
                  }
                  title={
                    leida
                      ? "Notificación leída"
                      : "Marcar como leída"
                  }
                >
                  <div className="notif-item-left">
                    {!leida && (
                      <span className="notif-dot" />
                    )}

                    <div className="notif-text">
                      {/* TÍTULO */}

                      <div className="notif-title">
                        {notification?.titulo ||
                          "Notificación"}
                      </div>

                      {/* MENSAJE */}

                      <div className="notif-message">
                        {notification?.mensaje ||
                          "Sin mensaje"}
                      </div>

                      {/* FECHA */}

                      <div className="notif-time">
                        {obtenerTiempoRelativo(
                          notification?.fecha_creacion
                        )}
                      </div>

                      {/* MÓDULO OPCIONAL */}

                      {notification?.modulo && (
                        <div className="notif-module">
                          Módulo:{" "}
                          {
                            notification.modulo
                          }
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={`notif-status ${
                      leida
                        ? "status-read"
                        : "status-new"
                    }`}
                  >
                    {leida
                      ? "Leída"
                      : "Nueva"}
                  </div>
                </button>
              );
            }
          )
        ) : (
          <div className="notif-empty">
            No hay
            notificaciones.
          </div>
        )}
      </div>

      {/* =================================================
          FOOTER
          ================================================= */}

      <div className="notif-footer">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </ModalReutilizable>
  );
};

export default ModalNotificaciones;