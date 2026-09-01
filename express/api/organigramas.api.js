const express = require("express");
const router = express.Router();

const organigramasController = require("../controllers/organigramas.controller");

const { autenticar } = require("../middlewares/auth.middleware");

const { requierePrivilegio } = require("../middlewares/permisos.middleware");

const prisma = require("../db/client");

const PRIVILEGIO_GESTIONAR_ORGANIGRAMA = "Gestionar Organigrama";

const PRIVILEGIO_REVISAR_ORGANIGRAMA = "Revisar Organigrama";

// ======================================================
// SEGURIDAD Y ALCANCE
// ======================================================

const tienePrivilegio = async (usuario, tituloPrivilegio) => {
  if (!usuario || !usuario.id_rol) {
    return false;
  }

  const permiso = await prisma.rolPermiso.findFirst({
    where: {
      id_rol: Number(usuario.id_rol),

      privilegio: {
        titulo_privilegio: tituloPrivilegio,
      },
    },

    select: {
      id_rol: true,
    },
  });

  return Boolean(permiso);
};

// ------------------------------------------------------
// GET /api/organigramas
// ------------------------------------------------------
//
// Gestionar Organigrama:
//   todas las versiones.
//
// Revisar Organigrama:
//   versiones solicitadas.
//
// Resto:
//   únicamente autorizadas.
//
const aplicarAlcanceListado = async (req, res, next) => {
  try {
    if (await tienePrivilegio(req.usuario, PRIVILEGIO_GESTIONAR_ORGANIGRAMA)) {
      return next();
    }

    if (await tienePrivilegio(req.usuario, PRIVILEGIO_REVISAR_ORGANIGRAMA)) {
      req.query = {
        estado: "solicitado",
      };

      return next();
    }

    req.query = {
      estado: "autorizado",
      autorizado: "true",
    };

    return next();
  } catch (error) {
    console.error("[Organigramas - Alcance]", error);

    return res.status(500).json({
      error: "No fue posible validar el alcance de consulta del organigrama.",
    });
  }
};

// ------------------------------------------------------
// GET /api/organigramas/:id
// ------------------------------------------------------
const validarAccesoOrganigrama = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "El identificador no es válido.",
      });
    }

    if (await tienePrivilegio(req.usuario, PRIVILEGIO_GESTIONAR_ORGANIGRAMA)) {
      return next();
    }

    const organigrama = await prisma.organigrama.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        estado: true,
        autorizado: true,
      },
    });

    if (!organigrama) {
      return res.status(404).json({
        error: "El organigrama solicitado no existe.",
      });
    }

    const esRevisor = await tienePrivilegio(
      req.usuario,
      PRIVILEGIO_REVISAR_ORGANIGRAMA,
    );

    const estado = String(organigrama.estado || "")
      .trim()
      .toLowerCase();

    if (
      esRevisor &&
      (estado === "solicitado" ||
        estado === "autorizado" ||
        estado === "rechazado")
    ) {
      return next();
    }

    if (estado === "autorizado" || organigrama.autorizado === true) {
      return next();
    }

    return res.status(403).json({
      error: "No tiene acceso a esta versión del organigrama.",
    });
  } catch (error) {
    console.error("[Organigramas - Acceso]", error);

    return res.status(500).json({
      error: "No fue posible validar el acceso al organigrama.",
    });
  }
};

// ------------------------------------------------------
// El autor se toma de la sesión autenticada.
// ------------------------------------------------------
const prepararCreacion = (req, res, next) => {
  req.body = {
    ...(req.body || {}),

    id_usuario: req.usuario.id,
  };

  return next();
};

const protegerAutor = (req, res, next) => {
  if (
    req.body &&
    Object.prototype.hasOwnProperty.call(req.body, "id_usuario")
  ) {
    delete req.body.id_usuario;
  }

  return next();
};

// ======================================================
// MANEJO GENERAL DE ERRORES
// ======================================================

