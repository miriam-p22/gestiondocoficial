import React, {
  useMemo,
  useState,
} from "react";

import {
  FiEdit3,
  FiLayers,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

import { useAreas } from "../hooks/useAreas";
import usePermisosUsuario from "../hooks/usePermisosUsuario";

import BotonReutilizable from "../components/BotonReutilizable";
import FiltroBusqueda from "../components/FiltroBusqueda";
import ModalReutilizable from "../components/ModalReutilizable";
import CampoFormulario from "../components/CampoFormulario";
import TablaReutilizable from "../components/TablaReutilizable";
import Card from "../components/Card";

import "../styles/AreasPage.css";

const AreasPage = () => {
  const {
    areas,
    loading,
    saving,
    error,
    crearArea,
    actualizarArea,
    eliminarArea,
    obtenerUsoArea,
    limpiarError,
  } = useAreas();

  const {
    loading: loadingPermisos,
    error: errorPermisos,
    tienePrivilegio,
  } = usePermisosUsuario();

  const puedeGestionar =
    !loadingPermisos &&
    tienePrivilegio(
      "Gestionar Áreas"
    );

  const [searchTerm, setSearchTerm] =
    useState("");

  const [
    isModalCrearOpen,
    setIsModalCrearOpen,
  ] = useState(false);

  const [
    isModalEditarOpen,
    setIsModalEditarOpen,
  ] = useState(false);

  const [
    isModalEliminarOpen,
    setIsModalEliminarOpen,
  ] = useState(false);

  const [nombreArea, setNombreArea] =
    useState("");

  const [
    areaSeleccionada,
    setAreaSeleccionada,
  ] = useState(null);

  const [
    errorFormulario,
    setErrorFormulario,
  ] = useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [usoArea, setUsoArea] =
    useState(null);

  const columns = puedeGestionar
    ? [
        "ID",
        "Área",
        "Acciones",
      ]
    : [
        "ID",
        "Área",
      ];

  const areasFiltradas = useMemo(() => {
    const termino =
      searchTerm
        .trim()
        .toLowerCase();

    if (!termino) {
      return areas;
    }

    return areas.filter(
      (area) =>
        String(
          area.nombre_area ||
            ""
        )
          .toLowerCase()
          .includes(
            termino
          )
    );
  }, [
    areas,
    searchTerm,
  ]);

  const abrirCrear = () => {
    if (!puedeGestionar) {
      return;
    }

    limpiarError();
    setNombreArea("");
    setErrorFormulario("");
    setMensaje("");
    setIsModalCrearOpen(true);
  };

  const cerrarCrear = () => {
    if (saving) {
      return;
    }

    setIsModalCrearOpen(false);
    setNombreArea("");
    setErrorFormulario("");
  };

  const handleCrear = async () => {
    setErrorFormulario("");

    try {
      const nombre =
        nombreArea.trim();

      if (!nombre) {
        throw new Error(
          "El nombre del área es obligatorio."
        );
      }

      await crearArea(nombre);

      setIsModalCrearOpen(false);
      setNombreArea("");

      setMensaje(
        "Área agregada correctamente."
      );
    } catch (err) {
      setErrorFormulario(
        err?.message ||
          "No fue posible crear el área."
      );
    }
  };

  const abrirEditar = (area) => {
    if (!puedeGestionar) {
      return;
    }

    limpiarError();

    setAreaSeleccionada(area);
    setNombreArea(
      area.nombre_area
    );

    setErrorFormulario("");
    setMensaje("");
    setIsModalEditarOpen(true);
  };

  const cerrarEditar = () => {
    if (saving) {
      return;
    }

    setIsModalEditarOpen(false);
    setAreaSeleccionada(null);
    setNombreArea("");
    setErrorFormulario("");
  };

  const handleEditar = async () => {
    if (!areaSeleccionada) {
      return;
    }

    setErrorFormulario("");

    try {
      const nombre =
        nombreArea.trim();

      if (!nombre) {
        throw new Error(
          "El nombre del área es obligatorio."
        );
      }

      await actualizarArea(
        areaSeleccionada.id,
        nombre
      );

      setIsModalEditarOpen(false);
      setAreaSeleccionada(null);
      setNombreArea("");

      setMensaje(
        "Área actualizada correctamente."
      );
    } catch (err) {
      setErrorFormulario(
        err?.message ||
          "No fue posible actualizar el área."
      );
    }
  };

  const abrirEliminar = async (
    area
  ) => {
    if (!puedeGestionar) {
      return;
    }

    limpiarError();

    setMensaje("");
    setErrorFormulario("");
    setAreaSeleccionada(area);
    setUsoArea(null);
    setIsModalEliminarOpen(true);

    try {
      const uso =
        await obtenerUsoArea(
          area.id
        );

      setUsoArea(uso);
    } catch (err) {
      setErrorFormulario(
        err?.message ||
          "No fue posible consultar el uso del área."
      );
    }
  };

  const cerrarEliminar = () => {
    if (saving) {
      return;
    }

    setIsModalEliminarOpen(false);
    setAreaSeleccionada(null);
    setUsoArea(null);
    setErrorFormulario("");
  };

  const handleEliminar = async () => {
    if (!areaSeleccionada) {
      return;
    }

    setErrorFormulario("");

    try {
      await eliminarArea(
        areaSeleccionada.id
      );

      setIsModalEliminarOpen(false);
      setAreaSeleccionada(null);
      setUsoArea(null);

      setMensaje(
        "Área eliminada correctamente."
      );
    } catch (err) {
      setErrorFormulario(
        err?.message ||
          "No fue posible eliminar el área."
      );
    }
  };

  const tableData =
    areasFiltradas.map(
      (area) => ({
        _id: area.id,

        ID: {
          main: area.id,
        },

        Área: {
          main: (
            <div className="area-name-cell">
              <FiLayers />
              <span>
                {area.nombre_area}
              </span>
            </div>
          ),
        },

        ...(puedeGestionar
          ? {
              Acciones: {
                main: (
                  <div className="actions-cell areas-actions">
                    <BotonReutilizable
                      className="btn-action btn-icon edit"
                      onClick={() =>
                        abrirEditar(area)
                      }
                      title="Editar área"
                      aria-label="Editar área"
                    >
                      <FiEdit3 />
                    </BotonReutilizable>

                    <BotonReutilizable
                      className="btn-action btn-icon delete"
                      onClick={() =>
                        abrirEliminar(area)
                      }
                      title="Eliminar área"
                      aria-label="Eliminar área"
                    >
                      <FiTrash2 />
                    </BotonReutilizable>
                  </div>
                ),
              },
            }
          : {}),
      })
    );

  const errorGeneral =
    error ||
    errorPermisos;

  return (
    <main className="content-area">
      <section className="content-section areas-page">

        <div className="areas-header">
          <div>
            <h2 className="card-title">
              Gestión de Áreas
            </h2>

            <p className="areas-subtitle">
              Catálogo institucional de áreas utilizado por usuarios,
              documentos, organigramas y direcciones IP.
            </p>
          </div>

          {puedeGestionar && (
            <BotonReutilizable
              onClick={abrirCrear}
              className="btn-add-user areas-add-button"
            >
              <FiPlus />
              Agregar Área
            </BotonReutilizable>
          )}
        </div>

        <div className="areas-permission-info">
          <FiLayers />

          <div>
            <strong>
              {puedeGestionar
                ? "Gestión habilitada"
                : "Consulta de áreas"}
            </strong>

            <span>
              {puedeGestionar
                ? "Su rol puede registrar, editar y eliminar áreas disponibles."
                : "Su rol puede consultar el catálogo, pero no modificarlo."}
            </span>
          </div>
        </div>

        {(mensaje || errorGeneral) && (
          <div
            className={
              errorGeneral
                ? "page-message page-message-error"
                : "page-message page-message-success"
            }
          >
            {errorGeneral || mensaje}
          </div>
        )}

        <div className="areas-search-wrapper">
          <FiltroBusqueda
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            placeholder="Buscar área..."
          />
        </div>

        <Card className="areas-table-card">
          {loading || loadingPermisos ? (
            <div className="areas-loading">
              Cargando áreas...
            </div>
          ) : areasFiltradas.length === 0 ? (
            <div className="areas-empty">
              No se encontraron áreas.
            </div>
          ) : (
            <TablaReutilizable
              columns={columns}
              data={tableData}
              renderRow={(row) => (
                <tr key={row._id}>
                  {columns.map(
                    (column) => (
                      <td key={column}>
                        {row[column]
                          ?.main ??
                          ""}
                      </td>
                    )
                  )}
                </tr>
              )}
            />
          )}
        </Card>

      </section>

      <ModalReutilizable
        id="modalCrearArea"
        title="Agregar Área"
        isOpen={isModalCrearOpen}
        onClose={cerrarCrear}
        onAccept={handleCrear}
        acceptButtonText="Guardar"
        loading={saving}
        errorMessage={errorFormulario}
      >
        <CampoFormulario
          label="Nombre del área"
          name="nombre_area"
          value={nombreArea}
          onChange={(event) => {
            setNombreArea(
              event.target.value
            );

            setErrorFormulario("");
          }}
          placeholder="Ej. Dirección de Desarrollo Social"
          required
        />
      </ModalReutilizable>

      <ModalReutilizable
        id="modalEditarArea"
        title="Editar Área"
        isOpen={isModalEditarOpen}
        onClose={cerrarEditar}
        onAccept={handleEditar}
        acceptButtonText="Guardar cambios"
        loading={saving}
        errorMessage={errorFormulario}
      >
        <CampoFormulario
          label="Nombre del área"
          name="nombre_area"
          value={nombreArea}
          onChange={(event) => {
            setNombreArea(
              event.target.value
            );

            setErrorFormulario("");
          }}
          required
        />
      </ModalReutilizable>

      <ModalReutilizable
        id="modalEliminarArea"
        title="Eliminar Área"
        isOpen={isModalEliminarOpen}
        onClose={cerrarEliminar}
        onAccept={handleEliminar}
        acceptButtonText="Eliminar"
        loading={saving}
        errorMessage={errorFormulario}
      >
        {areaSeleccionada && (
          <>
            <p>
              ¿Desea eliminar el área{" "}
              <strong>
                {areaSeleccionada.nombre_area}
              </strong>
              ?
            </p>

            {usoArea && (
              <div className="area-uso-info">
                <div className="area-uso-grid">
                  <div>
                    <span>Usuarios</span>
                    <strong>
                      {usoArea.usuarios}
                    </strong>
                  </div>

                  <div>
                    <span>Documentos</span>
                    <strong>
                      {usoArea.documentos}
                    </strong>
                  </div>

                  <div>
                    <span>Organigramas</span>
                    <strong>
                      {usoArea.niveles}
                    </strong>
                  </div>

                  <div>
                    <span>Direcciones IP</span>
                    <strong>
                      {usoArea.ips}
                    </strong>
                  </div>
                </div>

                {usoArea.en_uso && (
                  <div className="area-en-uso-warning">
                    Esta área está siendo utilizada y no podrá eliminarse
                    hasta reasignar sus relaciones.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </ModalReutilizable>

    </main>
  );
};

export default AreasPage;