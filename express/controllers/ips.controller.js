const prisma = require("../db/client");

const convertirId = (valor) => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("INVALID_ID");
  }

  return id;
};

const convertirBooleano = (valor) => {
  if (valor === undefined) {
    return undefined;
  }

  if (valor === null || valor === "") {
    return null;
  }

  if (typeof valor === "boolean") {
    return valor;
  }

  if (typeof valor === "number") {
    if (valor === 1) return true;
    if (valor === 0) return false;
  }

  if (typeof valor === "string") {
    const texto = valor.trim().toLowerCase();

    if (["true", "1", "si", "sí", "yes"].includes(texto)) {
      return true;
    }

    if (["false", "0", "no"].includes(texto)) {
      return false;
    }
  }

  throw new Error("INVALID_DATA");
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

const esIpv4Valida = (valor) => {
  const texto = String(valor || "").trim();
  const partes = texto.split(".");

  if (partes.length !== 4) {
    return false;
  }

  return partes.every((parte) => {
    if (parte === "" || !/^\d+$/.test(parte)) {
      return false;
    }

    const numero = Number(parte);

    return numero >= 0 && numero <= 255;
  });
};

const relacionesIp = {
  area: true,
};

//GET ALL
const getAll = async (filtros = {}) => {
  const where = {};

  if (filtros.id_area !== undefined && filtros.id_area !== "") {
    where.id_area = convertirId(filtros.id_area);
  }

  return prisma.ip.findMany({
    where,
    include: relacionesIp,
    orderBy: [
      {
        area: {
          nombre_area: "asc",
        },
      },
      {
        ip_areas: "asc",
      },
    ],
  });
};

//GET BY ID
const getById = async (id) => {
  const ipId = convertirId(id);

  const registro = await prisma.ip.findUnique({
    where: {
      id: ipId,
    },
    include: relacionesIp,
  });

  if (!registro) {
    throw new Error("NOT_FOUND");
  }

  return registro;
};

//VALIDAR ÁREA
const validarArea = async (idArea) => {
  const areaId = convertirId(idArea);

  const area = await prisma.area.findUnique({
    where: {
      id: areaId,
    },
    select: {
      id: true,
    },
  });

  if (!area) {
    throw new Error("AREA_NOT_FOUND");
  }

  return areaId;
};

//VALIDAR IP DUPLICADA
const validarIpDuplicada = async (ip, excluirId = null) => {
  const existente = await prisma.ip.findFirst({
    where: {
      ip_areas: ip,

      ...(excluirId
        ? {
            NOT: {
              id: excluirId,
            },
          }
        : {}),
    },

    select: {
      id: true,
      id_area: true,
    },
  });

  if (existente) {
    throw new Error("DUPLICATE_IP");
  }
};

//CREATE
const create = async (data) => {
  if (!data?.id_area) {
    throw new Error("INVALID_DATA");
  }

  const areaId = await validarArea(data.id_area);
  const ipAreas = limpiarTexto(data.ip_areas);

  if (!ipAreas || !esIpv4Valida(ipAreas)) {
    throw new Error("INVALID_IP");
  }

  await validarIpDuplicada(ipAreas);

  return prisma.ip.create({
    data: {
      id_area: areaId,
      ip_rh: data.ip_rh !== undefined ? convertirBooleano(data.ip_rh) : false,
      ip_areas: ipAreas,
      grupo: limpiarTexto(data.grupo),
    },

    include: relacionesIp,
  });
};

//UPDATE
const update = async (id, data) => {
  const ipId = convertirId(id);

  const actual = await prisma.ip.findUnique({
    where: {
      id: ipId,
    },
  });

  if (!actual) {
    throw new Error("NOT_FOUND");
  }

  let areaId;

  if (data.id_area !== undefined) {
    areaId = await validarArea(data.id_area);
  }

  let ipAreas;

  if (data.ip_areas !== undefined) {
    ipAreas = limpiarTexto(data.ip_areas);

    if (!ipAreas || !esIpv4Valida(ipAreas)) {
      throw new Error("INVALID_IP");
    }

    await validarIpDuplicada(ipAreas, ipId);
  }

  try {
    return await prisma.ip.update({
      where: {
        id: ipId,
      },

      data: {
        id_area: areaId,

        ip_rh:
          data.ip_rh !== undefined ? convertirBooleano(data.ip_rh) : undefined,

        ip_areas: ipAreas,

        grupo: limpiarTexto(data.grupo),
      },

      include: relacionesIp,
    });
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("NOT_FOUND");
    }

    throw error;
  }
};

//DELETE
const remove = async (id) => {
  const ipId = convertirId(id);

  try {
    return await prisma.ip.delete({
      where: {
        id: ipId,
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
