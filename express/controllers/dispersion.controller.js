const prisma = require("../db/client");

const notificacionesController = require("./notificaciones.controller");

const ejecutarNotificacionSegura = async (callback) => {
  try {
    return await callback();
  } catch (error) {
    console.error("[NOTIFICACIÓN DISPERSIÓN]", error);

    return null;
  }
};

const ORIGENES_VALIDOS = ["web", "app"];
const ESTADOS_ENVIO_VALIDOS = ["pendiente", "enviado", "error"];
const ESTADOS_DOCUMENTO_VALIDOS = [
  "turnado",
  "recibido",
  "en proceso",
  "atendido",
  "devuelto",
];

const MOTIVOS_DEVOLUCION_VALIDOS = [
  "no_corresponde_area",
  "informacion_incompleta",
  "documento_ilegible",
  "documento_duplicado",
  "otro",
];

const convertirId = (valor) => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("INVALID_ID");
  }

  return id;
};

const convertirOrigen = (valor) => {
  const origen = String(valor ?? "")
    .trim()
    .toLowerCase();

  if (!ORIGENES_VALIDOS.includes(origen)) {
    throw new Error("INVALID_ORIGIN");
  }

  return origen;
};

const convertirEstadoEnvio = (valor) => {
  const estado = String(valor ?? "")
    .trim()
    .toLowerCase();

  if (!ESTADOS_ENVIO_VALIDOS.includes(estado)) {
    throw new Error("INVALID_SEND_STATE");
  }

  return estado;
};

const convertirEstadoDocumento = (valor) => {
  const estado = String(valor ?? "")
    .trim()
    .toLowerCase();

  if (!ESTADOS_DOCUMENTO_VALIDOS.includes(estado)) {
    throw new Error("INVALID_DOCUMENT_STATE");
  }

  return estado;
};

const convertirMotivoDevolucion = (valor) => {
  const motivo = String(valor ?? "")
    .trim()
    .toLowerCase();

  if (!MOTIVOS_DEVOLUCION_VALIDOS.includes(motivo)) {
    throw new Error("INVALID_RETURN_REASON");
  }

  return motivo;
};

const convertirTextoOpcional = (valor, maximo) => {
  if (valor === undefined || valor === null) {
    return null;
  }

  const texto = String(valor).trim();

  if (!texto) {
    return null;
  }

  if (maximo && texto.length > maximo) {
    throw new Error("TEXT_TOO_LONG");
  }

  return texto;
};

const convertirFechaOpcional = (valor) => {
  if (valor === undefined || valor === null || valor === "") {
    return null;
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    throw new Error("INVALID_DATE");
  }

  return fecha;
};

//RELACIONES
const includeRelations = {
  destinos: {
    include: {
      area: {
        select: {
          id: true,
          nombre_area: true,
        },
      },
    },

    orderBy: {
      id: "asc",
    },
  },

  eventos: {
    include: {
      area: {
        select: {
          id: true,
          nombre_area: true,
        },
      },
    },

    orderBy: [
      {
        fecha: "desc",
      },
      {
        id: "desc",
      },
    ],
  },
};

//VALIDAR ÁREA
const validarArea = async (idArea) => {
  const area = await prisma.area.findUnique({
    where: {
      id: idArea,
    },

    select: {
      id: true,
    },
  });

  if (!area) {
    throw new Error("AREA_NOT_FOUND");
  }

  return area;
};

//VALIDAR DISPERSIÓN
const validarDispersion = async (idDispersion) => {
  const dispersion = await prisma.dispersion.findUnique({
    where: {
      id: idDispersion,
    },
  });

  if (!dispersion) {
    throw new Error("NOT_FOUND");
  }

  return dispersion;
};

//OBTENER DESTINO
const obtenerDestino = async (idDispersion, idArea) => {
  const destino = await prisma.dispersionDestino.findUnique({
    where: {
      id_dispersion_id_area: {
        id_dispersion: idDispersion,

        id_area: idArea,
      },
    },
  });

  if (!destino) {
    throw new Error("DESTINATION_NOT_FOUND");
  }

  return destino;
};

const crearEvento = async (
  transaction,
  {
    idDispersion,
    idArea = null,
    tipoEvento,
    comentario = null,
    archivo = null,
  },
) => {
  return transaction.documentoEvento.create({
    data: {
      id_dispersion: idDispersion,
      id_area: idArea,
      tipo_evento: tipoEvento,
      comentario,
      archivo,
    },
  });
};

