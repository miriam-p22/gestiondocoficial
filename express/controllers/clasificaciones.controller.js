const prisma = require("../db/client");

const convertirId = (valor) => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("INVALID_ID");
  }

  return id;
};

const limpiarTexto = (valor) => {
  if (valor === undefined) {
    return undefined;
  }

  if (valor === null || String(valor).trim() === "") {
    return null;
  }

  return String(valor).trim();
};

const relacionesClasificacion = {
  documentos: {
    select: {
      id: true,
      num_oficio: true,
      titulo_documento: true,
    },
  },
};

// Obtener todas las clasificaciones
const getAll = async () => {
  return prisma.clasificacion.findMany({
    orderBy: [
      {
        area_administrativa: "asc",
      },
      {
        codigo_asignado: "asc",
      },
    ],
  });
};

// Obtener clasificación por ID
const getById = async (id) => {
  const clasificacionId = convertirId(id);

  const clasificacion = await prisma.clasificacion.findUnique({
    where: {
      id: clasificacionId,
    },
    include: relacionesClasificacion,
  });

  if (!clasificacion) {
    throw new Error("NOT_FOUND");
  }

  return clasificacion;
};

// Crear clasificación
const create = async (data) => {
  const areaAdministrativa = limpiarTexto(data?.area_administrativa);
  const codigoAsignado = limpiarTexto(data?.codigo_asignado);
  const ubicacion = limpiarTexto(data?.ubicacion);
  const funcion = limpiarTexto(data?.funcion);

  if (!areaAdministrativa || !codigoAsignado) {
    throw new Error("INVALID_DATA");
  }

  const clasificacionExistente = await prisma.clasificacion.findFirst({
    where: {
      codigo_asignado: codigoAsignado,
    },
  });

  if (clasificacionExistente) {
    throw new Error("DUPLICATE");
  }

  return prisma.clasificacion.create({
    data: {
      area_administrativa: areaAdministrativa,
      codigo_asignado: codigoAsignado,
      ubicacion,
      funcion,
    },
  });
};

// Actualizar clasificación
const update = async (id, data) => {
  const clasificacionId = convertirId(id);

  if (
    data.area_administrativa !== undefined &&
    !limpiarTexto(data.area_administrativa)
  ) {
    throw new Error("INVALID_DATA");
  }

  if (
    data.codigo_asignado !== undefined &&
    !limpiarTexto(data.codigo_asignado)
  ) {
    throw new Error("INVALID_DATA");
  }

  if (data.codigo_asignado !== undefined) {
    const codigoAsignado = limpiarTexto(data.codigo_asignado);

    const clasificacionExistente = await prisma.clasificacion.findFirst({
      where: {
        codigo_asignado: codigoAsignado,
        NOT: {
          id: clasificacionId,
        },
      },
    });

    if (clasificacionExistente) {
      throw new Error("DUPLICATE");
    }
  }

  try {
    return await prisma.clasificacion.update({
      where: {
        id: clasificacionId,
      },
      data: {
        area_administrativa: limpiarTexto(data.area_administrativa),
        codigo_asignado: limpiarTexto(data.codigo_asignado),
        ubicacion: limpiarTexto(data.ubicacion),
        funcion: limpiarTexto(data.funcion),
      },
    });
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("NOT_FOUND");
    }

    throw error;
  }
};

// Eliminar clasificación
const remove = async (id) => {
  const clasificacionId = convertirId(id);

  const clasificacion = await prisma.clasificacion.findUnique({
    where: {
      id: clasificacionId,
    },
    include: {
      documentos: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!clasificacion) {
    throw new Error("NOT_FOUND");
  }

  if (clasificacion.documentos.length > 0) {
    throw new Error("CLASSIFICATION_IN_USE");
  }

  return prisma.clasificacion.delete({
    where: {
      id: clasificacionId,
    },
  });
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
