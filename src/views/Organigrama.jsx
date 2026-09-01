import React, { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";

import {
  FiEye,
  FiEdit3,
  FiTrash2,
  FiGitMerge,
  FiMessageSquare,
  FiCheck,
  FiX,
} from "react-icons/fi";

import Card from "../components/Card";
import TablaReutilizable from "../components/TablaReutilizable";
import FiltroBusqueda from "../components/FiltroBusqueda";
import BotonReutilizable from "../components/BotonReutilizable";
import ModalReutilizable from "../components/ModalReutilizable";
import CampoFormulario from "../components/CampoFormulario";
import ArbolOrganigrama from "../components/ArbolOrganigrama";
import "../styles/Organigrama.css";
import { compararVersionesOrganigrama } from "../utils/compararVersionesOrganigrama";
import { useOrganigramas } from "../hooks/useOrganigramas";
import { useAreas } from "../hooks/useAreas";
import { useNiveles } from "../hooks/useNiveles";
import usePermisosUsuario from "../hooks/usePermisosUsuario";

import { validarOrganigrama } from "../utils/validarOrganigrama";

const formatearFecha = (valor) => {
  if (!valor) return "—";

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) return "—";

  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const obtenerEstadoOrganigrama = (org) => {
  const estado = String(org?.estado || "")
    .trim()
    .toLowerCase();

  if (estado) {
    return estado;
  }

  return org?.autorizado ? "autorizado" : "edicion";
};

const obtenerTextoEstado = (org) => {
  const estado = obtenerEstadoOrganigrama(org);

  switch (estado) {
    case "solicitado":
      return "Pendiente de autorización";

    case "autorizado":
      return "Autorizado";

    case "rechazado":
      return "Rechazado";

    case "edicion":
    default:
      return "En edición";
  }
};

const obtenerClaseEstado = (org) => {
  const estado = obtenerEstadoOrganigrama(org);

  switch (estado) {
    case "solicitado":
      return "estado-organigrama solicitado";

    case "autorizado":
      return "estado-organigrama autorizado";

    case "rechazado":
      return "estado-organigrama rechazado";

    case "edicion":
    default:
      return "estado-organigrama edicion";
  }
};

const formularioAreaInicial = {
  id_area: "",
  nivel: "",
  id_nivel_superior: "",
};

const Organigrama = () => {
  // ======================================================
  // PRIVILEGIOS Y ALCANCE
  // ======================================================

  const {
    loading: loadingPermisos,
    error: errorPermisos,
    tienePrivilegio,
  } = usePermisosUsuario();

  const puedeGestionarOrganigrama = tienePrivilegio("Gestionar Organigrama");

  const puedeRevisarOrganigrama = tienePrivilegio("Revisar Organigrama");

  /*
    El comportamiento ya no depende del nombre del rol
    ni de IDs fijos.

    - Gestionar Organigrama:
      historial completo de gestión y herramientas de RH.

    - Revisar Organigrama:
      historial de Presidencia, con solicitudes, autorizados
      y rechazados; autoriza/rechaza únicamente solicitados.

    - Sin privilegios administrativos:
      consulta exclusivamente el organigrama vigente.
  */
  const esConsultaGeneral =
    !puedeGestionarOrganigrama && !puedeRevisarOrganigrama;

  const modoOrganigramas = puedeRevisarOrganigrama
    ? "revision"
    : puedeGestionarOrganigrama
      ? "todos"
      : "vigente";

  const {
    organigramas,
    loading: loadingOrganigramas,
    saving: savingOrganigramas,
    error: errorOrganigramas,
    crearOrganigrama,
    eliminarOrganigrama,
    solicitarAutorizacion,
    autorizarOrganigrama,
    rechazarOrganigrama,
    obtenerOrganigrama,
    limpiarError: limpiarErrorOrganigramas,
  } = useOrganigramas({ modo: modoOrganigramas });

  const {
    areas,
    error: errorAreas,
    limpiarError: limpiarErrorAreas,
  } = useAreas();

  const [selectedOrg, setSelectedOrg] = useState(null);
  const idOrganigrama = selectedOrg?.id || null;

  const {
    niveles,
    loading: loadingNiveles,
    saving: savingNiveles,
    error: errorNiveles,
    cargarNiveles,
    establecerNiveles,
    crearNivel,
    actualizarNivel,
    eliminarNivel,
    limpiarError: limpiarErrorNiveles,
  } = useNiveles(idOrganigrama, {
    autoLoad: !esConsultaGeneral,
  });

  const arbolGestionRef = useRef(null);
  const arbolVistaRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [mostrarGestion, setMostrarGestion] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [errorVista, setErrorVista] = useState("");
  const [exportandoPdf, setExportandoPdf] = useState(false);

  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaVersion, setNuevaVersion] = useState(1);

  const [isModalObservacionesOpen, setIsModalObservacionesOpen] =
    useState(false);

  const [organigramaObservaciones, setOrganigramaObservaciones] =
    useState(null);

  const [isModalVerOpen, setIsModalVerOpen] = useState(false);
  const [nivelesVista, setNivelesVista] = useState([]);

  // ======================================================
  // CONSULTA INSTITUCIONAL
  // ======================================================

  const [organigramaVigente, setOrganigramaVigente] = useState(null);
  const [nivelesConsulta, setNivelesConsulta] = useState([]);
  const [loadingConsulta, setLoadingConsulta] = useState(false);
  const [errorConsulta, setErrorConsulta] = useState("");

  const [isModalInsertarAreaOpen, setIsModalInsertarAreaOpen] = useState(false);
  const [formularioArea, setFormularioArea] = useState(formularioAreaInicial);
  const [errorFormularioArea, setErrorFormularioArea] = useState("");

  const [isModalEditarAreaOpen, setIsModalEditarAreaOpen] = useState(false);
  const [nivelEditando, setNivelEditando] = useState(null);

  const [isModalEliminarAreaOpen, setIsModalEliminarAreaOpen] = useState(false);
  const [nivelAEliminar, setNivelAEliminar] = useState(null);

  const [isModalEliminarOrgOpen, setIsModalEliminarOrgOpen] = useState(false);
  const [orgAEliminar, setOrgAEliminar] = useState(null);

  const [isModalSolicitarOpen, setIsModalSolicitarOpen] = useState(false);

  // ======================================================
  // MODALES DE PRESIDENCIA
  // ======================================================

  const [isModalAutorizarOpen, setIsModalAutorizarOpen] = useState(false);
  const [isModalRechazarOpen, setIsModalRechazarOpen] = useState(false);
  const [organigramaRevision, setOrganigramaRevision] = useState(null);
  const [observacionesRechazo, setObservacionesRechazo] = useState("");
  // ======================================================
  // MODAL COMPARAR VERSIONES
  // ======================================================

  const [isModalCompararOpen, setIsModalCompararOpen] = useState(false);

  const [organigramaComparacion, setOrganigramaComparacion] = useState(null);

  const [idVersionComparar, setIdVersionComparar] = useState("");

  const [resultadoComparacion, setResultadoComparacion] = useState(null);

  const [comparandoVersiones, setComparandoVersiones] = useState(false);

  // ======================================================
  // CARGAR DIRECTAMENTE EL ORGANIGRAMA VIGENTE
  // ======================================================
  //
  // Para consulta general usamos directamente la respuesta de
  // GET /api/organigramas/vigente. Esa respuesta ya contiene
  // la estructura (niveles), por lo que NO hacemos una segunda
  // petición a /organigramas/:id.
  // ======================================================

  useEffect(() => {
    if (!esConsultaGeneral) {
      setOrganigramaVigente(null);
      setNivelesConsulta([]);
      setErrorConsulta("");
      setLoadingConsulta(false);
      return;
    }

    if (loadingOrganigramas) {
      setLoadingConsulta(true);
      return;
    }

    const vigente =
      Array.isArray(organigramas) && organigramas.length > 0
        ? organigramas[0]
        : null;

    if (!vigente) {
      setOrganigramaVigente(null);
      setNivelesConsulta([]);
      setErrorConsulta("");
      setLoadingConsulta(false);
      return;
    }

    const estructura = Array.isArray(vigente.niveles) ? vigente.niveles : [];

    setOrganigramaVigente(vigente);
    setNivelesConsulta(estructura);
    establecerNiveles(estructura);
    setErrorConsulta("");
    setLoadingConsulta(false);
  }, [esConsultaGeneral, loadingOrganigramas, organigramas, establecerNiveles]);

  const limpiarMensajes = () => {
    setMensaje("");
    setErrorVista("");
    limpiarErrorOrganigramas();
    limpiarErrorAreas();
    limpiarErrorNiveles();
  };

  const organigramasFiltrados = useMemo(() => {
    const termino = searchQuery.trim().toLowerCase();

    if (!termino) return organigramas;

    return organigramas.filter((org) =>
      String(org.titulo || "")
        .toLowerCase()
        .includes(termino),
    );
  }, [organigramas, searchQuery]);

  const idsAreasUtilizadas = useMemo(() => {
    return new Set(niveles.map((item) => Number(item.id_area)));
  }, [niveles]);

  const areasDisponibles = useMemo(() => {
    return areas.filter((area) => !idsAreasUtilizadas.has(Number(area.id)));
  }, [areas, idsAreasUtilizadas]);

  const opcionesSuperior = useMemo(() => {
    return niveles
      .filter((item) => {
        if (nivelEditando && item.id === nivelEditando.id) {
          return false;
        }
        return true;
      })
      .map((item) => ({
        id: item.id,
        nombre: item.area?.nombre_area || "Sin área",
        nivel: item.nivel,
      }));
  }, [niveles, nivelEditando]);

  const diagnosticoOrganigrama = useMemo(() => {
    return validarOrganigrama(niveles);
  }, [niveles]);

  const abrirCrear = () => {
    limpiarMensajes();
    setNuevoTitulo("");
    setNuevaVersion(1);
    setIsModalCrearOpen(true);
  };

  const cerrarCrear = () => {
    if (savingOrganigramas) return;

    setIsModalCrearOpen(false);
    setNuevoTitulo("");
    setNuevaVersion(1);
    setErrorVista("");
  };
  const abrirObservaciones = (org) => {
    setOrganigramaObservaciones(org);

    setIsModalObservacionesOpen(true);
  };

  const cerrarObservaciones = () => {
    setIsModalObservacionesOpen(false);

    setOrganigramaObservaciones(null);
  };

  const handleCrearOrganigrama = async () => {
    limpiarMensajes();

    try {
      const titulo = nuevoTitulo.trim();

      if (!titulo) {
        throw new Error("El título del organigrama es obligatorio.");
      }

      const nuevo = await crearOrganigrama({
        titulo,
        version: Number(nuevaVersion) || 1,
      });

      setIsModalCrearOpen(false);
      setNuevoTitulo("");
      setNuevaVersion(1);
      setMensaje("Organigrama creado correctamente.");
      setSelectedOrg(nuevo);
    } catch (err) {
      setErrorVista(err?.message || "No fue posible crear el organigrama.");
    }
  };

  const abrirGestion = async (org) => {
    limpiarMensajes();

    try {
      const actualizado = await obtenerOrganigrama(org.id);
      setSelectedOrg(actualizado);
      setMostrarGestion(true);
    } catch (err) {
      setErrorVista(err?.message || "No fue posible abrir el organigrama.");
    }
  };

  const regresarAOrganigrama = () => {
    setMostrarGestion(false);
    setSelectedOrg(null);
    setMensaje("");
    setErrorVista("");
  };

  const abrirVer = async (org) => {
    limpiarMensajes();

    try {
      const completo = await obtenerOrganigrama(org.id);
      setNivelesVista(completo.niveles || []);
      setSelectedOrg(completo);
      setIsModalVerOpen(true);
    } catch (err) {
      setErrorVista(err?.message || "No fue posible cargar el organigrama.");
    }
  };

  const cerrarVer = () => {
    if (exportandoPdf) return;

    setIsModalVerOpen(false);
    setNivelesVista([]);
  };

  const abrirInsertarArea = () => {
    limpiarMensajes();
    setFormularioArea(formularioAreaInicial);
    setErrorFormularioArea("");
    setIsModalInsertarAreaOpen(true);
  };

  const cerrarInsertarArea = () => {
    if (savingNiveles) return;

    setIsModalInsertarAreaOpen(false);
    setFormularioArea(formularioAreaInicial);
    setErrorFormularioArea("");
  };

  const handleCambioArea = (event) => {
    const { name, value } = event.target;
    setErrorFormularioArea("");
    setFormularioArea((actual) => ({
      ...actual,
      [name]: value,
    }));
  };

  const handleAgregarArea = async () => {
    setErrorFormularioArea("");

    try {
      if (!selectedOrg) {
        throw new Error("No existe un organigrama seleccionado.");
      }

      const numeroNivel = Number(formularioArea.nivel);

      if (!Number.isInteger(numeroNivel) || numeroNivel <= 0) {
        throw new Error("Capture un nivel válido.");
      }

      if (!formularioArea.id_area) {
        throw new Error("Debe seleccionar un área.");
      }

      const idArea = Number(formularioArea.id_area);

      if (idsAreasUtilizadas.has(idArea)) {
        throw new Error(
          "El área seleccionada ya forma parte de este organigrama.",
        );
      }

      const idNivelSuperior = formularioArea.id_nivel_superior
        ? Number(formularioArea.id_nivel_superior)
        : null;

      await crearNivel({
        id_organigrama: selectedOrg.id,
        id_area: idArea,
        nivel: numeroNivel,
        id_nivel_superior: idNivelSuperior,
      });

      await cargarNiveles(selectedOrg.id);

      setIsModalInsertarAreaOpen(false);
      setFormularioArea(formularioAreaInicial);
      setMensaje("Área agregada al organigrama correctamente.");
    } catch (err) {
      setErrorFormularioArea(err?.message || "No fue posible agregar el área.");
    }
  };

  const abrirEditarArea = (item) => {
    limpiarMensajes();

    setNivelEditando(item);

    setFormularioArea({
      id_area: String(item.id_area),
      nivel: String(item.nivel ?? ""),
      id_nivel_superior: item.id_nivel_superior
        ? String(item.id_nivel_superior)
        : "",
    });

    setErrorFormularioArea("");
    setIsModalEditarAreaOpen(true);
  };

  const cerrarEditarArea = () => {
    if (savingNiveles) return;

    setIsModalEditarAreaOpen(false);
    setNivelEditando(null);
    setFormularioArea(formularioAreaInicial);
    setErrorFormularioArea("");
  };

  const guardarEdicionArea = async () => {
    setErrorFormularioArea("");

    try {
      if (!nivelEditando) {
        throw new Error("No existe un área seleccionada.");
      }

      const numeroNivel = Number(formularioArea.nivel);

      if (!Number.isInteger(numeroNivel) || numeroNivel <= 0) {
        throw new Error("Capture un nivel válido.");
      }

      const idNivelSuperior = formularioArea.id_nivel_superior
        ? Number(formularioArea.id_nivel_superior)
        : null;

      await actualizarNivel(nivelEditando.id, {
        nivel: numeroNivel,
        id_nivel_superior: idNivelSuperior,
      });

      await cargarNiveles(selectedOrg.id);

      setIsModalEditarAreaOpen(false);
      setNivelEditando(null);
      setFormularioArea(formularioAreaInicial);
      setMensaje("Relación actualizada correctamente.");
    } catch (err) {
      setErrorFormularioArea(
        err?.message || "No fue posible actualizar la relación.",
      );
    }
  };

  const abrirEliminarArea = (item) => {
    limpiarMensajes();
    setNivelAEliminar(item);
    setErrorFormularioArea("");
    setIsModalEliminarAreaOpen(true);
  };

  const cerrarEliminarArea = () => {
    if (savingNiveles) return;

    setIsModalEliminarAreaOpen(false);
    setNivelAEliminar(null);
    setErrorFormularioArea("");
  };

  const handleEliminarArea = async () => {
    if (!nivelAEliminar) return;

    setErrorFormularioArea("");

    try {
      await eliminarNivel(nivelAEliminar.id);
      await cargarNiveles(selectedOrg.id);

      setIsModalEliminarAreaOpen(false);
      setNivelAEliminar(null);
      setMensaje("Área eliminada del organigrama correctamente.");
    } catch (err) {
      setErrorFormularioArea(
        err?.message || "No fue posible eliminar el área.",
      );
    }
  };

  const abrirEliminarOrg = (org) => {
    limpiarMensajes();
    setOrgAEliminar(org);
    setIsModalEliminarOrgOpen(true);
  };

  const cerrarEliminarOrg = () => {
    if (savingOrganigramas) return;

    setOrgAEliminar(null);
    setIsModalEliminarOrgOpen(false);
  };

  const handleEliminarOrg = async () => {
    if (!orgAEliminar) return;

    setErrorVista("");

    try {
      await eliminarOrganigrama(orgAEliminar.id);

      setOrgAEliminar(null);
      setIsModalEliminarOrgOpen(false);
      setMensaje("Organigrama eliminado correctamente.");
    } catch (err) {
      setErrorVista(err?.message || "No fue posible eliminar el organigrama.");
    }
  };

  const abrirSolicitar = () => {
    limpiarMensajes();

    if (!diagnosticoOrganigrama.valido) {
      setErrorVista(
        "El organigrama contiene errores en su estructura. Revise las relaciones entre las áreas antes de solicitar autorización.",
      );
      return;
    }

    setIsModalSolicitarOpen(true);
  };

  const cerrarSolicitar = () => {
    if (savingOrganigramas) return;

    setIsModalSolicitarOpen(false);
    setErrorVista("");
  };

  const handleSolicitar = async () => {
    if (!selectedOrg) return;

    if (!diagnosticoOrganigrama.valido) {
      setErrorVista("La estructura todavía contiene errores.");
      return;
    }

    setErrorVista("");

    try {
      const actualizado = await solicitarAutorizacion(selectedOrg.id);

      setSelectedOrg(actualizado);
      setIsModalSolicitarOpen(false);

      await cargarNiveles(selectedOrg.id);

      setMensaje("La solicitud de autorización fue procesada correctamente.");
    } catch (err) {
      setErrorVista(
        err?.message || "No fue posible solicitar la autorización.",
      );
    }
  };

  // ======================================================
  // PRESIDENCIA - AUTORIZAR
  // ======================================================

  const abrirAutorizar = (org) => {
    limpiarMensajes();
    setOrganigramaRevision(org);
    setIsModalAutorizarOpen(true);
  };

  const cerrarAutorizar = () => {
    if (savingOrganigramas) return;

    setIsModalAutorizarOpen(false);
    setOrganigramaRevision(null);
  };

  const handleAutorizar = async () => {
    if (!organigramaRevision) return;

    try {
      await autorizarOrganigrama(organigramaRevision.id);

      setIsModalAutorizarOpen(false);
      setOrganigramaRevision(null);
      setMensaje("Organigrama autorizado correctamente.");
    } catch (err) {
      setErrorVista(err?.message || "No fue posible autorizar el organigrama.");
    }
  };

  // ======================================================
  // PRESIDENCIA - RECHAZAR
  // ======================================================

  const abrirRechazar = (org) => {
    limpiarMensajes();
    setOrganigramaRevision(org);
    setObservacionesRechazo("");
    setIsModalRechazarOpen(true);
  };

  const cerrarRechazar = () => {
    if (savingOrganigramas) return;

    setIsModalRechazarOpen(false);
    setOrganigramaRevision(null);
    setObservacionesRechazo("");
  };

  const handleRechazar = async () => {
    if (!organigramaRevision) return;

    const observaciones = observacionesRechazo.trim();

    if (!observaciones) {
      setErrorVista("Debe escribir el motivo del rechazo.");
      return;
    }

    try {
      await rechazarOrganigrama(organigramaRevision.id, observaciones);

      setIsModalRechazarOpen(false);
      setOrganigramaRevision(null);
      setObservacionesRechazo("");
      setMensaje(
        "El organigrama fue rechazado y las observaciones quedaron registradas.",
      );
    } catch (err) {
      setErrorVista(err?.message || "No fue posible rechazar el organigrama.");
    }
  };

  // ======================================================
  // EXPORTAR PDF
  // PDF VECTORIAL - SIN HTML2CANVAS
  // ======================================================

  const exportarOrganigramaPdf = async ({ nivelesExportar, organigrama }) => {
    if (!Array.isArray(nivelesExportar) || nivelesExportar.length === 0) {
      setErrorVista("El organigrama no tiene una estructura para exportar.");

      return;
    }

    if (!organigrama) {
      setErrorVista("No existe un organigrama seleccionado.");

      return;
    }

    setExportandoPdf(true);
    setErrorVista("");

    try {
      // ==================================================
      // CONSTRUIR ÁRBOL
      // ==================================================

      const porId = new Map();

      const hijosPorPadre = new Map();

      nivelesExportar.forEach((item) => {
        const id = Number(item.id);

        porId.set(id, item);

        hijosPorPadre.set(id, []);
      });

      nivelesExportar.forEach((item) => {
        if (
          item.id_nivel_superior === null ||
          item.id_nivel_superior === undefined
        ) {
          return;
        }

        const padreId = Number(item.id_nivel_superior);

        if (hijosPorPadre.has(padreId)) {
          hijosPorPadre.get(padreId).push(item);
        }
      });

      const raices = nivelesExportar.filter(
        (item) =>
          item.id_nivel_superior === null ||
          item.id_nivel_superior === undefined,
      );

      if (raices.length !== 1) {
        throw new Error(
          "El organigrama debe tener exactamente una raíz para exportarse.",
        );
      }

      const raiz = raices[0];

      // ==================================================
      // ORDENAR HIJOS
      // ==================================================

      hijosPorPadre.forEach((lista) => {
        lista.sort((a, b) =>
          String(a.area?.nombre_area || "").localeCompare(
            String(b.area?.nombre_area || ""),
            "es",
          ),
        );
      });

      // ==================================================
      // CONTAR HOJAS
      // Determina cuánto espacio horizontal necesita
      // cada rama.
      // ==================================================

      const contarHojas = (nodo, visitados = new Set()) => {
        const id = Number(nodo.id);

        if (visitados.has(id)) {
          return 1;
        }

        const siguientes = new Set(visitados);

        siguientes.add(id);

        const hijos = hijosPorPadre.get(id) || [];

        if (hijos.length === 0) {
          return 1;
        }

        return hijos.reduce(
          (acumulado, hijo) => acumulado + contarHojas(hijo, siguientes),
          0,
        );
      };

      const totalHojas = contarHojas(raiz);

      // ==================================================
      // MEDIDAS DEL ORGANIGRAMA
      // ==================================================

      const anchoNodo = 48;
      const altoNodo = 19;

      const espacioHorizontal = 10;
      const espacioVertical = 23;

      const margenX = 12;
      const margenInferior = 12;

      const inicioY = 42;

      /*
      Cada hoja necesita el ancho de una caja
      más separación.
    */
      const anchoArbol = Math.max(
        260,
        totalHojas * (anchoNodo + espacioHorizontal),
      );

      // ==================================================
      // PROFUNDIDAD
      // ==================================================

      const obtenerProfundidad = (nodo, visitados = new Set()) => {
        const id = Number(nodo.id);

        if (visitados.has(id)) {
          return 1;
        }

        const siguientes = new Set(visitados);

        siguientes.add(id);

        const hijos = hijosPorPadre.get(id) || [];

        if (hijos.length === 0) {
          return 1;
        }

        return (
          1 +
          Math.max(...hijos.map((hijo) => obtenerProfundidad(hijo, siguientes)))
        );
      };

      const profundidad = obtenerProfundidad(raiz);

      const altoArbol =
        profundidad * (altoNodo + espacioVertical) + inicioY + margenInferior;

      // ==================================================
      // TAMAÑO DE PÁGINA
      // ==================================================

      /*
      Usamos un PDF de tamaño personalizado.

      Esto evita encoger un organigrama grande
      hasta que el texto sea ilegible.
    */

      const anchoPagina = Math.max(297, anchoArbol + margenX * 2);

      const altoPagina = Math.max(210, altoArbol);

      const pdf = new jsPDF({
        orientation: "landscape",

        unit: "mm",

        format: [anchoPagina, altoPagina],
      });

      // ==================================================
      // ENCABEZADO
      // ==================================================

      pdf.setTextColor(30, 30, 30);

      pdf.setFont("helvetica", "bold");

      pdf.setFontSize(16);

      pdf.text(String(organigrama.titulo || "Organigrama"), margenX, 14);

      pdf.setFont("helvetica", "normal");

      pdf.setFontSize(9);

      pdf.text(`Versión: ${organigrama.version ?? "—"}`, margenX, 20);

      pdf.text(
        `Fecha de creación: ${formatearFecha(organigrama.fecha_solicitud)}`,
        margenX,
        25,
      );

      if (organigrama.autorizado) {
        pdf.text(
          `Fecha de autorización: ${formatearFecha(
            organigrama.fecha_autorizacion,
          )}`,
          margenX,
          30,
        );
      }

      // ==================================================
      // CALCULAR POSICIONES
      // ==================================================

      const posiciones = new Map();

      let cursorX = margenX;

      const posicionarNodo = (
        nodo,
        profundidadActual = 0,
        visitados = new Set(),
      ) => {
        const id = Number(nodo.id);

        if (visitados.has(id)) {
          return;
        }

        const siguientes = new Set(visitados);

        siguientes.add(id);

        const hijos = hijosPorPadre.get(id) || [];

        const y = inicioY + profundidadActual * (altoNodo + espacioVertical);

        // ================================================
        // HOJA
        // ================================================

        if (hijos.length === 0) {
          const x = cursorX;

          posiciones.set(id, {
            x,
            y,
          });

          cursorX += anchoNodo + espacioHorizontal;

          return;
        }

        // ================================================
        // POSICIONAR HIJOS PRIMERO
        // ================================================

        hijos.forEach((hijo) =>
          posicionarNodo(hijo, profundidadActual + 1, siguientes),
        );

        const primera = posiciones.get(Number(hijos[0].id));

        const ultima = posiciones.get(Number(hijos[hijos.length - 1].id));

        const centroPrimero = primera.x + anchoNodo / 2;

        const centroUltimo = ultima.x + anchoNodo / 2;

        const centro = (centroPrimero + centroUltimo) / 2;

        posiciones.set(id, {
          x: centro - anchoNodo / 2,

          y,
        });
      };

      posicionarNodo(raiz);

      // ==================================================
      // DIBUJAR CONEXIONES
      // ==================================================

      pdf.setDrawColor(52, 139, 173);

      pdf.setLineWidth(0.45);

      nivelesExportar.forEach((item) => {
        if (
          item.id_nivel_superior === null ||
          item.id_nivel_superior === undefined
        ) {
          return;
        }

        const hijo = posiciones.get(Number(item.id));

        const padre = posiciones.get(Number(item.id_nivel_superior));

        if (!hijo || !padre) {
          return;
        }

        const padreX = padre.x + anchoNodo / 2;

        const padreY = padre.y + altoNodo;

        const hijoX = hijo.x + anchoNodo / 2;

        const hijoY = hijo.y;

        const mitadY = padreY + (hijoY - padreY) / 2;

        /*
          Línea vertical desde padre.
        */
        pdf.line(padreX, padreY, padreX, mitadY);

        /*
          Línea horizontal hasta hijo.
        */
        pdf.line(padreX, mitadY, hijoX, mitadY);

        /*
          Línea vertical hacia el hijo.
        */
        pdf.line(hijoX, mitadY, hijoX, hijoY);
      });

      // ==================================================
      // DIBUJAR NODOS
      // ==================================================

      nivelesExportar.forEach((item) => {
        const posicion = posiciones.get(Number(item.id));

        if (!posicion) {
          return;
        }

        const esRaiz =
          item.id_nivel_superior === null ||
          item.id_nivel_superior === undefined;

        // ================================================
        // CAJA
        // ================================================

        if (esRaiz) {
          pdf.setFillColor(52, 139, 173);

          pdf.setDrawColor(52, 139, 173);
        } else {
          pdf.setFillColor(255, 255, 255);

          pdf.setDrawColor(52, 139, 173);
        }

        pdf.roundedRect(
          posicion.x,
          posicion.y,
          anchoNodo,
          altoNodo,
          2,
          2,
          "FD",
        );

        // ================================================
        // NOMBRE
        // ================================================

        const nombre = String(item.area?.nombre_area || "Sin área");

        const lineasNombre = pdf.splitTextToSize(nombre, anchoNodo - 6);

        pdf.setFont("helvetica", "bold");

        pdf.setFontSize(7.5);

        if (esRaiz) {
          pdf.setTextColor(255, 255, 255);
        } else {
          pdf.setTextColor(50, 50, 50);
        }

        const altoTexto = lineasNombre.length * 3;

        const inicioTexto =
          posicion.y + Math.max(6, (altoNodo - altoTexto) / 2);

        lineasNombre.forEach((linea, indice) => {
          pdf.text(
            linea,
            posicion.x + anchoNodo / 2,
            inicioTexto + indice * 3.2,
            {
              align: "center",
            },
          );
        });

        // ================================================
        // NIVEL
        // ================================================

        pdf.setFont("helvetica", "normal");

        pdf.setFontSize(6);

        if (esRaiz) {
          pdf.setTextColor(235, 245, 249);
        } else {
          pdf.setTextColor(110, 110, 110);
        }

        pdf.text(
          `Nivel ${item.nivel ?? "—"}`,
          posicion.x + anchoNodo / 2,
          posicion.y + altoNodo - 3,
          {
            align: "center",
          },
        );
      });

      // ==================================================
      // NOMBRE DE ARCHIVO
      // ==================================================

      const tituloSeguro = String(organigrama.titulo || "Organigrama")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "_")
        .replace(/^_+|_+$/g, "");

      pdf.save(`${tituloSeguro}_V${organigrama.version || 1}.pdf`);

      setMensaje("PDF generado correctamente.");
    } catch (error) {
      console.error("Error al generar PDF:", error);

      setErrorVista(
        error?.message || "No fue posible generar el PDF del organigrama.",
      );
    } finally {
      setExportandoPdf(false);
    }
  };

  // ======================================================
  // COMPARAR VERSIONES
  // ======================================================

  const abrirComparar = (org) => {
    limpiarMensajes();

    setOrganigramaComparacion(org);

    setIdVersionComparar("");

    setResultadoComparacion(null);

    setIsModalCompararOpen(true);
  };

  const cerrarComparar = () => {
    if (comparandoVersiones) {
      return;
    }

    setIsModalCompararOpen(false);

    setOrganigramaComparacion(null);

    setIdVersionComparar("");

    setResultadoComparacion(null);
  };

  const ejecutarComparacion = async () => {
    if (!organigramaComparacion) {
      return;
    }

    if (!idVersionComparar) {
      setErrorVista("Seleccione una versión para realizar la comparación.");

      return;
    }

    setComparandoVersiones(true);

    setErrorVista("");

    try {
      const actual = await obtenerOrganigrama(organigramaComparacion.id);

      const anterior = await obtenerOrganigrama(Number(idVersionComparar));

      const resultado = compararVersionesOrganigrama(
        anterior.niveles || [],
        actual.niveles || [],
      );

      setResultadoComparacion({
        ...resultado,

        actual: {
          id: actual.id,

          titulo: actual.titulo,

          version: actual.version,
        },

        anterior: {
          id: anterior.id,

          titulo: anterior.titulo,

          version: anterior.version,
        },
      });
    } catch (error) {
      setErrorVista(
        error?.message || "No fue posible comparar los organigramas.",
      );
    } finally {
      setComparandoVersiones(false);
    }
  };

  // ======================================================
  // TABLA ORGANIGRAMAS
  // ======================================================
  const columnasOrganigramas = [
    "Título",
    "Versión",
    "Fecha de solicitud",
    "Estatus",
    "Fecha de autorización",
    "Acciones",
  ];

  const dataOrganigramas = organigramasFiltrados.map((org) => ({
    _id: org.id,
    Título: {
      main: org.titulo,
    },
    Versión: {
      main: org.version,
    },
    "Fecha de solicitud": {
      main: formatearFecha(org.fecha_solicitud),
    },
    Estatus: {
      main: (
        <span className={obtenerClaseEstado(org)}>
          {obtenerTextoEstado(org)}
        </span>
      ),
    },
    "Fecha de autorización": {
      main: formatearFecha(org.fecha_autorizacion),
    },
    Acciones: {
      main: (
        <div className="actions-cell organigrama-actions">
          {puedeGestionarOrganigrama && (
            <>
              {obtenerEstadoOrganigrama(org) === "edicion" && (
                <>
                  <BotonReutilizable
                    className="btn-action btn-icon edit"
                    onClick={() => abrirGestion(org)}
                    title="Gestionar"
                    aria-label="Gestionar organigrama"
                  >
                    <FiEdit3 />
                  </BotonReutilizable>

                  <BotonReutilizable
                    className="btn-action btn-icon delete"
                    onClick={() => abrirEliminarOrg(org)}
                    title="Eliminar"
                    aria-label="Eliminar organigrama"
                  >
                    <FiTrash2 />
                  </BotonReutilizable>
                </>
              )}

              {obtenerEstadoOrganigrama(org) === "solicitado" && (
                <BotonReutilizable
                  className="btn-action btn-icon"
                  onClick={() => abrirVer(org)}
                  title="Ver"
                  aria-label="Ver organigrama"
                >
                  <FiEye />
                </BotonReutilizable>
              )}

              {obtenerEstadoOrganigrama(org) === "autorizado" && (
                <BotonReutilizable
                  className="btn-action btn-icon status-active"
                  onClick={() => abrirVer(org)}
                  title="Ver"
                  aria-label="Ver organigrama"
                >
                  <FiEye />
                </BotonReutilizable>
              )}

              {obtenerEstadoOrganigrama(org) === "rechazado" && (
                <>
                  <BotonReutilizable
                    className="btn-action btn-icon edit"
                    onClick={() => abrirGestion(org)}
                    title="Corregir"
                    aria-label="Corregir organigrama"
                  >
                    <FiEdit3 />
                  </BotonReutilizable>

                  <BotonReutilizable
                    className="btn-action btn-icon"
                    onClick={() => abrirObservaciones(org)}
                    title="Ver observaciones"
                    aria-label="Ver observaciones"
                  >
                    <FiMessageSquare />
                  </BotonReutilizable>
                </>
              )}

              <BotonReutilizable
                className="btn-action btn-icon"
                onClick={() => abrirComparar(org)}
                title="Comparar versiones"
                aria-label="Comparar versiones"
              >
                <FiGitMerge />
              </BotonReutilizable>
            </>
          )}

          {puedeRevisarOrganigrama && (
            <>
              <BotonReutilizable
                className="btn-action btn-icon"
                onClick={() => abrirVer(org)}
                title="Ver organigrama"
                aria-label="Ver organigrama"
              >
                <FiEye />
              </BotonReutilizable>

              {obtenerEstadoOrganigrama(org) === "solicitado" && (
                <>
                  <BotonReutilizable
                    className="btn-action btn-icon status-active"
                    onClick={() => abrirAutorizar(org)}
                    title="Autorizar"
                    aria-label="Autorizar organigrama"
                  >
                    <FiCheck />
                  </BotonReutilizable>

                  <BotonReutilizable
                    className="btn-action btn-icon delete"
                    onClick={() => abrirRechazar(org)}
                    title="Rechazar"
                    aria-label="Rechazar organigrama"
                  >
                    <FiX />
                  </BotonReutilizable>
                </>
              )}

              {obtenerEstadoOrganigrama(org) === "rechazado" &&
                org.observaciones && (
                  <BotonReutilizable
                    className="btn-action btn-icon"
                    onClick={() => abrirObservaciones(org)}
                    title="Ver motivo del rechazo"
                    aria-label="Ver motivo del rechazo"
                  >
                    <FiMessageSquare />
                  </BotonReutilizable>
                )}

              <BotonReutilizable
                className="btn-action btn-icon"
                onClick={() => abrirComparar(org)}
                title="Comparar versiones"
                aria-label="Comparar versiones"
              >
                <FiGitMerge />
              </BotonReutilizable>
            </>
          )}

          {esConsultaGeneral && (
            <BotonReutilizable
              className="btn-action btn-icon status-active"
              onClick={() => abrirVer(org)}
              title="Ver organigrama vigente"
              aria-label="Ver organigrama vigente"
            >
              <FiEye />
            </BotonReutilizable>
          )}
        </div>
      ),
    },
  }));

  const columnasNiveles = ["Área", "Nivel", "Área superior", "Acciones"];

  const dataNiveles = niveles.map((item) => ({
    _id: item.id,

    Área: {
      main: item.area?.nombre_area || "—",
    },

    Nivel: {
      main: item.nivel ?? "—",
    },

    "Área superior": {
      main: item.superior?.area?.nombre_area || "Ninguna (raíz)",
    },

    Acciones: {
      main: (
        <div className="actions-cell">
          <BotonReutilizable
            className="btn-action btn-icon edit"
            disabled={
              obtenerEstadoOrganigrama(selectedOrg) === "solicitado" ||
              obtenerEstadoOrganigrama(selectedOrg) === "autorizado"
            }
            onClick={() => abrirEditarArea(item)}
            title="Editar relación"
            aria-label="Editar relación"
          >
            <FiEdit3 />
          </BotonReutilizable>

          <BotonReutilizable
            className="btn-action btn-icon delete"
            disabled={
              obtenerEstadoOrganigrama(selectedOrg) === "solicitado" ||
              obtenerEstadoOrganigrama(selectedOrg) === "autorizado"
            }
            onClick={() => abrirEliminarArea(item)}
            title="Eliminar área"
            aria-label="Eliminar área"
          >
            <FiTrash2 />
          </BotonReutilizable>
        </div>
      ),
    },
  }));

  // ======================================================
  // VERSIONES DISPONIBLES PARA COMPARAR
  // ======================================================

  const versionesDisponiblesComparacion = useMemo(() => {
    if (!organigramaComparacion) {
      return [];
    }

    return organigramas.filter(
      (org) => Number(org.id) !== Number(organigramaComparacion.id),
    );
  }, [organigramas, organigramaComparacion]);
  const errorGeneral =
    errorVista ||
    errorConsulta ||
    errorOrganigramas ||
    errorAreas ||
    errorNiveles;

  return (
    <main className="content-area">
      <section className="content-section">
        {!mostrarGestion && esConsultaGeneral && (
          <>
            <div className="organigrama-consulta-header">
              <div>
                <h2 className="card-title">Organigrama Institucional</h2>

                <p className="organigrama-view-description">
                  Consulta la última versión autorizada del organigrama
                  municipal.
                </p>
              </div>

              {organigramaVigente && (
                <div className="organigrama-vigente-meta">
                  <span className="organigrama-vigente-badge">
                    Versión vigente {organigramaVigente.version ?? "—"}
                  </span>

                  <span>
                    Autorizado:{" "}
                    <strong>
                      {formatearFecha(organigramaVigente.fecha_autorizacion)}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {errorGeneral && (
              <div className="page-message page-message-error">
                {errorGeneral}
              </div>
            )}

            <Card className="organigrama-vigente-card">
              {loadingPermisos || loadingOrganigramas || loadingConsulta ? (
                <div className="organigrama-vigente-loading">
                  Cargando organigrama institucional...
                </div>
              ) : !organigramaVigente ? (
                <div className="organigrama-vigente-empty">
                  Todavía no existe un organigrama institucional autorizado.
                </div>
              ) : nivelesConsulta.length === 0 ? (
                <div className="organigrama-vigente-empty">
                  La versión vigente todavía no contiene una estructura
                  disponible.
                </div>
              ) : (
                <>
                  <div className="organigrama-vigente-title">
                    <strong>
                      {organigramaVigente.titulo || "Organigrama Institucional"}
                    </strong>
                  </div>

                  <div className="organigrama-preview-card organigrama-vigente-tree">
                    <ArbolOrganigrama
                      ref={arbolVistaRef}
                      niveles={nivelesConsulta}
                    />
                  </div>
                </>
              )}
            </Card>
          </>
        )}

        {!mostrarGestion && !esConsultaGeneral && (
          <>
            <h2 className="card-title">
              {puedeRevisarOrganigrama
                ? "Historial y revisión de organigramas"
                : "Organigrama"}
            </h2>

            {puedeGestionarOrganigrama && (
              <div className="management-buttons-container">
                <BotonReutilizable onClick={abrirCrear}>
                  Nueva versión
                </BotonReutilizable>
              </div>
            )}

            <div className="search-filter-container">
              <FiltroBusqueda
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar organigrama..."
              />
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

            <Card>
              {loadingOrganigramas ? (
                <p>Cargando organigramas...</p>
              ) : organigramasFiltrados.length === 0 ? (
                <p>"No hay organigramas registrados."</p>
              ) : (
                <TablaReutilizable
                  columns={columnasOrganigramas}
                  data={dataOrganigramas}
                  renderRow={(row) => (
                    <tr key={row._id}>
                      {columnasOrganigramas.map((column) => (
                        <td key={column}>{row[column]?.main ?? ""}</td>
                      ))}
                    </tr>
                  )}
                />
              )}
            </Card>
          </>
        )}

        {mostrarGestion && selectedOrg && (
          <>
            <h2 className="card-title">Gestión organizacional</h2>

            <div className="organigrama-selected-info">
              <strong>{selectedOrg.titulo}</strong>
              <span>Versión {selectedOrg.version}</span>
            </div>

            {obtenerEstadoOrganigrama(selectedOrg) === "rechazado" &&
              selectedOrg.observaciones && (
                <div className="organigrama-observaciones-aviso">
                  <strong>Observaciones de Presidencia</strong>

                  <p>{selectedOrg.observaciones}</p>
                </div>
              )}

            <div className="management-buttons-container">
              <BotonReutilizable
                className="btn-secondary"
                onClick={regresarAOrganigrama}
              >
                Regresar
              </BotonReutilizable>

              <BotonReutilizable
                onClick={abrirInsertarArea}
                disabled={
                  obtenerEstadoOrganigrama(selectedOrg) !== "edicion" &&
                  obtenerEstadoOrganigrama(selectedOrg) !== "rechazado"
                }
              >
                Agregar área al organigrama
              </BotonReutilizable>

              <BotonReutilizable
                className="status-active"
                onClick={abrirSolicitar}
                disabled={
                  obtenerEstadoOrganigrama(selectedOrg) === "solicitado" ||
                  obtenerEstadoOrganigrama(selectedOrg) === "autorizado"
                }
              >
                Solicitar autorización
              </BotonReutilizable>
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

            <Card>
              {loadingNiveles ? (
                <p>Cargando estructura...</p>
              ) : niveles.length === 0 ? (
                <p>Este organigrama todavía no tiene áreas.</p>
              ) : (
                <TablaReutilizable
                  columns={columnasNiveles}
                  data={dataNiveles}
                  renderRow={(row) => (
                    <tr key={row._id}>
                      {columnasNiveles.map((column) => (
                        <td key={column}>{row[column]?.main ?? ""}</td>
                      ))}
                    </tr>
                  )}
                />
              )}
            </Card>

            <div className="organigrama-preview-section">
              <div className="organigrama-preview-header">
                <div>
                  <h3>Vista previa del organigrama</h3>
                  <p>
                    Se actualiza automáticamente conforme agregas, editas o
                    eliminas áreas.
                  </p>
                </div>

                <BotonReutilizable
                  onClick={() =>
                    exportarOrganigramaPdf({
                      nivelesExportar: niveles,

                      organigrama: selectedOrg,
                    })
                  }
                  disabled={niveles.length === 0 || exportandoPdf}
                >
                  {exportandoPdf ? "Generando PDF..." : "Exportar PDF"}
                </BotonReutilizable>
              </div>

              <Card>
                <div className="organigrama-preview-card">
                  {loadingNiveles ? (
                    <p>Actualizando organigrama...</p>
                  ) : (
                    <ArbolOrganigrama ref={arbolGestionRef} niveles={niveles} />
                  )}
                </div>
              </Card>
            </div>
          </>
        )}
      </section>

      <ModalReutilizable
        id="modalCrearOrganigrama"
        title="Nueva versión de organigrama"
        isOpen={isModalCrearOpen}
        onClose={cerrarCrear}
        onAccept={handleCrearOrganigrama}
        acceptButtonText="Crear"
        loading={savingOrganigramas}
        errorMessage={errorVista}
      >
        <CampoFormulario
          label="Título del organigrama"
          name="titulo"
          value={nuevoTitulo}
          onChange={(event) => {
            setNuevoTitulo(event.target.value);
            setErrorVista("");
          }}
          placeholder="Ej. Organigrama 2026-2029"
          required
        />

        <CampoFormulario
          label="Versión"
          name="version"
          type="number"
          value={nuevaVersion}
          onChange={(event) => setNuevaVersion(event.target.value)}
          min="1"
          required
        />
      </ModalReutilizable>

      <ModalReutilizable
        id="modalAgregarAreaOrganigrama"
        title="Agregar área al organigrama"
        isOpen={isModalInsertarAreaOpen}
        onClose={cerrarInsertarArea}
        onAccept={handleAgregarArea}
        acceptButtonText="Agregar"
        loading={savingNiveles}
        errorMessage={errorFormularioArea}
      >
        <p className="organigrama-modal-help">
          Seleccione un área existente del catálogo institucional. Para crear o
          modificar áreas, utilice el módulo de Áreas.
        </p>

        <CampoFormulario
          label="Área"
          isSelect
          name="id_area"
          value={formularioArea.id_area}
          onChange={handleCambioArea}
          required
        >
          <option value="">-- Seleccione un área --</option>

          {areasDisponibles.map((area) => (
            <option key={area.id} value={area.id}>
              {area.nombre_area}
            </option>
          ))}
        </CampoFormulario>

        {areasDisponibles.length === 0 && (
          <div className="organigrama-area-empty">
            Todas las áreas disponibles ya forman parte de este organigrama.
          </div>
        )}

        <CampoFormulario
          label="Nivel administrativo"
          type="number"
          name="nivel"
          min="1"
          value={formularioArea.nivel}
          onChange={handleCambioArea}
          required
        />

        <CampoFormulario
          label="Área superior"
          isSelect
          name="id_nivel_superior"
          value={formularioArea.id_nivel_superior}
          onChange={handleCambioArea}
        >
          <option value="">Ninguna (raíz del organigrama)</option>

          {opcionesSuperior.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre}
              {" — Nivel "}
              {item.nivel}
            </option>
          ))}
        </CampoFormulario>
      </ModalReutilizable>

      <ModalReutilizable
        id="modalEditarAreaOrganigrama"
        title="Editar relación"
        isOpen={isModalEditarAreaOpen}
        onClose={cerrarEditarArea}
        onAccept={guardarEdicionArea}
        acceptButtonText="Guardar cambios"
        loading={savingNiveles}
        errorMessage={errorFormularioArea}
      >
        <CampoFormulario
          label="Área"
          value={nivelEditando?.area?.nombre_area || ""}
          disabled
        />

        <CampoFormulario
          label="Nivel administrativo"
          type="number"
          name="nivel"
          min="1"
          value={formularioArea.nivel}
          onChange={handleCambioArea}
          required
        />

        <CampoFormulario
          label="Área superior"
          isSelect
          name="id_nivel_superior"
          value={formularioArea.id_nivel_superior}
          onChange={handleCambioArea}
        >
          <option value="">Ninguna (raíz del organigrama)</option>

          {opcionesSuperior.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre}
              {" — Nivel "}
              {item.nivel}
            </option>
          ))}
        </CampoFormulario>
      </ModalReutilizable>

      <ModalReutilizable
        id="modalEliminarAreaOrganigrama"
        title="Eliminar área del organigrama"
        isOpen={isModalEliminarAreaOpen}
        onClose={cerrarEliminarArea}
        onAccept={handleEliminarArea}
        acceptButtonText="Eliminar"
        loading={savingNiveles}
        errorMessage={errorFormularioArea}
      >
        <p>
          ¿Desea eliminar <strong>{nivelAEliminar?.area?.nombre_area}</strong>{" "}
          de este organigrama?
        </p>

        <p>Esto no eliminará el área del catálogo general.</p>

        <p>Si tiene dependencias, primero deberá reasignarlas o eliminarlas.</p>
      </ModalReutilizable>

      <ModalReutilizable
        id="modalEliminarOrganigrama"
        title="Eliminar organigrama"
        isOpen={isModalEliminarOrgOpen}
        onClose={cerrarEliminarOrg}
        onAccept={handleEliminarOrg}
        acceptButtonText="Eliminar"
        loading={savingOrganigramas}
        errorMessage={errorVista}
      >
        <p>
          ¿Desea eliminar el organigrama <strong>{orgAEliminar?.titulo}</strong>
          ?
        </p>

        <p>También se eliminarán sus relaciones de niveles.</p>
      </ModalReutilizable>

      <ModalReutilizable
        id="modalSolicitarOrganigrama"
        title="Solicitar autorización"
        isOpen={isModalSolicitarOpen}
        onClose={cerrarSolicitar}
        onAccept={handleSolicitar}
        acceptButtonText="Solicitar"
        loading={savingOrganigramas}
        errorMessage={errorVista}
      >
        <p>
          El organigrama cumple con las validaciones estructurales necesarias.
        </p>

        <p>Verifique la vista previa antes de continuar.</p>

        <p>
          Organigrama: <strong>{selectedOrg?.titulo}</strong>
        </p>
      </ModalReutilizable>
      {/* ================================================= */}
      {/* AUTORIZAR - PRESIDENCIA */}
      {/* ================================================= */}

      <ModalReutilizable
        id="modalAutorizarOrganigrama"
        title="Autorizar organigrama"
        isOpen={isModalAutorizarOpen}
        onClose={cerrarAutorizar}
        onAccept={handleAutorizar}
        acceptButtonText="Autorizar"
        loading={savingOrganigramas}
        errorMessage={errorVista}
      >
        <p>¿Confirma que desea autorizar esta versión del organigrama?</p>

        <p>
          <strong>{organigramaRevision?.titulo}</strong>
          {" — Versión "}
          {organigramaRevision?.version}
        </p>

        <p>
          Una vez autorizada, esta versión será candidata a mostrarse como el
          organigrama institucional vigente para todos los usuarios.
        </p>
      </ModalReutilizable>

      {/* ================================================= */}
      {/* RECHAZAR - PRESIDENCIA */}
      {/* ================================================= */}

      <ModalReutilizable
        id="modalRechazarOrganigrama"
        title="Rechazar organigrama"
        isOpen={isModalRechazarOpen}
        onClose={cerrarRechazar}
        onAccept={handleRechazar}
        acceptButtonText="Rechazar"
        loading={savingOrganigramas}
        errorMessage={errorVista}
      >
        <p>Indique las correcciones que deberá realizar Recursos Humanos.</p>

        <CampoFormulario
          label="Observaciones"
          isTextarea
          rows={5}
          value={observacionesRechazo}
          onChange={(event) => {
            setObservacionesRechazo(event.target.value);
            setErrorVista("");
          }}
          placeholder="Ej. Corregir la dependencia de Tesorería..."
          required
        />
      </ModalReutilizable>

      {/* ================================================= */}
      {/* MODAL COMPARAR VERSIONES */}
      {/* ================================================= */}

      <ModalReutilizable
        id="modalCompararOrganigramas"
        title="Comparar versiones"
        isOpen={isModalCompararOpen}
        onClose={cerrarComparar}
        onAccept={ejecutarComparacion}
        acceptButtonText={
          resultadoComparacion ? "Comparar nuevamente" : "Comparar"
        }
        loading={comparandoVersiones}
        errorMessage={errorVista}
      >
        <div className="comparacion-organigrama-info">
          <p>Versión actual:</p>

          <strong>
            {organigramaComparacion?.titulo}
            {" — V"}
            {organigramaComparacion?.version}
          </strong>
        </div>

        <CampoFormulario
          label="Comparar contra"
          isSelect
          name="versionComparar"
          value={idVersionComparar}
          onChange={(event) => {
            setIdVersionComparar(event.target.value);

            setResultadoComparacion(null);

            setErrorVista("");
          }}
        >
          <option value="">-- Seleccione otra versión --</option>

          {versionesDisponiblesComparacion.map((org) => (
            <option key={org.id} value={org.id}>
              {org.titulo}
              {" — V"}
              {org.version}
            </option>
          ))}
        </CampoFormulario>

        {resultadoComparacion && (
          <div className="comparacion-resultados">
            {/* ============================================= */}
            {/* RESUMEN */}
            {/* ============================================= */}

            <div className="comparacion-resumen">
              <div className="comparacion-resumen-item agregado">
                <strong>{resultadoComparacion.resumen.agregadas}</strong>

                <span>Agregadas</span>
              </div>

              <div className="comparacion-resumen-item eliminado">
                <strong>{resultadoComparacion.resumen.eliminadas}</strong>

                <span>Eliminadas</span>
              </div>

              <div className="comparacion-resumen-item movido">
                <strong>{resultadoComparacion.resumen.movidas}</strong>

                <span>Movidas</span>
              </div>

              <div className="comparacion-resumen-item nivel">
                <strong>{resultadoComparacion.resumen.nivelModificado}</strong>

                <span>Cambio de nivel</span>
              </div>
            </div>

            {!resultadoComparacion.hayCambios && (
              <div className="comparacion-sin-cambios">
                No se detectaron cambios entre las dos versiones.
              </div>
            )}

            {/* ============================================= */}
            {/* AGREGADAS */}
            {/* ============================================= */}

            {resultadoComparacion.agregadas.length > 0 && (
              <div className="comparacion-seccion">
                <h4>Áreas agregadas</h4>

                {resultadoComparacion.agregadas.map((item) => (
                  <div key={item.id_area} className="comparacion-cambio">
                    <strong>+ {item.nombre}</strong>

                    <span>Nivel {item.nivel}</span>

                    <span>Superior: {item.superior || "Raíz"}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ============================================= */}
            {/* ELIMINADAS */}
            {/* ============================================= */}

            {resultadoComparacion.eliminadas.length > 0 && (
              <div className="comparacion-seccion">
                <h4>Áreas eliminadas</h4>

                {resultadoComparacion.eliminadas.map((item) => (
                  <div key={item.id_area} className="comparacion-cambio">
                    <strong>− {item.nombre}</strong>

                    <span>Nivel anterior: {item.nivel}</span>

                    <span>Superior anterior: {item.superior || "Raíz"}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ============================================= */}
            {/* MOVIDAS */}
            {/* ============================================= */}

            {resultadoComparacion.movidas.length > 0 && (
              <div className="comparacion-seccion">
                <h4>Cambios de dependencia</h4>

                {resultadoComparacion.movidas.map((item) => (
                  <div key={item.id_area} className="comparacion-cambio">
                    <strong>{item.nombre}</strong>

                    <span>Antes: {item.superiorAnterior || "Raíz"}</span>

                    <span>Ahora: {item.superiorActual || "Raíz"}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ============================================= */}
            {/* CAMBIOS DE NIVEL */}
            {/* ============================================= */}

            {resultadoComparacion.nivelModificado.length > 0 && (
              <div className="comparacion-seccion">
                <h4>Cambios de nivel</h4>

                {resultadoComparacion.nivelModificado.map((item) => (
                  <div key={item.id_area} className="comparacion-cambio">
                    <strong>{item.nombre}</strong>

                    <span>
                      Nivel {item.nivelAnterior}
                      {" → "}
                      {item.nivelActual}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ModalReutilizable>

      <ModalReutilizable
        id="modalObservacionesOrganigrama"
        title="Observaciones de Presidencia"
        isOpen={isModalObservacionesOpen}
        onClose={cerrarObservaciones}
        onAccept={cerrarObservaciones}
        acceptButtonText="Cerrar"
      >
        <p>
          Organigrama: <strong>{organigramaObservaciones?.titulo}</strong>
        </p>

        <div className="observaciones-organigrama-box">
          {organigramaObservaciones?.observaciones ||
            "No se registraron observaciones."}
        </div>
      </ModalReutilizable>

      <ModalReutilizable
        id="modalVerOrganigrama"
        title="Organigrama"
        isOpen={isModalVerOpen}
        onClose={cerrarVer}
        onAccept={cerrarVer}
        acceptButtonText="Cerrar"
        className="modal-organigrama"
      >
        {nivelesVista.length === 0 ? (
          <p>Este organigrama no tiene estructura registrada.</p>
        ) : (
          <>
            <div className="organigrama-modal-actions">
              <BotonReutilizable
                onClick={() =>
                  exportarOrganigramaPdf({
                    nivelesExportar: nivelesVista,

                    organigrama: selectedOrg,
                  })
                }
                disabled={exportandoPdf}
              >
                {exportandoPdf ? "Generando PDF..." : "Exportar PDF"}
              </BotonReutilizable>
            </div>

            <div className="organigrama-visual-container">
              <ArbolOrganigrama ref={arbolVistaRef} niveles={nivelesVista} />
            </div>
          </>
        )}
      </ModalReutilizable>
    </main>
  );
};

export default Organigrama;
