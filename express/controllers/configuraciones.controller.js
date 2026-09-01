const prisma = require("../db/client");
const net = require("net");
const tls = require("tls");

// ======================================================
// UTILIDADES
// ======================================================

const convertirId = (valor) => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("INVALID_ID");
  }

  return id;
};

const convertirPuerto = (valor) => {
  if (valor === undefined) {
    return undefined;
  }

  if (valor === null || valor === "") {
    return null;
  }

  const puerto = Number(valor);

  if (
    !Number.isInteger(puerto) ||
    puerto <= 0 ||
    puerto > 65535
  ) {
    throw new Error("INVALID_PORT");
  }

  return puerto;
};

const limpiarTexto = (valor) => {
  if (valor === undefined) {
    return undefined;
  }

  if (
    valor === null ||
    String(valor).trim() === ""
  ) {
    return null;
  }

  return String(valor).trim();
};

// ======================================================
// NO EXPONER LA CONTRASEÑA SMTP
// ======================================================

const sanitizarConfiguracion = (configuracion) => {
  if (!configuracion) {
    return null;
  }

  const {
    contrasenia,
    ...segura
  } = configuracion;

  return {
    ...segura,
    tiene_contrasenia:
      Boolean(contrasenia),
  };
};

const sanitizarLista = (lista = []) => {
  return lista.map(
    sanitizarConfiguracion
  );
};

const relacionesConfiguracion = {
  usuario: {
    include: {
      area: true,
      rol: true,
    },
  },
};

// ======================================================
// OBTENER TODAS LAS CONFIGURACIONES
// ======================================================

const getAll = async (filtros = {}) => {
  const where = {};

  if (
    filtros.id_usuario !== undefined &&
    filtros.id_usuario !== ""
  ) {
    where.id_usuario =
      convertirId(
        filtros.id_usuario
      );
  }

  const configuraciones =
    await prisma.configuracion.findMany({
      where,
      include:
        relacionesConfiguracion,
      orderBy: {
        id: "asc",
      },
    });

  return sanitizarLista(
    configuraciones
  );
};

// ======================================================
// OBTENER CONFIGURACIÓN POR ID
// ======================================================

const getById = async (id) => {
  const configuracionId =
    convertirId(id);

  const configuracion =
    await prisma.configuracion.findUnique({
      where: {
        id:
          configuracionId,
      },
      include:
        relacionesConfiguracion,
    });

  if (!configuracion) {
    throw new Error(
      "NOT_FOUND"
    );
  }

  return sanitizarConfiguracion(
    configuracion
  );
};

// ======================================================
// OBTENER CONFIGURACIONES DE UN USUARIO
// ======================================================

const getByUsuario = async (idUsuario) => {
  const usuarioId =
    convertirId(
      idUsuario
    );

  const configuraciones =
    await prisma.configuracion.findMany({
      where: {
        id_usuario:
          usuarioId,
      },
      include:
        relacionesConfiguracion,
      orderBy: {
        id: "desc",
      },
    });

  return sanitizarLista(
    configuraciones
  );
};

// ======================================================
// CONFIGURACIÓN SMTP DEL USUARIO AUTENTICADO
// ======================================================
//
// No recibe id_usuario del navegador.
// Se utiliza el usuario validado por auth.middleware.js.
// ======================================================

const getActual = async (usuario) => {
  if (!usuario?.id) {
    throw new Error(
      "INVALID_USER"
    );
  }

  const configuracion =
    await prisma.configuracion.findFirst({
      where: {
        id_usuario:
          Number(
            usuario.id
          ),
      },
      include:
        relacionesConfiguracion,
      orderBy: {
        id: "desc",
      },
    });

  return sanitizarConfiguracion(
    configuracion
  );
};

// ======================================================
// GUARDAR CONFIGURACIÓN SMTP ACTUAL
// ======================================================
//
// Si ya existe una configuración:
// - se actualiza la más reciente.
// - si contraseña viene vacía, se conserva la anterior.
//
// Si no existe:
// - contraseña es obligatoria.
// ======================================================

