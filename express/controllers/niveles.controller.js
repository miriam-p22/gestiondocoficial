const prisma = require("../db/client");

const convertirId = (valor) => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("INVALID_ID");
  }

  return id;
};

const convertirNivel = (valor) => {
  const nivel = Number(valor);

  if (!Number.isInteger(nivel) || nivel <= 0) {
    throw new Error("INVALID_LEVEL");
  }

  return nivel;
};

const convertirIdNivelSuperior = (valor) => {
  if (valor === undefined || valor === null || valor === "") {
    return null;
  }

  return convertirId(valor);
};

//RELACIONES
const includeRelations = {
  area: true,

  superior: {
    include: {
      area: true,
    },
  },

  organigrama: {
    select: {
      id: true,
      titulo: true,
      version: true,
      autorizado: true,
    },
  },
};

//GET ALL
const getAll = async (filtros = {}) => {
  const where = {};

  if (filtros.id_organigrama) {
    where.id_organigrama = convertirId(filtros.id_organigrama);
  }

  if (filtros.id_area) {
    where.id_area = convertirId(filtros.id_area);
  }

  return prisma.nivel.findMany({
    where,

    include: includeRelations,

    orderBy: [
      {
        nivel: "asc",
      },
      {
        id: "asc",
      },
    ],
  });
};

//GET BY ID
const getById = async (id) => {
  const nivel = await prisma.nivel.findUnique({
    where: {
      id: convertirId(id),
    },

    include: includeRelations,
  });

  if (!nivel) {
    throw new Error("NOT_FOUND");
  }

  return nivel;
};

//VALIDAR ORGANIGRAMA
const obtenerOrganigrama = async (idOrganigrama) => {
  const organigrama = await prisma.organigrama.findUnique({
    where: {
      id: idOrganigrama,
    },

    select: {
      id: true,
      titulo: true,
      autorizado: true,
    },
  });

  if (!organigrama) {
    throw new Error("ORGANIGRAMA_NOT_FOUND");
  }

  return organigrama;
};

//VALIDAR ÁREA
const obtenerArea = async (idArea) => {
  const area = await prisma.area.findUnique({
    where: {
      id: idArea,
    },

    select: {
      id: true,
      nombre_area: true,
    },
  });

  if (!area) {
    throw new Error("AREA_NOT_FOUND");
  }

  return area;
};

//VALIDAR SUPERIOR
const obtenerNivelSuperior = async (idNivelSuperior, idOrganigrama) => {
  if (!idNivelSuperior) {
    return null;
  }

  const superior = await prisma.nivel.findUnique({
    where: {
      id: idNivelSuperior,
    },

    include: {
      area: true,
    },
  });

  if (!superior) {
    throw new Error("SUPERIOR_NOT_FOUND");
  }

  if (superior.id_organigrama !== idOrganigrama) {
    throw new Error("SUPERIOR_OTHER_ORGANIGRAMA");
  }

  return superior;
};

//VALIDAR RAÍZ ÚNICA
const validarRaizUnica = async (
  idOrganigrama,
  idNivelSuperior,
  idNivelExcluir = null,
) => {
  if (idNivelSuperior !== null) {
    return;
  }

  const raizExistente = await prisma.nivel.findFirst({
    where: {
      id_organigrama: idOrganigrama,
      id_nivel_superior: null,
      ...(idNivelExcluir
        ? {
            NOT: {
              id: idNivelExcluir,
            },
          }
        : {}),
    },
  });

  if (raizExistente) {
    throw new Error("ROOT_ALREADY_EXISTS");
  }
};

//VALIDAR CICLO
const validarCiclo = async (idNivelActual, idNivelSuperior) => {
  if (!idNivelActual || !idNivelSuperior) {
    return;
  }

  if (idNivelActual === idNivelSuperior) {
    throw new Error("SELF_PARENT");
  }

  let actualId = idNivelSuperior;
  const visitados = new Set();

  while (actualId) {
    if (visitados.has(actualId)) {
      break;
    }

    visitados.add(actualId);

    if (actualId === idNivelActual) {
      throw new Error("CIRCULAR_RELATION");
    }

    const actual = await prisma.nivel.findUnique({
      where: {
        id: actualId,
      },

      select: {
        id_nivel_superior: true,
      },
    });

    if (!actual) {
      break;
    }

    actualId = actual.id_nivel_superior;
  }
};

