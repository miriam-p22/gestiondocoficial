const prisma = require("../db/client");

// ======================================================
// CONFIGURACIÓN
// ======================================================
const NOMBRE_AREA_PRESIDENCIA = "Presidencia Municipal";
const DIAS_PROXIMO_A_VENCER = 2;
const ESTADOS_FINALES = ["atendido", "devuelto"];

// ======================================================
// NORMALIZAR FECHA AL FINAL DEL DÍA
// ======================================================
const obtenerFinDelDia = (valor) => {
  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return null;
  }

  fecha.setHours(23, 59, 59, 999);
  return fecha;
};

// ======================================================
// CALCULAR DÍAS RESTANTES
// ======================================================
const calcularDiasRestantes = (fechaLimite, ahora = new Date()) => {
  const limite = obtenerFinDelDia(fechaLimite);

  if (!limite) {
    return null;
  }

  const diferencia = limite.getTime() - ahora.getTime();
  return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
};

// ======================================================
// CREAR NOTIFICACIÓN SIN DUPLICAR
// ======================================================
const crearNotificacionSiNoExiste = async (idUsuario, datos) => {
  const usuarioId = Number(idUsuario);

  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return false;
  }

  const titulo = String(datos.titulo || "").trim();
  const mensaje = String(datos.mensaje || "").trim();
  const modulo = datos.modulo ? String(datos.modulo).trim() : null;
  const referenciaId =
    datos.referencia_id !== undefined && datos.referencia_id !== null
      ? Number(datos.referencia_id)
      : null;
  const ruta = datos.ruta ? String(datos.ruta).trim() : null;

  if (!titulo || !mensaje) {
    return false;
  }

  const existente = await prisma.notificacion.findFirst({
    where: {
      id_usuario: usuarioId,
      titulo,
      mensaje,
      modulo,
      referencia_id: referenciaId,
    },

    select: {
      id: true,
    },
  });

  if (existente) {
    return false;
  }

  await prisma.notificacion.create({
    data: {
      id_usuario: usuarioId,
      tipo: String(datos.tipo || "documento").trim(),
      titulo,
      mensaje,
      modulo,
      referencia_id: referenciaId,
      ruta,
      leida: false,
    },
  });

  return true;
};

// ======================================================
// CREAR PARA USUARIOS ACTIVOS DE UN ÁREA
// ======================================================

const crearParaAreaSinDuplicar = async (idArea, datos) => {
  const areaId = Number(idArea);

  if (!Number.isInteger(areaId) || areaId <= 0) {
    return 0;
  }

  const usuarios = await prisma.usuario.findMany({
    where: {
      id_area: areaId,

      status: true,
    },
    select: {
      id: true,
    },
  });

  let creadas = 0;

  for (const usuario of usuarios) {
    const creada = await crearNotificacionSiNoExiste(usuario.id, datos);

    if (creada) {
      creadas += 1;
    }
  }
  return creadas;
};

// ======================================================
// CREAR PARA PRESIDENCIA
// ======================================================
const crearParaPresidenciaSinDuplicar = async (datos) => {
  const area = await prisma.area.findUnique({
    where: {
      nombre_area: NOMBRE_AREA_PRESIDENCIA,
    },

    select: {
      id: true,
    },
  });

  if (!area) {
    console.warn(
      `[ALERTAS DOCUMENTOS] No existe el área "${NOMBRE_AREA_PRESIDENCIA}".`,
    );

    return 0;
  }

  return crearParaAreaSinDuplicar(area.id, datos);
};

// ======================================================
// FORMATEAR FECHA
// ======================================================

const formatearFecha = (valor) => {
  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "";
  }

  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ======================================================
// REVISAR ALERTAS
// ======================================================

const revisarAlertasDocumentos = async () => {
  const ahora = new Date();

  console.log(
    `[ALERTAS DOCUMENTOS] Revisión iniciada: ${ahora.toLocaleString()}`,
  );

  const destinos = await prisma.dispersionDestino.findMany({
    where: {
      fecha_limite: {
        not: null,
      },
      estado_documento: {
        notIn: ESTADOS_FINALES,
      },
    },

    include: {
      area: {
        select: {
          id: true,
          nombre_area: true,
        },
      },

      dispersion: {
        select: {
          id: true,
          nombre_archivo: true,
        },
      },
    },
  });

  let proximos = 0;
  let vencidosArea = 0;
  let vencidosPresidencia = 0;

  for (const destino of destinos) {
    const limite = obtenerFinDelDia(destino.fecha_limite);

    if (!limite) {
      continue;
    }

    const nombreArchivo = destino.dispersion?.nombre_archivo || "Documento";
    const nombreArea = destino.area?.nombre_area || "Área responsable";
    const fechaTexto = formatearFecha(destino.fecha_limite);
    const referenciaId = destino.id_dispersion;

    // ==================================================
    // VENCIDO
    // ==================================================

    if (ahora.getTime() > limite.getTime()) {
      const mensajeArea = `El documento "${nombreArchivo}" venció el ${fechaTexto} y continúa pendiente de atención.`;

      vencidosArea += await crearParaAreaSinDuplicar(destino.id_area, {
        tipo: "documento",
        titulo: "Documento vencido",
        mensaje: mensajeArea,
        modulo: "documentos",
        referencia_id: referenciaId,
        ruta: "/documentos",
      });

      const mensajePresidencia = `El documento "${nombreArchivo}", asignado a "${nombreArea}", venció el ${fechaTexto} y continúa pendiente de atención.`;
      vencidosPresidencia += await crearParaPresidenciaSinDuplicar({
        tipo: "documento",
        titulo: "Documento vencido",
        mensaje: mensajePresidencia,
        modulo: "documentos",
        referencia_id: referenciaId,
        ruta: "/documentos?filtro=vencidos",
      });

      continue;
    }

    // ==================================================
    // PRÓXIMO A VENCER
    // ==================================================
    const diasRestantes = calcularDiasRestantes(destino.fecha_limite, ahora);

    if (
      diasRestantes !== null &&
      diasRestantes >= 0 &&
      diasRestantes <= DIAS_PROXIMO_A_VENCER
    ) {
      let textoTiempo = `${diasRestantes} días`;

      if (diasRestantes === 0) {
        textoTiempo = "hoy";
      } else if (diasRestantes === 1) {
        textoTiempo = "1 día";
      }

      const mensaje =
        diasRestantes === 0
          ? `El documento "${nombreArchivo}" vence hoy (${fechaTexto}).`
          : `El documento "${nombreArchivo}" vence en ${textoTiempo} (${fechaTexto}).`;

      proximos += await crearParaAreaSinDuplicar(destino.id_area, {
        tipo: "documento",
        titulo: "Documento próximo a vencer",
        mensaje,
        modulo: "documentos",
        referencia_id: referenciaId,
        ruta: "/documentos?filtro=por-vencer",
      });
    }
  }

  console.log("[ALERTAS DOCUMENTOS] Revisión finalizada:", {
    destinos_revisados: destinos.length,
    proximos_creados: proximos,
    vencidos_area_creados: vencidosArea,
    vencidos_presidencia_creados: vencidosPresidencia,
  });

  return {
    destinos_revisados: destinos.length,
    proximos_creados: proximos,
    vencidos_area_creados: vencidosArea,
    vencidos_presidencia_creados: vencidosPresidencia,
  };
};

module.exports = {
  revisarAlertasDocumentos,
};