const guardarActual = async (
  usuario,
  data
) => {
  if (!usuario?.id) {
    throw new Error(
      "INVALID_USER"
    );
  }

  const usuarioId =
    convertirId(
      usuario.id
    );

  const correoRemitente =
    limpiarTexto(
      data?.correo_remitente
    );

  const smtp =
    limpiarTexto(
      data?.smtp
    );

  const puerto =
    convertirPuerto(
      data?.puerto
    );

  const contraseniaNueva =
    limpiarTexto(
      data?.contrasenia
    );

  if (
    !correoRemitente ||
    !smtp ||
    puerto === null ||
    puerto === undefined
  ) {
    throw new Error(
      "INVALID_DATA"
    );
  }

  const actual =
    await prisma.configuracion.findFirst({
      where: {
        id_usuario:
          usuarioId,
      },
      orderBy: {
        id: "desc",
      },
    });

  if (!actual) {
    if (!contraseniaNueva) {
      throw new Error(
        "PASSWORD_REQUIRED"
      );
    }

    const creada =
      await prisma.configuracion.create({
        data: {
          id_usuario:
            usuarioId,

          correo_remitente:
            correoRemitente,

          contrasenia:
            contraseniaNueva,

          smtp,

          puerto,
        },

        include:
          relacionesConfiguracion,
      });

    return sanitizarConfiguracion(
      creada
    );
  }

  const actualizada =
    await prisma.configuracion.update({
      where: {
        id:
          actual.id,
      },

      data: {
        correo_remitente:
          correoRemitente,

        smtp,

        puerto,

        contrasenia:
          contraseniaNueva ||
          undefined,
      },

      include:
        relacionesConfiguracion,
    });

  return sanitizarConfiguracion(
    actualizada
  );
};

// ======================================================
// CREAR CONFIGURACIÓN (COMPATIBILIDAD)
// ======================================================

const create = async (data) => {
  if (!data?.id_usuario) {
    throw new Error(
      "INVALID_DATA"
    );
  }

  const usuarioId =
    convertirId(
      data.id_usuario
    );

  const correoRemitente =
    limpiarTexto(
      data.correo_remitente
    );

  const contrasenia =
    limpiarTexto(
      data.contrasenia
    );

  const smtp =
    limpiarTexto(
      data.smtp
    );

  const puerto =
    convertirPuerto(
      data.puerto
    );

  if (
    !correoRemitente ||
    !contrasenia ||
    !smtp ||
    puerto === null ||
    puerto === undefined
  ) {
    throw new Error(
      "INVALID_DATA"
    );
  }

  const usuario =
    await prisma.usuario.findUnique({
      where: {
        id:
          usuarioId,
      },
    });

  if (!usuario) {
    throw new Error(
      "USER_NOT_FOUND"
    );
  }

  const configuracion =
    await prisma.configuracion.create({
      data: {
        id_usuario:
          usuarioId,

        correo_remitente:
          correoRemitente,

        contrasenia,

        smtp,

        puerto,
      },

      include:
        relacionesConfiguracion,
    });

  return sanitizarConfiguracion(
    configuracion
  );
};

// ======================================================
// ACTUALIZAR CONFIGURACIÓN (COMPATIBILIDAD)
// ======================================================

const update = async (
  id,
  data
) => {
  const configuracionId =
    convertirId(id);

  if (
    data.id_usuario !==
    undefined
  ) {
    const usuarioId =
      convertirId(
        data.id_usuario
      );

    const usuario =
      await prisma.usuario.findUnique({
        where: {
          id:
            usuarioId,
        },
      });

    if (!usuario) {
      throw new Error(
        "USER_NOT_FOUND"
      );
    }
  }

  try {
    const configuracion =
      await prisma.configuracion.update({
        where: {
          id:
            configuracionId,
        },

        data: {
          id_usuario:
            data.id_usuario !==
            undefined
              ? convertirId(
                  data.id_usuario
                )
              : undefined,

          correo_remitente:
            limpiarTexto(
              data.correo_remitente
            ),

          contrasenia:
            limpiarTexto(
              data.contrasenia
            ) ||
            undefined,

          smtp:
            limpiarTexto(
              data.smtp
            ),

          puerto:
            convertirPuerto(
              data.puerto
            ),
        },

        include:
          relacionesConfiguracion,
      });

    return sanitizarConfiguracion(
      configuracion
    );
  } catch (error) {
    if (
      error.code ===
      "P2025"
    ) {
      throw new Error(
        "NOT_FOUND"
      );
    }

    throw error;
  }
};

// ======================================================
// ELIMINAR CONFIGURACIÓN
// ======================================================

const remove = async (id) => {
  const configuracionId =
    convertirId(id);

  try {
    return await prisma.configuracion.delete({
      where: {
        id:
          configuracionId,
      },
    });
  } catch (error) {
    if (
      error.code ===
      "P2025"
    ) {
      throw new Error(
        "NOT_FOUND"
      );
    }

    throw error;
  }
};