const handleApiError = (res, error) => {
  console.error("[Error API Organigramas]:", {
    message: error.message,

    code: error.code,

    meta: error.meta,
  });

  // ====================================================
  // ERRORES DE CONEXIÓN PRISMA
  // ====================================================

  if (["P1001", "P1002", "P1003"].includes(error.code)) {
    return res.status(503).json({
      error: "No se pudo conectar con la base de datos.",
    });
  }

  // ====================================================
  // ID INVÁLIDO
  // ====================================================

  if (error.message === "INVALID_ID") {
    return res.status(400).json({
      error: "El identificador no es válido.",
    });
  }

  // ====================================================
  // VERSIÓN INVÁLIDA
  // ====================================================

  if (error.message === "INVALID_VERSION") {
    return res.status(400).json({
      error: "La versión debe ser un número entero mayor a cero.",
    });
  }

  // ====================================================
  // ESTADO INVÁLIDO
  // ====================================================

  if (error.message === "INVALID_STATE") {
    return res.status(400).json({
      error: "El estado del organigrama no es válido.",
    });
  }

  // ====================================================
  // DATOS INVÁLIDOS
  // ====================================================

  if (error.message === "INVALID_DATA") {
    return res.status(400).json({
      error: "Los datos proporcionados no son válidos.",
    });
  }

  // ====================================================
  // USUARIO NO ENCONTRADO
  // ====================================================

  if (error.message === "USER_NOT_FOUND") {
    return res.status(404).json({
      error: "El usuario indicado no existe.",
    });
  }

  // ====================================================
  // ESTRUCTURA VACÍA
  // ====================================================

  if (error.message === "EMPTY_STRUCTURE") {
    return res.status(409).json({
      error:
        "No se puede solicitar autorización porque el organigrama todavía no tiene áreas.",
    });
  }

  // ====================================================
  // ESTRUCTURA INVÁLIDA
  // ====================================================

  if (error.message === "INVALID_STRUCTURE") {
    return res.status(409).json({
      error:
        "La estructura del organigrama no es válida. Debe existir exactamente una raíz y todas las relaciones deben ser correctas.",
    });
  }

  // ====================================================
  // RELACIÓN CIRCULAR
  // ====================================================

  if (error.message === "CIRCULAR_RELATION") {
    return res.status(409).json({
      error: "La estructura contiene una relación circular entre áreas.",
    });
  }

  // ====================================================
  // ÁREA DUPLICADA
  // ====================================================

  if (error.message === "DUPLICATED_AREA") {
    return res.status(409).json({
      error:
        "Una misma área no puede aparecer más de una vez dentro del organigrama.",
    });
  }

  // ====================================================
  // YA FUE SOLICITADO
  // ====================================================

  if (error.message === "ALREADY_REQUESTED") {
    return res.status(409).json({
      error:
        "Este organigrama ya fue enviado para autorización y se encuentra pendiente de revisión.",
    });
  }

  // ====================================================
  // SOLICITUD PENDIENTE
  // ====================================================

  if (error.message === "REQUEST_PENDING") {
    return res.status(409).json({
      error:
        "El organigrama se encuentra pendiente de autorización y no puede modificarse ni eliminarse.",
    });
  }

  // ====================================================
  // NO FUE SOLICITADO
  // ====================================================

  if (error.message === "NOT_REQUESTED") {
    return res.status(409).json({
      error: "El organigrama no se encuentra pendiente de autorización.",
    });
  }

  // ====================================================
  // YA AUTORIZADO
  // ====================================================

  if (error.message === "ALREADY_AUTHORIZED") {
    return res.status(409).json({
      error: "El organigrama ya fue autorizado y no puede modificarse.",
    });
  }

  // ====================================================
  // AUTORIZADO NO SE PUEDE ELIMINAR
  // ====================================================

  if (error.message === "AUTHORIZED_CANNOT_DELETE") {
    return res.status(409).json({
      error: "No se puede eliminar un organigrama autorizado.",
    });
  }

  // ====================================================
  // OBSERVACIONES OBLIGATORIAS
  // ====================================================

  if (error.message === "OBSERVATIONS_REQUIRED") {
    return res.status(400).json({
      error: "Debe indicar el motivo por el cual se rechaza el organigrama.",
    });
  }

  // ====================================================
  // OBSERVACIONES DEMASIADO LARGAS
  // ====================================================

  if (error.message === "OBSERVATIONS_TOO_LONG") {
    return res.status(400).json({
      error: "Las observaciones no pueden superar los 1000 caracteres.",
    });
  }

  // ====================================================
  // NO ESTÁ RECHAZADO
  // ====================================================

  if (error.message === "NOT_REJECTED") {
    return res.status(409).json({
      error: "El organigrama no se encuentra en estado rechazado.",
    });
  }

  // ====================================================
  // NO EXISTE ORGANIGRAMA VIGENTE
  // ====================================================

  if (error.message === "NO_CURRENT_ORGANIZATION") {
    return res.status(404).json({
      error: "Todavía no existe un organigrama autorizado.",
    });
  }

  // ====================================================
  // NO ENCONTRADO
  // ====================================================

  if (error.message === "NOT_FOUND" || error.code === "P2025") {
    return res.status(404).json({
      error: "El organigrama solicitado no existe.",
    });
  }

  // ====================================================
  // FOREIGN KEY
  // ====================================================

  if (error.code === "P2003") {
    return res.status(400).json({
      error: "Existe una relación inválida con la base de datos.",
    });
  }

  // ====================================================
  // ERROR GENERAL
  // ====================================================

  return res.status(500).json({
    error:
      error.message ||
      "Ocurrió un error inesperado al procesar el organigrama.",
  });
};

