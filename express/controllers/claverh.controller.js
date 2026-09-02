const prisma = require("../db/client");

const convertirId = (valor) => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("INVALID_ID");
  }

  return id;
};

const limpiarClave = (valor) => {
  if (valor === undefined || valor === null) {
    throw new Error("INVALID_DATA");
  }

  const clave = String(valor).trim();

  if (!clave) {
    throw new Error("INVALID_DATA");
  }

  return clave;
};

// Obtener todos los registros
const getAll = async () => {
  return prisma.claveRh.findMany({
    orderBy: {
      id: "asc",
    },
  });
};

// Obtener registro por ID
const getById = async (id) => {
  const claveId = convertirId(id);
  const registro = await prisma.claveRh.findUnique({
    where: {
      id: claveId,
    },
  });

  if (!registro) {
    throw new Error("NOT_FOUND");
  }

  return registro;
};

// Crear clave RH
const create = async (data) => {
  const clave = limpiarClave(data?.clave);
  const claveExistente = await prisma.claveRh.findFirst({
    where: {
      clave,
    },
  });

  if (claveExistente) {
    throw new Error("DUPLICATE");
  }

  return prisma.claveRh.create({
    data: {
      clave,
    },
  });
};

// Actualizar clave RH
const update = async (id, data) => {
  const claveId = convertirId(id);
  const clave = limpiarClave(data?.clave);

  const claveExistente = await prisma.claveRh.findFirst({
    where: {
      clave,
      NOT: {
        id: claveId,
      },
    },
  });

  if (claveExistente) {
    throw new Error("DUPLICATE");
  }

  try {
    return await prisma.claveRh.update({
      where: {
        id: claveId,
      },
      data: {
        clave,
      },
    });
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("NOT_FOUND");
    }

    throw error;
  }
};

// Eliminar clave RH
const remove = async (id) => {
  const claveId = convertirId(id);

  try {
    return await prisma.claveRh.delete({
      where: {
        id: claveId,
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
  getAll,
  getById,
  create,
  update,
  remove,
};
