const prisma = require("../db/client");
const notificacionesController = require("./notificaciones.controller");
const ESTADOS = {
  EDICION: "edicion",
  SOLICITADO: "solicitado",
  AUTORIZADO: "autorizado",
  RECHAZADO: "rechazado",
};

const convertirId = (valor) => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("INVALID_ID");
  }

  return id;
};

const convertirVersion = (valor) => {
  const version = Number(valor);

  if (!Number.isInteger(version) || version <= 0) {
    throw new Error("INVALID_VERSION");
  }

  return version;
};

const convertirBooleano = (valor) => {
  if (typeof valor === "boolean") {
    return valor;
  }

  if (valor === 1 || valor === "1") {
    return true;
  }

  if (valor === 0 || valor === "0") {
    return false;
  }

  if (typeof valor === "string") {
    const texto = valor.trim().toLowerCase();

    if (texto === "true") {
      return true;
    }

    if (texto === "false") {
      return false;
    }
  }

  throw new Error("INVALID_DATA");
};

const convertirEstado = (valor) => {
  const estado = String(valor ?? "")
    .trim()
    .toLowerCase();

  const permitidos = Object.values(ESTADOS);

  if (!permitidos.includes(estado)) {
    throw new Error("INVALID_STATE");
  }

  return estado;
};

const convertirObservaciones = (valor) => {
  if (valor === undefined || valor === null) {
    return null;
  }

  const texto = String(valor).trim();

  if (!texto) {
    return null;
  }

  if (texto.length > 1000) {
    throw new Error("OBSERVATIONS_TOO_LONG");
  }

  return texto;
};

//NOTIFICACIÓN SEGURA
const ejecutarNotificacionSegura = async (callback) => {
  try {
    await callback();
  } catch (error) {
    console.error("[NOTIFICACIÓN ORGANIGRAMA]", error);
  }
};

//RELACIONES
const includeRelations = {
  usuario: {
    select: {
      id: true,
      nombre_completo: true,
      nombre_usuario: true,

      area: {
        select: {
          id: true,
          nombre_area: true,
        },
      },

      rol: {
        select: {
          id: true,
          nombre_rol: true,
        },
      },
    },
  },

  niveles: {
    include: {
      area: true,

      superior: {
        include: {
          area: true,
        },
      },
    },

    orderBy: [
      {
        nivel: "asc",
      },
      {
        id: "asc",
      },
    ],
  },
};

//GET ALL
const getAll = async (filtros = {}) => {
  const where = {};

  if (filtros.id_usuario) {
    where.id_usuario = convertirId(filtros.id_usuario);
  }

  if (filtros.autorizado !== undefined && filtros.autorizado !== "") {
    where.autorizado = convertirBooleano(filtros.autorizado);
  }

  if (filtros.estado !== undefined && filtros.estado !== "") {
    where.estado = convertirEstado(filtros.estado);
  }

  return prisma.organigrama.findMany({
    where,

    include: includeRelations,

    orderBy: {
      id: "desc",
    },
  });
};

//GET BY ID
const getById = async (id) => {
  const organigrama = await prisma.organigrama.findUnique({
    where: {
      id: convertirId(id),
    },

    include: includeRelations,
  });

  if (!organigrama) {
    throw new Error("NOT_FOUND");
  }

  return organigrama;
};

//GET ORGANIGRAMA VIGENTE
const getVigente = async () => {
  const organigrama = await prisma.organigrama.findFirst({
    where: {
      estado: ESTADOS.AUTORIZADO,
      autorizado: true,
    },

    include: includeRelations,

    orderBy: [
      {
        fecha_autorizacion: "desc",
      },
      {
        version: "desc",
      },
      {
        id: "desc",
      },
    ],
  });

  if (!organigrama) {
    throw new Error("NO_CURRENT_ORGANIZATION");
  }

  return organigrama;
};

