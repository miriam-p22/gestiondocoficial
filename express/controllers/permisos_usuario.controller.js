const prisma = require("../db/client");

const getActuales = async (usuario) => {
  if (!usuario || !usuario.id || !usuario.id_rol) {
    throw new Error("ACCESS_DENIED");
  }

  const permisos = await prisma.rolPermiso.findMany({
    where: {
      id_rol: Number(usuario.id_rol),
    },
    select: {
      privilegio: {
        select: {
          id: true,
          titulo_privilegio: true,
        },
      },
    },
    orderBy: {
      id_privilegio: "asc",
    },
  });

  const privilegios = permisos
    .map((item) => item.privilegio)
    .filter(Boolean);

  return {
    id_usuario: usuario.id,
    rol: {
      id: usuario.id_rol,
      nombre: usuario.rol?.nombre_rol || null,
    },
    privilegios,
    titulos: privilegios.map(
      (item) => item.titulo_privilegio
    ),
  };
};

module.exports = {
  getActuales,
};