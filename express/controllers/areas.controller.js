const prisma = require("../db/client");

//CONVERTIR Y VALIDAR ID
const convertirId = (valor) => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("INVALID_ID");
  }

  return id;
};

//NORMALIZAR NOMBRE DE ÁREA
const obtenerNombreArea = (data) => {
  const nombre = String(data?.nombre_area ?? "").trim();

  if (!nombre) {
    throw new Error("INVALID_DATA");
  }

  return nombre;
};

const getAll = async () => {
  return prisma.area.findMany({
    orderBy: {
      nombre_area: "asc",
    },
  });
};

const getById = async (id) => {
  const areaId = convertirId(id);

  const area = await prisma.area.findUnique({
    where: {
      id: areaId,
    },

    include: {
      usuarios: {
        select: {
          id: true,
          nombre_completo: true,
          nombre_usuario: true,
        },
      },

      documentos: {
        select: {
          id: true,
          num_oficio: true,
          titulo_documento: true,
        },
      },

      niveles: {
        select: {
          id: true,
          id_organigrama: true,
          nivel: true,
          area_superior: true,
        },
      },

      ips: {
        select: {
          id: true,
          ip_areas: true,
          grupo: true,
        },
      },
    },
  });

  if (!area) {
    throw new Error("NOT_FOUND");
  }

  return area;
};

//CREAR ÁREA
const create = async (data) => {
  const nombreArea = obtenerNombreArea(data);

  const areas = await prisma.area.findMany({
    select: {
      id: true,
      nombre_area: true,
    },
  });

  const duplicada = areas.find(
    (area) =>
      area.nombre_area.trim().toLowerCase() === nombreArea.trim().toLowerCase(),
  );

  if (duplicada) {
    throw new Error("DUPLICATE");
  }

  return prisma.area.create({
    data: {
      nombre_area: nombreArea,
    },
  });
};

//ACTUALIZAR ÁREA
const update = async (id, data) => {
  const areaId = convertirId(id);

  const areaActual = await prisma.area.findUnique({
    where: {
      id: areaId,
    },
  });

  if (!areaActual) {
    throw new Error("NOT_FOUND");
  }

  const nombreArea = obtenerNombreArea(data);

  const areas = await prisma.area.findMany({
    where: {
      NOT: {
        id: areaId,
      },
    },

    select: {
      id: true,
      nombre_area: true,
    },
  });

  const duplicada = areas.find(
    (area) =>
      area.nombre_area.trim().toLowerCase() === nombreArea.trim().toLowerCase(),
  );

  if (duplicada) {
    throw new Error("DUPLICATE");
  }

  return prisma.area.update({
    where: {
      id: areaId,
    },

    data: {
      nombre_area: nombreArea,
    },
  });
};

//OBTENER USO DEL ÁREA
const getUso = async (id) => {
  const areaId = convertirId(id);

  const area = await prisma.area.findUnique({
    where: {
      id: areaId,
    },

    select: {
      id: true,
      nombre_area: true,

      _count: {
        select: {
          usuarios: true,
          documentos: true,
          niveles: true,
          ips: true,
        },
      },
    },
  });

  if (!area) {
    throw new Error("NOT_FOUND");
  }

  return {
    id: area.id,
    nombre_area: area.nombre_area,
    usuarios: area._count.usuarios,
    documentos: area._count.documentos,
    niveles: area._count.niveles,
    ips: area._count.ips,
    en_uso:
      area._count.usuarios > 0 ||
      area._count.documentos > 0 ||
      area._count.niveles > 0 ||
      area._count.ips > 0,
  };
};

//ELIMINAR ÁREA
const remove = async (id) => {
  const areaId = convertirId(id);

  const area = await prisma.area.findUnique({
    where: {
      id: areaId,
    },

    include: {
      usuarios: {
        select: {
          id: true,
        },
      },

      documentos: {
        select: {
          id: true,
        },
      },

      niveles: {
        select: {
          id: true,
        },
      },

      ips: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!area) {
    throw new Error("NOT_FOUND");
  }

  if (
    area.usuarios.length > 0 ||
    area.documentos.length > 0 ||
    area.niveles.length > 0 ||
    area.ips.length > 0
  ) {
    throw new Error("AREA_IN_USE");
  }

  return prisma.area.delete({
    where: {
      id: areaId,
    },
  });
};

module.exports = {
  getAll,
  getById,
  getUso,
  create,
  update,
  remove,
};