//HISTORIAL Y REVISIÓN PARA PRESIDENCIA
const getPendientesRevision = async () => {
  return prisma.organigrama.findMany({
    where: {
      OR: [
        {
          estado: ESTADOS.SOLICITADO,
          autorizado: false,
        },

        {
          estado: ESTADOS.AUTORIZADO,
          autorizado: true,
        },

        {
          estado: ESTADOS.RECHAZADO,
          autorizado: false,
        },
      ],
    },

    include: includeRelations,

    orderBy: [
      {
        fecha_solicitud: "desc",
      },
      {
        id: "desc",
      },
    ],
  });
};

//VALIDAR USUARIO
const validarUsuario = async (idUsuario) => {
  const usuario = await prisma.usuario.findUnique({
    where: {
      id: idUsuario,
    },

    select: {
      id: true,
    },
  });

  if (!usuario) {
    throw new Error("USER_NOT_FOUND");
  }
};

//OBTENER ORGANIGRAMA
const obtenerOrganigramaBasico = async (id) => {
  const organigrama = await prisma.organigrama.findUnique({
    where: {
      id,
    },

    include: {
      niveles: true,
    },
  });

  if (!organigrama) {
    throw new Error("NOT_FOUND");
  }

  return organigrama;
};

//VALIDAR ESTRUCTURA
const validarEstructura = async (organigramaId) => {
  const niveles = await prisma.nivel.findMany({
    where: {
      id_organigrama: organigramaId,
    },

    select: {
      id: true,
      id_organigrama: true,
      id_area: true,
      nivel: true,
      id_nivel_superior: true,
    },
  });

  if (niveles.length === 0) {
    throw new Error("EMPTY_STRUCTURE");
  }

  //UNA SOLA RAÍZ
  const raices = niveles.filter(
    (item) =>
      item.id_nivel_superior === null || item.id_nivel_superior === undefined,
  );

  if (raices.length !== 1) {
    throw new Error("INVALID_STRUCTURE");
  }

  //MAPA POR ID
  const mapa = new Map();

  niveles.forEach((item) => {
    mapa.set(Number(item.id), item);
  });

  //PADRES INEXISTENTES
  for (const item of niveles) {
    if (
      item.id_nivel_superior === null ||
      item.id_nivel_superior === undefined
    ) {
      continue;
    }

    if (!mapa.has(Number(item.id_nivel_superior))) {
      throw new Error("INVALID_STRUCTURE");
    }
  }

  //CICLOS
  for (const item of niveles) {
    const visitados = new Set();

    let actual = item;

    while (actual && actual.id_nivel_superior) {
      const actualId = Number(actual.id);

      if (visitados.has(actualId)) {
        throw new Error("CIRCULAR_RELATION");
      }

      visitados.add(actualId);

      actual = mapa.get(Number(actual.id_nivel_superior));
    }
  }

  //ÁREAS REPETIDAS
  const areas = new Set();

  for (const item of niveles) {
    const idArea = Number(item.id_area);

    if (areas.has(idArea)) {
      throw new Error("DUPLICATED_AREA");
    }

    areas.add(idArea);
  }

  return true;
};

//CREATE
const create = async (data) => {
  const titulo = String(data?.titulo ?? "").trim();

  if (!data?.id_usuario || !titulo) {
    throw new Error("INVALID_DATA");
  }

  const idUsuario = convertirId(data.id_usuario);

  await validarUsuario(idUsuario);

  const version =
    data.version !== undefined && data.version !== ""
      ? convertirVersion(data.version)
      : 1;

  return prisma.organigrama.create({
    data: {
      titulo,
      version,
      fecha_solicitud: null,
      fecha_autorizacion: null,
      autorizado: false,
      estado: ESTADOS.EDICION,
      observaciones: null,
      usuario: {
        connect: {
          id: idUsuario,
        },
      },
    },

    include: includeRelations,
  });
};

