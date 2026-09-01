import React, {
  useMemo,
  useState,
} from "react";

import {
  FiEdit3,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiWifi,
} from "react-icons/fi";

import Card from "../components/Card";
import BotonReutilizable from "../components/BotonReutilizable";
import TablaReutilizable from "../components/TablaReutilizable";
import FiltroBusqueda from "../components/FiltroBusqueda";
import ModalReutilizable from "../components/ModalReutilizable";
import RegistroIP from "../components/RegistroIP";

import useIps from "../hooks/useIps";
import usePermisosUsuario from "../hooks/usePermisosUsuario";

import "../styles/DireccionesIP.css";

const normalizar = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const DireccionesIp = () => {
  const {
    loading: loadingPermisos,
    error: errorPermisos,
    tienePrivilegio,
  } = usePermisosUsuario();

  const puedeGestionar =
    !loadingPermisos &&
    tienePrivilegio(
      "Gestionar Direcciones IP"
    );

  const {
    ips,
    areas,
    loading,
    saving,
    error,
    refresh,
    crearIp,
    actualizarIp,
    eliminarIp,
    limpiarError,
  } = useIps(
    puedeGestionar,
    !loadingPermisos
  );

  const [searchQuery, setSearchQuery] =
    useState("");

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [
    registroEditar,
    setRegistroEditar,
  ] = useState(null);

  const [
    registroEliminar,
    setRegistroEliminar,
  ] = useState(null);

  const [
    isDeleteOpen,
    setIsDeleteOpen,
  ] = useState(false);

  const [mensaje, setMensaje] =
    useState("");

  const filasFiltradas = useMemo(() => {
    const termino =
      normalizar(searchQuery);

    if (!termino) {
      return ips;
    }

    return ips.filter((item) => {
      const texto = [
        item.area?.nombre_area,
        item.ip_areas,
        item.grupo,
        item.ip_rh
          ? "recursos humanos"
          : "",
      ]
        .map(normalizar)
        .join(" ");

      return texto.includes(termino);
    });
  }, [ips, searchQuery]);

  const abrirNuevo = () => {
    if (!puedeGestionar) {
      return;
    }

    limpiarError();
    setMensaje("");
    setRegistroEditar(null);
    setIsModalOpen(true);
  };

  const abrirEditar = (item) => {
    if (!puedeGestionar) {
      return;
    }

    limpiarError();
    setMensaje("");
    setRegistroEditar(item);
    setIsModalOpen(true);
  };

  const abrirEliminar = (item) => {
    if (!puedeGestionar) {
      return;
    }

    limpiarError();
    setMensaje("");
    setRegistroEliminar(item);
    setIsDeleteOpen(true);
  };

  const cerrarRegistro = () => {
    setIsModalOpen(false);
    setRegistroEditar(null);
  };

  const registrar = async (datos) => {
    await crearIp(datos);

    setMensaje(
      "La dirección IP se registró correctamente."
    );
  };

  const actualizar = async (
    id,
    datos
  ) => {
    await actualizarIp(id, datos);

    setMensaje(
      "La dirección IP se actualizó correctamente."
    );
  };

  const confirmarEliminar =
    async () => {
      if (
        !registroEliminar ||
        saving ||
        !puedeGestionar
      ) {
        return;
      }

      try {
        await eliminarIp(
          registroEliminar.id
        );

        setMensaje(
          "La dirección IP se eliminó correctamente."
        );

        setIsDeleteOpen(false);
        setRegistroEliminar(null);
      } catch {
        // El hook ya deja el error disponible.
      }
    };

  const columnas = [
    "Área",
    "Dirección IP",
    "Grupo",
    "Tipo",
    "Acciones",
  ];

  const renderRow = (row) => (
    <tr key={row.id}>
      <td>
        <div className="ip-area-cell">
          <strong>
            {row.area?.nombre_area ||
              "Sin área"}
          </strong>
        </div>
      </td>

      <td>
        <div className="ip-address-cell">
          <FiWifi />
          <span>
            {row.ip_areas ||
              "Sin dirección IP"}
          </span>
        </div>
      </td>

      <td>
        {row.grupo || "—"}
      </td>

      <td>
        <span
          className={
            row.ip_rh
              ? "ip-badge ip-badge-rh"
              : "ip-badge ip-badge-area"
          }
        >
          {row.ip_rh
            ? "Recursos Humanos"
            : "Área"}
        </span>
      </td>

      <td>
        <div className="actions-cell">
          <BotonReutilizable
            className="btn-action btn-icon edit"
            onClick={() =>
              abrirEditar(row)
            }
            title="Editar dirección IP"
            aria-label="Editar dirección IP"
          >
            <FiEdit3 />
          </BotonReutilizable>

          <BotonReutilizable
            className="btn-action btn-icon delete"
            onClick={() =>
              abrirEliminar(row)
            }
            title="Eliminar dirección IP"
            aria-label="Eliminar dirección IP"
          >
            <FiTrash2 />
          </BotonReutilizable>
        </div>
      </td>
    </tr>
  );

  const errorGeneral =
    error || errorPermisos;

  if (
    !loadingPermisos &&
    !puedeGestionar
  ) {
    return (
      <main className="content-area">
        <section className="content-section direcciones-ip-page">
          <div className="direcciones-ip-header">
            <div>
              <h2 className="card-title">
                Direcciones IP
              </h2>

              <p className="direcciones-ip-subtitle">
                Administra las direcciones IP asociadas a las áreas del sistema.
              </p>
            </div>
          </div>

          <div className="page-message page-message-error">
            No tiene permiso para gestionar las direcciones IP del sistema.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="content-area">
      <section className="content-section direcciones-ip-page">
        <div className="direcciones-ip-header">
          <div>
            <h2 className="card-title">
              Direcciones IP
            </h2>

            <p className="direcciones-ip-subtitle">
              Administra las direcciones IP asociadas a las áreas del sistema.
            </p>
          </div>

          {puedeGestionar && (
            <div className="direcciones-ip-header-actions">
              <BotonReutilizable
                className="btn-secondary-ip"
                onClick={() =>
                  refresh().catch(
                    () => {}
                  )
                }
                title="Actualizar"
              >
                <FiRefreshCw />
                Actualizar
              </BotonReutilizable>

              <BotonReutilizable
                className="btn-add-user"
                onClick={abrirNuevo}
              >
                <FiPlus />
                Agregar IP
              </BotonReutilizable>
            </div>
          )}
        </div>

        {mensaje && (
          <div className="page-message page-message-success">
            {mensaje}
          </div>
        )}

        {errorGeneral && (
          <div className="page-message page-message-error">
            {errorGeneral}
          </div>
        )}

        <FiltroBusqueda
          value={searchQuery}
          onChange={(event) =>
            setSearchQuery(
              event.target.value
            )
          }
          placeholder="Buscar por área, IP o grupo..."
        />

        <Card className="card-direcciones-ip">
          {loading ||
          loadingPermisos ? (
            <div className="ips-loading">
              Cargando direcciones IP...
            </div>
          ) : (
            <TablaReutilizable
              columns={columnas}
              data={filasFiltradas}
              renderRow={renderRow}
            />
          )}
        </Card>
      </section>

      {puedeGestionar && (
        <>
          <RegistroIP
            isOpen={isModalOpen}
            onClose={cerrarRegistro}
            onRegister={registrar}
            onUpdate={actualizar}
            areas={areas}
            registro={registroEditar}
            saving={saving}
          />

          <ModalReutilizable
            title="Eliminar dirección IP"
            isOpen={isDeleteOpen}
            onClose={() => {
              setIsDeleteOpen(false);
              setRegistroEliminar(
                null
              );
            }}
            onAccept={
              confirmarEliminar
            }
            acceptButtonText={
              saving
                ? "Eliminando..."
                : "Eliminar"
            }
          >
            <div className="ip-delete-content">
              <p>
                ¿Desea eliminar la dirección IP{" "}
                <strong>
                  {registroEliminar
                    ?.ip_areas || ""}
                </strong>
                ?
              </p>

              <p className="ip-delete-warning">
                Esta acción elimina únicamente el registro de configuración de IP.
                No elimina el área relacionada.
              </p>
            </div>
          </ModalReutilizable>
        </>
      )}
    </main>
  );
};

export default DireccionesIp;