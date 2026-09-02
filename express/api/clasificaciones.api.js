const express = require("express");
const router = express.Router();

const clasificacionesController = require("../controllers/clasificaciones.controller");
const { autenticar } = require("../middlewares/auth.middleware");

const {
  requierePrivilegio,
  requiereCualquierPrivilegio,
} = require("../middlewares/permisos.middleware");

const PRIVILEGIO_GESTIONAR = "Gestionar Archivo Físico";
const PRIVILEGIO_CONSULTAR_GLOBAL = "Consultar Archivo Físico Global";

// ERRORES
const handleApiError = (res, error, customMessage) => {
  console.error("[Error API Clasificaciones]:", error);

  if (["P1001", "P1002", "P1003"].includes(error.code)) {
    return res.status(503).json({
      error:
        "No se pudo conectar con la base de datos. Verifique que MySQL esté encendido.",
    });
  }

  if (error.message === "INVALID_ID") {
    return res.status(400).json({
      error: "El identificador de la clasificación no es válido.",
    });
  }

  if (error.message === "INVALID_DATA") {
    return res.status(400).json({
      error: "El área administrativa y el código asignado son obligatorios.",
    });
  }

  if (error.message === "DUPLICATE" || error.code === "P2002") {
    return res.status(409).json({
      error: "Ya existe una clasificación con ese código asignado.",
    });
  }

  if (error.message === "CLASSIFICATION_IN_USE") {
    return res.status(409).json({
      error:
        "No se puede eliminar la clasificación porque está siendo utilizada por uno o más documentos.",
    });
  }

  if (error.message === "NOT_FOUND" || error.code === "P2025") {
    return res.status(404).json({
      error: "La clasificación solicitada no existe.",
    });
  }

  if (error.code === "P2003") {
    return res.status(409).json({
      error:
        "No se puede completar la operación porque la clasificación tiene documentos relacionados.",
    });
  }

  return res.status(500).json({
    error:
      customMessage ||
      "Ocurrió un error inesperado al procesar la clasificación.",
  });
};

// CONSULTAR TODAS
router.get(
  "/",
  autenticar,
  requiereCualquierPrivilegio([
    PRIVILEGIO_GESTIONAR,
    PRIVILEGIO_CONSULTAR_GLOBAL,
  ]),
  async (req, res) => {
    try {
      const clasificaciones = await clasificacionesController.getAll();

      return res.status(200).json(clasificaciones);
    } catch (error) {
      return handleApiError(
        res,
        error,
        "Error al consultar las clasificaciones.",
      );
    }
  },
);

// CONSULTAR POR ID
router.get(
  "/:id",
  autenticar,
  requiereCualquierPrivilegio([
    PRIVILEGIO_GESTIONAR,
    PRIVILEGIO_CONSULTAR_GLOBAL,
  ]),
  async (req, res) => {
    try {
      const clasificacion = await clasificacionesController.getById(
        req.params.id,
      );

      return res.status(200).json(clasificacion);
    } catch (error) {
      return handleApiError(res, error, "Error al consultar la clasificación.");
    }
  },
);

// CREAR
router.post(
  "/",
  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR),
  async (req, res) => {
    try {
      const clasificacion = await clasificacionesController.create(req.body);

      return res.status(201).json(clasificacion);
    } catch (error) {
      return handleApiError(res, error, "Error al crear la clasificación.");
    }
  },
);

// ACTUALIZAR
router.put(
  "/:id",
  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR),
  async (req, res) => {
    try {
      const clasificacion = await clasificacionesController.update(
        req.params.id,
        req.body,
      );

      return res.status(200).json(clasificacion);
    } catch (error) {
      return handleApiError(
        res,
        error,
        "Error al actualizar la clasificación.",
      );
    }
  },
);

// ELIMINAR
router.delete(
  "/:id",
  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR),
  async (req, res) => {
    try {
      await clasificacionesController.remove(req.params.id);

      return res.status(200).json({
        message: "Clasificación eliminada correctamente.",
      });
    } catch (error) {
      return handleApiError(res, error, "Error al eliminar la clasificación.");
    }
  },
);

module.exports = router;
