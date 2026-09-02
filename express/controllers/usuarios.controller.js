const prisma = require("../db/client");
const bcrypt = require("bcryptjs");
const BCRYPT_ROUNDS = 12;

const convertirId = (valor) => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("INVALID_ID");
  }

  return id;
};

const convertirNumeroOpcional = (valor) => {
  if (valor === undefined || valor === null || valor === "") {
    return null;
  }

  const numero = Number(valor);

  if (!Number.isInteger(numero)) {
    throw new Error("INVALID_DATA");
  }

  return numero;
};

const convertirBooleano = (valor) => {
  if (valor === undefined) {
    return undefined;
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

    if (["true", "1", "si", "sí"].includes(texto)) {
      return true;
    }

    if (["false", "0", "no"].includes(texto)) {
      return false;
    }
  }

  throw new Error("INVALID_DATA");
};

const obtenerContrasenia = (data) => {
  return data?.contrasenia ?? data?.contrasennia ?? data?.password;
};

const seleccionUsuarioSegura = {
  id: true,
  id_rol: true,
  id_area: true,
  nombre_completo: true,
  numero_trab: true,
  correo_electronico: true,
  nombre_usuario: true,
  status: true,
  fecha_creacion: true,
  rol: true,
  area: true,
};

const getAll = async () => {
  return prisma.usuario.findMany({
    select: seleccionUsuarioSegura,
    orderBy: {
      nombre_completo: "asc",
    },
  });
};

const getById = async (id) => {
  const usuario = await prisma.usuario.findUnique({
    where: {
      id: convertirId(id),
    },
    select: seleccionUsuarioSegura,
  });

  if (!usuario) {
    throw new Error("NOT_FOUND");
  }

  return usuario;
};

const create = async (data) => {
  const nombreCompleto = String(data?.nombre_completo ?? "").trim();
  const nombreUsuario = String(data?.nombre_usuario ?? "").trim();
  const contrasenia = obtenerContrasenia(data);

  if (
    !nombreCompleto ||
    !nombreUsuario ||
    !String(contrasenia ?? "").trim() ||
    !data?.id_rol ||
    !data?.id_area
  ) {
    throw new Error("INVALID_DATA");
  }

  const rolId = convertirId(data.id_rol);
  const areaId = convertirId(data.id_area);

  const usuarioDuplicado = await prisma.usuario.findFirst({
    where: {
      nombre_usuario: nombreUsuario,
    },
  });

  if (usuarioDuplicado) {
    throw new Error("DUPLICATE_USERNAME");
  }

  const correo =
    data.correo_electronico === undefined ||
    data.correo_electronico === null ||
    String(data.correo_electronico).trim() === ""
      ? null
      : String(data.correo_electronico).trim();

  if (correo) {
    const correoDuplicado = await prisma.usuario.findFirst({
      where: {
        correo_electronico: correo,
      },
    });

    if (correoDuplicado) {
      throw new Error("DUPLICATE_EMAIL");
    }
  }

  return prisma.usuario.create({
    data: {
      nombre_completo: nombreCompleto,
      numero_trab: convertirNumeroOpcional(data.numero_trab),
      correo_electronico: correo,
      nombre_usuario: nombreUsuario,
      contrasenia: await bcrypt.hash(String(contrasenia), BCRYPT_ROUNDS),
      status: data.status !== undefined ? convertirBooleano(data.status) : true,
      fecha_creacion: new Date(),

      rol: {
        connect: {
          id: rolId,
        },
      },

      area: {
        connect: {
          id: areaId,
        },
      },
    },

    select: seleccionUsuarioSegura,
  });
};

