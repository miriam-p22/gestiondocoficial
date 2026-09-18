import React, { useMemo, useState } from "react";

import { useSearchParams } from "react-router-dom";

import Card from "../components/Card";
import TablaReutilizable from "../components/TablaReutilizable";
import FiltroBusqueda from "../components/FiltroBusqueda";
import EtiquetaEstado from "../components/EtiquetaEstado";
import BotonReutilizable from "../components/BotonReutilizable";
import ModalReutilizable from "../components/ModalReutilizable";
import VisorDocumento from "../components/VisorDocumento";
import CampoFormulario from "../components/CampoFormulario";

import useDispersion from "../hooks/useDispersion";
import { useAreas } from "../hooks/useAreas";
import usePermisosUsuario from "../hooks/usePermisosUsuario";

import { FiEye, FiEdit3 } from "react-icons/fi";

import "../styles/Documentos.css";

const SERVER_URL = "http://localhost:3001";

//RESPALDOS POR RANGO
const fechaInput = (fecha) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
};

const obtenerRangoMesActual = () => {
  const hoy = new Date();

  return {
    desde: fechaInput(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
    hasta: fechaInput(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)),
  };
};

const obtenerRangoMesAnterior = () => {
  const hoy = new Date();

  return {
    desde: fechaInput(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)),
    hasta: fechaInput(new Date(hoy.getFullYear(), hoy.getMonth(), 0)),
  };
};

// FORMATEAR FECHA
const formatearFecha = (valor) => {
  if (!valor) {
    return "—";
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "—";
  }

  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",

    month: "2-digit",

    year: "numeric",
  });
};

