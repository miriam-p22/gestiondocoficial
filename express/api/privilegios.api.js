const express = require("express");
const router = express.Router();

const privilegiosController = require("../controllers/privilegios.controller");
const { autenticar } = require("../middlewares/auth.middleware");
const { requierePrivilegio } = require("../middlewares/permisos.middleware");
const PRIVILEGIO_GESTIONAR_ROLES = "Gestionar Roles y Privilegios";

const handleApiError = (res, error) => {
  console.error("[Error API Privilegios]:", {
    message: error.message,
    code: error.code,
    meta: error.meta,
  });

  if (["P1001", "P1002", "P1003"].includes(error.code)) {
    return res.status(503).json({
      error: "No se pudo conectar con la base de datos.",
    });
  }

  if (error.message === "INVALID_ID") {
    return res.status(400).json({
      error: "El identificador del privilegio no es válido.",
    });
  }

  if (error.message === "INVALID_DATA") {
    return res.status(400).json({
      error: "El título del privilegio es obligatorio.",
    });
  }

  if (error.message === "DUPLICATE" || error.code === "P2002") {
    return res.status(409).json({
      error: "Ya existe ese privilegio.",
    });
  }

  if (error.message === "NOT_FOUND" || error.code === "P2025") {
    return res.status(404).json({
      error: "El privilegio solicitado no existe.",
    });
  }

  return res.status(500).json({
    error:
      error.message || "Ocurrió un error inesperado al procesar el privilegio.",
  });
};

router.get(
  "/",
  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_ROLES),
  async (req, res) => {
    try {
      const privilegios = await privilegiosController.getAll();

      return res.status(200).json(privilegios);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

router.get(
  "/:id",
  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_ROLES),
  async (req, res) => {
    try {
      const privilegio = await privilegiosController.getById(req.params.id);

      return res.status(200).json(privilegio);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

router.post(
  "/",
  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_ROLES),
  async (req, res) => {
    try {
      const privilegio = await privilegiosController.create(req.body);

      return res.status(201).json(privilegio);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

router.put(
  "/:id",
  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_ROLES),
  async (req, res) => {
    try {
      const privilegio = await privilegiosController.update(
        req.params.id,
        req.body,
      );

      return res.status(200).json(privilegio);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

router.delete(
  "/:id",
  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_ROLES),
  async (req, res) => {
    try {
      await privilegiosController.remove(req.params.id);

      return res.status(200).json({
        message: "Privilegio eliminado correctamente.",
      });
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

module.exports = router;