const getAll = async (filtros = {}) => {
  const where = {};

  if (filtros.origen !== undefined && filtros.origen !== "") {
    where.origen = convertirOrigen(filtros.origen);
  }

  const condicionDestino = {};

  if (filtros.id_area !== undefined && filtros.id_area !== "") {
    condicionDestino.id_area = convertirId(filtros.id_area);
  }

  if (filtros.estado_envio !== undefined && filtros.estado_envio !== "") {
    condicionDestino.estado_envio = convertirEstadoEnvio(filtros.estado_envio);
  }

  if (
    filtros.estado_documento !== undefined &&
    filtros.estado_documento !== ""
  ) {
    condicionDestino.estado_documento = convertirEstadoDocumento(
      filtros.estado_documento,
    );
  }

  if (Object.keys(condicionDestino).length > 0) {
    where.destinos = {
      some: condicionDestino,
    };
  }

  return prisma.dispersion.findMany({
    where,

    include: includeRelations,

    orderBy: {
      id: "desc",
    },
  });
};

const getById = async (id) => {
  const dispersionId = convertirId(id);

  const dispersion = await prisma.dispersion.findUnique({
    where: {
      id: dispersionId,
    },

    include: includeRelations,
  });

  if (!dispersion) {
    throw new Error("NOT_FOUND");
  }

  return dispersion;
};

//CREATE
const create = async (data) => {
  const nombreArchivo = String(data?.nombre_archivo ?? "").trim();
  const archivo = String(data?.archivo ?? "").trim();

  if (!nombreArchivo || !archivo) {
    throw new Error("INVALID_DATA");
  }

  if (nombreArchivo.length > 255 || archivo.length > 500) {
    throw new Error("TEXT_TOO_LONG");
  }

  const tipoArchivo = convertirTextoOpcional(data.tipo_archivo, 100);
  const extension = convertirTextoOpcional(data.extension, 20);

  const origen =
    data.origen !== undefined ? convertirOrigen(data.origen) : "web";

  let tamanoArchivo = null;

  if (data.tamano_archivo !== undefined && data.tamano_archivo !== null) {
    tamanoArchivo = Number(data.tamano_archivo);

    if (!Number.isInteger(tamanoArchivo) || tamanoArchivo < 0) {
      throw new Error("INVALID_DATA");
    }
  }

  const fechaLimite = convertirFechaOpcional(data.fecha_limite);

  if (!fechaLimite) {
    throw new Error("DEADLINE_REQUIRED");
  }

  const destinosRecibidos = Array.isArray(data.destinos) ? data.destinos : [];

  if (destinosRecibidos.length === 0) {
    throw new Error("DESTINATIONS_REQUIRED");
  }

  const destinos = [...new Set(destinosRecibidos.map(convertirId))];

  for (const idArea of destinos) {
    await validarArea(idArea);
  }

  //CREAR DISPERSIÓN
  const nueva = await prisma.$transaction(async (transaction) => {
    const dispersion = await transaction.dispersion.create({
      data: {
        nombre_archivo: nombreArchivo,
        archivo,
        tipo_archivo: tipoArchivo,
        tamano_archivo: tamanoArchivo,
        extension,
        origen,
        destinos: {
          create: destinos.map((idArea) => ({
            id_area: idArea,
            estado_envio: "pendiente",
            fecha_envio: null,
            error_envio: null,
            estado_documento: "turnado",
            fecha_limite: fechaLimite,
            fecha_recepcion_area: null,
            fecha_inicio_proceso: null,
            fecha_atencion: null,
            motivo_devolucion: null,
            comentario_devolucion: null,
          })),
        },
      },
    });

    //EVENTO TURNADO POR CADA ÁREA
    for (const idArea of destinos) {
      await crearEvento(transaction, {
        idDispersion: dispersion.id,
        idArea,
        tipoEvento: "turnado",
      });
    }

    //DEVOLVER DISPERSIÓN COMPLETA
    return transaction.dispersion.findUnique({
      where: {
        id: dispersion.id,
      },

      include: includeRelations,
    });
  });

  //NOTIFICAR A CADA ÁREA DESTINO
  for (const idArea of destinos) {
    await ejecutarNotificacionSegura(() =>
      notificacionesController.crearParaArea(idArea, {
        tipo: "documento",
        titulo: "Nuevo documento asignado",
        mensaje: `Se asignó el documento "${nombreArchivo}" a su área para su atención.`,
        modulo: "documentos",
        referencia_id: nueva.id,
        ruta: "/documentos",
      }),
    );
  }

  return nueva;
};

