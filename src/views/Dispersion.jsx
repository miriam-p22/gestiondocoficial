import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiCheck,
  FiEye,
  FiFileText,
  FiMessageSquare,
  FiSend,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import Card from "../components/Card";
import TablaReutilizable from "../components/TablaReutilizable";
import FiltroBusqueda from "../components/FiltroBusqueda";
import BotonReutilizable from "../components/BotonReutilizable";
import ModalReutilizable from "../components/ModalReutilizable";
import CampoFormulario from "../components/CampoFormulario";

import { useAreas } from "../hooks/useAreas";
import useDispersion from "../hooks/useDispersion";
import useDocumentoEventos from "../hooks/useDocumentoEventos";
import usePermisosUsuario from "../hooks/usePermisosUsuario";

import "../styles/Dispersion.css";

// ======================================================
// CONFIGURACIÓN
// ======================================================

const SERVER_URL =
  "http://localhost:3001";

// ======================================================
// UTILIDADES
// ======================================================

const formatearFecha = (valor) => {
  if (!valor) {
    return "—";
  }

  const fecha =
    new Date(valor);

  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return "—";
  }

  return fecha.toLocaleString(
    "es-MX",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

// ======================================================
// FECHA SOLO DD/MM/AAAA
// ======================================================

const formatearFechaCorta = (
  valor
) => {
  if (!valor) {
    return "—";
  }

  const fecha =
    new Date(valor);

  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return "—";
  }

  return fecha.toLocaleDateString(
    "es-MX",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
};

// ======================================================
// TAMAÑO
// ======================================================

const formatearTamano = (
  bytes
) => {
  const numero =
    Number(bytes);

  if (
    !Number.isFinite(
      numero
    ) ||
    numero < 0
  ) {
    return "—";
  }

  if (
    numero < 1024
  ) {
    return `${numero} B`;
  }

  if (
    numero <
    1024 * 1024
  ) {
    return `${(
      numero / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    numero /
    (1024 * 1024)
  ).toFixed(2)} MB`;
};

// ======================================================
// ORIGEN
// ======================================================

const obtenerTextoOrigen = (
  origen
) => {
  const valor =
    String(
      origen || ""
    )
      .trim()
      .toLowerCase();

  if (
    valor === "app"
  ) {
    return "App móvil";
  }

  return "Carga manual";
};

// ======================================================
// URL DEL ARCHIVO
// ======================================================

const obtenerRutaArchivo = (
  dispersion
) => {
  if (
    !dispersion?.archivo
  ) {
    return "";
  }

  const ruta =
    String(
      dispersion.archivo
    )
      .replace(
        /\\/g,
        "/"
      )
      .replace(
        /^\/+/,
        ""
      );

  return `${SERVER_URL}/${ruta}`;
};

// ======================================================
// TEXTO DEL ESTADO ADMINISTRATIVO
// ======================================================

const obtenerTextoEstadoDocumento = (
  estado
) => {
  const valor =
    String(
      estado ||
        "turnado"
    )
      .trim()
      .toLowerCase();

  switch (valor) {
    case "recibido":
      return "Recibido";

    case "en proceso":
      return "En proceso";

    case "atendido":
      return "Atendido";

    case "devuelto":
      return "Devuelto";

    case "turnado":
    default:
      return "Turnado";
  }
};

// ======================================================
// CLASE ESTADO ADMINISTRATIVO
// ======================================================

const obtenerClaseEstadoDocumento = (
  estado
) => {
  return String(
    estado ||
      "turnado"
  )
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      "-"
    );
};

// ======================================================
// TEXTO DE TRANSFERENCIA
// ======================================================

const obtenerTextoEstadoEnvio = (
  estado
) => {
  switch (
    String(
      estado ||
        "pendiente"
    ).toLowerCase()
  ) {
    case "enviado":
      return "Enviado";

    case "error":
      return "Error";

    case "pendiente":
    default:
      return "Pendiente";
  }
};

// ======================================================
// SEMÁFORO / SEGUIMIENTO
// ======================================================

const calcularSeguimiento = (
  destino
) => {
  const estado =
    String(
      destino
        ?.estado_documento ||
        "turnado"
    )
      .trim()
      .toLowerCase();

  /*
    Atendido detiene el conteo.
  */

  if (
    estado ===
    "atendido"
  ) {
    const fechaRespuesta =
      destino
        ?.fecha_respuesta
        ? new Date(
            destino.fecha_respuesta
          )
        : null;

    const fechaLimite =
      destino
        ?.fecha_limite
        ? new Date(
            destino.fecha_limite
          )
        : null;

    if (
      fechaRespuesta &&
      fechaLimite
    ) {
      if (
        fechaRespuesta.getTime() >
        fechaLimite.getTime()
      ) {
        return {
          texto:
            "Atendido fuera de plazo",

          clase:
            "vencido",
        };
      }
    }

    return {
      texto:
        "Atendido",

      clase:
        "atendido",
    };
  }

  /*
    Devuelto también deja de tratarse
    como un documento activo.
  */

  if (
    estado ===
    "devuelto"
  ) {
    return {
      texto:
        "Devuelto",

      clase:
        "sin-fecha",
    };
  }

  if (
    !destino?.fecha_limite
  ) {
    return {
      texto:
        "Sin fecha límite",

      clase:
        "sin-fecha",
    };
  }

  const hoy =
    new Date();

  const limite =
    new Date(
      destino.fecha_limite
    );

  hoy.setHours(
    0,
    0,
    0,
    0
  );

  limite.setHours(
    23,
    59,
    59,
    999
  );

  const diferencia =
    limite.getTime() -
    hoy.getTime();

  const diasRestantes =
    Math.ceil(
      diferencia /
        (
          1000 *
          60 *
          60 *
          24
        )
    );

  if (
    diasRestantes < 0
  ) {
    return {
      texto:
        "Vencido",

      clase:
        "vencido",
    };
  }

  if (
    diasRestantes === 0
  ) {
    return {
      texto:
        "Vence hoy",

      clase:
        "proximo",
    };
  }

  if (
    diasRestantes === 1
  ) {
    return {
      texto:
        "Vence mañana",

      clase:
        "proximo",
    };
  }

  return {
    texto:
      `${diasRestantes} días restantes`,

    clase:
      "atiempo",
  };
};

// ======================================================
// ESTADO GENERAL DE LA DISPERSIÓN
// ======================================================

const obtenerEstadoGeneral = (
  destinos = []
) => {
  if (
    !Array.isArray(
      destinos
    ) ||
    destinos.length === 0
  ) {
    return {
      texto:
        "Sin destinos",

      clase:
        "sin-destinos",
    };
  }

  const enviados =
    destinos.filter(
      (item) =>
        item.estado_envio ===
        "enviado"
    ).length;

  const errores =
    destinos.filter(
      (item) =>
        item.estado_envio ===
        "error"
    ).length;

  if (
    enviados ===
    destinos.length
  ) {
    return {
      texto:
        "Enviado",

      clase:
        "enviado",
    };
  }

  if (
    errores > 0
  ) {
    return {
      texto:
        "Con errores",

      clase:
        "error",
    };
  }

  return {
    texto:
      "Pendiente",

    clase:
      "pendiente",
  };
};

// ======================================================
// COMPONENTE
// ======================================================

const Dispersion = () => {
  // ====================================================
  // HOOK DISPERSIÓN
  // ====================================================

  const {
    dispersiones,

    loading,
    saving,
    error,

    subirArchivo,
    eliminarDispersion,

    limpiarError,
  } = useDispersion();

  // ====================================================
  // PERMISOS
  // ====================================================

  const {
    loading:
      loadingPermisos,
    tienePrivilegio,
  } = usePermisosUsuario();

  const puedeGestionarDispersion =
    tienePrivilegio(
      "Gestionar Dispersión"
    );

  // ====================================================
  // HOOK ÁREAS
  // ====================================================

  const {
    areas = [],

    loading:
      loadingAreas = false,
  } = useAreas();

  // ====================================================
  // HOOK RESPUESTAS Y ENTREGAS
  // ====================================================

  const {
    respuestas,

    loading:
      loadingRespuestas,

    saving:
      savingEventos,

    error:
      errorEventos,

    cargarRespuestas,
    crearEvento,
    limpiarError:
      limpiarErrorEventos,
  } = useDocumentoEventos();

  // ====================================================
  // ESTADOS GENERALES
  // ====================================================

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  // ====================================================
  // MODAL SUBIR
  // ====================================================

  const [
    isModalSubirOpen,
    setIsModalSubirOpen,
  ] = useState(false);

  const [
    archivoSeleccionado,
    setArchivoSeleccionado,
  ] = useState(null);

  const [
    destinosSeleccionados,
    setDestinosSeleccionados,
  ] = useState([]);

  const [
    fechaLimite,
    setFechaLimite,
  ] = useState("");

  const [
    busquedaArea,
    setBusquedaArea,
  ] = useState("");

  const [
    errorFormulario,
    setErrorFormulario,
  ] = useState("");

  // ====================================================
  // MODAL VER
  // ====================================================

  const [
    isModalVerOpen,
    setIsModalVerOpen,
  ] = useState(false);

  const [
    dispersionSeleccionada,
    setDispersionSeleccionada,
  ] = useState(null);

  // ====================================================
  // MODAL ELIMINAR
  // ====================================================

  const [
    isModalEliminarOpen,
    setIsModalEliminarOpen,
  ] = useState(false);

  const [
    dispersionAEliminar,
    setDispersionAEliminar,
  ] = useState(null);

  // ====================================================
  // RESPUESTAS Y ENTREGAS
  // ====================================================

  const [
    isModalRecibirOpen,
    setIsModalRecibirOpen,
  ] = useState(false);

  const [
    isModalEntregarOpen,
    setIsModalEntregarOpen,
  ] = useState(false);

  const [
    isModalRespuestaOpen,
    setIsModalRespuestaOpen,
  ] = useState(false);

  const [
    respuestaSeleccionada,
    setRespuestaSeleccionada,
  ] = useState(null);

  const [
    comentarioOficialia,
    setComentarioOficialia,
  ] = useState("");

  // ====================================================
  // CARGAR RESPUESTAS DE LAS ÁREAS
  // ====================================================

  useEffect(() => {
    /*
      "Respuestas y Entregas" pertenece al flujo
      operativo de Oficialía.

      Evitamos incluso consultar ese recurso cuando
      el usuario no tiene Gestionar Dispersión.
    */
    if (
      loadingPermisos ||
      !puedeGestionarDispersion
    ) {
      return;
    }

    cargarRespuestas()
      .catch(() => {});
  }, [
    cargarRespuestas,
    loadingPermisos,
    puedeGestionarDispersion,
  ]);

  // ====================================================
  // LIMPIAR MENSAJES
  // ====================================================

  const limpiarMensajes =
    () => {
      setMensaje("");

      setErrorFormulario(
        ""
      );

      limpiarError();
      limpiarErrorEventos();
    };

  // ====================================================
  // FILTRAR DISPERSIONES
  // ====================================================

  const dispersionesFiltradas =
    useMemo(() => {
      const termino =
        searchQuery
          .trim()
          .toLowerCase();

      if (!termino) {
        return dispersiones;
      }

      return dispersiones.filter(
        (item) => {
          const archivo =
            String(
              item.nombre_archivo ||
                ""
            ).toLowerCase();

          const origen =
            obtenerTextoOrigen(
              item.origen
            ).toLowerCase();

          const destinos =
            (
              item.destinos ||
              []
            )
              .map(
                (destino) =>
                  destino.area
                    ?.nombre_area ||
                  ""
              )
              .join(" ")
              .toLowerCase();

          const estados =
            (
              item.destinos ||
              []
            )
              .map(
                (destino) =>
                  `${destino.estado_envio || ""} ${destino.estado_documento || ""}`
              )
              .join(" ")
              .toLowerCase();

          return (
            archivo.includes(
              termino
            ) ||
            origen.includes(
              termino
            ) ||
            destinos.includes(
              termino
            ) ||
            estados.includes(
              termino
            )
          );
        }
      );
    }, [
      dispersiones,
      searchQuery,
    ]);

  // ====================================================
  // FILTRAR ÁREAS
  // ====================================================

  const areasFiltradas =
    useMemo(() => {
      const termino =
        busquedaArea
          .trim()
          .toLowerCase();

      const lista =
        [...areas].sort(
          (
            a,
            b
          ) =>
            String(
              a.nombre_area ||
                ""
            ).localeCompare(
              String(
                b.nombre_area ||
                  ""
              ),
              "es"
            )
        );

      if (!termino) {
        return lista;
      }

      return lista.filter(
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
      busquedaArea,
    ]);

  // ====================================================
  // ABRIR MODAL SUBIR
  // ====================================================

  const abrirSubir =
    () => {
      if (
        !puedeGestionarDispersion
      ) {
        return;
      }

      limpiarMensajes();

      setArchivoSeleccionado(
        null
      );

      setDestinosSeleccionados(
        []
      );

      setFechaLimite("");

      setBusquedaArea("");

      setIsModalSubirOpen(
        true
      );
    };

  // ====================================================
  // CERRAR MODAL SUBIR
  // ====================================================

  const cerrarSubir =
    () => {
      if (saving) {
        return;
      }

      setIsModalSubirOpen(
        false
      );

      setArchivoSeleccionado(
        null
      );

      setDestinosSeleccionados(
        []
      );

      setFechaLimite("");

      setBusquedaArea("");

      setErrorFormulario(
        ""
      );
    };

  // ====================================================
  // SELECCIONAR ARCHIVO
  // ====================================================

  const handleSeleccionArchivo =
    (event) => {
      setErrorFormulario(
        ""
      );

      const archivo =
        event.target
          .files?.[0] ||
        null;

      setArchivoSeleccionado(
        archivo
      );
    };

  // ====================================================
  // TOGGLE ÁREA
  // ====================================================

  const toggleArea = (
    idArea
  ) => {
    const id =
      Number(idArea);

    setDestinosSeleccionados(
      (actuales) => {
        if (
          actuales.includes(
            id
          )
        ) {
          return actuales.filter(
            (item) =>
              item !== id
          );
        }

        return [
          ...actuales,
          id,
        ];
      }
    );

    setErrorFormulario(
      ""
    );
  };

  // ====================================================
  // SELECCIONAR VISIBLES
  // ====================================================

  const seleccionarTodas =
    () => {
      const ids =
        areasFiltradas.map(
          (area) =>
            Number(
              area.id
            )
        );

      setDestinosSeleccionados(
        (actuales) => [
          ...new Set([
            ...actuales,
            ...ids,
          ]),
        ]
      );
    };

  // ====================================================
  // LIMPIAR DESTINOS
  // ====================================================

  const limpiarDestinos =
    () => {
      setDestinosSeleccionados(
        []
      );
    };

  // ====================================================
  // SUBIR ARCHIVO
  // ====================================================

  const handleSubirArchivo =
    async () => {
      setErrorFormulario(
        ""
      );

      limpiarError();

      try {
        if (
          !archivoSeleccionado
        ) {
          throw new Error(
            "Debe seleccionar un archivo."
          );
        }

        if (
          destinosSeleccionados
            .length === 0
        ) {
          throw new Error(
            "Debe seleccionar al menos un área destino."
          );
        }

        if (
          !fechaLimite
        ) {
          throw new Error(
            "Debe indicar la fecha límite de atención."
          );
        }

        await subirArchivo({
          archivo:
            archivoSeleccionado,

          destinos:
            destinosSeleccionados,

          fecha_limite:
            fechaLimite,
        });

        setIsModalSubirOpen(
          false
        );

        setArchivoSeleccionado(
          null
        );

        setDestinosSeleccionados(
          []
        );

        setFechaLimite("");

        setBusquedaArea("");

        setMensaje(
          "Documento registrado correctamente en Dispersión."
        );
      } catch (err) {
        setErrorFormulario(
          err?.message ||
            "No fue posible registrar el documento."
        );
      }
    };

  // ====================================================
  // VER
  // ====================================================

  const abrirVer = (
    dispersion
  ) => {
    limpiarMensajes();

    setDispersionSeleccionada(
      dispersion
    );

    setIsModalVerOpen(
      true
    );
  };

  const cerrarVer =
    () => {
      setIsModalVerOpen(
        false
      );

      setDispersionSeleccionada(
        null
      );
    };

  // ====================================================
  // ABRIR ARCHIVO
  // ====================================================

  const abrirArchivo = (
    dispersion
  ) => {
    const url =
      obtenerRutaArchivo(
        dispersion
      );

    if (!url) {
      return;
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // ====================================================
  // ELIMINAR
  // ====================================================

  const abrirEliminar = (
    dispersion
  ) => {
    if (
      !puedeGestionarDispersion
    ) {
      return;
    }

    limpiarMensajes();

    setDispersionAEliminar(
      dispersion
    );

    setIsModalEliminarOpen(
      true
    );
  };

  const cerrarEliminar =
    () => {
      if (saving) {
        return;
      }

      setIsModalEliminarOpen(
        false
      );

      setDispersionAEliminar(
        null
      );
    };

  const handleEliminar =
    async () => {
      if (
        !dispersionAEliminar
      ) {
        return;
      }

      try {
        await eliminarDispersion(
          dispersionAEliminar.id
        );

        setIsModalEliminarOpen(
          false
        );

        setDispersionAEliminar(
          null
        );

        setMensaje(
          "Dispersión eliminada correctamente."
        );
      } catch {
        // Error controlado
        // por el hook.
      }
    };

  // ====================================================
  // RESPUESTA RECIBIDA POR OFICIALÍA
  // ====================================================

  const abrirRecibirRespuesta = (respuesta) => {
    if (
      !puedeGestionarDispersion
    ) {
      return;
    }

    limpiarMensajes();
    setRespuestaSeleccionada(respuesta);
    setComentarioOficialia("");
    setIsModalRecibirOpen(true);
  };

  const cerrarRecibirRespuesta = () => {
    if (savingEventos) {
      return;
    }

    setIsModalRecibirOpen(false);
    setRespuestaSeleccionada(null);
    setComentarioOficialia("");
    setErrorFormulario("");
  };

  const registrarRecepcionRespuesta = async () => {
    if (!respuestaSeleccionada) {
      return;
    }

    try {
      setErrorFormulario("");

      await crearEvento({
        id_dispersion:
          respuestaSeleccionada.id_dispersion,

        id_area:
          respuestaSeleccionada.id_area,

        tipo_evento:
          "respuesta_recibida",

        comentario:
          comentarioOficialia.trim() || null,
      });

      await cargarRespuestas();

      setIsModalRecibirOpen(false);
      setRespuestaSeleccionada(null);
      setComentarioOficialia("");

      setMensaje(
        "Respuesta confirmada como recibida por Oficialía de Partes."
      );
    } catch (err) {
      setErrorFormulario(
        err?.message ||
          "No fue posible confirmar la recepción de la respuesta."
      );
    }
  };

  // ====================================================
  // ENTREGA DE RESPUESTA AL CIUDADANO
  // ====================================================

  const abrirEntregarRespuesta = (respuesta) => {
    if (
      !puedeGestionarDispersion
    ) {
      return;
    }

    limpiarMensajes();
    setRespuestaSeleccionada(respuesta);
    setComentarioOficialia("");
    setIsModalEntregarOpen(true);
  };

  const cerrarEntregarRespuesta = () => {
    if (savingEventos) {
      return;
    }

    setIsModalEntregarOpen(false);
    setRespuestaSeleccionada(null);
    setComentarioOficialia("");
    setErrorFormulario("");
  };

  const registrarEntregaRespuesta = async () => {
    if (!respuestaSeleccionada) {
      return;
    }

    try {
      setErrorFormulario("");

      await crearEvento({
        id_dispersion:
          respuestaSeleccionada.id_dispersion,

        id_area:
          null,

        tipo_evento:
          "respuesta_entregada",

        comentario:
          comentarioOficialia.trim() || null,
      });

      await cargarRespuestas();

      setIsModalEntregarOpen(false);
      setRespuestaSeleccionada(null);
      setComentarioOficialia("");

      setMensaje(
        "Entrega de la respuesta al ciudadano registrada correctamente."
      );
    } catch (err) {
      setErrorFormulario(
        err?.message ||
          "No fue posible registrar la entrega de la respuesta."
      );
    }
  };

  // ====================================================
  // VER RESPUESTA DEL ÁREA
  // ====================================================

  const abrirDetalleRespuesta = (respuesta) => {
    limpiarMensajes();
    setRespuestaSeleccionada(respuesta);
    setIsModalRespuestaOpen(true);
  };

  const cerrarDetalleRespuesta = () => {
    setIsModalRespuestaOpen(false);
    setRespuestaSeleccionada(null);
  };

  // ====================================================
  // TABLA
  // ====================================================

  const columnas = [
    "Archivo",
    "Origen",
    "Fecha",
    "Tamaño",
    "Destinos",
    "Envío",
    "Acciones",
  ];

  const dataTabla =
    dispersionesFiltradas.map(
      (item) => {
        const estadoGeneral =
          obtenerEstadoGeneral(
            item.destinos
          );

        return {
          _id:
            item.id,

          Archivo: {
            main: (
              <div className="dispersion-file-cell">
                <strong>
                  {
                    item.nombre_archivo
                  }
                </strong>

                <span>
                  {String(
                    item.extension ||
                      ""
                  ).toUpperCase() ||
                    "Archivo"}
                </span>
              </div>
            ),
          },

          Origen: {
            main: (
              <span className="dispersion-origin">
                {obtenerTextoOrigen(
                  item.origen
                )}
              </span>
            ),
          },

          Fecha: {
            main:
              formatearFecha(
                item.fecha_recepcion
              ),
          },

          Tamaño: {
            main:
              formatearTamano(
                item.tamano_archivo
              ),
          },

          Destinos: {
            main: (
              <span className="dispersion-destination-count">
                {
                  (
                    item.destinos ||
                    []
                  ).length
                }{" "}
                {(
                  item.destinos ||
                  []
                ).length === 1
                  ? "área"
                  : "áreas"}
              </span>
            ),
          },

          Envío: {
            main: (
              <span
                className={`dispersion-send-state ${estadoGeneral.clase}`}
              >
                {
                  estadoGeneral.texto
                }
              </span>
            ),
          },

          Acciones: {
            main: (
              <div className="actions-cell dispersion-actions">
                <BotonReutilizable
                  className="btn-action btn-icon edit"
                  onClick={() =>
                    abrirVer(
                      item
                    )
                  }
                  title="Ver detalle"
                  aria-label="Ver detalle de dispersión"
                >
                  <FiEye />
                </BotonReutilizable>

                <BotonReutilizable
                  className="btn-action btn-icon"
                  onClick={() =>
                    abrirArchivo(
                      item
                    )
                  }
                  title="Abrir archivo"
                  aria-label="Abrir archivo"
                >
                  <FiFileText />
                </BotonReutilizable>

                {puedeGestionarDispersion && (
                  <BotonReutilizable
                    className="btn-action btn-icon delete"
                    onClick={() =>
                      abrirEliminar(
                        item
                      )
                    }
                    title="Eliminar dispersión"
                    aria-label="Eliminar dispersión"
                  >
                    <FiTrash2 />
                  </BotonReutilizable>
                )}
              </div>
            ),
          },
        };
      }
    );

  // ====================================================
  // TABLA RESPUESTAS Y ENTREGAS
  // ====================================================

  const columnasRespuestas = [
    "Documento",
    "Área",
    "Respuesta",
    "Fecha atención",
    "Oficialía",
    "Entrega",
    "Acciones",
  ];

  const dataRespuestas =
    respuestas.map((item) => ({
      _id:
        item.id_evento_respuesta,

      Documento: {
        main: (
          <div className="dispersion-response-document">
            <strong>
              {item.documento || "Documento"}
            </strong>
          </div>
        ),
      },

      Área: {
        main:
          item.area || "Área",
      },

      Respuesta: {
        main: (
          <div className="dispersion-response-preview">
            {item.respuesta || "Sin comentario"}
          </div>
        ),
      },

      "Fecha atención": {
        main:
          formatearFecha(
            item.fecha_respuesta_area
          ),
      },

      Oficialía: {
        main: item.respuesta_recibida ? (
          <span className="dispersion-history-state completed">
            Recibida
          </span>
        ) : (
          <span className="dispersion-history-state pending">
            Pendiente
          </span>
        ),
      },

      Entrega: {
        main: item.respuesta_entregada ? (
          <span className="dispersion-history-state completed">
            Entregada
          </span>
        ) : (
          <span className="dispersion-history-state pending">
            Pendiente
          </span>
        ),
      },

      Acciones: {
        main: (
          <div className="actions-cell dispersion-actions">
            <BotonReutilizable
              className="btn-action btn-icon"
              onClick={() =>
                abrirDetalleRespuesta(item)
              }
              title="Ver respuesta"
              aria-label="Ver respuesta del área"
            >
              <FiMessageSquare />
            </BotonReutilizable>

            {!item.respuesta_recibida && (
              <BotonReutilizable
                className="btn-action btn-icon status-active"
                onClick={() =>
                  abrirRecibirRespuesta(item)
                }
                title="Marcar respuesta como recibida"
                aria-label="Marcar respuesta como recibida por Oficialía"
              >
                <FiCheck />
              </BotonReutilizable>
            )}

            {item.respuesta_recibida &&
              !item.respuesta_entregada && (
                <BotonReutilizable
                  className="btn-action btn-icon"
                  onClick={() =>
                    abrirEntregarRespuesta(item)
                  }
                  title="Registrar entrega al ciudadano"
                  aria-label="Registrar entrega de respuesta al ciudadano"
                >
                  <FiSend />
                </BotonReutilizable>
              )}
          </div>
        ),
      },
    }));

  // ====================================================
  // ARCHIVO DEL MODAL
  // ====================================================

  const urlArchivoSeleccionado =
    dispersionSeleccionada
      ? obtenerRutaArchivo(
          dispersionSeleccionada
        )
      : "";

  const extensionSeleccionada =
    String(
      dispersionSeleccionada
        ?.extension ||
        ""
    )
      .trim()
      .toLowerCase();

  const esPdf =
    extensionSeleccionada ===
    "pdf";

  const esImagen =
    [
      "jpg",
      "jpeg",
      "png",
      "webp",
    ].includes(
      extensionSeleccionada
    );

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <main className="content-area">
      <section className="content-section">

        {/* ============================================= */}
        {/* TÍTULO */}
        {/* ============================================= */}

        <h2 className="card-title">
          Dispersión
        </h2>

        {/* ============================================= */}
        {/* CABECERA */}
        {/* ============================================= */}

        <div className="dispersion-header">
          <div>
            <p className="dispersion-description">
              {puedeGestionarDispersion
                ? "Registre los documentos recibidos por Oficialía de Partes, asigne la fecha límite de atención y seleccione las áreas responsables."
                : "Consulte los documentos turnados y su seguimiento documental."}
            </p>
          </div>

          {puedeGestionarDispersion && (
            <BotonReutilizable
              onClick={
                abrirSubir
              }
            >
              Subir documento
            </BotonReutilizable>
          )}
        </div>

        {/* ============================================= */}
        {/* BUSCADOR */}
        {/* ============================================= */}

        <div className="search-filter-container">
          <FiltroBusqueda
            value={
              searchQuery
            }
            onChange={(
              event
            ) =>
              setSearchQuery(
                event.target.value
              )
            }
            placeholder="Buscar por archivo, origen, área o estado..."
          />
        </div>

        {/* ============================================= */}
        {/* MENSAJES */}
        {/* ============================================= */}

        {(mensaje ||
          error ||
          errorEventos) && (
          <div
            className={
              error ||
              errorEventos
                ? "page-message page-message-error"
                : "page-message page-message-success"
            }
          >
            {error ||
              errorEventos ||
              mensaje}
          </div>
        )}

        {/* ============================================= */}
        {/* TABLA */}
        {/* ============================================= */}

        <Card>
          {loading ? (
            <p>
              Cargando dispersiones...
            </p>
          ) : dispersionesFiltradas
              .length ===
            0 ? (
            <div className="dispersion-empty">
              <strong>
                No hay documentos registrados
              </strong>

              <span>
                {puedeGestionarDispersion
                  ? "Utilice “Subir documento” para registrar el primero."
                  : "No existen dispersiones disponibles para su consulta."}
              </span>
            </div>
          ) : (
            <TablaReutilizable
              columns={
                columnas
              }
              data={
                dataTabla
              }
              renderRow={(
                row
              ) => (
                <tr
                  key={
                    row._id
                  }
                >
                  {columnas.map(
                    (
                      column
                    ) => (
                      <td
                        key={
                          column
                        }
                      >
                        {row[
                          column
                        ]
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

        {/* ============================================= */}
        {/* RESPUESTAS Y ENTREGAS */}
        {/* ============================================= */}

        {puedeGestionarDispersion && (
          <>
        <Card className="dispersion-respuestas-card">
            <div className="dispersion-section-title">
              <div>
                <h3>
                  Respuestas y Entregas
                </h3>
  
                <p>
                  Respuestas enviadas por las áreas y seguimiento de su recepción en Oficialía y entrega al ciudadano.
                </p>
              </div>
            </div>
  
            {loadingRespuestas ? (
              <p>
                Cargando respuestas...
              </p>
            ) : respuestas.length === 0 ? (
              <div className="dispersion-empty dispersion-empty-responses">
                <strong>
                  Todavía no hay respuestas enviadas por las áreas
                </strong>
  
                <span>
                  Cuando un área marque un documento como atendido y envíe su comentario, aparecerá aquí.
                </span>
              </div>
            ) : (
              <TablaReutilizable
                columns={
                  columnasRespuestas
                }
                data={
                  dataRespuestas
                }
                renderRow={(row) => (
                  <tr
                    key={
                      row._id
                    }
                  >
                    {columnasRespuestas.map(
                      (column) => (
                        <td
                          key={
                            column
                          }
                        >
                          {row[column]
                            ?.main ?? ""}
                        </td>
                      )
                    )}
                  </tr>
                )}
              />
            )}
          </Card>
          </>
        )}
      </section>

      {/* ================================================= */}
      {/* MODAL SUBIR DOCUMENTO */}
      {/* ================================================= */}

      <ModalReutilizable
        id="modalSubirDispersion"
        title="Subir documento"
        isOpen={
          puedeGestionarDispersion &&
          isModalSubirOpen
        }
        onClose={
          cerrarSubir
        }
        onAccept={
          handleSubirArchivo
        }
        acceptButtonText="Registrar documento"
        loading={
          saving
        }
        errorMessage={
          errorFormulario
        }
        className="modal-dispersion-upload"
      >
        <div className="dispersion-upload-form">

          {/* ============================================= */}
          {/* ARCHIVO */}
          {/* ============================================= */}

          <div className="dispersion-form-section">
            <label className="dispersion-form-label">
              Archivo
            </label>

            <label className="dispersion-file-picker">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={
                  handleSeleccionArchivo
                }
              />

              <span className="dispersion-file-picker-button">
                Seleccionar archivo
              </span>

              <span className="dispersion-file-picker-name">
                {archivoSeleccionado
                  ? archivoSeleccionado.name
                  : "Ningún archivo seleccionado"}
              </span>
            </label>

            <span className="dispersion-form-help">
              Formatos permitidos: PDF, JPG, PNG, DOC y DOCX. Máximo 20 MB.
            </span>
          </div>

          {/* ============================================= */}
          {/* ARCHIVO SELECCIONADO */}
          {/* ============================================= */}

          {archivoSeleccionado && (
            <div className="dispersion-selected-file">
              <div>
                <strong>
                  {
                    archivoSeleccionado.name
                  }
                </strong>

                <span>
                  {formatearTamano(
                    archivoSeleccionado.size
                  )}
                </span>
              </div>

              <button
                type="button"
                className="dispersion-remove-file"
                onClick={() =>
                  setArchivoSeleccionado(
                    null
                  )
                }
                title="Quitar archivo"
                aria-label="Quitar archivo seleccionado"
              >
                <FiX />
              </button>
            </div>
          )}

          {/* ============================================= */}
          {/* FECHA LÍMITE */}
          {/* ============================================= */}

          <div className="dispersion-form-section">
            <label className="dispersion-form-label">
              Fecha límite de atención
            </label>

            <input
              type="date"
              className="dispersion-date-input"
              value={
                fechaLimite
              }
              onChange={(
                event
              ) => {
                setFechaLimite(
                  event.target.value
                );

                setErrorFormulario(
                  ""
                );
              }}
            />

            <span className="dispersion-form-help">
              Fecha máxima en la que las áreas deberán haber atendido el oficio.
            </span>
          </div>

          {/* ============================================= */}
          {/* DESTINOS */}
          {/* ============================================= */}

          <div className="dispersion-form-section">
            <div className="dispersion-destinations-header">
              <div>
                <label className="dispersion-form-label">
                  Áreas destino
                </label>

                <span className="dispersion-selected-count">
                  {
                    destinosSeleccionados.length
                  }{" "}
                  {destinosSeleccionados.length ===
                  1
                    ? "área seleccionada"
                    : "áreas seleccionadas"}
                </span>
              </div>

              <div className="dispersion-destination-actions">
                <button
                  type="button"
                  onClick={
                    seleccionarTodas
                  }
                >
                  Seleccionar visibles
                </button>

                <button
                  type="button"
                  onClick={
                    limpiarDestinos
                  }
                >
                  Limpiar
                </button>
              </div>
            </div>

            <input
              type="text"
              className="dispersion-area-search"
              placeholder="Buscar área..."
              value={
                busquedaArea
              }
              onChange={(
                event
              ) =>
                setBusquedaArea(
                  event.target.value
                )
              }
            />

            <div className="dispersion-area-list">
              {loadingAreas ? (
                <p>
                  Cargando áreas...
                </p>
              ) : areasFiltradas.length ===
                0 ? (
                <p className="dispersion-no-areas">
                  No se encontraron áreas.
                </p>
              ) : (
                areasFiltradas.map(
                  (area) => {
                    const seleccionado =
                      destinosSeleccionados.includes(
                        Number(
                          area.id
                        )
                      );

                    return (
                      <label
                        key={
                          area.id
                        }
                        className={`dispersion-area-option ${
                          seleccionado
                            ? "selected"
                            : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={
                            seleccionado
                          }
                          onChange={() =>
                            toggleArea(
                              area.id
                            )
                          }
                        />

                        <span className="dispersion-area-checkbox" />

                        <span className="dispersion-area-name">
                          {
                            area.nombre_area
                          }
                        </span>
                      </label>
                    );
                  }
                )
              )}
            </div>
          </div>
        </div>
      </ModalReutilizable>

      {/* ================================================= */}
      {/* MODAL DETALLE */}
      {/* ================================================= */}

      <ModalReutilizable
        id="modalVerDispersion"
        title="Detalle de dispersión"
        isOpen={
          isModalVerOpen
        }
        onClose={
          cerrarVer
        }
        onAccept={
          cerrarVer
        }
        acceptButtonText="Cerrar"
        className="modal-dispersion-detail"
      >
        {dispersionSeleccionada && (
          <div className="dispersion-detail">

            {/* =========================================== */}
            {/* RESUMEN */}
            {/* =========================================== */}

            <div className="dispersion-detail-summary">
              <div>
                <span>
                  Archivo
                </span>

                <strong>
                  {
                    dispersionSeleccionada.nombre_archivo
                  }
                </strong>
              </div>

              <div>
                <span>
                  Origen
                </span>

                <strong>
                  {obtenerTextoOrigen(
                    dispersionSeleccionada.origen
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Fecha de registro
                </span>

                <strong>
                  {formatearFecha(
                    dispersionSeleccionada.fecha_recepcion
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Tamaño
                </span>

                <strong>
                  {formatearTamano(
                    dispersionSeleccionada.tamano_archivo
                  )}
                </strong>
              </div>
            </div>

            {/* =========================================== */}
            {/* VISOR + DESTINOS */}
            {/* =========================================== */}

            <div className="dispersion-detail-grid">

              {/* ========================================= */}
              {/* VISOR */}
              {/* ========================================= */}

              <div className="dispersion-preview">
                <div className="dispersion-preview-header">
                  <strong>
                    Vista del archivo
                  </strong>

                  <button
                    type="button"
                    onClick={() =>
                      abrirArchivo(
                        dispersionSeleccionada
                      )
                    }
                  >
                    Abrir archivo
                  </button>
                </div>

                {esPdf && (
                  <iframe
                    src={
                      urlArchivoSeleccionado
                    }
                    title={
                      dispersionSeleccionada.nombre_archivo
                    }
                    className="dispersion-file-frame"
                  />
                )}

                {esImagen && (
                  <div className="dispersion-image-preview">
                    <img
                      src={
                        urlArchivoSeleccionado
                      }
                      alt={
                        dispersionSeleccionada.nombre_archivo
                      }
                    />
                  </div>
                )}

                {!esPdf &&
                  !esImagen && (
                    <div className="dispersion-file-no-preview">
                      <strong>
                        Vista previa no disponible
                      </strong>

                      <span>
                        Este tipo de archivo debe abrirse con su aplicación correspondiente.
                      </span>

                      <BotonReutilizable
                        onClick={() =>
                          abrirArchivo(
                            dispersionSeleccionada
                          )
                        }
                      >
                        Abrir archivo
                      </BotonReutilizable>
                    </div>
                  )}
              </div>

              {/* ========================================= */}
              {/* DESTINOS */}
              {/* ========================================= */}

              <div className="dispersion-destinations-panel">
                <div className="dispersion-panel-title">
                  <div>
                    <strong>
                      Áreas destino
                    </strong>

                    <span>
                      {
                        (
                          dispersionSeleccionada.destinos ||
                          []
                        ).length
                      }{" "}
                      destinos
                    </span>
                  </div>
                </div>

                <div className="dispersion-destination-list">
                  {(
                    dispersionSeleccionada.destinos ||
                    []
                  ).length ===
                  0 ? (
                    <p className="dispersion-no-areas">
                      Este documento no tiene áreas destino.
                    </p>
                  ) : (
                    (
                      dispersionSeleccionada.destinos ||
                      []
                    ).map(
                      (
                        destino
                      ) => {
                        const seguimiento =
                          calcularSeguimiento(
                            destino
                          );

                        return (
                          <div
                            key={
                              destino.id
                            }
                            className="dispersion-destination-card"
                          >
                            <div className="dispersion-destination-info">

                              {/* ================================= */}
                              {/* ÁREA */}
                              {/* ================================= */}

                              <strong>
                                {destino.area
                                  ?.nombre_area ||
                                  "Área"}
                              </strong>

                              {/* ================================= */}
                              {/* TRANSFERENCIA */}
                              {/* ================================= */}

                              <div className="dispersion-destination-meta">
                                <span>
                                  Transferencia:
                                </span>

                                <strong
                                  className={`dispersion-send-state ${
                                    destino.estado_envio ||
                                    "pendiente"
                                  }`}
                                >
                                  {obtenerTextoEstadoEnvio(
                                    destino.estado_envio
                                  )}
                                </strong>
                              </div>

                              {/* ================================= */}
                              {/* ESTADO DEL OFICIO */}
                              {/* ================================= */}

                              <div className="dispersion-destination-meta">
                                <span>
                                  Estado del oficio:
                                </span>

                                <strong
                                  className={`dispersion-document-state ${obtenerClaseEstadoDocumento(
                                    destino.estado_documento
                                  )}`}
                                >
                                  {obtenerTextoEstadoDocumento(
                                    destino.estado_documento
                                  )}
                                </strong>
                              </div>

                              {/* ================================= */}
                              {/* FECHA LÍMITE */}
                              {/* ================================= */}

                              <div className="dispersion-destination-meta">
                                <span>
                                  Fecha límite:
                                </span>

                                <strong>
                                  {formatearFechaCorta(
                                    destino.fecha_limite
                                  )}
                                </strong>
                              </div>

                              {/* ================================= */}
                              {/* SEMÁFORO */}
                              {/* ================================= */}

                              <div className="dispersion-destination-meta">
                                <span>
                                  Tiempo:
                                </span>

                                <strong
                                  className={`dispersion-time-state ${seguimiento.clase}`}
                                >
                                  {
                                    seguimiento.texto
                                  }
                                </strong>
                              </div>

                              {/* ================================= */}
                              {/* FECHA DE RECEPCIÓN */}
                              {/* ================================= */}

                              {destino.fecha_recepcion && (
                                <div className="dispersion-destination-meta">
                                  <span>
                                    Recibido:
                                  </span>

                                  <strong>
                                    {formatearFecha(
                                      destino.fecha_recepcion
                                    )}
                                  </strong>
                                </div>
                              )}

                              {/* ================================= */}
                              {/* FECHA DE RESPUESTA */}
                              {/* ================================= */}

                              {(destino.fecha_atencion ||
                                destino.fecha_respuesta) && (
                                <div className="dispersion-destination-meta">
                                  <span>
                                    Atendido:
                                  </span>

                                  <strong>
                                    {formatearFecha(
                                      destino.fecha_atencion ||
                                        destino.fecha_respuesta
                                    )}
                                  </strong>
                                </div>
                              )}

                              {(destino.respuesta_area ||
                                destino.respuesta) && (
                                <div className="dispersion-area-response-box">
                                  <strong>
                                    Respuesta del área
                                  </strong>

                                  <p>
                                    {destino.respuesta_area ||
                                      destino.respuesta}
                                  </p>
                                </div>
                              )}

                              {destino.motivo_devolucion && (
                                <div className="dispersion-return-box">
                                  <strong>
                                    Documento devuelto
                                  </strong>

                                  <span>
                                    {destino.motivo_devolucion}
                                  </span>

                                  {destino.comentario_devolucion && (
                                    <p>
                                      {destino.comentario_devolucion}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* ================================= */}
                              {/* ERROR P2P */}
                              {/* ================================= */}

                              {destino.error_envio && (
                                <span className="dispersion-destination-error">
                                  {
                                    destino.error_envio
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )
                  )}
                </div>

                {/* ======================================= */}
                {/* INFORMACIÓN P2P */}
                {/* ======================================= */}

                <div className="dispersion-p2p-note">
                  <strong>
                    Transferencia P2P
                  </strong>

                  <p>
                    Los destinos y el seguimiento administrativo ya están registrados. La comunicación P2P se conectará posteriormente para transferir físicamente el archivo a cada equipo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalReutilizable>

      {/* ================================================= */}
      {/* MODAL VER RESPUESTA DEL ÁREA */}
      {/* ================================================= */}

      <ModalReutilizable
        id="modalVerRespuestaArea"
        title="Respuesta del área"
        isOpen={
          isModalRespuestaOpen
        }
        onClose={
          cerrarDetalleRespuesta
        }
        onAccept={
          cerrarDetalleRespuesta
        }
        acceptButtonText="Cerrar"
      >
        {respuestaSeleccionada && (
          <div className="dispersion-response-detail">
            <div>
              <span>
                Documento
              </span>
              <strong>
                {respuestaSeleccionada.documento}
              </strong>
            </div>

            <div>
              <span>
                Área responsable
              </span>
              <strong>
                {respuestaSeleccionada.area}
              </strong>
            </div>

            <div>
              <span>
                Fecha de atención
              </span>
              <strong>
                {formatearFecha(
                  respuestaSeleccionada.fecha_respuesta_area
                )}
              </strong>
            </div>

            <div className="dispersion-response-detail-comment">
              <span>
                Respuesta / comentario del área
              </span>
              <p>
                {respuestaSeleccionada.respuesta ||
                  "El área no agregó un comentario."}
              </p>
            </div>

            <div className="dispersion-response-history">
              <div>
                <span>
                  Recibida por Oficialía
                </span>
                <strong>
                  {respuestaSeleccionada.respuesta_recibida
                    ? formatearFecha(
                        respuestaSeleccionada.fecha_recepcion_oficialia
                      )
                    : "Pendiente"}
                </strong>
              </div>

              <div>
                <span>
                  Entregada al ciudadano
                </span>
                <strong>
                  {respuestaSeleccionada.respuesta_entregada
                    ? formatearFecha(
                        respuestaSeleccionada.fecha_entrega_ciudadano
                      )
                    : "Pendiente"}
                </strong>
              </div>
            </div>
          </div>
        )}
      </ModalReutilizable>

      {/* ================================================= */}
      {/* MODAL RECIBIR RESPUESTA */}
      {/* ================================================= */}

      <ModalReutilizable
        id="modalRecibirRespuesta"
        title="Confirmar respuesta recibida"
        isOpen={
          puedeGestionarDispersion &&
          isModalRecibirOpen
        }
        onClose={
          cerrarRecibirRespuesta
        }
        onAccept={
          registrarRecepcionRespuesta
        }
        acceptButtonText="Confirmar recepción"
        loading={
          savingEventos
        }
        errorMessage={
          errorFormulario
        }
      >
        {respuestaSeleccionada && (
          <>
            <p>
              <strong>Documento:</strong>{" "}
              {respuestaSeleccionada.documento}
            </p>

            <p>
              <strong>Área:</strong>{" "}
              {respuestaSeleccionada.area}
            </p>

            <div className="dispersion-response-confirm-box">
              <strong>
                Respuesta del área
              </strong>

              <p>
                {respuestaSeleccionada.respuesta ||
                  "Sin comentario adicional."}
              </p>
            </div>

            <CampoFormulario
              label="Comentario de Oficialía"
              isTextarea
              rows={4}
              value={
                comentarioOficialia
              }
              onChange={(event) =>
                setComentarioOficialia(
                  event.target.value
                )
              }
              placeholder="Comentario opcional sobre la recepción..."
            />
          </>
        )}
      </ModalReutilizable>

      {/* ================================================= */}
      {/* MODAL ENTREGAR RESPUESTA */}
      {/* ================================================= */}

      <ModalReutilizable
        id="modalEntregarRespuesta"
        title="Registrar entrega al ciudadano"
        isOpen={
          puedeGestionarDispersion &&
          isModalEntregarOpen
        }
        onClose={
          cerrarEntregarRespuesta
        }
        onAccept={
          registrarEntregaRespuesta
        }
        acceptButtonText="Registrar entrega"
        loading={
          savingEventos
        }
        errorMessage={
          errorFormulario
        }
      >
        {respuestaSeleccionada && (
          <>
            <p>
              <strong>Documento:</strong>{" "}
              {respuestaSeleccionada.documento}
            </p>

            <p>
              Esta acción dejará registrada la fecha en que Oficialía entregó o comunicó la respuesta al ciudadano.
            </p>

            <CampoFormulario
              label="Comentario de entrega"
              isTextarea
              rows={4}
              value={
                comentarioOficialia
              }
              onChange={(event) =>
                setComentarioOficialia(
                  event.target.value
                )
              }
              placeholder="Ej. El ciudadano acudió personalmente a Oficialía..."
            />
          </>
        )}
      </ModalReutilizable>

      {/* ================================================= */}
      {/* MODAL ELIMINAR */}
      {/* ================================================= */}

      <ModalReutilizable
        id="modalEliminarDispersion"
        title="Eliminar dispersión"
        isOpen={
          puedeGestionarDispersion &&
          isModalEliminarOpen
        }
        onClose={
          cerrarEliminar
        }
        onAccept={
          handleEliminar
        }
        acceptButtonText="Eliminar"
        loading={
          saving
        }
        errorMessage={
          error
        }
      >
        <p>
          ¿Desea eliminar el registro de{" "}
          <strong>
            {
              dispersionAEliminar
                ?.nombre_archivo
            }
          </strong>
          ?
        </p>

        <p>
          También se eliminarán sus áreas destino y el seguimiento asociado a ellas.
        </p>
      </ModalReutilizable>
    </main>
  );
};

export default Dispersion;