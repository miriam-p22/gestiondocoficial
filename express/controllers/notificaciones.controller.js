const prisma = require("../db/client");

const convertirId = (valor) => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("INVALID_ID");
  }

  return id;
};

//OBTENER NOTIFICACIONES DEL USUARIO
const getByUsuario = async (idUsuario) => {
  const usuarioId = convertirId(idUsuario);

  return prisma.notificacion.findMany({
    where: {
      id_usuario: usuarioId,
    },

    orderBy: {
      fecha_creacion: "desc",
    },
  });
};

//OBTENER SOLO NO LEÍDAS
const getNoLeidas = async (idUsuario) => {
  const usuarioId = convertirId(idUsuario);

  return prisma.notificacion.findMany({
    where: {
      id_usuario: usuarioId,
      leida: false,
    },

    orderBy: {
      fecha_creacion: "desc",
    },
  });
};

//MARCAR UNA COMO LEÍDA
const marcarComoLeida = async (id, idUsuario) => {
  const notificacionId = convertirId(id);
  const usuarioId = convertirId(idUsuario);

  const notificacion = await prisma.notificacion.findFirst({
    where: {
      id: notificacionId,
      id_usuario: usuarioId,
    },
  });

  if (!notificacion) {
    throw new Error("NOT_FOUND");
  }

  if (notificacion.leida) {
    return notificacion;
  }

  return prisma.notificacion.update({
    where: {
      id: notificacionId,
    },

    data: {
      leida: true,
      fecha_lectura: new Date(),
    },
  });
};

//MARCAR TODAS COMO LEÍDAS
const marcarTodasComoLeidas = async (idUsuario) => {
  const usuarioId = convertirId(idUsuario);
  const fechaLectura = new Date();

  const resultado = await prisma.notificacion.updateMany({
    where: {
      id_usuario: usuarioId,
      leida: false,
    },

    data: {
      leida: true,
      fecha_lectura: fechaLectura,
    },
  });

  return {
    actualizadas: resultado.count,
  };
};

//ELIMINAR UNA NOTIFICACIÓN
const remove = async (id, idUsuario) => {
  const notificacionId = convertirId(id);
  const usuarioId = convertirId(idUsuario);

  const notificacion = await prisma.notificacion.findFirst({
    where: {
      id: notificacionId,
      id_usuario: usuarioId,
    },
  });

  if (!notificacion) {
    throw new Error("NOT_FOUND");
  }

  return prisma.notificacion.delete({
    where: {
      id: notificacionId,
    },
  });
};

//CREAR NOTIFICACIÓN
const crearParaUsuario = async (idUsuario, datos = {}) => {
  const usuarioId = convertirId(idUsuario);

  const titulo = String(datos.titulo || "").trim();
  const mensaje = String(datos.mensaje || "").trim();

  if (!titulo || !mensaje) {
    throw new Error("INVALID_DATA");
  }

  const nueva = await prisma.notificacion.create({
    data: {
      id_usuario: usuarioId,
      tipo: String(datos.tipo || "sistema").trim(),
      titulo,
      mensaje,
      modulo: datos.modulo ? String(datos.modulo).trim() : null,
      referencia_id:
        datos.referencia_id !== undefined && datos.referencia_id !== null
          ? Number(datos.referencia_id)
          : null,
      ruta: datos.ruta ? String(datos.ruta).trim() : null,
      leida: false,
    },
  });

  console.log(
    `[NOTIFICACIONES] Notificación creada para usuario ${usuarioId}: "${titulo}".`,
  );

  return nueva;
};

//CREAR NOTIFICACIÓN PARA USUARIOS DE UN ÁREA
const crearParaArea = async (idArea, datos = {}) => {
  const areaId = convertirId(idArea);

  const titulo = String(datos.titulo || "").trim();
  const mensaje = String(datos.mensaje || "").trim();

  if (!titulo || !mensaje) {
    throw new Error("INVALID_DATA");
  }

  console.log(
    `[NOTIFICACIONES] Buscando usuarios activos del área ${areaId}...`,
  );

  //VALIDAR QUE EL ÁREA EXISTA
  const area = await prisma.area.findUnique({
    where: {
      id: areaId,
    },

    select: {
      id: true,
      nombre_area: true,
    },
  });

  if (!area) {
    throw new Error("AREA_NOT_FOUND");
  }

  //BUSCAR USUARIOS ACTIVOS DEL ÁREA
  const usuarios = await prisma.usuario.findMany({
    where: {
      id_area: areaId,
      status: true,
    },

    select: {
      id: true,
      nombre_completo: true,
      nombre_usuario: true,
      id_area: true,
      status: true,
    },
  });

  console.log(
    `[NOTIFICACIONES] Usuarios encontrados en el área "${area.nombre_area}":`,
    usuarios,
  );

  if (usuarios.length === 0) {
    console.warn(
      `[NOTIFICACIONES] El área "${area.nombre_area}" no tiene usuarios activos.`,
    );

    return {
      creadas: 0,
    };
  }

  // NOTIFICACIONES
  const data = usuarios.map((usuario) => ({
    id_usuario: usuario.id,
    tipo: String(datos.tipo || "sistema").trim(),
    titulo,
    mensaje,
    modulo: datos.modulo ? String(datos.modulo).trim() : null,

    referencia_id:
      datos.referencia_id !== undefined && datos.referencia_id !== null
        ? Number(datos.referencia_id)
        : null,

    ruta: datos.ruta ? String(datos.ruta).trim() : null,

    leida: false,
  }));

  console.log("[NOTIFICACIONES] Datos que se insertarán para el área:", data);

  const resultado = await prisma.notificacion.createMany({
    data,
  });

  console.log(
    `[NOTIFICACIONES] Se crearon ${resultado.count} notificación(es) para el área "${area.nombre_area}".`,
  );

  return {
    creadas: resultado.count,
  };
};

