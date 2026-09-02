const prisma = require("../db/client");

const convertirId = (valor) => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("INVALID_ID");
  }

  return id;
};

const obtenerNombreRol = (data) => {
  const nombre = String(data?.nombre_rol ?? "").trim();

  if (!nombre) {
    throw new Error("INVALID_DATA");
  }

  return nombre;
};

const relacionesRol = {
  permisos: {
    include: {
      privilegio: true,
    },
  },
};

const getAll = async () => {
  return prisma.rol.findMany({
    include: relacionesRol,
    orderBy: {
      nombre_rol: "asc",
    },
  });
};

const getById = async (id) => {
  const rol = await prisma.rol.findUnique({
    where: {
      id: convertirId(id),
    },
    include: {
      usuarios: {
        select: {
          id: true,
          nombre_completo: true,
          nombre_usuario: true,
        },
      },
      permisos: {
        include: {
          privilegio: true,
        },
      },
    },
  });

  if (!rol) {
    throw new Error("NOT_FOUND");
  }

  return rol;
};

const create = async (data) => {
  const nombreRol = obtenerNombreRol(data);
  const duplicado = await prisma.rol.findFirst({
    where: {
      nombre_rol: nombreRol,
    },
  });

  if (duplicado) {
    throw new Error("DUPLICATE");
  }

  return prisma.rol.create({
    data: {
      nombre_rol: nombreRol,
    },
    include: relacionesRol,
  });
};

const update = async (id, data) => {
  const rolId = convertirId(id);
  const nombreRol = obtenerNombreRol(data);

  const duplicado = await prisma.rol.findFirst({
    where: {
      nombre_rol: nombreRol,
      NOT: {
        id: rolId,
      },
    },
  });

  if (duplicado) {
    throw new Error("DUPLICATE");
  }

  try {
    return await prisma.rol.update({
      where: {
        id: rolId,
      },
      data: {
        nombre_rol: nombreRol,
      },
      include: relacionesRol,
    });
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("NOT_FOUND");
    }

    throw error;
  }
};

const remove = async (id) => {
  const rolId = convertirId(id);

  const rol = await prisma.rol.findUnique({
    where: {
      id: rolId,
    },
    include: {
      usuarios: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!rol) {
    throw new Error("NOT_FOUND");
  }

  if (rol.usuarios.length > 0) {
    throw new Error("ROLE_HAS_USERS");
  }

  return prisma.$transaction(async (transaction) => {
    await transaction.rolPermiso.deleteMany({
      where: {
        id_rol: rolId,
      },
    });

    return transaction.rol.delete({
      where: {
        id: rolId,
      },
    });
  });
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
