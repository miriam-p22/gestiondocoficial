import React from "react";
import { useNavigate } from "react-router-dom";

import "../styles/BarraNavegacion.css";

// ======================================================
// IMÁGENES
// ======================================================

import menuIcon from "../assets/menu.png";
import userIcon from "../assets/usuario.png";
import notifIcon from "../assets/notificacion.png";
import IconoIP from "../assets/ip.png";
import IconoGrupo from "../assets/grupotlahuapan.png";

// ======================================================
// FORMATEAR FECHA RELATIVA
// ======================================================

const obtenerTiempoRelativo = (fecha) => {
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

  // Si por alguna diferencia de reloj
  // la fecha viene ligeramente en el futuro.
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

  return fechaNotificacion.toLocaleDateString(
    "es-MX",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

// ======================================================
// NOTIFICACIÓN INDIVIDUAL
// ======================================================

const NotificationItem = ({
  notification,
  onClick,
}) => {
  const leida =
    notification?.leida === true;

  return (
    <div
      className={`notification-item ${
        leida
          ? "read"
          : "unread"
      }`}
      onClick={() =>
        onClick?.(
          notification
        )
      }
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (
          event.key ===
            "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();

          onClick?.(
            notification
          );
        }
      }}
      style={{
        cursor: "pointer",
      }}
    >
      <div className="notification-item-left">
        {!leida && (
          <span className="notif-dot-mini" />
        )}

        <div>
          {notification?.titulo && (
            <p
              className="notification-title"
              style={{
                marginBottom: "3px",
                fontWeight: leida
                  ? 500
                  : 600,
              }}
            >
              {notification.titulo}
            </p>
          )}

          <p className="notification-message">
            {notification?.mensaje ||
              "Notificación del sistema"}
          </p>

          <span className="notification-time">
            {obtenerTiempoRelativo(
              notification?.fecha_creacion
            )}
          </span>
        </div>
      </div>

      <span
        className={`notif-pill ${
          leida
            ? "pill-read"
            : "pill-new"
        }`}
      >
        {leida
          ? "Leída"
          : "Nueva"}
      </span>
    </div>
  );
};

// ======================================================
// NAVBAR
// ======================================================

function Navbar({
  onToggleSidebar,

  userName,
  ipAddress,
  groupName,

  notifications = [],
  unreadCount,

  notificationsLoading = false,

  notifMenuOpen,
  toggleNotificationMenu,

  onMarkAsRead,
  onViewAllNotifications,
  onCloseNotifMenu,
  onRefreshNotifications,
}) {
  const navigate =
    useNavigate();

  // ====================================================
  // CONTADOR REAL DE NO LEÍDAS
  // ====================================================

  const totalNoLeidas =
    Number.isInteger(
      unreadCount
    )
      ? unreadCount
      : notifications.filter(
          (notification) =>
            notification?.leida !==
            true
        ).length;

  // ====================================================
  // ABRIR / CERRAR CAMPANA
  // ====================================================

  const handleNotificationToggle =
    async () => {
      /*
       * Cada vez que abrimos la campana podemos
       * refrescar las notificaciones para mostrar
       * información reciente.
       */
      if (
        !notifMenuOpen &&
        onRefreshNotifications
      ) {
        try {
          await onRefreshNotifications();
        } catch (error) {
          console.error(
            "[Navbar] No fue posible actualizar las notificaciones:",
            error
          );
        }
      }

      if (
        toggleNotificationMenu
      ) {
        toggleNotificationMenu();
      }
    };

  // ====================================================
  // CLICK EN UNA NOTIFICACIÓN
  // ====================================================

  const handleNotificationClick =
    async (notification) => {
      if (!notification) {
        return;
      }

      /*
       * Si todavía no ha sido leída,
       * la marcamos como leída.
       */
      if (
        notification.leida !==
          true &&
        onMarkAsRead
      ) {
        try {
          await onMarkAsRead(
            notification.id
          );
        } catch (error) {
          console.error(
            "[Navbar] No fue posible marcar la notificación como leída:",
            error
          );

          return;
        }
      }

      /*
       * Cerramos el dropdown.
       */
      if (onCloseNotifMenu) {
        onCloseNotifMenu();
      }

      /*
       * Si la notificación tiene una ruta,
       * llevamos al usuario al módulo.
       *
       * Ejemplos:
       *
       * /organigrama
       * /documentos
       * /dispersion
       * /leyarchivo
       */
      const ruta =
        String(
          notification.ruta ||
            ""
        ).trim();

      if (ruta) {
        navigate(ruta);
      }
    };

  // ====================================================
  // VER TODAS
  // ====================================================

  const handleViewAllClick =
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (onCloseNotifMenu) {
        onCloseNotifMenu();
      }

      if (
        onViewAllNotifications
      ) {
        onViewAllNotifications();
      }
    };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <header className="navbar">
      {/* =================================================
          MENÚ
          ================================================= */}

      <div className="header-left-group">
        <img
          src={menuIcon}
          alt="Menú"
          className="icon-control-img"
          onClick={
            onToggleSidebar
          }
          style={{
            cursor: "pointer",
          }}
        />
      </div>

      {/* =================================================
          CENTRO: IP + ROL
          ================================================= */}

      <div className="center-items">
        <div className="right-item">
          <img
            src={IconoIP}
            alt="IP"
            className="icon-control-img"
          />

          <span>
            {ipAddress}
          </span>
        </div>

        <div className="right-item">
          <img
            src={IconoGrupo}
            alt="Rol"
            className="icon-control-img"
          />

          <span>
            {groupName}
          </span>
        </div>
      </div>

      {/* =================================================
          USUARIO + NOTIFICACIONES
          ================================================= */}

      <div className="user-info">
        <div className="profile-info-container">
          <img
            src={userIcon}
            alt="Usuario"
            className="icon-control-img"
          />

          <span className="user-name">
            {userName}
          </span>
        </div>

        {/* ===============================================
            CAMPANA
            =============================================== */}

        <div
          className="notification-dropdown-container"
        >
          <div
            onClick={
              handleNotificationToggle
            }
            style={{
              cursor: "pointer",
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src={notifIcon}
              alt="Notificaciones"
              className="icon-control-img notification-icon-img"
            />

            {totalNoLeidas >
              0 &&
              !notifMenuOpen && (
                <span className="notification-badge">
                  {totalNoLeidas >
                  99
                    ? "99+"
                    : totalNoLeidas}
                </span>
              )}
          </div>

          {/* =============================================
              MENÚ DESPLEGABLE
              ============================================= */}

          <div
            className={`dropdown-menu notification-menu ${
              notifMenuOpen
                ? "visible"
                : ""
            }`}
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <p className="dropdown-title">
              Notificaciones recientes
              {totalNoLeidas >
                0 &&
                ` (${totalNoLeidas} nuevas)`}
            </p>

            <div className="notification-list-scrollable">
              {notificationsLoading ? (
                <div className="dropdown-item notification-empty">
                  Cargando
                  notificaciones...
                </div>
              ) : notifications.length >
                0 ? (
                notifications
                  .slice(0, 5)
                  .map(
                    (
                      notification
                    ) => (
                      <NotificationItem
                        key={
                          notification.id
                        }
                        notification={
                          notification
                        }
                        onClick={
                          handleNotificationClick
                        }
                      />
                    )
                  )
              ) : (
                <div className="dropdown-item notification-empty">
                  No hay
                  notificaciones.
                </div>
              )}
            </div>

            <a
              href="#"
              className="dropdown-item view-all"
              onClick={
                handleViewAllClick
              }
            >
              Ver todas las
              notificaciones
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;