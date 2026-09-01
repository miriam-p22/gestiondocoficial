const prisma = require("../db/client");

const convertirId = (valor) => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("INVALID_ID");
  }

  return id;
};

const obtenerTitulo = (data) => {
  const titulo = String(
    data?.titulo_privilegio ?? ""
  ).trim();

  if (!titulo) {
    throw new Error("INVALID_DATA");
  }

  return titulo;
};

const getAll = async () => {
  return prisma.privilegio.findMany({
    orderBy: {
      titulo_privilegio: "asc",
    },
  });
};

const getById = async (id) => {
  const privilegio =
    await prisma.privilegio.findUnique({
      where: {
        id: convertirId(id),
      },
      include: {
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });

  if (!privilegio) {
    throw new Error("NOT_FOUND");
  }

  return privilegio;
};

const create = async (data) => {
  const titulo = obtenerTitulo(data);

  const duplicado =
    await prisma.privilegio.findFirst({
      where: {
        titulo_privilegio: titulo,
      },
    });

  if (duplicado) {
    throw new Error("DUPLICATE");
  }

  const datos = {
    titulo_privilegio: titulo,
  };

  if (
    data.id !== undefined &&
    data.id !== ""
  ) {
    datos.id = convertirId(data.id);
  }

  return prisma.privilegio.create({
    data: datos,
  });
};

const update = async (id, data) => {
  const privilegioId = convertirId(id);

  const actual =
    await prisma.privilegio.findUnique({
      where: {
        id: privilegioId,
      },
    });

  if (!actual) {
    throw new Error("NOT_FOUND");
  }

  const titulo =
    data.titulo_privilegio !== undefined
      ? obtenerTitulo(data)
      : actual.titulo_privilegio;

  const duplicado =
    await prisma.privilegio.findFirst({
      where: {
        titulo_privilegio: titulo,
        NOT: {
          id: privilegioId,
        },
      },
    });

  if (duplicado) {
    throw new Error("DUPLICATE");
  }

  return prisma.privilegio.update({
    where: {
      id: privilegioId,
    },
    data: {
      titulo_privilegio: titulo,
    },
  });
};

const remove = async (id) => {
  const privilegioId =
    convertirId(id);

  const privilegio =
    await prisma.privilegio.findUnique({
      where: {
        id: privilegioId,
      },
    });

  if (!privilegio) {
    throw new Error("NOT_FOUND");
  }

  return prisma.$transaction(
    async (transaction) => {
      await transaction.rolPermiso.deleteMany({
        where: {
          id_privilegio:
            privilegioId,
        },
      });

      return transaction.privilegio.delete({
        where: {
          id: privilegioId,
        },
      });
    }
  );
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};