const formatearFechaHora = (valor) => {
  if (!valor) {
    return "—";
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "—";
  }

  return fecha.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// URL DEL DOCUMENTO
const obtenerUrlDocumento = (archivo) => {
  if (!archivo) {
    return null;
  }

  const ruta = String(archivo).replace(/\\/g, "/").replace(/^\/+/, "");

  return `${SERVER_URL}/${ruta}`;
};

// ESTADO VISUAL
const obtenerEstadoReal = (documento) => {
  const estado = String(documento?.estado_documento || "turnado")
    .trim()
    .toLowerCase();

  if (estado === "atendido" || estado === "devuelto") {
    return estado;
  }

  if (documento?.fecha_limite) {
    const limite = new Date(documento.fecha_limite);
    limite.setHours(23, 59, 59, 999);

    if (Date.now() > limite.getTime()) {
      return "vencido";
    }
  }

  return estado;
};

// TEXTO DEL ESTADO
const obtenerTextoEstado = (documento) => {
  const estado = obtenerEstadoReal(documento);

  switch (estado) {
    case "recibido":
      return "Recibido";

    case "en proceso":
      return "En proceso";

    case "atendido":
      return "Atendido";

    case "devuelto":
      return "Devuelto";

    case "vencido":
      return "Vencido";

    default:
      return "Turnado";
  }
};

// SEMÁFORO
const obtenerTiempo = (documento) => {
  const estado = obtenerEstadoReal(documento);

  if (estado === "atendido") {
    return {
      texto: "Atendido",

      color: "verde",
    };
  }

  if (estado === "devuelto") {
    return {
      texto: "Devuelto",

      color: "gris",
    };
  }

  if (estado === "vencido") {
    return {
      texto: "Vencido",

      color: "rojo",
    };
  }

  if (!documento?.fecha_limite) {
    return {
      texto: "Sin fecha límite",

      color: "gris",
    };
  }

  const ahora = new Date();

  const limite = new Date(documento.fecha_limite);

  limite.setHours(23, 59, 59, 999);

  const diferencia = limite.getTime() - ahora.getTime();

  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

  if (dias <= 0) {
    return {
      texto: "Vence hoy",

      color: "rojo",
    };
  }

  if (dias <= 2) {
    return {
      texto: dias === 1 ? "1 día" : `${dias} días`,

      color: "amarillo",
    };
  }

  return {
    texto: `${dias} días`,

    color: "verde",
  };
};

// TRANSICIONES DE ESTADO
const obtenerOpcionesEstado = (documento) => {
  const estadoActual = String(documento?.estado_documento || "turnado")
    .trim()
    .toLowerCase();

  switch (estadoActual) {
    case "turnado":
      return [
        {
          value: "recibido",
          label: "Recibido",
        },
        {
          value: "devuelto",
          label: "Devuelto",
        },
      ];

    case "recibido":
      return [
        {
          value: "recibido",
          label: "Recibido",
        },
        {
          value: "en proceso",
          label: "En proceso",
        },
        {
          value: "devuelto",
          label: "Devuelto",
        },
      ];

    case "en proceso":
      return [
        {
          value: "en proceso",
          label: "En proceso",
        },
        {
          value: "atendido",
          label: "Atendido",
        },
        {
          value: "devuelto",
          label: "Devuelto",
        },
      ];

    case "atendido":
      return [
        {
          value: "atendido",
          label: "Atendido",
        },
      ];

    case "devuelto":
      return [
        {
          value: "devuelto",
          label: "Devuelto",
        },
      ];

    default:
      return [
        {
          value: "recibido",
          label: "Recibido",
        },
        {
          value: "devuelto",
          label: "Devuelto",
        },
      ];
  }
};

const obtenerResultadoAtencion = (documento) => {
  if (!documento?.fecha_limite || !documento?.fecha_atencion) {
    return null;
  }

  const limite = new Date(documento.fecha_limite);

  limite.setHours(23, 59, 59, 999);

  const atencion = new Date(documento.fecha_atencion);

  if (Number.isNaN(limite.getTime()) || Number.isNaN(atencion.getTime())) {
    return null;
  }

  const diferencia = limite.getTime() - atencion.getTime();

  const dias = Math.floor(Math.abs(diferencia) / (1000 * 60 * 60 * 24));

  if (diferencia >= 0) {
    if (dias === 0) {
      return {
        texto: "Atendido dentro del plazo",
        clase: "a-tiempo",
      };
    }

    return {
      texto: `Atendido ${dias} ${
        dias === 1 ? "día" : "días"
      } antes del vencimiento`,
      clase: "a-tiempo",
    };
  }

  return {
    texto: `Atendido ${dias} ${
      dias === 1 ? "día" : "días"
    } después del vencimiento`,
    clase: "fuera-tiempo",
  };
};

// MOTIVOS DE DEVOLUCIÓN
const motivosDevolucion = [
  {
    value: "no_corresponde_area",
    label: "No corresponde a mi área",
  },

  {
    value: "informacion_incompleta",
    label: "Información incompleta",
  },

  {
    value: "documento_ilegible",
    label: "Documento ilegible",
  },

  {
    value: "documento_duplicado",
    label: "Documento duplicado",
  },

  {
    value: "otro",
    label: "Otro",
  },
];

// COMPONENTE
const Documentos = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filtroDashboard = String(searchParams.get("filtro") || "")
    .trim()
    .toLowerCase();

  const nombreAreaSesion = String(
    localStorage.getItem("nombre_area") || "",
  ).trim();

  const { loading: loadingPermisos, tienePrivilegio } = usePermisosUsuario();

  const puedeConsultarDocumentosGlobal =
    !loadingPermisos && tienePrivilegio("Consultar Documentos Global");

  const puedeGenerarRespaldos =
    !loadingPermisos && tienePrivilegio("Generar Respaldos");

  const esConsultaGlobal = puedeConsultarDocumentosGlobal;

  const {
    dispersiones,

    loading,
    saving,
    error,

    actualizarEstadoDocumento,
  } = useDispersion();

  const { areas = [], loading: loadingAreas } = useAreas();

  // ESTADOS
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isModalVerOpen, setIsModalVerOpen] = useState(false);
  const [isModalGestionOpen, setIsModalGestionOpen] = useState(false);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("recibido");
  const [motivoDevolucion, setMotivoDevolucion] = useState("");
  const [comentarioDevolucion, setComentarioDevolucion] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");

  // MODAL DE RESPALDO
  const rangoInicialRespaldo = obtenerRangoMesActual();
  const [isModalRespaldoOpen, setIsModalRespaldoOpen] = useState(false);
  const [tipoRangoRespaldo, setTipoRangoRespaldo] = useState("mes_actual");
  const [desdeRespaldo, setDesdeRespaldo] = useState(
    rangoInicialRespaldo.desde,
  );
  const [hastaRespaldo, setHastaRespaldo] = useState(
    rangoInicialRespaldo.hasta,
  );
  const [errorRespaldo, setErrorRespaldo] = useState("");
  const [generandoRespaldo, setGenerandoRespaldo] = useState(false);
  const [alcanceRespaldo, setAlcanceRespaldo] = useState(
    puedeGenerarRespaldos ? "general" : "area",
  );
  const [idAreaRespaldo, setIdAreaRespaldo] = useState(
    String(localStorage.getItem("id_area") || ""),
  );

  const documentos = useMemo(() => {
    const resultado = [];

    dispersiones.forEach((dispersion) => {
      (dispersion.destinos || []).forEach((destino) => {
        resultado.push({
          id: `${dispersion.id}-${destino.id_area}`,
          id_dispersion: dispersion.id,
          id_area: destino.id_area,
          nombre_area: destino.area?.nombre_area || "Área",
          nombre_archivo: dispersion.nombre_archivo,
          archivo: dispersion.archivo,
          extension: dispersion.extension,
          fecha_registro: dispersion.fecha_recepcion,
          estado_documento: destino.estado_documento,
          fecha_limite: destino.fecha_limite,
          fecha_recepcion_area:
            destino.fecha_recepcion_area || destino.fecha_recepcion,
          fecha_inicio_proceso: destino.fecha_inicio_proceso,
          fecha_atencion: destino.fecha_atencion || destino.fecha_respuesta,
          motivo_devolucion: destino.motivo_devolucion,
          comentario_devolucion: destino.comentario_devolucion,
          respuesta: destino.respuesta || destino.comentario_respuesta || "",
        });
      });
    });

    return resultado;
  }, [dispersiones]);

  // FILTRAR POR ÁREA DEL USUARIO
  const documentosArea = useMemo(() => {
    const idAreaUsuario = Number(localStorage.getItem("id_area"));

    if (esConsultaGlobal) {
      return documentos;
    }

    if (!Number.isInteger(idAreaUsuario) || idAreaUsuario <= 0) {
      return [];
    }

    return documentos.filter(
      (documento) => Number(documento.id_area) === idAreaUsuario,
    );
  }, [documentos, esConsultaGlobal]);

  // FILTRO DE BÚSQUEDA
  const documentosFiltrados = useMemo(() => {
    const termino = searchQuery.trim().toLowerCase();

    let base = documentosArea;

    if (filtroDashboard) {
      const ahora = new Date();

      base = base.filter((documento) => {
        const estado = String(documento.estado_documento || "turnado")
          .trim()
          .toLowerCase();

        const esFinal = ["atendido", "devuelto"].includes(estado);

        const limite = documento.fecha_limite
          ? new Date(documento.fecha_limite)
          : null;

        if (limite && !Number.isNaN(limite.getTime())) {
          limite.setHours(23, 59, 59, 999);
        }

        if (filtroDashboard === "atendidos") {
          return estado === "atendido";
        }

        if (filtroDashboard === "pendientes") {
          return !esFinal;
        }

        if (filtroDashboard === "recibidos") {
          return estado === "recibido";
        }

        if (filtroDashboard === "en-proceso") {
          return estado === "en proceso";
        }

        if (filtroDashboard === "vencidos") {
          return !esFinal && limite && ahora.getTime() > limite.getTime();
        }

        if (filtroDashboard === "por-vencer") {
          if (esFinal || !limite) {
            return false;
          }

          const diferencia = limite.getTime() - ahora.getTime();
          const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));

          return dias >= 0 && dias <= 3;
        }

        return true;
      });
    }

    if (!termino) {
      return base;
    }

    return base.filter((documento) => {
      const archivo = String(documento.nombre_archivo || "").toLowerCase();

      const area = String(documento.nombre_area || "").toLowerCase();

      const estado = obtenerTextoEstado(documento).toLowerCase();

      return (
        archivo.includes(termino) ||
        area.includes(termino) ||
        estado.includes(termino)
      );
    });
  }, [documentosArea, searchQuery, filtroDashboard]);

  // ACCIONES
  const abrirVer = (documento) => {
    setSelectedDoc(documento);

    setIsModalVerOpen(true);
  };

  const abrirGestionar = (documento) => {
    const estadoActual = String(documento.estado_documento || "turnado")
      .trim()
      .toLowerCase();

    setSelectedDoc(documento);

    setEstadoSeleccionado(
      estadoActual === "turnado" ? "recibido" : estadoActual,
    );

    setMotivoDevolucion(documento.motivo_devolucion || "");
    setComentarioDevolucion(documento.comentario_devolucion || "");
    setRespuesta(documento.respuesta || "");
    setMensaje("");
    setErrorFormulario("");
    setIsModalGestionOpen(true);
  };

  //GUARDAR GESTIÓN
  const guardarGestion = async () => {
    if (!selectedDoc) {
      return;
    }

    try {
      setErrorFormulario("");

      const payload = {
        estado_documento: estadoSeleccionado,
      };

      // DEVUELTO
      if (estadoSeleccionado === "devuelto") {
        if (!motivoDevolucion) {
          throw new Error("Debe seleccionar un motivo de devolución.");
        }

        if (motivoDevolucion === "otro" && !comentarioDevolucion.trim()) {
          throw new Error("Debe escribir el motivo de devolución.");
        }

        payload.motivo_devolucion = motivoDevolucion;
        payload.comentario_devolucion = comentarioDevolucion.trim();
      }

      // ATENDIDO
      if (estadoSeleccionado === "atendido") {
        if (!respuesta.trim()) {
          throw new Error("Debe escribir una respuesta para Oficialía.");
        }

        payload.respuesta = respuesta.trim();
      }

      await actualizarEstadoDocumento(
        selectedDoc.id_dispersion,
        selectedDoc.id_area,
        payload,
      );

      setIsModalGestionOpen(false);

      setSelectedDoc(null);

      if (estadoSeleccionado === "atendido") {
        setMensaje(
          "El documento fue marcado como atendido y la respuesta fue enviada a Oficialía.",
        );
      } else {
        setMensaje("El estado del documento se actualizó correctamente.");
      }
    } catch (err) {
      setErrorFormulario(err?.message || "No fue posible guardar los cambios.");
    }
  };

  // RESPALDO POR RANGO DE FECHAS
  const aplicarTipoRangoRespaldo = (tipo) => {
    setTipoRangoRespaldo(tipo);
    setErrorRespaldo("");

    if (tipo === "mes_actual") {
      const rango = obtenerRangoMesActual();
      setDesdeRespaldo(rango.desde);
      setHastaRespaldo(rango.hasta);
      return;
    }

    if (tipo === "mes_anterior") {
      const rango = obtenerRangoMesAnterior();
      setDesdeRespaldo(rango.desde);
      setHastaRespaldo(rango.hasta);
    }
  };

  const abrirModalRespaldo = () => {
    const rango = obtenerRangoMesActual();

    setTipoRangoRespaldo("mes_actual");
    setDesdeRespaldo(rango.desde);
    setHastaRespaldo(rango.hasta);
    setAlcanceRespaldo(puedeGenerarRespaldos ? "general" : "area");
    setIdAreaRespaldo(String(localStorage.getItem("id_area") || ""));
    setErrorRespaldo("");
    setGenerandoRespaldo(false);
    setIsModalRespaldoOpen(true);
  };

  const cerrarModalRespaldo = () => {
    if (generandoRespaldo) return;

    setIsModalRespaldoOpen(false);
    setErrorRespaldo("");
  };

  const obtenerNombreArchivoRespaldo = (response) => {
    const disposition = response.headers.get("Content-Disposition") || "";

    const coincidencia = disposition.match(/filename="?([^";]+)"?/i);

    return coincidencia?.[1] || "respaldo_documental.zip";
  };

  const obtenerMensajeErrorRespaldo = async (
    response,
    { esPorArea = false, nombreArea = "" } = {},
  ) => {
    let mensajeBackend = "";

    try {
      const data = await response.json();
      mensajeBackend = data?.error || data?.message || "";
    } catch {
      mensajeBackend = "";
    }

    if (response.status === 404 && esPorArea) {
      if (puedeGenerarRespaldos) {
        return nombreArea
          ? `No hay documentos correspondientes al área ${nombreArea} dentro del periodo seleccionado.`
          : "No hay documentos correspondientes al área seleccionada dentro del periodo indicado.";
      }

      return "No hay documentos correspondientes a su área dentro del periodo seleccionado.";
    }

    return (
      mensajeBackend ||
      `No fue posible generar el respaldo. Error HTTP ${response.status}.`
    );
  };

  const guardarBlobConSelector = async (blob, nombreArchivo) => {
    if (
      !window.electronAPI ||
      typeof window.electronAPI.guardarRespaldoZip !== "function"
    ) {
      throw new Error(
        "La función de guardado de Electron no está disponible. Reinicie la aplicación después de actualizar main.js y preload.js.",
      );
    }

    const contenido = await blob.arrayBuffer();

    const resultado = await window.electronAPI.guardarRespaldoZip({
      nombreArchivo,
      contenido,
    });

    if (resultado?.cancelado) {
      return {
        guardado: false,
        cancelado: true,
      };
    }

    if (!resultado?.ok) {
      throw new Error(
        resultado?.error || "No fue posible guardar el respaldo.",
      );
    }

    return {
      guardado: true,
      cancelado: false,
      ruta: resultado?.ruta || "",
    };
  };

  const generarRespaldo = async () => {
    if (generandoRespaldo) return;

    const desde = String(desdeRespaldo || "").trim();
    const hasta = String(hastaRespaldo || "").trim();

    if (!desde || !hasta) {
      setErrorRespaldo(
        "Seleccione la fecha inicial y la fecha final del respaldo.",
      );
      return;
    }

    if (desde > hasta) {
      setErrorRespaldo(
        "La fecha inicial no puede ser posterior a la fecha final.",
      );
      return;
    }

    const parametros = new URLSearchParams({ desde, hasta });
    let url = "";
    let esPorArea = true;
    let areaSeleccionada = null;

    if (puedeGenerarRespaldos && alcanceRespaldo === "general") {
      esPorArea = false;
      url = `${SERVER_URL}/api/backups/general?${parametros.toString()}`;
    } else {
      const idArea = Number(
        puedeGenerarRespaldos
          ? idAreaRespaldo
          : localStorage.getItem("id_area"),
      );

      if (!Number.isInteger(idArea) || idArea <= 0) {
        setErrorRespaldo(
          puedeGenerarRespaldos
            ? "Seleccione el área que desea respaldar."
            : "Para generar el respaldo debe existir un área activa en la sesión.",
        );
        return;
      }

      areaSeleccionada =
        areas.find((area) => Number(area.id) === idArea) || null;

      url = `${SERVER_URL}/api/backups/area/${idArea}?${parametros.toString()}`;
    }

    setErrorRespaldo("");
    setGenerandoRespaldo(true);

    try {
      const token = localStorage.getItem("token");
      const headers = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const mensajeError = await obtenerMensajeErrorRespaldo(response, {
          esPorArea,
          nombreArea: areaSeleccionada?.nombre_area || nombreAreaSesion || "",
        });

        setErrorRespaldo(mensajeError);
        return;
      }

      const tipoContenido = response.headers.get("Content-Type") || "";

      if (!tipoContenido.toLowerCase().includes("application/zip")) {
        setErrorRespaldo(
          "El servidor respondió, pero no devolvió un archivo ZIP válido.",
        );
        return;
      }

      const blob = await response.blob();
      const nombreArchivo = obtenerNombreArchivoRespaldo(response);

      const resultadoGuardado = await guardarBlobConSelector(
        blob,
        nombreArchivo,
      );

      if (resultadoGuardado?.cancelado) {
        setErrorRespaldo(
          "El guardado del respaldo fue cancelado. No se guardó ningún archivo.",
        );
        return;
      }

      setIsModalRespaldoOpen(false);

      setMensaje(
        puedeGenerarRespaldos && !esPorArea
          ? "El respaldo general se guardó correctamente."
          : "El respaldo del área se guardó correctamente.",
      );
    } catch (err) {
      setErrorRespaldo(
        err?.message ||
          "No fue posible generar el respaldo. Verifique la conexión con el servidor.",
      );
    } finally {
      setGenerandoRespaldo(false);
    }
  };

  const columnas = [
    "Archivo",
    "Estado",
    "Fecha límite",
    "Tiempo de respuesta",
    "Acciones",
  ];

  // RENDER ROW
  const renderRow = (documento) => {
    const tiempo = obtenerTiempo(documento);

    const estado = obtenerTextoEstado(documento);

    const estadoBase = String(documento.estado_documento || "turnado")
      .trim()
      .toLowerCase();

    const esDocumentoFinal =
      estadoBase === "atendido" || estadoBase === "devuelto";

    const tituloGestion =
      estadoBase === "atendido"
        ? "Documento finalizado. Ya no puede modificarse desde Gestión Documental."
        : estadoBase === "devuelto"
          ? "Documento devuelto. El proceso se encuentra finalizado."
          : "Gestionar documento";

    return (
      <tr key={documento.id}>
        <td>
          <div className="documento-archivo-cell">
            <strong>{documento.nombre_archivo}</strong>

            <span>{documento.nombre_area}</span>
          </div>
        </td>

        <td>
          <EtiquetaEstado estatus={estado} />
        </td>

        <td>{formatearFecha(documento.fecha_limite)}</td>

        <td>
          <div className="tiempo-respuesta-cell">
            <span>{tiempo.texto}</span>

            <span className={`semaforo semaforo-${tiempo.color}`} />
          </div>
        </td>

        <td>
          <div className="actions-cell">
            <BotonReutilizable
              className="btn-action btn-icon"
              onClick={() => abrirVer(documento)}
              title="Ver documento"
              aria-label="Ver documento"
            >
              <FiEye />
            </BotonReutilizable>

            {!esConsultaGlobal && (
              <BotonReutilizable
                className="btn-action btn-icon edit"
                onClick={() => abrirGestionar(documento)}
                disabled={esDocumentoFinal}
                title={tituloGestion}
                aria-label={tituloGestion}
              >
                <FiEdit3 />
              </BotonReutilizable>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <main className="content-area">
      <section className="content-section">
        <div className="documentos-header">
          <div>
            <h2 className="card-title">Gestión Documental</h2>

            <p className="documentos-subtitle">
              {esConsultaGlobal
                ? "Consulta global de la gestión documental de las áreas municipales."
                : "Documentos asignados al área responsable."}
            </p>
          </div>

          <BotonReutilizable onClick={abrirModalRespaldo}>
            {puedeGenerarRespaldos ? "Generar respaldo" : "Exportar documentos"}
          </BotonReutilizable>
        </div>

        {mensaje && <div className="documentos-mensaje">{mensaje}</div>}

        {error && <div className="documentos-error">{error}</div>}

        {filtroDashboard && (
          <div className="documentos-dashboard-filter">
            <span>
              Filtro desde Dashboard:{" "}
              <strong>
                {filtroDashboard === "por-vencer"
                  ? "Próximos a vencer"
                  : filtroDashboard === "vencidos"
                    ? "Vencidos"
                    : filtroDashboard === "atendidos"
                      ? "Atendidos"
                      : filtroDashboard === "pendientes"
                        ? "Pendientes"
                        : filtroDashboard === "recibidos"
                          ? "Recibidos"
                          : filtroDashboard === "en-proceso"
                            ? "En proceso"
                            : filtroDashboard}
              </strong>
            </span>

            <button type="button" onClick={() => setSearchParams({})}>
              Quitar filtro
            </button>
          </div>
        )}

        <Card className="table-component">
          <div className="toolbar-container">
            <FiltroBusqueda
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar por archivo, área o estado..."
            />
          </div>

          {loading ? (
            <div className="documentos-cargando">Cargando documentos...</div>
          ) : (
            <TablaReutilizable
              className="tabla-documentos"
              columns={columnas}
              data={documentosFiltrados}
              renderRow={renderRow}
            />
          )}
        </Card>
      </section>

      {/* MODAL VER */}
      <ModalReutilizable
        id="modal-ver-documento"
        title="Visualización del documento"
        isOpen={isModalVerOpen}
        onClose={() => {
          setIsModalVerOpen(false);

          setSelectedDoc(null);
        }}
        onAccept={() => {
          setIsModalVerOpen(false);

          setSelectedDoc(null);
        }}
        acceptButtonText="Cerrar"
      >
        {selectedDoc && (
          <>
            <div className="documento-modal-info">
              <div>
                <strong>Archivo</strong>

                <span>{selectedDoc.nombre_archivo}</span>
              </div>

              <div>
                <strong>Área</strong>

                <span>{selectedDoc.nombre_area}</span>
              </div>

              <div>
                <strong>Estado</strong>

                <span>{obtenerTextoEstado(selectedDoc)}</span>
              </div>

              <div>
                <strong>Fecha límite</strong>

                <span>{formatearFecha(selectedDoc.fecha_limite)}</span>
              </div>

              {selectedDoc.fecha_recepcion_area && (
                <div>
                  <strong>Recibido por el área</strong>

                  <span>
                    {formatearFechaHora(selectedDoc.fecha_recepcion_area)}
                  </span>
                </div>
              )}

              {selectedDoc.fecha_inicio_proceso && (
                <div>
                  <strong>Inicio del proceso</strong>

                  <span>
                    {formatearFechaHora(selectedDoc.fecha_inicio_proceso)}
                  </span>
                </div>
              )}

              {selectedDoc.fecha_atencion && (
                <div>
                  <strong>Fecha de atención</strong>

                  <span>{formatearFechaHora(selectedDoc.fecha_atencion)}</span>
                </div>
              )}

              {obtenerResultadoAtencion(selectedDoc) && (
                <div
                  className={`documento-resultado-atencion ${
                    obtenerResultadoAtencion(selectedDoc).clase
                  }`}
                >
                  <strong>Cumplimiento</strong>

                  <span>{obtenerResultadoAtencion(selectedDoc).texto}</span>
                </div>
              )}

              {String(selectedDoc.estado_documento || "").toLowerCase() ===
                "atendido" &&
                selectedDoc.respuesta && (
                  <div className="documento-modal-info-wide">
                    <strong>Respuesta enviada a Oficialía</strong>

                    <span>{selectedDoc.respuesta}</span>
                  </div>
                )}

              {String(selectedDoc.estado_documento || "").toLowerCase() ===
                "devuelto" && (
                <div className="documento-modal-info-wide">
                  <strong>Motivo de devolución</strong>

                  <span>
                    {motivosDevolucion.find(
                      (item) => item.value === selectedDoc.motivo_devolucion,
                    )?.label ||
                      selectedDoc.motivo_devolucion ||
                      "—"}
                  </span>

                  {selectedDoc.comentario_devolucion && (
                    <small>{selectedDoc.comentario_devolucion}</small>
                  )}
                </div>
              )}
            </div>

            <VisorDocumento
              documentUrl={obtenerUrlDocumento(selectedDoc.archivo)}
              documentTitle={selectedDoc.nombre_archivo}
            />
          </>
        )}
      </ModalReutilizable>

      {/* MODAL GESTIONAR */}
      <ModalReutilizable
        id="modal-gestionar-documento"
        title="Gestionar documento"
        isOpen={isModalGestionOpen}
        onClose={() => {
          setIsModalGestionOpen(false);

          setSelectedDoc(null);

          setErrorFormulario("");
        }}
        onAccept={guardarGestion}
        acceptButtonText="Guardar cambios"
        loading={saving}
        errorMessage={errorFormulario}
      >
        {selectedDoc && (
          <div className="documento-gestion">
            <div className="documento-gestion-resumen">
              <strong>{selectedDoc.nombre_archivo}</strong>

              <span>Área: {selectedDoc.nombre_area}</span>

              <span>
                Fecha límite: {formatearFecha(selectedDoc.fecha_limite)}
              </span>
            </div>

            <CampoFormulario
              label="Estado del documento"
              isSelect
              value={estadoSeleccionado}
              onChange={(event) => {
                setEstadoSeleccionado(event.target.value);

                setErrorFormulario("");
              }}
            >
              {obtenerOpcionesEstado(selectedDoc).map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </CampoFormulario>

            <div className="documento-flujo-aviso">
              <strong>Flujo del documento</strong>

              <span>Turnado → Recibido → En proceso → Atendido</span>

              <small>
                Un documento también puede devolverse mientras siga activo.
              </small>
            </div>

            {/* DEVUELTO */}
            {estadoSeleccionado === "devuelto" && (
              <>
                <CampoFormulario
                  label="Motivo de devolución"
                  isSelect
                  value={motivoDevolucion}
                  onChange={(event) => setMotivoDevolucion(event.target.value)}
                >
                  <option value="">Seleccione un motivo</option>

                  {motivosDevolucion.map((motivo) => (
                    <option key={motivo.value} value={motivo.value}>
                      {motivo.label}
                    </option>
                  ))}
                </CampoFormulario>

                <CampoFormulario
                  label="Comentario de devolución"
                  isTextarea
                  rows={4}
                  value={comentarioDevolucion}
                  onChange={(event) =>
                    setComentarioDevolucion(event.target.value)
                  }
                  placeholder="Explique por qué se devuelve el documento..."
                />
              </>
            )}

            {/* ATENDIDO */}
            {estadoSeleccionado === "atendido" && (
              <>
                <div className="respuesta-oficialia-box">
                  <strong>Respuesta para Oficialía de Partes</strong>

                  <p>
                    Esta información será enviada a Oficialía para que pueda
                    consultar la respuesta cuando el ciudadano solicite
                    información sobre su petición.
                  </p>
                </div>

                <CampoFormulario
                  label="Respuesta o comentario"
                  isTextarea
                  rows={5}
                  value={respuesta}
                  onChange={(event) => setRespuesta(event.target.value)}
                  placeholder="Escriba el resultado de la atención realizada..."
                />
              </>
            )}

            {/* TRAZABILIDAD */}
            <div className="documento-trazabilidad">
              <h4>Seguimiento</h4>

              <div>
                <span>Recepción del área</span>

                <strong>
                  {formatearFechaHora(selectedDoc.fecha_recepcion_area)}
                </strong>
              </div>

              <div>
                <span>Inicio del proceso</span>

                <strong>
                  {formatearFechaHora(selectedDoc.fecha_inicio_proceso)}
                </strong>
              </div>

              <div>
                <span>Fecha de atención</span>

                <strong>
                  {formatearFechaHora(selectedDoc.fecha_atencion)}
                </strong>
              </div>
            </div>
          </div>
        )}
      </ModalReutilizable>

      {/* RESPALDO POR FECHA DE RECEPCIÓN */}
      <ModalReutilizable
        id="modal-respaldo-documentos"
        title={
          puedeGenerarRespaldos
            ? "Generar respaldo documental"
            : "Exportar documentos del área"
        }
        isOpen={isModalRespaldoOpen}
        onClose={cerrarModalRespaldo}
        onAccept={generarRespaldo}
        acceptButtonText={
          generandoRespaldo ? "Generando..." : "Generar respaldo"
        }
        loading={generandoRespaldo}
      >
        <div className="documentos-respaldo-form">
          <p className="documentos-respaldo-ayuda">
            El respaldo se genera utilizando la fecha de recepción original del
            documento en Oficialía de Partes.
          </p>

          {errorRespaldo && (
            <div className="documentos-error documentos-respaldo-error">
              {errorRespaldo}
            </div>
          )}

          {puedeGenerarRespaldos && (
            <CampoFormulario
              label="Alcance del respaldo"
              isSelect
              value={alcanceRespaldo}
              onChange={(event) => {
                setAlcanceRespaldo(event.target.value);
                setErrorRespaldo("");
              }}
            >
              <option value="general">Todas las áreas</option>
              <option value="area">Un área específica</option>
            </CampoFormulario>
          )}

          {puedeGenerarRespaldos && alcanceRespaldo === "area" && (
            <CampoFormulario
              label="Área"
              isSelect
              value={idAreaRespaldo}
              onChange={(event) => {
                setIdAreaRespaldo(event.target.value);
                setErrorRespaldo("");
              }}
              disabled={loadingAreas}
            >
              <option value="">
                {loadingAreas ? "Cargando áreas..." : "Seleccione un área"}
              </option>

              {[...areas]
                .sort((a, b) =>
                  String(a.nombre_area || "").localeCompare(
                    String(b.nombre_area || ""),
                    "es",
                  ),
                )
                .map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.nombre_area}
                  </option>
                ))}
            </CampoFormulario>
          )}

          {!puedeGenerarRespaldos && (
            <div className="documentos-respaldo-area-actual">
              <span>Área del respaldo</span>
              <strong>{nombreAreaSesion || "Área de la sesión"}</strong>
            </div>
          )}

          <CampoFormulario
            label="Periodo"
            isSelect
            value={tipoRangoRespaldo}
            onChange={(event) => aplicarTipoRangoRespaldo(event.target.value)}
          >
            <option value="mes_actual">Este mes</option>
            <option value="mes_anterior">Mes anterior</option>
            <option value="personalizado">Rango personalizado</option>
          </CampoFormulario>

          <div className="documentos-respaldo-fechas">
            <CampoFormulario
              label="Desde"
              type="date"
              value={desdeRespaldo}
              onChange={(event) => {
                setTipoRangoRespaldo("personalizado");
                setDesdeRespaldo(event.target.value);
                setErrorRespaldo("");
              }}
            />

            <CampoFormulario
              label="Hasta"
              type="date"
              value={hastaRespaldo}
              onChange={(event) => {
                setTipoRangoRespaldo("personalizado");
                setHastaRespaldo(event.target.value);
                setErrorRespaldo("");
              }}
            />
          </div>

          <div className="documentos-respaldo-nota">
            <strong>Contenido del respaldo</strong>
            <span>
              {puedeGenerarRespaldos && alcanceRespaldo === "general"
                ? "Incluye los documentos recibidos por todas las áreas dentro del periodo seleccionado, su información de dispersión y los archivos de respuesta relacionados."
                : "Incluye únicamente los documentos correspondientes al área seleccionada dentro del periodo indicado, su información de dispersión y los archivos de respuesta relacionados."}
            </span>
          </div>

          {generandoRespaldo && (
            <div className="documentos-respaldo-progreso">
              Preparando archivo ZIP. Espere un momento...
            </div>
          )}
        </div>
      </ModalReutilizable>
    </main>
  );
};

export default Documentos;
