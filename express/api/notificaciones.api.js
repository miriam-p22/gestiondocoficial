const express = require("express");
const router = express.Router();

const notificacionesController = require("../controllers/notificaciones.controller");
const {autenticar,} = require("../middlewares/auth.middleware");

// ======================================================
// MANEJO DE ERRORES
// ======================================================

const handleApiError = (
  res,
  error
) => {
  console.error(
    "[Error API Notificaciones]:",
    {
      message:
        error.message,
      code:
        error.code,
      meta:
        error.meta,
    }
  );

  if (
    ["P1001", "P1002", "P1003"].includes(
      error.code
    )
  ) {
    return res.status(503).json({
      error:
        "No se pudo conectar con la base de datos.",
    });
  }

  if (
    error.message ===
    "INVALID_ID"
  ) {
    return res.status(400).json({
      error:
        "El identificador de la notificación no es válido.",
    });
  }

  if (
    error.message ===
      "NOT_FOUND" ||
    error.code === "P2025"
  ) {
    return res.status(404).json({
      error:
        "La notificación solicitada no existe.",
    });
  }

  return res.status(500).json({
    error:
      error.message ||
      "Ocurrió un error inesperado al procesar las notificaciones.",
  });
};

// ======================================================
// TODAS LAS RUTAS REQUIEREN SESIÓN
// ======================================================

router.use(autenticar);

// ======================================================
// GET - NOTIFICACIONES DEL USUARIO ACTUAL
// ======================================================

router.get(
  "/",
  async (req, res) => {
    try {
      const notificaciones =
        await notificacionesController.getByUsuario(
          req.usuario.id
        );

      return res
        .status(200)
        .json(
          notificaciones
        );
    } catch (error) {
      return handleApiError(
        res,
        error
      );
    }
  }
);

// ======================================================
// GET - NO LEÍDAS
// IMPORTANTE: ANTES DE /:id
// ======================================================

router.get(
  "/no-leidas",
  async (req, res) => {
    try {
      const notificaciones =
        await notificacionesController.getNoLeidas(
          req.usuario.id
        );

      return res
        .status(200)
        .json(
          notificaciones
        );
    } catch (error) {
      return handleApiError(
        res,
        error
      );
    }
  }
);

// ======================================================
// PUT - MARCAR TODAS COMO LEÍDAS
// IMPORTANTE: ANTES DE /:id/leer
// ======================================================

router.put(
  "/leer-todas",
  async (req, res) => {
    try {
      const resultado =
        await notificacionesController.marcarTodasComoLeidas(
          req.usuario.id
        );

      return res
        .status(200)
        .json({
          message:
            "Notificaciones marcadas como leídas correctamente.",

          ...resultado,
        });
    } catch (error) {
      return handleApiError(
        res,
        error
      );
    }
  }
);

// ======================================================
// PUT - MARCAR UNA COMO LEÍDA
// ======================================================

router.put(
  "/:id/leer",
  async (req, res) => {
    try {
      const notificacion =
        await notificacionesController.marcarComoLeida(
          req.params.id,
          req.usuario.id
        );

      return res
        .status(200)
        .json(
          notificacion
        );
    } catch (error) {
      return handleApiError(
        res,
        error
      );
    }
  }
);

// ======================================================
// DELETE - ELIMINAR NOTIFICACIÓN
// ======================================================

router.delete(
  "/:id",
  async (req, res) => {
    try {
      const notificacion =
        await notificacionesController.remove(
          req.params.id,
          req.usuario.id
        );

      return res
        .status(200)
        .json({
          message:
            "Notificación eliminada correctamente.",

          notificacion,
        });
    } catch (error) {
      return handleApiError(
        res,
        error
      );
    }
  }
);

module.exports = router;