//UPDATE
const update = async (id, data) => {
  const organigramaId = convertirId(id);

  const actual = await prisma.organigrama.findUnique({
    where: {
      id: organigramaId,
    },
  });

  if (!actual) {
    throw new Error("NOT_FOUND");
  }

  if (actual.estado === ESTADOS.AUTORIZADO || actual.autorizado === true) {
    throw new Error("ALREADY_AUTHORIZED");
  }

  if (actual.estado === ESTADOS.SOLICITADO) {
    throw new Error("REQUEST_PENDING");
  }

  const datos = {};

  if (data.titulo !== undefined) {
    const titulo = String(data.titulo).trim();

    if (!titulo) {
      throw new Error("INVALID_DATA");
    }

    datos.titulo = titulo;
  }

  if (data.version !== undefined) {
    datos.version = convertirVersion(data.version);
  }

  if (data.id_usuario !== undefined) {
    const idUsuario = convertirId(data.id_usuario);

    await validarUsuario(idUsuario);

    datos.usuario = {
      connect: {
        id: idUsuario,
      },
    };
  }

  if (actual.estado === ESTADOS.RECHAZADO) {
    datos.estado = ESTADOS.EDICION;
    datos.observaciones = null;
    datos.fecha_autorizacion = null;
    datos.autorizado = false;
  }

  return prisma.organigrama.update({
    where: {
      id: organigramaId,
    },

    data: datos,
    include: includeRelations,
  });
};

//SOLICITAR AUTORIZACIÓN
const solicitarAutorizacion = async (id) => {
  const organigramaId = convertirId(id);

  const organigrama = await obtenerOrganigramaBasico(organigramaId);

  if (
    organigrama.estado === ESTADOS.AUTORIZADO ||
    organigrama.autorizado === true
  ) {
    throw new Error("ALREADY_AUTHORIZED");
  }

  if (organigrama.estado === ESTADOS.SOLICITADO) {
    throw new Error("ALREADY_REQUESTED");
  }

  await validarEstructura(organigramaId);

  const actualizado = await prisma.organigrama.update({
    where: {
      id: organigramaId,
    },

    data: {
      estado: ESTADOS.SOLICITADO,
      autorizado: false,
      fecha_solicitud: new Date(),
      fecha_autorizacion: null,
      observaciones: null,
    },

    include: includeRelations,
  });

  //NOTIFICAR A PRESIDENCIA
  await ejecutarNotificacionSegura(() =>
    notificacionesController.crearParaPrivilegio("Revisar Organigrama", {
      tipo: "organigrama",
      titulo: "Organigrama pendiente de revisión",
      mensaje: `Recursos Humanos solicitó autorización para "${actualizado.titulo}", versión ${actualizado.version}.`,
      modulo: "organigrama",
      referencia_id: actualizado.id,
      ruta: "/organigrama",
    }),
  );

  return actualizado;
};

const cancelarSolicitud = async (id) => {
  const organigramaId = convertirId(id);

  const organigrama = await prisma.organigrama.findUnique({
    where: {
      id: organigramaId,
    },
  });

  if (!organigrama) {
    throw new Error("NOT_FOUND");
  }

  if (
    organigrama.estado === ESTADOS.AUTORIZADO ||
    organigrama.autorizado === true
  ) {
    throw new Error("ALREADY_AUTHORIZED");
  }

  if (organigrama.estado !== ESTADOS.SOLICITADO) {
    throw new Error("NOT_REQUESTED");
  }

  return prisma.organigrama.update({
    where: {
      id: organigramaId,
    },

    data: {
      estado: ESTADOS.EDICION,
      autorizado: false,
      fecha_autorizacion: null,
      observaciones: null,
    },

    include: includeRelations,
  });
};

//AUTORIZAR
const autorizar = async (id) => {
  const organigramaId = convertirId(id);
  const organigrama = await obtenerOrganigramaBasico(organigramaId);

  if (
    organigrama.estado === ESTADOS.AUTORIZADO ||
    organigrama.autorizado === true
  ) {
    throw new Error("ALREADY_AUTHORIZED");
  }

  if (organigrama.estado !== ESTADOS.SOLICITADO) {
    throw new Error("NOT_REQUESTED");
  }

  //VOLVER A VALIDAR ANTES DE AUTORIZAR
  await validarEstructura(organigramaId);

  const actualizado = await prisma.organigrama.update({
    where: {
      id: organigramaId,
    },

    data: {
      estado: ESTADOS.AUTORIZADO,
      autorizado: true,
      fecha_autorizacion: new Date(),
      observaciones: null,
    },

    include: includeRelations,
  });

  //NOTIFICAR AUTORIZACION
  await ejecutarNotificacionSegura(() =>
    notificacionesController.crearParaPrivilegio("Gestionar Organigrama", {
      tipo: "organigrama",
      titulo: "Organigrama autorizado",
      mensaje: `Presidencia autorizó "${actualizado.titulo}", versión ${actualizado.version}.`,
      modulo: "organigrama",
      referencia_id: actualizado.id,
      ruta: "/organigrama",
    }),
  );

  return actualizado;
};