// ======================================================
// ESTADO REAL DE LA BASE DE DATOS
// ======================================================
//
// Solo devuelve datos técnicos seguros.
// NO devuelve:
// - usuario de MySQL
// - contraseña
// - DATABASE_URL completa
// ======================================================

const obtenerEstadoSistema = async () => {
  const inicio =
    Date.now();

  let databaseUrl = null;

  try {
    if (
      process.env.DATABASE_URL
    ) {
      databaseUrl =
        new URL(
          process.env.DATABASE_URL
        );
    }
  } catch {
    databaseUrl =
      null;
  }

  let version =
    null;

  try {
    const resultado =
      await prisma.$queryRaw`
        SELECT VERSION() AS version
      `;

    if (
      Array.isArray(
        resultado
      ) &&
      resultado[0]
    ) {
      version =
        String(
          resultado[0]
            .version ||
          ""
        );
    }

    const tiempoMs =
      Date.now() -
      inicio;

    return {
      api: {
        estado:
          "conectada",

        fecha_verificacion:
          new Date()
            .toISOString(),
      },

      base_datos: {
        estado:
          "conectada",

        motor:
          "MySQL",

        version:
          version ||
          "No disponible",

        host:
          databaseUrl
            ?.hostname ||
          "Configurado en el servidor",

        puerto:
          databaseUrl
            ?.port ||
          "3306",

        nombre:
          databaseUrl
            ?.pathname
            ?.replace(
              /^\//,
              ""
            ) ||
          "Configurada",

        tiempo_respuesta_ms:
          tiempoMs,
      },
    };
  } catch (error) {
    console.error(
      "[ESTADO BD]",
      error
    );

    return {
      api: {
        estado:
          "conectada",

        fecha_verificacion:
          new Date()
            .toISOString(),
      },

      base_datos: {
        estado:
          "sin_conexion",

        motor:
          "MySQL",

        version:
          null,

        host:
          databaseUrl
            ?.hostname ||
          "Configurado en el servidor",

        puerto:
          databaseUrl
            ?.port ||
          "3306",

        nombre:
          databaseUrl
            ?.pathname
            ?.replace(
              /^\//,
              ""
            ) ||
          "Configurada",

        tiempo_respuesta_ms:
          null,
      },
    };
  }
};

// ======================================================
// PROBAR DISPONIBILIDAD DEL SERVIDOR SMTP
// ======================================================
//
// Esta prueba verifica conectividad TCP/TLS.
// NO envía correo y NO valida las credenciales.
// ======================================================

const probarServidorSmtp = async (
  usuario
) => {
  const configuracion =
    await prisma.configuracion.findFirst({
      where: {
        id_usuario:
          Number(
            usuario.id
          ),
      },
      orderBy: {
        id: "desc",
      },
    });

  if (!configuracion) {
    throw new Error(
      "SMTP_NOT_CONFIGURED"
    );
  }

  const host =
    configuracion.smtp;

  const puerto =
    Number(
      configuracion.puerto
    );

  if (
    !host ||
    !Number.isInteger(
      puerto
    )
  ) {
    throw new Error(
      "SMTP_NOT_CONFIGURED"
    );
  }

  const inicio =
    Date.now();

  await new Promise(
    (
      resolve,
      reject
    ) => {
      const timeoutMs =
        7000;

      let socket;

      const terminarError =
        (error) => {
          try {
            socket?.destroy();
          } catch {}

          reject(
            error
          );
        };

      if (
        puerto ===
        465
      ) {
        socket =
          tls.connect(
            {
              host,
              port:
                puerto,

              servername:
                host,

              rejectUnauthorized:
                true,
            },
            () => {
              resolve();
              socket.end();
            }
          );
      } else {
        socket =
          net.createConnection(
            {
              host,
              port:
                puerto,
            },
            () => {
              resolve();
              socket.end();
            }
          );
      }

      socket.setTimeout(
        timeoutMs
      );

      socket.on(
        "timeout",
        () => {
          terminarError(
            new Error(
              "SMTP_TIMEOUT"
            )
          );
        }
      );

      socket.on(
        "error",
        terminarError
      );
    }
  );

  return {
    ok:
      true,

    servidor:
      host,

    puerto,

    tiempo_respuesta_ms:
      Date.now() -
      inicio,

    mensaje:
      "El servidor SMTP respondió correctamente. Esta prueba verifica conectividad, no autenticación ni envío de correo.",
  };
};

module.exports = {
  getAll,
  getById,
  getByUsuario,
  getActual,
  guardarActual,
  create,
  update,
  remove,
  obtenerEstadoSistema,
  probarServidorSmtp,
};