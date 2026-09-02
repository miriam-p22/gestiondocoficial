const express = require("express");
const router = express.Router();

const path = require("path");
const fs = require("fs");
const multer = require("multer");

const dispersionController = require("../controllers/dispersion.controller");

const { autenticar } = require("../middlewares/auth.middleware");

const { requierePrivilegio } = require("../middlewares/permisos.middleware");

const prisma = require("../db/client");

const PRIVILEGIO_GESTIONAR_DISPERSION = "Gestionar Dispersión";

// SEGURIDAD Y ALCANCE DE CONSULTA
const tieneGestionDispersion = async (usuario) => {
  if (!usuario || !usuario.id_rol) {
    return false;
  }

  const permiso = await prisma.rolPermiso.findFirst({
    where: {
      id_rol: Number(usuario.id_rol),

      privilegio: {
        titulo_privilegio: PRIVILEGIO_GESTIONAR_DISPERSION,
      },
    },

    select: {
      id_rol: true,
    },
  });

  return Boolean(permiso);
};

const tieneConsultaGlobal = async (usuario) => {
  const nombreRol = String(usuario?.rol?.nombre_rol || "").trim();
  const nombreArea = String(usuario?.area?.nombre_area || "").trim();

  if (nombreRol === "Administrador" || nombreArea === "Presidencia Municipal") {
    return true;
  }

  return tieneGestionDispersion(usuario);
};

const aplicarAlcanceConsulta = async (req, res, next) => {
  try {
    const global = await tieneConsultaGlobal(req.usuario);

    if (global) {
      return next();
    }

    const idArea = Number(req.usuario?.id_area);

    if (!Number.isInteger(idArea) || idArea <= 0) {
      return res.status(403).json({
        error: "Su usuario no tiene un área válida asignada.",
      });
    }

    req.query.id_area = String(idArea);

    return next();
  } catch (error) {
    console.error("[DISPERSION ALCANCE]", error);

    return res.status(500).json({
      error: "No fue posible validar el alcance de consulta de Dispersión.",
    });
  }
};

const validarAccesoDispersion = async (req, res, next) => {
  try {
    const global = await tieneConsultaGlobal(req.usuario);

    if (global) {
      return next();
    }

    const idArea = Number(req.usuario?.id_area);
    const idDispersion = Number(req.params.id);

    if (
      !Number.isInteger(idArea) ||
      idArea <= 0 ||
      !Number.isInteger(idDispersion) ||
      idDispersion <= 0
    ) {
      return res.status(403).json({
        error: "No tiene acceso a la dispersión solicitada.",
      });
    }

    const destino = await prisma.dispersionDestino.findUnique({
      where: {
        id_dispersion_id_area: {
          id_dispersion: idDispersion,
          id_area: idArea,
        },
      },

      select: {
        id: true,
      },
    });

    if (!destino) {
      return res.status(403).json({
        error: "No tiene acceso a la dispersión solicitada.",
      });
    }

    return next();
  } catch (error) {
    console.error("[DISPERSION ACCESO]", error);

    return res.status(500).json({
      error: "No fue posible validar el acceso a la dispersión.",
    });
  }
};

// MULTER
const carpetaDispersion = path.join(process.cwd(), "uploads", "dispersion");

if (!fs.existsSync(carpetaDispersion)) {
  fs.mkdirSync(carpetaDispersion, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, carpetaDispersion);
  },

  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname);
    const nombreBase = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9_-]/g, "_");

    const fecha = new Date().toISOString().replace(/[:.]/g, "-");
    callback(null, `${fecha}_${nombreBase}${extension}`);
  },
});

const tiposPermitidos = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const upload = multer({
  storage,

  limits: {
    fileSize: 20 * 1024 * 1024,
  },

  fileFilter: (req, file, callback) => {
    if (tiposPermitidos.includes(file.mimetype)) {
      return callback(null, true);
    }

    return callback(new Error("INVALID_FILE_TYPE"));
  },
});

