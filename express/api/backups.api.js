const express = require("express");
const router = express.Router();

const backupsController = require("../controllers/backups.controller");
const { autenticar } = require("../middlewares/auth.middleware");

// AUTORIZACIÓN DE RESPALDOS
const esAdministrador = (usuario) => {
  return String(usuario?.rol?.nombre_rol || "").trim() === "Administrador";
};

const validarAccesoGeneral = (req, res, next) => {
  if (!esAdministrador(req.usuario)) {
    return res.status(403).json({
      error: "Solo el Administrador puede generar un respaldo general.",
    });
  }

  return next();
};

const validarAccesoArea = (req, res, next) => {
  const idAreaSolicitada = Number(req.params.idArea);

  if (!Number.isInteger(idAreaSolicitada) || idAreaSolicitada <= 0) {
    return res.status(400).json({
      error: "El identificador del área no es válido.",
    });
  }

  /* El Administrador puede respaldar cualquier área. */
  if (esAdministrador(req.usuario)) {
    return next();
  }

  /*
    Los demás usuarios únicamente pueden respaldar el área asociada a su sesión. */
  const idAreaUsuario = Number(req.usuario?.id_area);

  if (!Number.isInteger(idAreaUsuario) || idAreaUsuario <= 0) {
    return res.status(403).json({
      error:
        "Su usuario no tiene un área válida asignada para generar respaldos.",
    });
  }

  if (idAreaSolicitada !== idAreaUsuario) {
    return res.status(403).json({
      error: "Solo puede generar respaldos correspondientes a su propia área.",
    });
  }

  return next();
};

// ERRORES
const handleApiError = (res, error) => {
  console.error("[Error API Backups]:", {
    message: error.message,
    code: error.code,
  });

  if (res.headersSent) {
    return;
  }

  if (error.message === "INVALID_ID") {
    return res.status(400).json({
      error: "El identificador no es válido.",
    });
  }

  if (error.message === "INVALID_DATE") {
    return res.status(400).json({
      error: "El rango de fechas no es válido.",
    });
  }

  if (error.message === "AREA_NOT_FOUND") {
    return res.status(404).json({
      error: "El área indicada no existe.",
    });
  }

  if (error.message === "NO_DOCUMENTS") {
    return res.status(404).json({
      error:
        "No existen documentos recibidos dentro del periodo seleccionado para generar este respaldo.",
    });
  }

  return res.status(500).json({
    error: error.message || "No fue posible generar la copia de seguridad.",
  });
};

// RESPALDO GENERAL
router.get(
  "/general",

  autenticar,
  validarAccesoGeneral,

  async (req, res) => {
    try {
      await backupsController.general(res, req.query);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// RESPALDO POR ÁREA
router.get(
  "/area/:idArea",

  autenticar,
  validarAccesoArea,

  async (req, res) => {
    try {
      await backupsController.porArea(res, req.params.idArea, req.query);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

module.exports = router;
