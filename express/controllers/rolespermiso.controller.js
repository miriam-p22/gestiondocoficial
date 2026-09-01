const prisma = require("../db/client");

const convertirId = (valor) => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("INVALID_ID");
  }

  return id;
};

const getAll = async () => {
  return prisma.rolPermiso.findMany({
    include: {
      rol: true,
      privilegio: true,
    },
    orderBy: [
      {
        id_rol: "asc",
      },
      {
        id_privilegio: "asc",
      },
    ],
  });
};

const getByRol = async (idRol) => {
  return prisma.rolPermiso.findMany({
    where: {
      id_rol: convertirId(idRol),
    },
    include: {
      rol: true,
      privilegio: true,
    },
    orderBy: {
      id_privilegio: "asc",
    },
  });
};

const getOne = async (
  idRol,
  idPrivilegio
) => {
  const permiso = await prisma.rolPermiso.findUnique({
    where: {
      id_rol_id_privilegio: {
        id_rol: convertirId(idRol),
        id_privilegio:
          convertirId(idPrivilegio),
      },
    },
    include: {
      rol: true,
      privilegio: true,
    },
  });

  if (!permiso) {
    throw new Error("NOT_FOUND");
  }

  return permiso;
};

const create = async (data) => {
  if (!data?.id_rol || !data?.id_privilegio) {
    throw new Error("INVALID_DATA");
  }

  return prisma.rolPermiso.create({
    data: {
      id_rol: convertirId(data.id_rol),
      id_privilegio: convertirId(
        data.id_privilegio
      ),
    },
    include: {
      rol: true,
      privilegio: true,
    },
  });
};

const replaceByRol = async (
  idRol,
  privilegios = []
) => {
  const rolId = convertirId(idRol);

  if (!Array.isArray(privilegios)) {
    throw new Error("INVALID_DATA");
  }

  const ids = [
    ...new Set(
      privilegios.map((id) =>
        convertirId(id)
      )
    ),
  ];

  return prisma.$transaction(
    async (transaction) => {
      const rol = await transaction.rol.findUnique({
        where: {
          id: rolId,
        },
      });

      if (!rol) {
        throw new Error("ROLE_NOT_FOUND");
      }

      if (ids.length > 0) {
        const existentes =
          await transaction.privilegio.count({
            where: {
              id: {
                in: ids,
              },
            },
          });

        if (existentes !== ids.length) {
          throw new Error(
            "PRIVILEGE_NOT_FOUND"
          );
        }
      }

      await transaction.rolPermiso.deleteMany({
        where: {
          id_rol: rolId,
        },
      });

      if (ids.length > 0) {
        await transaction.rolPermiso.createMany({
          data: ids.map((idPrivilegio) => ({
            id_rol: rolId,
            id_privilegio: idPrivilegio,
          })),
          skipDuplicates: true,
        });
      }

      return transaction.rolPermiso.findMany({
        where: {
          id_rol: rolId,
        },
        include: {
          rol: true,
          privilegio: true,
        },
        orderBy: {
          id_privilegio: "asc",
        },
      });
    }
  );
};

const remove = async (
  idRol,
  idPrivilegio
) => {
  try {
    return await prisma.rolPermiso.delete({
      where: {
        id_rol_id_privilegio: {
          id_rol: convertirId(idRol),
          id_privilegio:
            convertirId(idPrivilegio),
        },
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
  getByRol,
  getOne,
  create,
  replaceByRol,
  remove,
};