// ERRORES
const handleApiError = (res, error) => {
  console.error("[Error API Dispersión]:", {
    message: error.message,
    code: error.code,
    meta: error.meta,
  });

  if (["P1001", "P1002", "P1003"].includes(error.code)) {
    return res.status(503).json({
      error: "No se pudo conectar con la base de datos.",
    });
  }

  const errores400 = {
    INVALID_ID: "El identificador no es válido.",
    INVALID_ORIGIN: "El origen debe ser web o app.",
    INVALID_SEND_STATE:
      "El estado de transferencia debe ser pendiente, enviado o error.",
    INVALID_DOCUMENT_STATE:
      "El estado del oficio debe ser turnado, recibido, en proceso, atendido o devuelto.",
    INVALID_RETURN_REASON: "El motivo de devolución no es válido.",
    RETURN_COMMENT_REQUIRED:
      "Debe escribir un comentario cuando seleccione el motivo Otro.",
    RESPONSE_REQUIRED:
      "Debe escribir una respuesta antes de marcar el oficio como Atendido.",
    INVALID_DATA: "Los datos proporcionados no son válidos.",
    INVALID_DATE: "La fecha proporcionada no es válida.",
    DEADLINE_REQUIRED: "Debe indicar la fecha límite de atención.",
    TEXT_TOO_LONG: "Uno de los campos supera la longitud permitida.",
    DESTINATIONS_REQUIRED: "Debe seleccionar al menos un área destino.",
    SEND_ERROR_REQUIRED: "Debe indicar el motivo del error de transferencia.",
    INVALID_FILE_TYPE:
      "El tipo de archivo no está permitido. Use PDF, JPG, PNG, DOC o DOCX.",
    STATE_NOT_EDITABLE:
      "El estado Turnado es asignado automáticamente por Oficialía.",
    RECEIVE_REQUIRED:
      "Primero debe confirmar que el documento fue recibido por el área.",
    FINAL_STATE:
      "El documento ya se encuentra en un estado final y no puede modificarse.",
  };

  if (errores400[error.message]) {
    return res.status(400).json({
      error: errores400[error.message],
    });
  }

  if (error.message === "ACCESS_DENIED") {
    return res.status(403).json({
      error:
        "No tiene permisos para modificar documentos asignados a otra área.",
    });
  }

  if (error.message === "AREA_NOT_FOUND") {
    return res.status(404).json({
      error: "El área indicada no existe.",
    });
  }

  if (error.message === "DESTINATION_NOT_FOUND") {
    return res.status(404).json({
      error: "El destino indicado no existe.",
    });
  }

  if (error.message === "DESTINATION_ALREADY_EXISTS") {
    return res.status(409).json({
      error: "El área ya está registrada como destino.",
    });
  }

  if (error.message === "NOT_FOUND" || error.code === "P2025") {
    return res.status(404).json({
      error: "La dispersión solicitada no existe.",
    });
  }

  if (error.code === "P2002") {
    return res.status(409).json({
      error: "El registro ya existe.",
    });
  }

  if (error.code === "P2003") {
    return res.status(400).json({
      error: "Existe una relación inválida con la base de datos.",
    });
  }

  return res.status(500).json({
    error: error.message || "Ocurrió un error inesperado en Dispersión.",
  });
};

