const prisma = require("../db/client");

const ESTADOS_PERMITIDOS = [
  "pendiente",
  "recibido",
  "devuelto",
  "atendido",
  "en proceso",
  "vencido",
  "respondido",
  "turnado",
];

const convertirId = (valor) => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("INVALID_ID");
  }

  return id;
};

const normalizarEstado = (valor) => {
  if (valor === undefined || valor === null) {
    throw new Error("INVALID_DATA");
  }

  const estado = String(valor).trim().toLowerCase();

  if (!estado || !ESTADOS_PERMITIDOS.includes(estado)) {
    throw new Error("INVALID_STATE");
  }

  return estado;
};

const relacionesEstado = {
  documento: {
    include: {
      area: true,
      clasificacion: true,
    },
  },
};

// Obtener estados con filtro opcional por documento
const getAll = async (filtros = {}) => {
  const where = {};

  if (
    filtros.id_documento !== undefined &&
    filtros.id_documento !== ""
  ) {
    where.id_documento = convertirId(
      filtros.id_documento
    );
  }

  return prisma.estado.findMany({
    where,
    include: relacionesEstado,
    orderBy: {
      id: "desc",
    },
  });
};

// Obtener estado por ID
const getById = async (id) => {
  const estadoId = convertirId(id);

  const estado = await prisma.estado.findUnique({
    where: {
      id: estadoId,
    },
    include: relacionesEstado,
  });

  if (!estado) {
    throw new Error("NOT_FOUND");
  }

  return estado;
};

// Crear estado
const create = async (data) => {
  if (!data?.id_documento) {
    throw new Error("INVALID_DATA");
  }

  const documentoId = convertirId(data.id_documento);
  const nombreEstado = normalizarEstado(
    data.nombre_estado
  );

  const documento = await prisma.documento.findUnique({
    where: {
      id: documentoId,
    },
  });

  if (!documento) {
    throw new Error("DOCUMENT_NOT_FOUND");
  }

  return prisma.estado.create({
    data: {
      id_documento: documentoId,
      nombre_estado: nombreEstado,
    },
    include: relacionesEstado,
  });
};

// Actualizar estado
const update = async (id, data) => {
  const estadoId = convertirId(id);

  const datosActualizacion = {};

  if (data.nombre_estado !== undefined) {
    datosActualizacion.nombre_estado = normalizarEstado(
      data.nombre_estado
    );
  }

  if (data.id_documento !== undefined) {
    const documentoId = convertirId(data.id_documento);

    const documento = await prisma.documento.findUnique({
      where: {
        id: documentoId,
      },
    });

    if (!documento) {
      throw new Error("DOCUMENT_NOT_FOUND");
    }

    datosActualizacion.id_documento = documentoId;
  }

  if (Object.keys(datosActualizacion).length === 0) {
    throw new Error("INVALID_DATA");
  }

  try {
    return await prisma.estado.update({
      where: {
        id: estadoId,
      },
      data: datosActualizacion,
      include: relacionesEstado,
    });
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("NOT_FOUND");
    }

    throw error;
  }
};

// Eliminar estado
const remove = async (id) => {
  const estadoId = convertirId(id);

  try {
    return await prisma.estado.delete({
      where: {
        id: estadoId,
      },
    });
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("NOT_FOUND");
    }

    throw error;
  }
};

module.exports = {
  ESTADOS_PERMITIDOS,
  getAll,
  getById,
  create,
  update,
  remove,
};