const update = async (id, data) => {
  const usuarioId = convertirId(id);
  const usuarioActual = await prisma.usuario.findUnique({
    where: {
      id: usuarioId,
    },
  });

  if (!usuarioActual) {
    throw new Error("NOT_FOUND");
  }

  const datosActualizacion = {};

  if (data.nombre_completo !== undefined) {
    const nombreCompleto = String(data.nombre_completo).trim();

    if (!nombreCompleto) {
      throw new Error("INVALID_DATA");
    }

    datosActualizacion.nombre_completo = nombreCompleto;
  }

  if (data.nombre_usuario !== undefined) {
    const nombreUsuario = String(data.nombre_usuario).trim();

    if (!nombreUsuario) {
      throw new Error("INVALID_DATA");
    }

    const duplicado = await prisma.usuario.findFirst({
      where: {
        nombre_usuario: nombreUsuario,
        NOT: {
          id: usuarioId,
        },
      },
    });

    if (duplicado) {
      throw new Error("DUPLICATE_USERNAME");
    }

    datosActualizacion.nombre_usuario = nombreUsuario;
  }

  if (data.correo_electronico !== undefined) {
    const correo =
      data.correo_electronico === null ||
      String(data.correo_electronico).trim() === ""
        ? null
        : String(data.correo_electronico).trim();

    if (correo) {
      const duplicado = await prisma.usuario.findFirst({
        where: {
          correo_electronico: correo,
          NOT: {
            id: usuarioId,
          },
        },
      });

      if (duplicado) {
        throw new Error("DUPLICATE_EMAIL");
      }
    }

    datosActualizacion.correo_electronico = correo;
  }

  if (data.numero_trab !== undefined) {
    datosActualizacion.numero_trab = convertirNumeroOpcional(data.numero_trab);
  }

  const contrasenia = obtenerContrasenia(data);

  if (contrasenia !== undefined && String(contrasenia).trim() !== "") {
    datosActualizacion.contrasenia = await bcrypt.hash(
      String(contrasenia),
      BCRYPT_ROUNDS,
    );
  }

  if (data.status !== undefined) {
    datosActualizacion.status = convertirBooleano(data.status);
  }

  if (data.id_rol !== undefined) {
    datosActualizacion.id_rol = convertirId(data.id_rol);
  }

  if (data.id_area !== undefined) {
    datosActualizacion.id_area = convertirId(data.id_area);
  }

  return prisma.usuario.update({
    where: {
      id: usuarioId,
    },

    data: datosActualizacion,

    select: seleccionUsuarioSegura,
  });
};

