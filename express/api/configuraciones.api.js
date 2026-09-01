const express = require("express");
const router = express.Router();

const configuracionesController = require("../controllers/configuraciones.controller");
const { autenticar } = require("../middlewares/auth.middleware");
const { requierePrivilegio } = require("../middlewares/permisos.middleware");

const PRIVILEGIO_NOTIFICACIONES = "Gestionar Notificaciones";
const PRIVILEGIO_CONFIGURACION = "Gestionar Configuración del Sistema";

const handleApiError = (res, error, customMessage) => {
  console.error("[Error API Configuraciones]:", {
    message: error.message,
    code: error.code,
    meta: error.meta,
  });

  if (["P1001", "P1002", "P1003"].includes(error.code)) {
    return res.status(503).json({
      error: "No se pudo conectar con la base de datos. Verifique que MySQL esté encendido.",
    });
  }

  if (error.message === "INVALID_PORT") {
    return res.status(400).json({
      error: "El puerto debe ser un número entero entre 1 y 65535.",
    });
  }

  if (error.message === "INVALID_DATA") {
    return res.status(400).json({
      error: "Debe proporcionar correo remitente, servidor SMTP y puerto.",
    });
  }

  if (error.message === "PASSWORD_REQUIRED") {
    return res.status(400).json({
      error: "La contraseña SMTP es obligatoria en la primera configuración.",
    });
  }

  if (error.message === "INVALID_USER") {
    return res.status(401).json({
      error: "La sesión no contiene un usuario válido.",
    });
  }

  if (error.message === "USER_NOT_FOUND") {
    return res.status(404).json({
      error: "El usuario indicado no existe.",
    });
  }

  if (error.message === "SMTP_NOT_CONFIGURED") {
    return res.status(400).json({
      error: "Primero debe guardar una configuración SMTP.",
    });
  }

  if (error.message === "SMTP_TIMEOUT") {
    return res.status(504).json({
      error: "El servidor SMTP no respondió dentro del tiempo esperado.",
    });
  }

  return res.status(500).json({
    error:
      customMessage ||
      error.message ||
      "Ocurrió un error inesperado al procesar la configuración.",
  });
};

router.get(
  "/estado-sistema",
  autenticar,
  requierePrivilegio(PRIVILEGIO_CONFIGURACION),
  async (req, res) => {
    try {
      const estado = await configuracionesController.obtenerEstadoSistema();
      return res.status(200).json(estado);
    } catch (error) {
      return handleApiError(
        res,
        error,
        "No fue posible comprobar el estado del sistema."
      );
    }
  }
);

router.get(
  "/actual",
  autenticar,
  requierePrivilegio(PRIVILEGIO_NOTIFICACIONES),
  async (req, res) => {
    try {
      const configuracion = await configuracionesController.getActual(req.usuario);
      return res.status(200).json(configuracion);
    } catch (error) {
      return handleApiError(
        res,
        error,
        "No fue posible consultar la configuración SMTP."
      );
    }
  }
);

router.put(
  "/actual",
  autenticar,
  requierePrivilegio(PRIVILEGIO_NOTIFICACIONES),
  async (req, res) => {
    try {
      const configuracion = await configuracionesController.guardarActual(
        req.usuario,
        req.body
      );
      return res.status(200).json(configuracion);
    } catch (error) {
      return handleApiError(
        res,
        error,
        "No fue posible guardar la configuración SMTP."
      );
    }
  }
);

router.post(
  "/probar-smtp",
  autenticar,
  requierePrivilegio(PRIVILEGIO_NOTIFICACIONES),
  async (req, res) => {
    try {
      const resultado = await configuracionesController.probarServidorSmtp(
        req.usuario
      );
      return res.status(200).json(resultado);
    } catch (error) {
      return handleApiError(
        res,
        error,
        "No fue posible conectar con el servidor SMTP."
      );
    }
  }
);

module.exports = router;