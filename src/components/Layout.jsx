import React, {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  Outlet,
} from "react-router-dom";

import "../styles/Layout.css";

import Sidebar from "./MenuLateral";
import Navbar from "./BarraNavegacion";
import ModalNotificaciones from "./ModalNotificaciones";

import {
  useNotificaciones,
} from "../hooks/useNotificaciones";

const Layout = () => {

  const [validandoSesion, setValidandoSesion] = useState(true);
  const [sesionValida, setSesionValida] = useState(false);

  useEffect(() => {
    let activo = true;

    const limpiarSesion = () => {
      [
        "token", "id_usuario", "id_area", "id_rol",
        "nombre_usuario", "nombre_completo",
        "nombre_area", "nombre_rol", "mantener_sesion",
      ].forEach((clave) => localStorage.removeItem(clave));
    };

    const validarSesion = async () => {
      const token = String(localStorage.getItem("token") || "").trim();

      if (!token) {
        limpiarSesion();
        if (activo) {
          setSesionValida(false);
          setValidandoSesion(false);
        }
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:3001/api/usuarios/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          limpiarSesion();
          if (activo) setSesionValida(false);
          return;
        }

        const data = await response.json();
        const usuario = data?.usuario;

        if (!usuario?.id) {
          limpiarSesion();
          if (activo) setSesionValida(false);
          return;
        }

        localStorage.setItem("id_usuario", String(usuario.id));

        if (usuario.id_area !== null && usuario.id_area !== undefined) {
          localStorage.setItem("id_area", String(usuario.id_area));
        } else {
          localStorage.removeItem("id_area");
        }

        if (usuario.id_rol !== null && usuario.id_rol !== undefined) {
          localStorage.setItem("id_rol", String(usuario.id_rol));
        } else {
          localStorage.removeItem("id_rol");
        }

        localStorage.setItem("nombre_usuario", usuario.nombre_usuario || "");
        localStorage.setItem("nombre_completo", usuario.nombre_completo || "");
        localStorage.setItem("nombre_area", usuario.area?.nombre_area || "");
        localStorage.setItem("nombre_rol", usuario.rol?.nombre_rol || "");

        if (activo) setSesionValida(true);
      } catch (error) {
        console.error("[Layout] No fue posible validar la sesión:", error);
        if (activo) setSesionValida(false);
      } finally {
        if (activo) setValidandoSesion(false);
      }
    };

    validarSesion();

    return () => {
      activo = false;
    };
  }, []);

  // ======================================================
  // SIDEBAR
  // ======================================================

  const [
    isSidebarOpen,
    setIsSidebarOpen,
  ] = useState(true);

  // ======================================================
  // DATOS REALES DE SESIÓN
  // ======================================================

  const nombreCompleto =
    String(
      localStorage.getItem(
        "nombre_completo"
      ) || ""
    ).trim();

  const nombreUsuario =
    String(
      localStorage.getItem(
        "nombre_usuario"
      ) || ""
    ).trim();

  const nombreRol =
    String(
      localStorage.getItem(
        "nombre_rol"
      ) || ""
    ).trim();

  const nombreArea =
    String(
      localStorage.getItem(
        "nombre_area"
      ) || ""
    ).trim();

  const usuarioNavbar =
    nombreCompleto ||
    nombreUsuario ||
    "Usuario";

  const grupoNavbar =
    nombreRol ||
    nombreArea ||
    "Sin rol";

  // ======================================================
  // NOTIFICACIONES REALES
  // ======================================================

  const {
    notificaciones,

    cantidadNoLeidas,

    loading:
      loadingNotificaciones,

    saving:
      savingNotificaciones,

    error:
      errorNotificaciones,

    cargarNotificaciones,

    marcarComoLeida,

    marcarTodasComoLeidas,

    eliminarNotificacion,
  } = useNotificaciones();

  // ======================================================
  // ESTADO UI DE NOTIFICACIONES
  // ======================================================

  const [
    isNotifMenuOpen,
    setIsNotifMenuOpen,
  ] = useState(false);

  const [
    isNotifModalOpen,
    setIsNotifModalOpen,
  ] = useState(false);

  // ======================================================
  // SIDEBAR
  // ======================================================

  const toggleSidebar =
    () => {
      setIsSidebarOpen(
        (prev) => !prev
      );
    };

  // ======================================================
  // ABRIR / CERRAR MENÚ
  // ======================================================

  const toggleNotificationMenu =
    () => {
      setIsNotifMenuOpen(
        (prev) => !prev
      );
    };

  const closeNotifMenu =
    () => {
      setIsNotifMenuOpen(
        false
      );
    };

  // ======================================================
  // MARCAR UNA COMO LEÍDA
  // ======================================================

  const handleMarkAsRead =
    async (id) => {
      try {
        await marcarComoLeida(
          id
        );
      } catch (error) {
        console.error(
          "[Layout] Error al marcar notificación como leída:",
          error
        );
      }
    };

  // ======================================================
  // MARCAR TODAS COMO LEÍDAS
  // ======================================================

  const handleMarkAllAsRead =
    async () => {
      try {
        await marcarTodasComoLeidas();
      } catch (error) {
        console.error(
          "[Layout] Error al marcar todas las notificaciones:",
          error
        );
      }
    };

  // ======================================================
  // ELIMINAR NOTIFICACIÓN
  // ======================================================

  const handleDeleteNotification =
    async (id) => {
      try {
        await eliminarNotificacion(
          id
        );
      } catch (error) {
        console.error(
          "[Layout] Error al eliminar notificación:",
          error
        );
      }
    };

  // ======================================================
  // VER TODAS
  // ======================================================

  const handleViewAllNotifications =
    () => {
      setIsNotifMenuOpen(
        false
      );

      setIsNotifModalOpen(
        true
      );
    };

  // ======================================================
  // RENDER
  // ======================================================

  if (validandoSesion) {
    return <div className="content-wrapper">Validando sesión...</div>;
  }

  if (!sesionValida) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      className={`layout-container ${
        !isSidebarOpen
          ? "sidebar-collapsed"
          : ""
      }`}
    >
      <Sidebar
        isOpen={
          isSidebarOpen
        }
      />

      <div className="main-area">
        <Navbar
          onToggleSidebar={
            toggleSidebar
          }

          userName={
            usuarioNavbar
          }

          groupName={
            grupoNavbar
          }

          ipAddress="192.168.0.5"

          notifications={
            notificaciones
          }

          unreadCount={
            cantidadNoLeidas
          }

          notificationsLoading={
            loadingNotificaciones
          }

          notifMenuOpen={
            isNotifMenuOpen
          }

          toggleNotificationMenu={
            toggleNotificationMenu
          }

          onMarkAsRead={
            handleMarkAsRead
          }

          onViewAllNotifications={
            handleViewAllNotifications
          }

          onCloseNotifMenu={
            closeNotifMenu
          }

          onRefreshNotifications={
            cargarNotificaciones
          }
        />

        <ModalNotificaciones
          isOpen={
            isNotifModalOpen
          }

          onClose={() =>
            setIsNotifModalOpen(
              false
            )
          }

          notifications={
            notificaciones
          }

          loading={
            loadingNotificaciones
          }

          saving={
            savingNotificaciones
          }

          error={
            errorNotificaciones
          }

          onMarkAsRead={
            handleMarkAsRead
          }

          onMarkAllAsRead={
            handleMarkAllAsRead
          }

          onDelete={
            handleDeleteNotification
          }
        />

        <main className="content-wrapper">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;