const remove = async (id) => {
  const usuarioId = convertirId(id);

  const usuario = await prisma.usuario.findUnique({
    where: {
      id: usuarioId,
    },

    include: {
      organigramas: {
        select: {
          id: true,
        },
      },

      configuraciones: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!usuario) {
    throw new Error("NOT_FOUND");
  }

  if (usuario.organigramas.length > 0 || usuario.configuraciones.length > 0) {
    throw new Error("USER_IN_USE");
  }

  return prisma.usuario.delete({
    where: {
      id: usuarioId,
    },
  });
};
//LOGIN
const login = async (data) => {
  const nombreUsuario = String(
    data?.nombre_usuario ?? data?.usuario ?? "",
  ).trim();

  const contrasenia = String(
    data?.contrasenia ?? data?.contrasennia ?? data?.password ?? "",
  );

  if (!nombreUsuario || !contrasenia) {
    throw new Error("LOGIN_DATA_REQUIRED");
  }

  const usuario = await prisma.usuario.findFirst({
    where: {
      nombre_usuario: nombreUsuario,
    },

    select: {
      id: true,
      id_rol: true,
      id_area: true,
      nombre_completo: true,
      numero_trab: true,
      correo_electronico: true,
      nombre_usuario: true,
      contrasenia: true,
      status: true,

      rol: {
        select: {
          id: true,
          nombre_rol: true,
        },
      },

      area: {
        select: {
          id: true,
          nombre_area: true,
        },
      },
    },
  });

  if (!usuario) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const contraseniaGuardada = String(usuario.contrasenia ?? "");
  const esHashBcrypt = /^\$2[aby]\$\d{2}\$/.test(contraseniaGuardada);

  let credencialesValidas = false;

  if (esHashBcrypt) {
    credencialesValidas = await bcrypt.compare(
      contrasenia,
      contraseniaGuardada,
    );
  } else {
    credencialesValidas = contraseniaGuardada === contrasenia;
  }

  if (!credencialesValidas) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (usuario.status !== true) {
    throw new Error("USER_INACTIVE");
  }

  if (!esHashBcrypt) {
    const nuevaContraseniaHash = await bcrypt.hash(contrasenia, BCRYPT_ROUNDS);

    await prisma.usuario.update({
      where: {
        id: usuario.id,
      },
      data: {
        contrasenia: nuevaContraseniaHash,
      },
    });
  }

  return {
    id: usuario.id,
    id_rol: usuario.id_rol,
    id_area: usuario.id_area,
    nombre_completo: usuario.nombre_completo,
    numero_trab: usuario.numero_trab,
    correo_electronico: usuario.correo_electronico,
    nombre_usuario: usuario.nombre_usuario,
    rol: usuario.rol,
    area: usuario.area,
  };
};


const obtenerAreaRh = async () => {
  const area = await prisma.area.findUnique({
    where: {
      nombre_area: "Dirección de Recursos Humanos",
    },
  });

  if (!area) {
    throw new Error("RH_AREA_NOT_FOUND");
  }

  return area;
};

//OBTENER ROL RH
const obtenerRolRh = async () => {
  const rol = await prisma.rol.findUnique({
    where: {
      nombre_rol: "Recursos Humanos",
    },
  });

  if (!rol) {
    throw new Error("RH_ROLE_NOT_FOUND");
  }

  return rol;
};

//COMPROBAR SI RH YA FUE REGISTRADO
const existeUsuarioRh = async () => {
  const area = await obtenerAreaRh();
  const rol = await obtenerRolRh();
  const usuario = await prisma.usuario.findFirst({
    where: {
      id_area: area.id,
      id_rol: rol.id,
    },

    select: {
      id: true,
    },
  });

  return Boolean(usuario);
};

//VALIDAR CLAVE ESPECIAL RH
const validarClaveRegistroRh = async (data) => {
  const clave = String(data?.clave ?? "").trim();

  if (!clave) {
    throw new Error("RH_KEY_REQUIRED");
  }

  const yaRegistrado = await existeUsuarioRh();

  if (yaRegistrado) {
    throw new Error("RH_ALREADY_REGISTERED");
  }

  const clavesRegistradas = await prisma.claveRh.findMany({
    select: {
      id: true,
      clave: true,
    },
  });

  let claveValida = null;
  let claveLegacy = false;

  for (const registro of clavesRegistradas) {
    const valorGuardado = String(registro.clave ?? "");

    const esHashBcrypt = /^\$2[aby]\$\d{2}\$/.test(valorGuardado);

    if (esHashBcrypt) {
      const coincide = await bcrypt.compare(clave, valorGuardado);

      if (coincide) {
        claveValida = registro;
        break;
      }
    } else if (valorGuardado === clave) {
      claveValida = registro;
      claveLegacy = true;
      break;
    }
  }

  if (!claveValida) {
    throw new Error("INVALID_RH_KEY");
  }

  if (claveLegacy) {
    const claveHash = await bcrypt.hash(clave, BCRYPT_ROUNDS);

    await prisma.claveRh.update({
      where: {
        id: claveValida.id,
      },
      data: {
        clave: claveHash,
      },
    });
  }

  return {
    valida: true,

    mensaje: "Clave especial válida.",
  };
};

//REGISTRO INICIAL DE RECURSOS HUMANOS
const registroInicialRh = async (data) => {
  await validarClaveRegistroRh({
    clave: data?.clave,
  });

  const nombreCompleto = String(data?.nombre_completo ?? "").trim();
  const nombreUsuario = String(data?.nombre_usuario ?? "").trim();
  const contrasenia = String(
    data?.contrasenia ?? data?.contrasennia ?? data?.password ?? "",
  );

  if (!nombreCompleto || !nombreUsuario || !contrasenia.trim()) {
    throw new Error("INVALID_INITIAL_RH_DATA");
  }

  //ÁREA Y ROL FIJOS
  const area = await obtenerAreaRh();
  const rol = await obtenerRolRh();

  const usuarioDuplicado = await prisma.usuario.findFirst({
    where: {
      nombre_usuario: nombreUsuario,
    },
  });

  if (usuarioDuplicado) {
    throw new Error("DUPLICATE_USERNAME");
  }

  //CORREO
  const correo =
    data?.correo_electronico === undefined ||
    data?.correo_electronico === null ||
    String(data.correo_electronico).trim() === ""
      ? null
      : String(data.correo_electronico).trim();

  if (correo) {
    const correoDuplicado = await prisma.usuario.findFirst({
      where: {
        correo_electronico: correo,
      },
    });

    if (correoDuplicado) {
      throw new Error("DUPLICATE_EMAIL");
    }
  }

  //NÚMERO DE TRABAJADOR
  const numeroTrab = convertirNumeroOpcional(data?.numero_trab);

  // CREAR RH
  return prisma.usuario.create({
    data: {
      nombre_completo: nombreCompleto,
      numero_trab: numeroTrab,
      correo_electronico: correo,
      nombre_usuario: nombreUsuario,
      contrasenia: await bcrypt.hash(contrasenia, BCRYPT_ROUNDS),
      status: true,
      fecha_creacion: new Date(),

      rol: {
        connect: {
          id: rol.id,
        },
      },

      area: {
        connect: {
          id: area.id,
        },
      },
    },

    select: seleccionUsuarioSegura,
  });
};

module.exports = {
  getAll,
  getById,
  login,
  validarClaveRegistroRh,
  registroInicialRh,
  create,
  update,
  remove,
};