//CREATE
const create = async (data) => {
  if (
    !data?.id_organigrama ||
    !data?.id_area ||
    data?.nivel === undefined ||
    data?.nivel === ""
  ) {
    throw new Error("INVALID_DATA");
  }

  const idOrganigrama = convertirId(data.id_organigrama);
  const idArea = convertirId(data.id_area);
  const nivel = convertirNivel(data.nivel);
  const idNivelSuperior = convertirIdNivelSuperior(data.id_nivel_superior);
  const organigrama = await obtenerOrganigrama(idOrganigrama);

  if (organigrama.autorizado) {
    throw new Error("ORGANIGRAMA_AUTHORIZED");
  }

  await obtenerArea(idArea);
  await validarRaizUnica(idOrganigrama, idNivelSuperior);

  const superior = await obtenerNivelSuperior(idNivelSuperior, idOrganigrama);

  try {
    return await prisma.nivel.create({
      data: {
        id_organigrama: idOrganigrama,
        id_area: idArea,
        nivel,
        id_nivel_superior: idNivelSuperior,
        area_superior: superior?.area?.nombre_area || null,
      },

      include: includeRelations,
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw new Error("AREA_ALREADY_EXISTS");
    }

    throw error;
  }
};

//UPDATE
const update = async (id, data) => {
  const nivelId = convertirId(id);

  const actual = await prisma.nivel.findUnique({
    where: {
      id: nivelId,
    },

    include: {
      organigrama: true,
      area: true,
    },
  });

  if (!actual) {
    throw new Error("NOT_FOUND");
  }

  if (actual.organigrama.autorizado) {
    throw new Error("ORGANIGRAMA_AUTHORIZED");
  }

  const idOrganigrama = actual.id_organigrama;

  const idArea =
    data.id_area !== undefined ? convertirId(data.id_area) : actual.id_area;

  const numeroNivel =
    data.nivel !== undefined ? convertirNivel(data.nivel) : actual.nivel;

  const idNivelSuperior =
    data.id_nivel_superior !== undefined
      ? convertirIdNivelSuperior(data.id_nivel_superior)
      : actual.id_nivel_superior;

  await obtenerArea(idArea);
  await validarRaizUnica(idOrganigrama, idNivelSuperior, nivelId);
  await validarCiclo(nivelId, idNivelSuperior);

  const superior = await obtenerNivelSuperior(idNivelSuperior, idOrganigrama);

  try {
    return await prisma.nivel.update({
      where: {
        id: nivelId,
      },

      data: {
        id_area: idArea,
        nivel: numeroNivel,
        id_nivel_superior: idNivelSuperior,
        area_superior: superior?.area?.nombre_area || null,
      },

      include: includeRelations,
    });
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("NOT_FOUND");
    }

    if (error.code === "P2002") {
      throw new Error("AREA_ALREADY_EXISTS");
    }

    throw error;
  }
};

//DELETE
const remove = async (id) => {
  const nivelId = convertirId(id);
  const registro = await prisma.nivel.findUnique({
    where: {
      id: nivelId,
    },

    include: {
      organigrama: true,
      area: true,
    },
  });

  if (!registro) {
    throw new Error("NOT_FOUND");
  }

  if (registro.organigrama.autorizado) {
    throw new Error("ORGANIGRAMA_AUTHORIZED");
  }

  const hijos = await prisma.nivel.count({
    where: {
      id_nivel_superior: nivelId,
    },
  });

  if (hijos > 0) {
    throw new Error("LEVEL_HAS_CHILDREN");
  }

  return prisma.nivel.delete({
    where: {
      id: nivelId,
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
