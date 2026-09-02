const prisma = require("../db/client");
const notificacionesController = require("./notificaciones.controller");
const PRIVILEGIO_GESTIONAR = "Gestionar Archivo Físico";
const PRIVILEGIO_CONSULTAR_GLOBAL = "Consultar Archivo Físico Global";

const convertirId = (valor) => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("INVALID_ID");
  }

  return id;
};

const limpiarTexto = (valor, maximo) => {
  if (valor === undefined || valor === null) {
    return null;
  }

  const texto = String(valor).trim();

  if (!texto) {
    return null;
  }

  if (texto.length > maximo) {
    throw new Error("TEXT_TOO_LONG");
  }

  return texto;
};

const convertirEstado = (valor) => {
  const estado = String(valor || "resguardado")
    .trim()
    .toLowerCase();

  if (!["pendiente", "resguardado"].includes(estado)) {
    throw new Error("INVALID_STATE");
  }

  return estado;
};

const validarSesion = (usuario) => {
  if (!usuario || !usuario.id || !usuario.id_rol || !usuario.id_area) {
    throw new Error("ACCESS_DENIED");
  }
};

const tienePrivilegio = async (usuario, tituloPrivilegio) => {
  validarSesion(usuario);

  const permiso = await prisma.rolPermiso.findFirst({
    where: {
      id_rol: Number(usuario.id_rol),
      privilegio: {
        titulo_privilegio: tituloPrivilegio,
      },
    },
    select: {
      id_rol: true,
      id_privilegio: true,
    },
  });

  return Boolean(permiso);
};

const puedeGestionarArchivo = async (usuario) => {
  return tienePrivilegio(usuario, PRIVILEGIO_GESTIONAR);
};

const puedeConsultarGlobal = async (usuario) => {
  if (await puedeGestionarArchivo(usuario)) {
    return true;
  }

  return tienePrivilegio(usuario, PRIVILEGIO_CONSULTAR_GLOBAL);
};

const validarPermisoGestion = async (usuario) => {
  validarSesion(usuario);

  if (!(await puedeGestionarArchivo(usuario))) {
    throw new Error("ARCHIVE_ACCESS_DENIED");
  }
};

const validarPermisoConsulta = async (usuario) => {
  validarSesion(usuario);

  if (!(await puedeConsultarGlobal(usuario))) {
    throw new Error("ARCHIVE_CONSULT_DENIED");
  }
};

const ejecutarNotificacionSegura = async (callback) => {
  try {
    return await callback();
  } catch (error) {
    console.error(
      "[ARCHIVO FÍSICO] No fue posible crear la notificación:",
      error,
    );

    return null;
  }
};

const selectArchivoFisico = {
  id: true,
  id_dispersion_destino: true,
  id_clasificacion: true,
  id_usuario_resguardo: true,
  expediente: true,
  carpeta: true,
  caja: true,
  estante: true,
  ubicacion_fisica: true,
  observaciones: true,
  estado: true,
  fecha_resguardo: true,
  fecha_actualizacion: true,

  clasificacion: {
    select: {
      id: true,
      area_administrativa: true,
      codigo_asignado: true,
      ubicacion: true,
      funcion: true,
    },
  },

  usuarioResguardo: {
    select: {
      id: true,
      nombre_completo: true,
      nombre_usuario: true,
      id_area: true,
    },
  },
};

const includeDestino = {
  dispersion: {
    select: {
      id: true,
      nombre_archivo: true,
      fecha_recepcion: true,
      tipo_archivo: true,
      extension: true,
    },
  },

  area: {
    select: {
      id: true,
      nombre_area: true,
    },
  },

  archivoFisico: {
    select: selectArchivoFisico,
  },
};

const obtenerDestino = async (idDestino) => {
  const destinoId = convertirId(idDestino);

  const destino = await prisma.dispersionDestino.findUnique({
    where: {
      id: destinoId,
    },
    include: includeDestino,
  });

  if (!destino) {
    throw new Error("NOT_FOUND");
  }

  return destino;
};

const validarVisibilidad = async (destino, usuario) => {
  await validarPermisoConsulta(usuario);
  return destino;
};

