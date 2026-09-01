import React, {
  useMemo,
  useState,
} from "react";

import { createPortal } from "react-dom";

import "../styles/Usuarios.css";

import BotonReutilizable from "../components/BotonReutilizable";
import EtiquetaEstado from "../components/EtiquetaEstado";
import FiltroBusqueda from "../components/FiltroBusqueda";
import FormularioUsuario from "../components/FormularioUsuario";
import FormularioPrivilegios from "../components/FormularioPrivilegios";
import ModalReutilizable from "../components/ModalReutilizable";
import TablaReutilizable from "../components/TablaReutilizable";

import {
  FiEdit2,
  FiRefreshCw,
  FiTrash2,
} from "react-icons/fi";

import { useUsuarios } from "../hooks/useUsuarios";
import { usePrivilegios } from "../hooks/usePrivilegios";
import usePermisosUsuario from "../hooks/usePermisosUsuario";

const formularioInicial = {
  nombre_completo: "",
  numero_trab: "",
  correo_electronico: "",
  nombre_usuario: "",
  contrasenia: "",
  id_rol: "",
  id_area: "",
  status: true,
};

const normalizarFormulario = (usuario) => ({
  id: usuario.id,

  nombre_completo:
    usuario.nombre_completo || "",

  numero_trab:
    usuario.numero_trab ?? "",

  correo_electronico:
    usuario.correo_electronico || "",

  nombre_usuario:
    usuario.nombre_usuario || "",

  contrasenia: "",

  id_rol:
    usuario.id_rol || "",

  id_area:
    usuario.id_area || "",

  status:
    usuario.status ?? true,
});

const prepararDatosApi = (
  formulario,
  isEdit = false
) => {
  const datos = {
    nombre_completo:
      formulario.nombre_completo.trim(),

    numero_trab:
      formulario.numero_trab === ""
        ? null
        : Number(formulario.numero_trab),

    correo_electronico:
      formulario.correo_electronico.trim() ||
      null,

    nombre_usuario:
      formulario.nombre_usuario.trim(),

    id_rol:
      Number(formulario.id_rol),

    id_area:
      Number(formulario.id_area),

    status:
      formulario.status === true ||
      formulario.status === "true",
  };

  if (
    !isEdit ||
    String(
      formulario.contrasenia || ""
    ).trim() !== ""
  ) {
    datos.contrasenia =
      String(formulario.contrasenia);
  }

  return datos;
};

