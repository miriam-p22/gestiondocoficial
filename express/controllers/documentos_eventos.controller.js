const prisma = require("../db/client");
const TIPOS_EVENTO = ["respuesta_recibida", "respuesta_entregada"];

const convertirId = (valor) => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("INVALID_ID");
  }

  return id;
};

const convertirTipoEvento = (valor) => {
  const tipo = String(valor ?? "")
    .trim()
    .toLowerCase();

  if (!TIPOS_EVENTO.includes(tipo)) {
    throw new Error("INVALID_EVENT_TYPE");
  }

  return tipo;
};

//COMENTARIO
const convertirComentario = (valor) => {
  if (valor === undefined || valor === null) {
    return null;
  }

  const comentario = String(valor).trim();

  if (!comentario) {
    return null;
  }

  if (comentario.length > 1000) {
    throw new Error("COMMENT_TOO_LONG");
  }

  return comentario;
};

//VALIDAR DISPERSIÓN
const validarDispersion = async (idDispersion) => {
  const dispersion = await prisma.dispersion.findUnique({
    where: {
      id: idDispersion,
    },

    select: {
      id: true,
    },
  });

  if (!dispersion) {
    throw new Error("DISPERSION_NOT_FOUND");
  }

  return dispersion;
};

//VALIDAR DESTINO
const validarDestino = async (idDispersion, idArea) => {
  const destino = await prisma.dispersionDestino.findUnique({
    where: {
      id_dispersion_id_area: {
        id_dispersion: idDispersion,

        id_area: idArea,
      },
    },

    select: {
      id: true,
    },
  });

  if (!destino) {
    throw new Error("DESTINATION_NOT_FOUND");
  }

  return destino;
};

//RELACIONES
const includeRelations = {
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
      archivo: true,
      fecha_recepcion: true,
    },
  },
};

//GET HISTORIAL DE UNA DISPERSIÓN
const getByDispersion = async (idDispersion) => {
  const dispersionId = convertirId(idDispersion);

  await validarDispersion(dispersionId);

  return prisma.documentoEvento.findMany({
    where: {
      id_dispersion: dispersionId,
    },

    include: includeRelations,

    orderBy: [
      {
        fecha: "desc",
      },

      {
        id: "desc",
      },
    ],
  });
};

//GET RESUMEN DE RESPUESTAS PARA OFICIALÍA
const getResumenRespuestas = async () => {
  const respuestasArea = await prisma.documentoEvento.findMany({
    where: {
      tipo_evento: "respuesta_area",
    },

    include: includeRelations,

    orderBy: {
      fecha: "desc",
    },
  });
  if (respuestasArea.length === 0) {
    return [];
  }
  const idsDispersion = [
    ...new Set(respuestasArea.map((evento) => evento.id_dispersion)),
  ];

  //EVENTOS REGISTRADOS POR OFICIALÍA
  const eventosOficialia = await prisma.documentoEvento.findMany({
    where: {
      id_dispersion: {
        in: idsDispersion,
      },

      tipo_evento: {
        in: ["respuesta_recibida", "respuesta_entregada"],
      },
    },

    orderBy: {
      fecha: "asc",
    },
  });

  return respuestasArea.map((respuestaArea) => {
    const respuestaRecibida = eventosOficialia.find(
      (evento) =>
        evento.tipo_evento === "respuesta_recibida" &&
        Number(evento.id_dispersion) === Number(respuestaArea.id_dispersion) &&
        Number(evento.id_area) === Number(respuestaArea.id_area),
    );

    const respuestaEntregada = eventosOficialia.find(
      (evento) =>
        evento.tipo_evento === "respuesta_entregada" &&
        Number(evento.id_dispersion) === Number(respuestaArea.id_dispersion),
    );

    return {
      id_evento_respuesta: respuestaArea.id,
      id_dispersion: respuestaArea.id_dispersion,
      id_area: respuestaArea.id_area,
      documento: respuestaArea.dispersion?.nombre_archivo || "Documento",
      archivo_documento: respuestaArea.dispersion?.archivo || null,
      area: respuestaArea.area?.nombre_area || "Área",
      respuesta: respuestaArea.comentario || "",
      archivo_respuesta: respuestaArea.archivo || null,
      fecha_respuesta_area: respuestaArea.fecha,

      respuesta_recibida: Boolean(respuestaRecibida),
      fecha_recepcion_oficialia: respuestaRecibida?.fecha || null,
      comentario_recepcion: respuestaRecibida?.comentario || null,

      respuesta_entregada: Boolean(respuestaEntregada),
      fecha_entrega_ciudadano: respuestaEntregada?.fecha || null,
      comentario_entrega: respuestaEntregada?.comentario || null,
    };
  });
};

//CREAR EVENTO
const create = async (data) => {
  const idDispersion = convertirId(data?.id_dispersion);
  const tipoEvento = convertirTipoEvento(data?.tipo_evento);
  const comentario = convertirComentario(data?.comentario);

  await validarDispersion(idDispersion);

  let idArea = null;

  if (
    data?.id_area !== undefined &&
    data?.id_area !== null &&
    data?.id_area !== ""
  ) {
    idArea = convertirId(data.id_area);
  }

  //RESPUESTA RECIBIDA
  if (tipoEvento === "respuesta_recibida") {
    if (idArea === null) {
      throw new Error("AREA_REQUIRED");
    }

    await validarDestino(idDispersion, idArea);

    const respuestaArea = await prisma.documentoEvento.findFirst({
      where: {
        id_dispersion: idDispersion,
        id_area: idArea,
        tipo_evento: "respuesta_area",
      },

      orderBy: {
        fecha: "desc",
      },
    });

    if (!respuestaArea) {
      throw new Error("AREA_RESPONSE_REQUIRED");
    }

    const yaRecibida = await prisma.documentoEvento.findFirst({
      where: {
        id_dispersion: idDispersion,
        id_area: idArea,
        tipo_evento: "respuesta_recibida",
      },
    });

    if (yaRecibida) {
      throw new Error("RESPONSE_ALREADY_RECEIVED");
    }
  }

  //RESPUESTA ENTREGADA AL CIUDADANO
  if (tipoEvento === "respuesta_entregada") {
    idArea = null;

    const respuestaRecibida = await prisma.documentoEvento.findFirst({
      where: {
        id_dispersion: idDispersion,
        tipo_evento: "respuesta_recibida",
      },
    });

    if (!respuestaRecibida) {
      throw new Error("OFFICE_RESPONSE_REQUIRED");
    }

    const yaEntregada = await prisma.documentoEvento.findFirst({
      where: {
        id_dispersion: idDispersion,
        tipo_evento: "respuesta_entregada",
      },
    });

    if (yaEntregada) {
      throw new Error("RESPONSE_ALREADY_DELIVERED");
    }
  }

  //CREAR
  return prisma.documentoEvento.create({
    data: {
      id_dispersion: idDispersion,
      id_area: idArea,
      tipo_evento: tipoEvento,
      comentario,
      archivo: null,
    },

    include: includeRelations,
  });
};

//DELETE
const remove = async (id) => {
  const eventoId = convertirId(id);

  const evento = await prisma.documentoEvento.findUnique({
    where: {
      id: eventoId,
    },
  });

  if (!evento) {
    throw new Error("NOT_FOUND");
  }

  return prisma.documentoEvento.delete({
    where: {
      id: eventoId,
    },
  });
};

module.exports = {
  getByDispersion,
  getResumenRespuestas,

  create,
  remove,
};