// SUBIR ARCHIVO REAL
router.post(
  "/subir",

  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_DISPERSION),
  upload.single("archivo"),

  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "Debe seleccionar un archivo.",
        });
      }

      let destinos = [];

      try {
        destinos = JSON.parse(req.body.destinos || "[]");
      } catch {
        destinos = String(req.body.destinos || "")
          .split(",")
          .map((valor) => valor.trim())
          .filter(Boolean)
          .map(Number);
      }

      if (!Array.isArray(destinos) || destinos.length === 0) {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(400).json({
          error: "Debe seleccionar al menos un área destino.",
        });
      }

      const extension = path
        .extname(req.file.originalname)
        .replace(".", "")
        .toLowerCase();

      const rutaRelativa = path
        .relative(process.cwd(), req.file.path)
        .replace(/\\/g, "/");

      try {
        const nueva = await dispersionController.create({
          nombre_archivo: req.file.originalname,
          archivo: rutaRelativa,
          tipo_archivo: req.file.mimetype,
          tamano_archivo: req.file.size,
          extension,
          origen: "web",
          fecha_limite: req.body.fecha_limite || null,
          destinos,
        });

        return res.status(201).json(nueva);
      } catch (error) {
        if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        throw error;
      }
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// GET ALL
router.get(
  "/",

  autenticar,
  aplicarAlcanceConsulta,

  async (req, res) => {
    try {
      const resultado = await dispersionController.getAll(req.query);

      return res.status(200).json(resultado);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// GET BY ID
router.get(
  "/:id",

  autenticar,
  validarAccesoDispersion,

  async (req, res) => {
    try {
      const resultado = await dispersionController.getById(req.params.id);

      return res.status(200).json(resultado);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// CREAR JSON
router.post(
  "/",

  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_DISPERSION),

  async (req, res) => {
    try {
      const resultado = await dispersionController.create(req.body);

      return res.status(201).json(resultado);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// UPDATE
router.put(
  "/:id",

  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_DISPERSION),

  async (req, res) => {
    try {
      const resultado = await dispersionController.update(
        req.params.id,
        req.body,
      );

      return res.status(200).json(resultado);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// DESTINOS
router.get(
  "/:id/destinos",

  autenticar,
  validarAccesoDispersion,

  async (req, res) => {
    try {
      const resultado = await dispersionController.getDestinos(req.params.id);

      return res.status(200).json(resultado);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

router.post(
  "/:id/destinos",

  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_DISPERSION),

  async (req, res) => {
    try {
      const resultado = await dispersionController.agregarDestino(
        req.params.id,
        req.body.id_area,
        {
          fecha_limite: req.body.fecha_limite,
        },
      );

      return res.status(201).json(resultado);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

router.delete(
  "/:id/destinos/:idArea",

  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_DISPERSION),

  async (req, res) => {
    try {
      await dispersionController.eliminarDestino(
        req.params.id,
        req.params.idArea,
      );

      return res.status(200).json({
        message: "Destino eliminado correctamente.",
      });
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// ESTADO DE TRANSFERENCIA
router.put(
  "/:id/destinos/:idArea/estado",

  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_DISPERSION),

  async (req, res) => {
    try {
      const resultado = await dispersionController.actualizarEstadoDestino(
        req.params.id,
        req.params.idArea,
        req.body,
      );

      return res.status(200).json(resultado);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// ESTADO ADMINISTRATIVO
router.put(
  "/:id/destinos/:idArea/documento",

  autenticar,

  async (req, res) => {
    try {
      const resultado = await dispersionController.actualizarEstadoDocumento(
        req.params.id,
        req.params.idArea,
        req.body,
        req.usuario,
      );

      return res.status(200).json(resultado);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// FECHA LÍMITE
router.put(
  "/:id/destinos/:idArea/fecha-limite",

  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_DISPERSION),

  async (req, res) => {
    try {
      const resultado = await dispersionController.actualizarFechaLimite(
        req.params.id,
        req.params.idArea,
        req.body.fecha_limite,
      );

      return res.status(200).json(resultado);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// REINTENTAR
router.put(
  "/:id/destinos/:idArea/reintentar",

  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_DISPERSION),

  async (req, res) => {
    try {
      const resultado = await dispersionController.reintentarDestino(
        req.params.id,
        req.params.idArea,
      );

      return res.status(200).json(resultado);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// DELETE DISPERSIÓN
router.delete(
  "/:id",

  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_DISPERSION),

  async (req, res) => {
    try {
      await dispersionController.remove(req.params.id);

      return res.status(200).json({
        message: "Dispersión eliminada correctamente.",
      });
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

module.exports = router;
