const express = require("express");
const router = express.Router();
const archivoFisicoController = require("../controllers/archivo_fisico.controller");
const { autenticar } = require("../middlewares/auth.middleware");

const {
  requierePrivilegio,
  requiereCualquierPrivilegio,
} = require("../middlewares/permisos.middleware");

const PRIVILEGIO_GESTIONAR = "Gestionar Archivo Físico";
const PRIVILEGIO_CONSULTAR_GLOBAL = "Consultar Archivo Físico Global";
const handleApiError = (res, error) => {
  console.error("[Error API Archivo Físico]:", {
    message: error.message,
    code: error.code,
    meta: error.meta,
  });

  const errores400 = {
    INVALID_ID: "El identificador indicado no es válido.",
    INVALID_STATE: "El estado de archivo no es válido.",
    TEXT_TOO_LONG: "Uno de los textos supera la longitud permitida.",
    ARCHIVE_DATA_REQUIRED:
      "Para marcar el documento como resguardado debe seleccionar una clasificación y capturar la ubicación física.",
  };

  if (errores400[error.message]) {
    return res.status(400).json({
      error: errores400[error.message],
    });
  }

  if (error.message === "ACCESS_DENIED") {
    return res.status(403).json({
      error: "No tiene permisos para consultar este registro de archivo.",
    });
  }

  if (error.message === "ARCHIVE_ACCESS_DENIED") {
    return res.status(403).json({
      error:
        "Su rol no cuenta con el privilegio para gestionar el Archivo Físico.",
    });
  }

  if (error.message === "ARCHIVE_CONSULT_DENIED") {
    return res.status(403).json({
      error:
        "Su rol no cuenta con privilegios para consultar el Archivo Físico.",
    });
  }

  if (error.message === "DOCUMENT_NOT_FINISHED") {
    return res.status(409).json({
      error:
        "El documento todavía no ha concluido su atención y no puede registrarse en el archivo físico.",
    });
  }

  if (error.message === "CLASSIFICATION_NOT_FOUND") {
    return res.status(404).json({
      error: "La clasificación seleccionada no existe.",
    });
  }

  if (error.message === "NOT_FOUND" || error.code === "P2025") {
    return res.status(404).json({
      error: "El documento solicitado no existe.",
    });
  }

  if (["P1001", "P1002", "P1003"].includes(error.code)) {
    return res.status(503).json({
      error: "No fue posible conectarse con la base de datos.",
    });
  }

  return res.status(500).json({
    error: error.message || "Ocurrió un error inesperado en Archivo Físico.",
  });
};

router.get("/permisos", autenticar, async (req, res) => {
  try {
    const permisos = await archivoFisicoController.getPermisos(req.usuario);

    return res.status(200).json(permisos);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get(
  "/",
  autenticar,
  requiereCualquierPrivilegio([
    PRIVILEGIO_GESTIONAR,
    PRIVILEGIO_CONSULTAR_GLOBAL,
  ]),
  async (req, res) => {
    try {
      const lista = await archivoFisicoController.getAll(req.usuario);

      return res.status(200).json(lista);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

router.get(
  "/destino/:idDestino",
  autenticar,
  requiereCualquierPrivilegio([
    PRIVILEGIO_GESTIONAR,
    PRIVILEGIO_CONSULTAR_GLOBAL,
  ]),
  async (req, res) => {
    try {
      const registro = await archivoFisicoController.getByDestino(
        req.params.idDestino,
        req.usuario,
      );

      return res.status(200).json(registro);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

router.put(
  "/destino/:idDestino",
  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR),
  async (req, res) => {
    try {
      const registro = await archivoFisicoController.guardarResguardo(
        req.params.idDestino,
        req.body,
        req.usuario,
      );

      return res.status(200).json(registro);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

module.exports = router;