// ======================================================
// GET ALL
// ======================================================
//
// Ejemplos:
//
// GET /api/organigramas
//
// GET /api/organigramas?id_usuario=1
//
// GET /api/organigramas?estado=solicitado
//
// GET /api/organigramas?autorizado=true
//
// ======================================================

router.get(
  "/",

  autenticar,

  aplicarAlcanceListado,

  async (req, res) => {
    try {
      const organigramas = await organigramasController.getAll(req.query);

      return res.status(200).json(organigramas);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// ======================================================
// GET ORGANIGRAMA VIGENTE
// ======================================================
//
// GET /api/organigramas/vigente
//
// Devuelve únicamente el último organigrama
// autorizado por Presidencia.
//
// ======================================================

router.get(
  "/vigente",

  autenticar,

  async (req, res) => {
    try {
      const organigrama = await organigramasController.getVigente();

      return res.status(200).json(organigrama);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// ======================================================
// GET PENDIENTES DE REVISIÓN
// ======================================================
//
// GET /api/organigramas/revision
//
// Sólo Presidencia.
//
// ======================================================

router.get(
  "/revision",

  autenticar,

  requierePrivilegio(PRIVILEGIO_REVISAR_ORGANIGRAMA),

  async (req, res) => {
    try {
      const lista = await organigramasController.getPendientesRevision();

      return res.status(200).json(lista);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// ======================================================
// GET BY ID
// ======================================================
//
// GET /api/organigramas/14
//
// ======================================================

router.get(
  "/:id",

  autenticar,

  validarAccesoOrganigrama,

  async (req, res) => {
    try {
      const organigrama = await organigramasController.getById(req.params.id);

      return res.status(200).json(organigrama);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// ======================================================
// POST
// ======================================================
//
// POST /api/organigramas
//
// Body:
// {
//   "id_usuario": 1,
//   "titulo": "Organigrama 2028",
//   "version": 1
// }
//
// Estado inicial:
// edicion
//
// ======================================================

router.post(
  "/",

  autenticar,

  requierePrivilegio(PRIVILEGIO_GESTIONAR_ORGANIGRAMA),

  prepararCreacion,

  async (req, res) => {
    try {
      const nuevo = await organigramasController.create(req.body);

      return res.status(201).json(nuevo);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// ======================================================
// PUT GENERAL
// ======================================================
//
// PUT /api/organigramas/14
//
// Solo modifica datos generales.
// NO autoriza, rechaza o solicita.
//
// ======================================================

router.put(
  "/:id",

  autenticar,

  requierePrivilegio(PRIVILEGIO_GESTIONAR_ORGANIGRAMA),

  protegerAutor,

  async (req, res) => {
    try {
      const actualizado = await organigramasController.update(
        req.params.id,
        req.body,
      );

      return res.status(200).json(actualizado);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// ======================================================
// SOLICITAR AUTORIZACIÓN
// ======================================================
//
// PUT /api/organigramas/14/solicitar
//
// edicion
//    ↓
// solicitado
//
// rechazado
//    ↓
// solicitado
//
// ======================================================

router.put(
  "/:id/solicitar",

  autenticar,

  requierePrivilegio(PRIVILEGIO_GESTIONAR_ORGANIGRAMA),

  async (req, res) => {
    try {
      const actualizado = await organigramasController.solicitarAutorizacion(
        req.params.id,
      );

      return res.status(200).json(actualizado);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// ======================================================
// CANCELAR SOLICITUD
// ======================================================
//
// PUT /api/organigramas/14/cancelar-solicitud
//
// solicitado
//    ↓
// edicion
//
// ======================================================

router.put(
  "/:id/cancelar-solicitud",

  autenticar,

  requierePrivilegio(PRIVILEGIO_GESTIONAR_ORGANIGRAMA),

  async (req, res) => {
    try {
      const actualizado = await organigramasController.cancelarSolicitud(
        req.params.id,
      );

      return res.status(200).json(actualizado);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// ======================================================
// AUTORIZAR
// ======================================================
//
// PUT /api/organigramas/14/autorizar
//
// solicitado
//    ↓
// autorizado
//
// Esta acción corresponde a Presidencia.
//
// ======================================================

router.put(
  "/:id/autorizar",

  autenticar,

  requierePrivilegio(PRIVILEGIO_REVISAR_ORGANIGRAMA),

  async (req, res) => {
    try {
      const autorizado = await organigramasController.autorizar(req.params.id);

      return res.status(200).json(autorizado);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// ======================================================
// RECHAZAR
// ======================================================
//
// PUT /api/organigramas/14/rechazar
//
// Body:
// {
//   "observaciones":
//     "Corregir la dependencia de Tesorería."
// }
//
// solicitado
//    ↓
// rechazado
//
// Esta acción corresponde a Presidencia.
//
// ======================================================

router.put(
  "/:id/rechazar",

  autenticar,

  requierePrivilegio(PRIVILEGIO_REVISAR_ORGANIGRAMA),

  async (req, res) => {
    try {
      const rechazado = await organigramasController.rechazar(
        req.params.id,
        req.body,
      );

      return res.status(200).json(rechazado);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// ======================================================
// REABRIR PARA EDICIÓN
// ======================================================
//
// PUT /api/organigramas/14/reabrir-edicion
//
// rechazado
//    ↓
// edicion
//
// El usuario puede corregirlo.
//
// ======================================================

router.put(
  "/:id/reabrir-edicion",

  autenticar,

  requierePrivilegio(PRIVILEGIO_GESTIONAR_ORGANIGRAMA),

  async (req, res) => {
    try {
      const actualizado = await organigramasController.reabrirEdicion(
        req.params.id,
      );

      return res.status(200).json(actualizado);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// ======================================================
// DELETE
// ======================================================
//
// DELETE /api/organigramas/14
//
// Solo:
// edicion
// rechazado
//
// No:
// solicitado
// autorizado
//
// ======================================================

router.delete(
  "/:id",

  autenticar,

  requierePrivilegio(PRIVILEGIO_GESTIONAR_ORGANIGRAMA),

  async (req, res) => {
    try {
      await organigramasController.remove(req.params.id);

      return res.status(200).json({
        message: "Organigrama eliminado correctamente.",
      });
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

module.exports = router;