const crearParaPrivilegio = async (tituloPrivilegio, datos = {}) => {
  const privilegio = String(tituloPrivilegio || "").trim();

  if (!privilegio) {
    throw new Error("INVALID_DATA");
  }

  const titulo = String(datos.titulo || "").trim();
  const mensaje = String(datos.mensaje || "").trim();

  if (!titulo || !mensaje) {
    throw new Error("INVALID_DATA");
  }

  console.log(
    `[NOTIFICACIONES] Buscando destinatarios para el privilegio "${privilegio}"...`,
  );

  //BUSCAR EL PRIVILEGIO
  const privilegioBD = await prisma.privilegio.findUnique({
    where: {
      titulo_privilegio: privilegio,
    },

    select: {
      id: true,
      titulo_privilegio: true,
    },
  });

  console.log("[NOTIFICACIONES] Privilegio encontrado:", privilegioBD);

  if (!privilegioBD) {
    throw new Error(`PRIVILEGE_NOT_FOUND: ${privilegio}`);
  }

  //BUSCAR ROLES QUE TIENEN EL PRIVILEGIO
  const permisos = await prisma.rolPermiso.findMany({
    where: {
      id_privilegio: privilegioBD.id,
    },

    select: {
      id_rol: true,
    },
  });

  console.log("[NOTIFICACIONES] Permisos encontrados:", permisos);

  const idsRoles = [
    ...new Set(permisos.map((permiso) => Number(permiso.id_rol))),
  ].filter((id) => Number.isInteger(id) && id > 0);

  console.log("[NOTIFICACIONES] IDs de roles:", idsRoles);

  if (idsRoles.length === 0) {
    console.warn(
      `[NOTIFICACIONES] El privilegio "${privilegio}" no está asignado a ningún rol.`,
    );

    return {
      creadas: 0,
    };
  }

  const usuarios = await prisma.usuario.findMany({
    where: {
      id_rol: {
        in: idsRoles,
      },

      status: true,
    },

    select: {
      id: true,
      nombre_completo: true,
      nombre_usuario: true,
      id_rol: true,
      status: true,
    },
  });

  console.log("[NOTIFICACIONES] Usuarios encontrados:", usuarios);

  if (usuarios.length === 0) {
    console.warn(
      `[NOTIFICACIONES] No existen usuarios activos con el privilegio "${privilegio}".`,
    );

    return {
      creadas: 0,
    };
  }

  //CREAR UNA NOTIFICACIÓN POR USUARIO
  const data = usuarios.map((usuario) => ({
    id_usuario: usuario.id,
    tipo: String(datos.tipo || "sistema").trim(),
    titulo,
    mensaje,
    modulo: datos.modulo ? String(datos.modulo).trim() : null,
    referencia_id:
      datos.referencia_id !== undefined && datos.referencia_id !== null
        ? Number(datos.referencia_id)
        : null,

    ruta: datos.ruta ? String(datos.ruta).trim() : null,

    leida: false,
  }));

  console.log("[NOTIFICACIONES] Datos que se insertarán:", data);

  const resultado = await prisma.notificacion.createMany({
    data,
  });

  console.log(
    `[NOTIFICACIONES] Se crearon ${resultado.count} notificación(es) para el privilegio "${privilegio}".`,
  );

  return {
    creadas: resultado.count,
  };
};

module.exports = {
  getByUsuario,
  getNoLeidas,

  marcarComoLeida,
  marcarTodasComoLeidas,

  crearParaUsuario,
  crearParaArea,
  crearParaPrivilegio,

  remove,
};