//UPDATE GENERAL
const update = async (id, data) => {
  const dispersionId = convertirId(id);

  await validarDispersion(dispersionId);

  const datos = {};

  if (data.nombre_archivo !== undefined) {
    const nombre = String(data.nombre_archivo).trim();

    if (!nombre) {
      throw new Error("INVALID_DATA");
    }

    if (nombre.length > 255) {
      throw new Error("TEXT_TOO_LONG");
    }

    datos.nombre_archivo = nombre;
  }

  if (data.archivo !== undefined) {
    const ruta = String(data.archivo).trim();

    if (!ruta) {
      throw new Error("INVALID_DATA");
    }

    if (ruta.length > 500) {
      throw new Error("TEXT_TOO_LONG");
    }

    datos.archivo = ruta;
  }

  if (data.tipo_archivo !== undefined) {
    datos.tipo_archivo = convertirTextoOpcional(data.tipo_archivo, 100);
  }

  if (data.extension !== undefined) {
    datos.extension = convertirTextoOpcional(data.extension, 20);
  }

  if (data.origen !== undefined) {
    datos.origen = convertirOrigen(data.origen);
  }

  return prisma.dispersion.update({
    where: {
      id: dispersionId,
    },

    data: datos,

    include: includeRelations,
  });
};

//GET DESTINOS
const getDestinos = async (idDispersion) => {
  const dispersionId = convertirId(idDispersion);

  await validarDispersion(dispersionId);

  return prisma.dispersionDestino.findMany({
    where: {
      id_dispersion: dispersionId,
    },

    include: {
      area: {
        select: {
          id: true,
          nombre_area: true,
        },
      },
    },

    orderBy: {
      id: "asc",
    },
  });
};

//AGREGAR DESTINO
const agregarDestino = async (idDispersion, idArea, data = {}) => {
  const dispersionId = convertirId(idDispersion);
  const areaId = convertirId(idArea);
  const dispersion = await validarDispersion(dispersionId);

  await validarArea(areaId);

  const existente = await prisma.dispersionDestino.findUnique({
    where: {
      id_dispersion_id_area: {
        id_dispersion: dispersionId,
        id_area: areaId,
      },
    },
  });

  if (existente) {
    throw new Error("DESTINATION_ALREADY_EXISTS");
  }

  const fechaLimite = convertirFechaOpcional(data.fecha_limite);

  if (!fechaLimite) {
    throw new Error("DEADLINE_REQUIRED");
  }

  const destinoCreado = await prisma.$transaction(async (transaction) => {
    const destino = await transaction.dispersionDestino.create({
      data: {
        id_dispersion: dispersionId,
        id_area: areaId,
        estado_envio: "pendiente",
        fecha_envio: null,
        error_envio: null,
        estado_documento: "turnado",
        fecha_limite: fechaLimite,
        fecha_recepcion_area: null,
        fecha_inicio_proceso: null,
        fecha_atencion: null,
        motivo_devolucion: null,
        comentario_devolucion: null,
      },

      include: {
        area: true,
      },
    });

    await crearEvento(transaction, {
      idDispersion: dispersionId,
      idArea: areaId,
      tipoEvento: "turnado",
    });

    return destino;
  });

  //NOTIFICAR AL NUEVO DESTINO
  await ejecutarNotificacionSegura(() =>
    notificacionesController.crearParaArea(areaId, {
      tipo: "documento",
      titulo: "Nuevo documento asignado",
      mensaje: `Se asignó el documento "${dispersion.nombre_archivo}" a su área para su atención.`,
      modulo: "documentos",
      referencia_id: dispersionId,
      ruta: "/documentos",
    }),
  );

  return destinoCreado;
};

//ELIMINAR DESTINO
const eliminarDestino = async (idDispersion, idArea) => {
  const dispersionId = convertirId(idDispersion);

  const areaId = convertirId(idArea);

  await validarDispersion(dispersionId);

  await obtenerDestino(dispersionId, areaId);

  return prisma.dispersionDestino.delete({
    where: {
      id_dispersion_id_area: {
        id_dispersion: dispersionId,

        id_area: areaId,
      },
    },
  });
};