const getAll = async (usuario) => {
  await validarPermisoConsulta(usuario);
  return prisma.dispersionDestino.findMany({
    where: {
      estado_documento: "atendido",
    },

    include: includeDestino,

    orderBy: [
      {
        fecha_atencion: "desc",
      },
      {
        id: "desc",
      },
    ],
  });
};

const getByDestino = async (idDestino, usuario) => {
  const destino = await obtenerDestino(idDestino);

  await validarVisibilidad(destino, usuario);

  if (destino.estado_documento !== "atendido") {
    throw new Error("DOCUMENT_NOT_FINISHED");
  }

  return destino;
};

const validarClasificacion = async (idClasificacion) => {
  if (idClasificacion === null) {
    return;
  }

  const clasificacion = await prisma.clasificacion.findUnique({
    where: {
      id: idClasificacion,
    },
    select: {
      id: true,
    },
  });

  if (!clasificacion) {
    throw new Error("CLASSIFICATION_NOT_FOUND");
  }
};

const guardarResguardo = async (idDestino, data, usuario) => {
  await validarPermisoGestion(usuario);

  const destino = await obtenerDestino(idDestino);

  if (destino.estado_documento !== "atendido") {
    throw new Error("DOCUMENT_NOT_FINISHED");
  }

  let idClasificacion = null;

  if (
    data?.id_clasificacion !== undefined &&
    data?.id_clasificacion !== null &&
    data?.id_clasificacion !== ""
  ) {
    idClasificacion = convertirId(data.id_clasificacion);
  }

  await validarClasificacion(idClasificacion);

  const estado = convertirEstado(data?.estado);
  const expediente = limpiarTexto(data?.expediente, 100);
  const carpeta = limpiarTexto(data?.carpeta, 100);
  const caja = limpiarTexto(data?.caja, 100);
  const estante = limpiarTexto(data?.estante, 100);
  const ubicacionFisica = limpiarTexto(data?.ubicacion_fisica, 255);
  const observaciones = limpiarTexto(data?.observaciones, 1000);

  if (estado === "resguardado" && (!idClasificacion || !ubicacionFisica)) {
    throw new Error("ARCHIVE_DATA_REQUIRED");
  }

  const existente = destino.archivoFisico;
  const yaEstabaResguardado = existente?.estado === "resguardado";
  const fechaResguardo =
    estado === "resguardado" ? existente?.fecha_resguardo || new Date() : null;
  const resultado = await prisma.archivoFisico.upsert({
    where: {
      id_dispersion_destino: destino.id,
    },

    create: {
      id_dispersion_destino: destino.id,
      id_clasificacion: idClasificacion,
      id_usuario_resguardo: usuario.id,
      expediente,
      carpeta,
      caja,
      estante,
      ubicacion_fisica: ubicacionFisica,
      observaciones,
      estado,
      fecha_resguardo: fechaResguardo,
    },

    update: {
      id_clasificacion: idClasificacion,
      id_usuario_resguardo: usuario.id,
      expediente,
      carpeta,
      caja,
      estante,
      ubicacion_fisica: ubicacionFisica,
      observaciones,
      estado,
      fecha_resguardo: fechaResguardo,
    },

    select: selectArchivoFisico,
  });

  const cambioAResguardado = estado === "resguardado" && !yaEstabaResguardado;

  if (cambioAResguardado) {
    await ejecutarNotificacionSegura(() =>
      notificacionesController.crearParaArea(destino.id_area, {
        tipo: "archivo",
        titulo: "Documento resguardado en Archivo Físico",
        mensaje: `El documento "${destino.dispersion?.nombre_archivo || "Documento"}" fue registrado correctamente en el archivo físico municipal.`,
        modulo: "archivo_fisico",
        referencia_id: destino.id,
        ruta: "/documentos",
      }),
    );
  }

  return resultado;
};

const getPermisos = async (usuario) => {
  validarSesion(usuario);

  const gestionar = await puedeGestionarArchivo(usuario);

  const consultarGlobal =
    gestionar || (await tienePrivilegio(usuario, PRIVILEGIO_CONSULTAR_GLOBAL));

  return {
    gestionar,
    consultar_global: consultarGlobal,
  };
};

module.exports = {
  getAll,
  getByDestino,
  guardarResguardo,
  getPermisos,
};
