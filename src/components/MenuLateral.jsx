import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import usePermisosUsuario from "../hooks/usePermisosUsuario";
import "../styles/MenuLateral.css";
import IconoLogo from "../assets/logo.png";
import IconoUsuarios from "../assets/usuarios.png";
import IconoDashboard from "../assets/dashboard.png";
import IconoDocumentos from "../assets/documentos.png";
import IconoOrganigrama from "../assets/organigrama.png";
import IconoDispersion from "../assets/enviodocumentos.png";
import IconoLeyArchivo from "../assets/leyarchivo.png";
import IconoConfiguracion from "../assets/configuracion.png";
import IconoCerrarSesion from "../assets/cerrarsesion.png";

function Sidebar({ isOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname.toLowerCase();

  const {
    loading: loadingPermisos,

    tienePrivilegio,
  } = usePermisosUsuario();

  const [configOpen, setConfigOpen] = useState(false);

  //CERRAR SUBMENÚ CUANDO SE COLAPSA
  useEffect(() => {
    if (!isOpen) {
      setConfigOpen(false);
    }
  }, [isOpen]);

  //ABRIR CONFIGURACIÓN SI YA ESTAMOS DENTRO
  useEffect(() => {
    if (isOpen && (pathname.startsWith("/config") || pathname === "/areas")) {
      setConfigOpen(true);
    }
  }, [isOpen, pathname]);

  //PRIVILEGIOS
  const puedeUsuarios = tienePrivilegio("Registrar usuarios");
  const puedeGestionarAreas = tienePrivilegio("Gestionar Áreas");
  const puedeGestionarIps = tienePrivilegio("Gestionar Direcciones IP");
  const puedeGestionarDispersion = tienePrivilegio("Gestionar Dispersión");
  const puedeGestionarArchivo = tienePrivilegio("Gestionar Archivo Físico");
  const puedeConsultarArchivoGlobal = tienePrivilegio(
    "Consultar Archivo Físico Global",
  );
  const puedeGestionarNotificaciones = tienePrivilegio(
    "Gestionar Notificaciones",
  );
  const puedeGestionarConfiguracion = tienePrivilegio(
    "Gestionar Configuración del Sistema",
  );

  const puedeLeyArchivo = puedeGestionarArchivo || puedeConsultarArchivoGlobal;
  const puedeVerNotificacionesSistema =
    puedeGestionarNotificaciones || puedeGestionarConfiguracion;
  const puedeVerConfiguracion =
    puedeGestionarAreas || puedeGestionarIps || puedeVerNotificacionesSistema;

  //CERRAR SESIÓN REAL
  const cerrarSesion = () => {
    [
      "token",
      "id_usuario",
      "id_area",
      "id_rol",
      "nombre_usuario",
      "nombre_completo",
      "nombre_area",
      "nombre_rol",
      "mantener_sesion",
    ].forEach((clave) => {
      localStorage.removeItem(clave);
    });

    setConfigOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <nav
      className={`sidebar sidebar-off-canvas ${!isOpen ? "collapsed" : ""}`}
      id="sidebar"
    >
      <ul className="nav">
        {/* LOGO */}

        <li className="nav-item nav-category tlahuapan-item">
          <div className="tlahuapan-logo-text">
            <img src={IconoLogo} alt="Logo" className="tlahuapan-logo" />

            {isOpen && <span className="tlahuapan-text">TLAHUAPAN</span>}
          </div>
        </li>

        <li className={`nav-item ${pathname === "/dashboard" ? "active" : ""}`}>
          <Link className="nav-link" to="/dashboard">
            <span className="icon-bg">
              <img
                src={IconoDashboard}
                className="sidebar-icon-img"
                alt="Inicio"
              />
            </span>

            {isOpen && <span className="menu-title">Inicio</span>}
          </Link>
        </li>

        <li
          className={`nav-item ${pathname === "/documentos" ? "active" : ""}`}
        >
          <Link className="nav-link" to="/documentos">
            <span className="icon-bg">
              <img
                src={IconoDocumentos}
                className="sidebar-icon-img"
                alt="Documentos"
              />
            </span>

            {isOpen && <span className="menu-title">Documentos</span>}
          </Link>
        </li>

        <li
          className={`nav-item ${pathname === "/organigrama" ? "active" : ""}`}
        >
          <Link className="nav-link" to="/organigrama">
            <span className="icon-bg">
              <img
                src={IconoOrganigrama}
                className="sidebar-icon-img"
                alt="Organigrama"
              />
            </span>

            {isOpen && <span className="menu-title">Organigrama</span>}
          </Link>
        </li>

        {!loadingPermisos && puedeUsuarios && (
          <li
            className={`nav-item ${pathname === "/usuarios" ? "active" : ""}`}
          >
            <Link className="nav-link" to="/usuarios">
              <span className="icon-bg">
                <img
                  src={IconoUsuarios}
                  className="sidebar-icon-img"
                  alt="Usuarios"
                />
              </span>

              {isOpen && <span className="menu-title">Usuarios</span>}
            </Link>
          </li>
        )}

        {!loadingPermisos && puedeGestionarDispersion && (
          <li
            className={`nav-item ${pathname === "/dispersion" ? "active" : ""}`}
          >
            <Link className="nav-link" to="/dispersion">
              <span className="icon-bg">
                <img
                  src={IconoDispersion}
                  className="sidebar-icon-img"
                  alt="Dispersión"
                />
              </span>

              {isOpen && <span className="menu-title">Dispersión</span>}
            </Link>
          </li>
        )}

        {!loadingPermisos && puedeLeyArchivo && (
          <li
            className={`nav-item ${pathname === "/leyarchivo" ? "active" : ""}`}
          >
            <Link className="nav-link" to="/leyarchivo">
              <span className="icon-bg">
                <img
                  src={IconoLeyArchivo}
                  className="sidebar-icon-img"
                  alt="Ley de Archivo"
                />
              </span>

              {isOpen && <span className="menu-title">Ley de Archivo</span>}
            </Link>
          </li>
        )}

        {!loadingPermisos && puedeVerConfiguracion && (
          <li
            className={`nav-item ${
              pathname.startsWith("/config") || pathname === "/areas"
                ? "active"
                : ""
            }`}
          >
            <div
              className="nav-link submenu-toggle"
              onClick={() => setConfigOpen((actual) => !actual)}
              style={{
                cursor: "pointer",
              }}
            >
              <span className="icon-bg">
                <img
                  src={IconoConfiguracion}
                  className="sidebar-icon-img"
                  alt="Configuración"
                />
              </span>

              {isOpen && <span className="menu-title">Configuración</span>}
            </div>

            {configOpen && isOpen && (
              <ul className="submenu">
                {puedeGestionarAreas && (
                  <li
                    className={`submenu-item ${
                      pathname === "/areas" ? "active" : ""
                    }`}
                  >
                    <Link className="nav-link" to="/Areas">
                      Gestión de Áreas
                    </Link>
                  </li>
                )}

                {puedeGestionarIps && (
                  <li
                    className={`submenu-item ${
                      pathname === "/config/direcciones-ip" ? "active" : ""
                    }`}
                  >
                    <Link className="nav-link" to="/config/direcciones-ip">
                      Direcciones IP
                    </Link>
                  </li>
                )}

                {puedeVerNotificacionesSistema && (
                  <li
                    className={`submenu-item ${
                      pathname === "/config/notificacion-conexion"
                        ? "active"
                        : ""
                    }`}
                  >
                    <Link
                      className="nav-link"
                      to="/config/notificacion-conexion"
                    >
                      Notificaciones y sistema
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </li>
        )}

        <li className={`nav-item ${pathname === "/login" ? "active" : ""}`}>
          <div
            className="nav-link"
            onClick={cerrarSesion}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                cerrarSesion();
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <span className="icon-bg">
              <img
                src={IconoCerrarSesion}
                className="sidebar-icon-img"
                alt="Cerrar Sesión"
              />
            </span>

            {isOpen && <span className="menu-title">Cerrar Sesión</span>}
          </div>
        </li>
      </ul>
    </nav>
  );
}

export default Sidebar;