//ACTUALIZAR ESTADO DE TRANSFERENCIA
const actualizarEstadoDestino = async (idDispersion, idArea, data) => {
  const dispersionId = convertirId(idDispersion);
  const areaId = convertirId(idArea);

  await validarDispersion(dispersionId);

  const destino = await obtenerDestino(dispersionId, areaId);
  const estado = convertirEstadoEnvio(data?.estado_envio);

  let fechaEnvio = destino.fecha_envio;
  let errorEnvio = null;

  if (estado === "enviado") {
    fechaEnvio = new Date();

    errorEnvio = null;
  }

  if (estado === "error") {
    fechaEnvio = null;

    errorEnvio = convertirTextoOpcional(data?.error_envio, 500);

    if (!errorEnvio) {
      throw new Error("SEND_ERROR_REQUIRED");
    }
  }

  if (estado === "pendiente") {
    fechaEnvio = null;

    errorEnvio = null;
  }

  return prisma.dispersionDestino.update({
    where: {
      id_dispersion_id_area: {
        id_dispersion: dispersionId,

        id_area: areaId,
      },
    },

    data: {
      estado_envio: estado,
      fecha_envio: fechaEnvio,
      error_envio: errorEnvio,
    },

    include: {
      area: true,
    },
  });
};

//ACTUALIZAR ESTADO ADMINISTRATIVO
const actualizarEstadoDocumento = async (
  idDispersion,
  idArea,
  data,
  usuarioSesion,
) => {
  const dispersionId = convertirId(idDispersion);
  const areaId = convertirId(idArea);

  if (!usuarioSesion || !usuarioSesion.id) {
    throw new Error("ACCESS_DENIED");
  }

  const areaUsuario = Number(usuarioSesion.id_area);

  if (
    !Number.isInteger(areaUsuario) ||
    areaUsuario <= 0 ||
    areaUsuario !== areaId
  ) {
    throw new Error("ACCESS_DENIED");
  }

  const dispersion = await validarDispersion(dispersionId);
  const destino = await obtenerDestino(dispersionId, areaId);
  const estado = convertirEstadoDocumento(data?.estado_documento);

  if (estado === "turnado") {
    throw new Error("STATE_NOT_EDITABLE");
  }

  if (
    destino.estado_documento === "atendido" ||
    destino.estado_documento === "devuelto"
  ) {
    throw new Error("FINAL_STATE");
  }

  const datos = {
    estado_documento: estado,
  };

  if (estado === "recibido") {
    if (!destino.fecha_recepcion_area) {
      datos.fecha_recepcion_area = new Date();
    }

    return prisma.$transaction(async (transaction) => {
      const actualizado = await transaction.dispersionDestino.update({
        where: {
          id_dispersion_id_area: {
            id_dispersion: dispersionId,
            id_area: areaId,
          },
        },

        data: datos,

        include: {
          area: true,
        },
      });

      await crearEvento(transaction, {
        idDispersion: dispersionId,
        idArea: areaId,
        tipoEvento: "recibido",
      });

      return actualizado;
    });
  }

  if (estado === "en proceso") {
    if (
      destino.estado_documento !== "recibido" &&
      destino.estado_documento !== "en proceso"
    ) {
      throw new Error("RECEIVE_REQUIRED");
    }

    if (!destino.fecha_inicio_proceso) {
      datos.fecha_inicio_proceso = new Date();
    }

    return prisma.$transaction(async (transaction) => {
      const actualizado = await transaction.dispersionDestino.update({
        where: {
          id_dispersion_id_area: {
            id_dispersion: dispersionId,

            id_area: areaId,
          },
        },

        data: datos,

        include: {
          area: true,
        },
      });

      if (destino.estado_documento !== "en proceso") {
        await crearEvento(transaction, {
          idDispersion: dispersionId,
          idArea: areaId,
          tipoEvento: "en_proceso",
        });
      }

      return actualizado;
    });
  }

  //DEVUELTO
  if (estado === "devuelto") {
    const motivo = convertirMotivoDevolucion(data?.motivo_devolucion);

    const comentario = convertirTextoOpcional(
      data?.comentario_devolucion,
      1000,
    );

    if (motivo === "otro" && !comentario) {
      throw new Error("RETURN_COMMENT_REQUIRED");
    }

    datos.motivo_devolucion = motivo;
    datos.comentario_devolucion = comentario;

    const actualizado = await prisma.$transaction(async (transaction) => {
      const resultado = await transaction.dispersionDestino.update({
        where: {
          id_dispersion_id_area: {
            id_dispersion: dispersionId,
            id_area: areaId,
          },
        },

        data: datos,

        include: {
          area: true,
        },
      });

      await crearEvento(transaction, {
        idDispersion: dispersionId,
        idArea: areaId,
        tipoEvento: "devuelto",
        comentario: comentario ? `${motivo}: ${comentario}` : motivo,
      });

      return resultado;
    });

    await ejecutarNotificacionSegura(() =>
      notificacionesController.crearParaPrivilegio("Gestionar Dispersión", {
        tipo: "documento",
        titulo: "Documento devuelto",
        mensaje: `El área "${actualizado.area?.nombre_area || "Área destino"}" devolvió el documento "${dispersion.nombre_archivo}". Motivo: ${motivo}.`,
        modulo: "dispersion",
        referencia_id: dispersionId,
        ruta: "/dispersion",
      }),
    );

    return actualizado;
  }

  //ATENDIDO
  if (estado === "atendido") {
    if (
      destino.estado_documento !== "recibido" &&
      destino.estado_documento !== "en proceso"
    ) {
      throw new Error("RECEIVE_REQUIRED");
    }

    const respuesta = convertirTextoOpcional(data?.respuesta, 1000);

    if (!respuesta) {
      throw new Error("RESPONSE_REQUIRED");
    }

    const archivoRespuesta = convertirTextoOpcional(
      data?.archivo_respuesta,
      500,
    );

    datos.fecha_atencion = destino.fecha_atencion || new Date();

    const actualizado = await prisma.$transaction(async (transaction) => {
      const resultado = await transaction.dispersionDestino.update({
        where: {
          id_dispersion_id_area: {
            id_dispersion: dispersionId,

            id_area: areaId,
          },
        },

        data: datos,

        include: {
          area: true,
        },
      });

      await crearEvento(transaction, {
        idDispersion: dispersionId,
        idArea: areaId,
        tipoEvento: "respuesta_area",
        comentario: respuesta,
        archivo: archivoRespuesta,
      });

      return resultado;
    });

    await ejecutarNotificacionSegura(() =>
      notificacionesController.crearParaPrivilegio("Gestionar Dispersión", {
        tipo: "documento",
        titulo: "Documento atendido",
        mensaje: `El área "${actualizado.area?.nombre_area || "Área destino"}" marcó el documento "${dispersion.nombre_archivo}" como atendido.`,
        modulo: "dispersion",
        referencia_id: dispersionId,
        ruta: "/dispersion",
      }),
    );

    await ejecutarNotificacionSegura(() =>
      notificacionesController.crearParaPrivilegio("Gestionar Archivo Físico", {
        tipo: "archivo",
        titulo: "Documento pendiente de resguardo físico",
        mensaje: `El documento "${dispersion.nombre_archivo}", atendido por el área "${actualizado.area?.nombre_area || "Área destino"}", está listo para registrar su resguardo físico.`,
        modulo: "archivo_fisico",
        referencia_id: actualizado.id,
        ruta: "/LeyArchivo",
      }),
    );

    return actualizado;
  }

  throw new Error("INVALID_DOCUMENT_STATE");
};