const Usuarios = () => {
  const {
    usuarios,
    roles,
    areas,

    loading,
    saving,
    error,

    crearUsuario,
    actualizarUsuario,
    cambiarEstadoUsuario,
    eliminarUsuario,

    limpiarError,
  } = useUsuarios();

  const {
    privilegios,

    loadingPrivilegios,
    savingPrivilegios,
    errorPrivilegios,

    cargarPrivilegiosDelRol,
    guardarPermisosRol,
    limpiarErrorPrivilegios,
  } = usePrivilegios();

  const {
    loading: loadingPermisos,
    tienePrivilegio,
  } = usePermisosUsuario();

  const puedeGestionarRoles =
    !loadingPermisos &&
    tienePrivilegio(
      "Gestionar Roles y Privilegios"
    );

  // ==============================================
  // ESTADOS GENERALES
  // ==============================================

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedUserId, setSelectedUserId] =
    useState(null);

  const [mensaje, setMensaje] =
    useState("");

  const [
    estadoMenu,
    setEstadoMenu,
  ] = useState(null);

  // ==============================================
  // MODAL AGREGAR
  // ==============================================

  const [
    isModalAddOpen,
    setIsModalAddOpen,
  ] = useState(false);

  const [
    errorFormulario,
    setErrorFormulario,
  ] = useState("");

  // ==============================================
  // MODAL EDITAR
  // ==============================================

  const [
    isModalEditOpen,
    setIsModalEditOpen,
  ] = useState(false);

  const [
    errorEdicion,
    setErrorEdicion,
  ] = useState("");

  // ==============================================
  // MODAL PRIVILEGIOS
  // ==============================================

  const [
    isModalPrivilegiosOpen,
    setIsModalPrivilegiosOpen,
  ] = useState(false);

  const [
    privilegiosSeleccionados,
    setPrivilegiosSeleccionados,
  ] = useState([]);

  const [
    usuarioPrivilegios,
    setUsuarioPrivilegios,
  ] = useState(null);

  const [
    errorModalPrivilegios,
    setErrorModalPrivilegios,
  ] = useState("");

  // ==============================================
  // FORMULARIO
  // ==============================================

  const [
    currentUser,
    setCurrentUser,
  ] = useState(formularioInicial);

  // ==============================================
  // COLUMNAS
  // ==============================================

  const columns = [
    "Usuario",
    "Num. Trabajador",
    "Adscripción",
    "Rol",
    "Estatus",
    "Acciones",
  ];

  // ==============================================
  // USUARIO SELECCIONADO
  // ==============================================

  const usuarioSeleccionado = useMemo(
    () =>
      usuarios.find(
        (usuario) =>
          usuario.id === selectedUserId
      ) || null,
    [usuarios, selectedUserId]
  );

  // ==============================================
  // FILTRO
  // ==============================================

  const usuariosFiltrados = useMemo(() => {
    const termino = searchTerm
      .trim()
      .toLowerCase();

    if (!termino) {
      return usuarios;
    }

    return usuarios.filter((usuario) => {
      const texto = [
        usuario.nombre_completo,
        usuario.nombre_usuario,
        usuario.correo_electronico,
        usuario.area?.nombre_area,
        usuario.rol?.nombre_rol,
        usuario.numero_trab,
        usuario.status
          ? "activo"
          : "inactivo",
      ]
        .filter(
          (valor) =>
            valor !== null &&
            valor !== undefined
        )
        .join(" ")
        .toLowerCase();

      return texto.includes(termino);
    });
  }, [usuarios, searchTerm]);

  // ==============================================
  // AGREGAR
  // ==============================================

  const abrirAgregar = () => {
    limpiarError();

    setMensaje("");
    setErrorFormulario("");

    setCurrentUser({
      ...formularioInicial,

      id_rol:
        roles.length > 0
          ? roles[0].id
          : "",

      id_area:
        areas.length > 0
          ? areas[0].id
          : "",
    });

    setIsModalAddOpen(true);
  };

  const cerrarAgregar = () => {
    setIsModalAddOpen(false);

    setCurrentUser(
      formularioInicial
    );

    setErrorFormulario("");

    limpiarError();
  };

  // ==============================================
  // EDITAR
  // ==============================================

  const abrirEditar = (usuario) => {
    limpiarError();

    setMensaje("");
    setErrorEdicion("");

    setCurrentUser(
      normalizarFormulario(usuario)
    );

    setIsModalEditOpen(true);
  };

  const cerrarEditar = () => {
    setIsModalEditOpen(false);

    setCurrentUser(
      formularioInicial
    );

    setErrorEdicion("");

    limpiarError();
  };

  // ==============================================
  // INPUT
  // ==============================================

  const handleUserInputChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    if (isModalAddOpen) {
      setErrorFormulario("");
    }

    if (isModalEditOpen) {
      setErrorEdicion("");
    }

    setCurrentUser((actual) => ({
      ...actual,
      [name]: value,
    }));
  };

  // ==============================================
  // VALIDACIÓN
  // ==============================================

  const validarFormulario = (
    isEdit = false
  ) => {
    if (
      !String(
        currentUser.nombre_completo || ""
      ).trim()
    ) {
      throw new Error(
        "El nombre completo es obligatorio."
      );
    }

    if (
      !String(
        currentUser.nombre_usuario || ""
      ).trim()
    ) {
      throw new Error(
        "El nombre de usuario es obligatorio."
      );
    }

    if (
      !isEdit &&
      !String(
        currentUser.contrasenia || ""
      ).trim()
    ) {
      throw new Error(
        "La contraseña es obligatoria."
      );
    }

    if (!currentUser.id_area) {
      throw new Error(
        "Debe seleccionar un área."
      );
    }

    if (!currentUser.id_rol) {
      throw new Error(
        "Debe seleccionar un rol."
      );
    }
  };

  // ==============================================
  // CREAR USUARIO
  // ==============================================

  const handleAddUser = async () => {
    setErrorFormulario("");
    setMensaje("");

    try {
      validarFormulario(false);

      const datos =
        prepararDatosApi(
          currentUser,
          false
        );

      const nuevoUsuario =
        await crearUsuario(datos);

      setSelectedUserId(
        nuevoUsuario.id
      );

      setIsModalAddOpen(false);

      setCurrentUser(
        formularioInicial
      );

      setMensaje(
        "Usuario agregado correctamente."
      );
    } catch (errorCreacion) {
      setErrorFormulario(
        errorCreacion?.message ||
          "No fue posible crear el usuario."
      );
    }
  };

  // ==============================================
  // EDITAR USUARIO
  // ==============================================

  const handleEditUser = async () => {
    setErrorEdicion("");
    setMensaje("");

    try {
      validarFormulario(true);

      const datos =
        prepararDatosApi(
          currentUser,
          true
        );

      await actualizarUsuario(
        currentUser.id,
        datos
      );

      setIsModalEditOpen(false);

      setCurrentUser(
        formularioInicial
      );

      setMensaje(
        "Usuario actualizado correctamente."
      );
    } catch (errorActualizacion) {
      setErrorEdicion(
        errorActualizacion?.message ||
          "No fue posible actualizar el usuario."
      );
    }
  };

  // ==============================================
  // MENÚ DE ESTADO
  // ==============================================

  const toggleMenuEstado = (
    event,
    usuario
  ) => {
    event.stopPropagation();

    if (
      estadoMenu?.id ===
      usuario.id
    ) {
      setEstadoMenu(null);
      return;
    }

    const rect =
      event.currentTarget.getBoundingClientRect();

    const anchoMenu = 145;
    const margen = 8;

    let left =
      rect.right -
      anchoMenu;

    if (
      left <
      margen
    ) {
      left =
        margen;
    }

    if (
      left +
        anchoMenu >
      window.innerWidth -
        margen
    ) {
      left =
        window.innerWidth -
        anchoMenu -
        margen;
    }

    setEstadoMenu({
      id:
        usuario.id,
      usuario,
      top:
        rect.bottom +
        6,
      left,
    });
  };

  // ==============================================
  // ESTADO USUARIO
  // ==============================================

  const handleStatusChange = async (
    usuario,
    nuevoEstado
  ) => {
    setEstadoMenu(null);
    setMensaje("");

    try {
      await cambiarEstadoUsuario(
        usuario.id,
        nuevoEstado
      );

      setMensaje(
        nuevoEstado
          ? "Usuario activado correctamente."
          : "Usuario desactivado correctamente."
      );
    } catch (errorEstado) {
      setMensaje(
        errorEstado?.message ||
          "No fue posible cambiar el estado."
      );
    }
  };

  // ==============================================
  // ELIMINAR USUARIO
  // ==============================================

  const handleDeleteUser = async (
    usuario
  ) => {
    const confirmado = window.confirm(
      `¿Desea eliminar al usuario "${usuario.nombre_completo}"?`
    );

    if (!confirmado) {
      return;
    }

    setMensaje("");

    try {
      await eliminarUsuario(
        usuario.id
      );

      if (
        selectedUserId === usuario.id
      ) {
        setSelectedUserId(null);
      }

      setMensaje(
        "Usuario eliminado correctamente."
      );
    } catch (errorEliminacion) {
      setMensaje(
        errorEliminacion?.message ||
          "No fue posible eliminar el usuario."
      );
    }
  };

  // ==============================================
  // PRIVILEGIOS
  // ==============================================

  const abrirPrivilegios = async () => {
    setMensaje("");
    setErrorModalPrivilegios("");
    limpiarErrorPrivilegios();

    if (!puedeGestionarRoles) {
      setMensaje(
        "No tiene permiso para gestionar roles y privilegios."
      );

      return;
    }

    if (!usuarioSeleccionado) {
      setMensaje(
        "Seleccione un usuario de la tabla antes de otorgar privilegios."
      );

      return;
    }

    if (!usuarioSeleccionado.id_rol) {
      setMensaje(
        "El usuario seleccionado no tiene un rol válido."
      );

      return;
    }

    setUsuarioPrivilegios(
      usuarioSeleccionado
    );

    setPrivilegiosSeleccionados([]);

    setIsModalPrivilegiosOpen(true);

    try {
      const resultado =
        await cargarPrivilegiosDelRol(
          usuarioSeleccionado.id_rol
        );

      const idsAsignados =
        resultado.permisos.map(
          (permiso) =>
            permiso.id_privilegio
        );

      setPrivilegiosSeleccionados(
        idsAsignados
      );
    } catch (errorCarga) {
      setErrorModalPrivilegios(
        errorCarga?.message ||
          "No fue posible cargar los privilegios."
      );
    }
  };

  const cerrarPrivilegios = () => {
    if (savingPrivilegios) {
      return;
    }

    setIsModalPrivilegiosOpen(false);

    setUsuarioPrivilegios(null);

    setPrivilegiosSeleccionados([]);

    setErrorModalPrivilegios("");

    limpiarErrorPrivilegios();
  };

  const togglePrivilegio = (
    idPrivilegio
  ) => {
    setErrorModalPrivilegios("");

    setPrivilegiosSeleccionados(
      (actuales) => {
        if (
          actuales.includes(
            idPrivilegio
          )
        ) {
          return actuales.filter(
            (id) =>
              id !== idPrivilegio
          );
        }

        return [
          ...actuales,
          idPrivilegio,
        ];
      }
    );
  };

  const handleGuardarPrivilegios =
    async () => {
      if (!puedeGestionarRoles) {
        setErrorModalPrivilegios(
          "No tiene permiso para gestionar roles y privilegios."
        );

        return;
      }

      if (!usuarioPrivilegios) {
        setErrorModalPrivilegios(
          "No existe un usuario seleccionado."
        );

        return;
      }

      setErrorModalPrivilegios("");

      try {
        await guardarPermisosRol(
          usuarioPrivilegios.id_rol,
          privilegiosSeleccionados
        );

        setIsModalPrivilegiosOpen(false);

        const nombreRol =
          usuarioPrivilegios.rol
            ?.nombre_rol ||
          "seleccionado";

        setUsuarioPrivilegios(null);

        setPrivilegiosSeleccionados([]);

        setMensaje(
          `Privilegios del rol "${nombreRol}" actualizados correctamente.`
        );
      } catch (errorGuardado) {
        setErrorModalPrivilegios(
          errorGuardado?.message ||
            "No fue posible guardar los privilegios."
        );
      }
    };


  // ==============================================
  // TABLA
  // ==============================================

  const tableData =
    usuariosFiltrados.map(
      (usuario) => {
        const estatus =
          usuario.status
            ? "Activo"
            : "Inactivo";

        return {
          _id: usuario.id,

          Usuario: {
            main: (
              <div className="usuario-identidad">
                <strong
                  className="usuario-identidad-nombre"
                  title={
                    usuario.nombre_completo ||
                    ""
                  }
                >
                  {usuario.nombre_completo ||
                    "—"}
                </strong>

                <span
                  className="usuario-identidad-username"
                  title={
                    usuario.nombre_usuario ||
                    ""
                  }
                >
                  @
                  {usuario.nombre_usuario ||
                    "sin_usuario"}
                </span>

                <span
                  className="usuario-identidad-correo"
                  title={
                    usuario.correo_electronico ||
                    "Sin correo electrónico"
                  }
                >
                  {usuario.correo_electronico ||
                    "Sin correo electrónico"}
                </span>
              </div>
            ),
          },

          "Num. Trabajador": {
            main:
              usuario.numero_trab ??
              "—",
          },

          Adscripción: {
            main: (
              <span
                className="usuario-texto-ajustable"
                title={
                  usuario.area
                    ?.nombre_area ||
                  "Sin área"
                }
              >
                {usuario.area
                  ?.nombre_area ||
                  "Sin área"}
              </span>
            ),
          },

          Rol: {
            main: (
              <span
                className="usuario-texto-ajustable"
                title={
                  usuario.rol
                    ?.nombre_rol ||
                  "Sin rol"
                }
              >
                {usuario.rol
                  ?.nombre_rol ||
                  "Sin rol"}
              </span>
            ),
          },

          Estatus: {
            main: (
              <EtiquetaEstado
                estatus={estatus}
              />
            ),
          },

          Acciones: {
            main: (
              <div className="usuarios-actions-cell">
                <button
                  type="button"
                  className="usuario-icon-action usuario-icon-edit"
                  title="Editar usuario"
                  aria-label={`Editar a ${usuario.nombre_completo}`}
                  onClick={(event) => {
                    event.stopPropagation();

                    abrirEditar(
                      usuario
                    );
                  }}
                >
                  <FiEdit2 />
                </button>

                <button
                  type="button"
                  className="usuario-icon-action usuario-icon-status"
                  title="Cambiar estado"
                  aria-label={`Cambiar estado de ${usuario.nombre_completo}`}
                  aria-expanded={
                    estadoMenu?.id ===
                    usuario.id
                  }
                  onClick={(event) =>
                    toggleMenuEstado(
                      event,
                      usuario
                    )
                  }
                >
                  <FiRefreshCw />
                </button>

                <button
                  type="button"
                  className="usuario-icon-action usuario-icon-delete"
                  title="Eliminar usuario"
                  aria-label={`Eliminar a ${usuario.nombre_completo}`}
                  onClick={(event) => {
                    event.stopPropagation();

                    handleDeleteUser(
                      usuario
                    );
                  }}
                >
                  <FiTrash2 />
                </button>
              </div>
            ),
          },
        };
      }
    );

  return (
    <div className="main-content-wrapper">
      <main className="content-area">
        <section className="content-section">
          <div className="table-container">
            <h2 className="card-title">
              Gestión de Usuarios
            </h2>

            <div className="management-buttons-container">
              <BotonReutilizable
                onClick={
                  abrirAgregar
                }
                disabled={
                  saving ||
                  roles.length === 0 ||
                  areas.length === 0
                }
              >
                Agregar Usuario
              </BotonReutilizable>

              {puedeGestionarRoles && (
                <BotonReutilizable
                  onClick={
                    abrirPrivilegios
                  }
                  className="btn-privileges-override"
                  disabled={
                    !selectedUserId
                  }
                >
                  Otorgar Privilegios
                </BotonReutilizable>
              )}
            </div>

            <div className="search-filter-container">
              <FiltroBusqueda
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Buscar por nombre, usuario, área, rol o estatus..."
              />
            </div>

            {(mensaje || error) && (
              <div
                className={
                  error
                    ? "page-message page-message-error"
                    : "page-message page-message-success"
                }
              >
                {mensaje || error}
              </div>
            )}

            {loading ? (
              <p>
                Cargando usuarios...
              </p>
            ) : usuariosFiltrados.length ===
              0 ? (
              <p>
                No se encontraron usuarios.
              </p>
            ) : (
              <div className="usuarios-tabla-wrapper">
                <TablaReutilizable
                  columns={columns}
                data={tableData}
                renderRow={(row) => {
                  const isSelected =
                    row._id ===
                    selectedUserId;

                  return (
                    <tr
                      key={row._id}
                      className={
                        isSelected
                          ? "selected-row"
                          : ""
                      }
                      onClick={() => {
                        setEstadoMenu(
                          null
                        );

                        setSelectedUserId(
                          row._id
                        );
                      }}
                      style={{
                        cursor:
                          "pointer",
                      }}
                    >
                      {columns.map(
                        (column) => (
                          <td
                            key={
                              column
                            }
                          >
                            {row[
                              column
                            ]?.main ??
                              ""}
                          </td>
                        )
                      )}
                    </tr>
                  );
                  }}
                />
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ============================= */}
      {/* AGREGAR USUARIO */}
      {/* ============================= */}

      <ModalReutilizable
        id="modalInsertarUsuario"
        title="Agregar Usuario"
        isOpen={isModalAddOpen}
        onClose={cerrarAgregar}
        onAccept={handleAddUser}
        acceptButtonText="Guardar"
        loading={saving}
        errorMessage={
          errorFormulario
        }
      >
        <FormularioUsuario
          userData={currentUser}
          onInputChange={
            handleUserInputChange
          }
          areas={areas}
          roles={roles}
        />
      </ModalReutilizable>

      {/* ============================= */}
      {/* EDITAR USUARIO */}
      {/* ============================= */}

      <ModalReutilizable
        id="modalEditarUsuario"
        title="Editar Usuario"
        isOpen={isModalEditOpen}
        onClose={cerrarEditar}
        onAccept={handleEditUser}
        acceptButtonText="Guardar"
        loading={saving}
        errorMessage={
          errorEdicion
        }
      >
        <FormularioUsuario
          userData={currentUser}
          onInputChange={
            handleUserInputChange
          }
          areas={areas}
          roles={roles}
          isEdit
        />
      </ModalReutilizable>

      {/* ============================= */}
      {/* PRIVILEGIOS */}
      {/* ============================= */}

      {puedeGestionarRoles && (
        <ModalReutilizable
          id="modalPrivilegiosUsuario"
        title="Otorgar Privilegios"
        isOpen={
          isModalPrivilegiosOpen
        }
        onClose={
          cerrarPrivilegios
        }
        onAccept={
          handleGuardarPrivilegios
        }
        acceptButtonText="Guardar"
        loading={
          savingPrivilegios
        }
        errorMessage={
          errorModalPrivilegios ||
          errorPrivilegios
        }
      >
        {usuarioPrivilegios && (
          <>
            <div className="privilegios-info">
              <div>
                <strong>
                  Usuario:
                </strong>{" "}
                {
                  usuarioPrivilegios.nombre_completo
                }
              </div>

              <div>
                <strong>
                  Rol:
                </strong>{" "}
                {usuarioPrivilegios
                  .rol
                  ?.nombre_rol ||
                  "Sin rol"}
              </div>
            </div>

            <div className="privilegios-advertencia">
              Los privilegios se asignan al
              rol. Los cambios afectarán a
              todos los usuarios que tengan
              el rol{" "}
              <strong>
                {usuarioPrivilegios
                  .rol
                  ?.nombre_rol ||
                  ""}
              </strong>
              .
            </div>
          </>
        )}

        <FormularioPrivilegios
          privilegios={
            privilegios
          }
          seleccionados={
            privilegiosSeleccionados
          }
          onChange={
            togglePrivilegio
          }
          loading={
            loadingPrivilegios
          }
        />
        </ModalReutilizable>
      )}

      {estadoMenu &&
        createPortal(
          <>
            <button
              type="button"
              className="usuario-status-overlay"
              aria-label="Cerrar menú de estado"
              onClick={() =>
                setEstadoMenu(
                  null
                )
              }
            />

            <div
              className="usuario-status-menu usuario-status-menu-portal"
              style={{
                top:
                  `${estadoMenu.top}px`,
                left:
                  `${estadoMenu.left}px`,
              }}
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <button
                type="button"
                className={`usuario-status-option usuario-status-option-active ${
                  estadoMenu.usuario.status
                    ? "is-current"
                    : ""
                }`}
                disabled={
                  estadoMenu.usuario.status
                }
                onClick={() =>
                  handleStatusChange(
                    estadoMenu.usuario,
                    true
                  )
                }
              >
                <span className="usuario-status-dot usuario-status-dot-active" />
                Activo
              </button>

              <button
                type="button"
                className={`usuario-status-option usuario-status-option-inactive ${
                  !estadoMenu.usuario.status
                    ? "is-current"
                    : ""
                }`}
                disabled={
                  !estadoMenu.usuario.status
                }
                onClick={() =>
                  handleStatusChange(
                    estadoMenu.usuario,
                    false
                  )
                }
              >
                <span className="usuario-status-dot usuario-status-dot-inactive" />
                Inactivo
              </button>
            </div>
          </>,
          document.body
        )}

    </div>
  );
};

export default Usuarios;