//RECHAZAR
const rechazar = async (id, data = {}) => {
  const organigramaId = convertirId(id);

  const organigrama = await prisma.organigrama.findUnique({
    where: {
      id: organigramaId,
    },
  });

  if (!organigrama) {
    throw new Error("NOT_FOUND");
  }

  if (
    organigrama.estado === ESTADOS.AUTORIZADO ||
    organigrama.autorizado === true
  ) {
    throw new Error("ALREADY_AUTHORIZED");
  }

  if (organigrama.estado !== ESTADOS.SOLICITADO) {
    throw new Error("NOT_REQUESTED");
  }

  const observaciones = convertirObservaciones(data.observaciones);

  if (!observaciones) {
    throw new Error("OBSERVATIONS_REQUIRED");
  }

  const actualizado = await prisma.organigrama.update({
    where: {
      id: organigramaId,
    },

    data: {
      estado: ESTADOS.RECHAZADO,
      autorizado: false,
      fecha_autorizacion: new Date(),
      observaciones,
    },

    include: includeRelations,
  });

  await ejecutarNotificacionSegura(() =>
    notificacionesController.crearParaPrivilegio("Gestionar Organigrama", {
      tipo: "organigrama",
      titulo: "Organigrama rechazado",
      mensaje: `Presidencia rechazó "${actualizado.titulo}", versión ${actualizado.version}. Motivo: ${observaciones}`,
      modulo: "organigrama",
      referencia_id: actualizado.id,
      ruta: "/organigrama",
    }),
  );

  return actualizado;
};

// REABRIR RECHAZADO PARA EDICIÓN
const reabrirEdicion = async (id) => {
  const organigramaId = convertirId(id);

  const organigrama = await prisma.organigrama.findUnique({
    where: {
      id: organigramaId,
    },
  });

  if (!organigrama) {
    throw new Error("NOT_FOUND");
  }

  if (organigrama.estado !== ESTADOS.RECHAZADO) {
    throw new Error("NOT_REJECTED");
  }

  return prisma.organigrama.update({
    where: {
      id: organigramaId,
    },

    data: {
      estado: ESTADOS.EDICION,
      autorizado: false,
      fecha_autorizacion: null,
    },

    include: includeRelations,
  });
};

//DELETE
const remove = async (id) => {
  const organigramaId = convertirId(id);

  const organigrama = await prisma.organigrama.findUnique({
    where: {
      id: organigramaId,
    },
  });

  if (!organigrama) {
    throw new Error("NOT_FOUND");
  }

  if (
    organigrama.estado === ESTADOS.AUTORIZADO ||
    organigrama.autorizado === true
  ) {
    throw new Error("AUTHORIZED_CANNOT_DELETE");
  }

  if (organigrama.estado === ESTADOS.SOLICITADO) {
    throw new Error("REQUEST_PENDING");
  }

  return prisma.$transaction(async (transaction) => {
    await transaction.nivel.deleteMany({
      where: {
        id_organigrama: organigramaId,
      },
    });

    return transaction.organigrama.delete({
      where: {
        id: organigramaId,
      },
    });
  });
};

module.exports = {
  getAll,
  getById,

  getVigente,
  getPendientesRevision,
  
  create,
  update,

  solicitarAutorizacion,
  cancelarSolicitud,

  autorizar,
  rechazar,
  reabrirEdicion,

  remove,
};