//ACTUALIZAR FECHA LÍMITE
const actualizarFechaLimite = async (idDispersion, idArea, fechaLimite) => {
  const dispersionId = convertirId(idDispersion);
  const areaId = convertirId(idArea);

  await validarDispersion(dispersionId);
  await obtenerDestino(dispersionId, areaId);

  const fecha = convertirFechaOpcional(fechaLimite);

  if (!fecha) {
    throw new Error("DEADLINE_REQUIRED");
  }

  return prisma.dispersionDestino.update({
    where: {
      id_dispersion_id_area: {
        id_dispersion: dispersionId,
        id_area: areaId,
      },
    },

    data: {
      fecha_limite: fecha,
    },

    include: {
      area: true,
    },
  });
};

//REINTENTAR TRANSFERENCIA
const reintentarDestino = async (idDispersion, idArea) => {
  return actualizarEstadoDestino(idDispersion, idArea, {
    estado_envio: "pendiente",
  });
};

//DELETE
const remove = async (id) => {
  const dispersionId = convertirId(id);

  await validarDispersion(dispersionId);

  return prisma.dispersion.delete({
    where: {
      id: dispersionId,
    },
  });
};

module.exports = {
  getAll,
  getById,

  create,
  update,
  remove,

  getDestinos,
  agregarDestino,
  eliminarDestino,

  actualizarEstadoDestino,
  actualizarEstadoDocumento,
  actualizarFechaLimite,

  reintentarDestino,
};
