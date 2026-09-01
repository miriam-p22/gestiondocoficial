const express = require("express");
const router = express.Router();

const documentosController = require(
  "../controllers/documentos.controller"
);

const handleApiError = (res, error, customMessage) => {
  console.error("[Error API Documentos]:", error);

  if (["P1001", "P1002", "P1003"].includes(error.code)) {
    return res.status(503).json({
      error:
        "No se pudo conectar con la base de datos. Verifique que MySQL esté encendido.",
    });
  }

  if (error.message === "INVALID_ID") {
    return res.status(400).json({
      error: "El identificador proporcionado no es válido.",
    });
  }

  if (error.message === "INVALID_DATE") {
    return res.status(400).json({
      error: "Una de las fechas no tiene un formato válido.",
    });
  }

  if (error.message === "INVALID_DATA") {
    return res.status(400).json({
      error:
        "Revise los datos enviados. El área, la clasificación y el título son obligatorios.",
    });
  }

  if (
    error.message === "NOT_FOUND" ||
    error.code === "P2025"
  ) {
    return res.status(404).json({
      error: "El documento solicitado no existe.",
    });
  }

  if (error.code === "P2003") {
    return res.status(400).json({
      error:
        "El área, la clasificación o el documento relacionado no existe.",
    });
  }

  return res.status(500).json({
    error:
      customMessage ||
      "Ocurrió un error inesperado al procesar el documento.",
  });
};

router.get("/", async (req, res) => {
  try {
    const documentos = await documentosController.getAll({
      id_area: req.query.id_area,
      id_clasificacion: req.query.id_clasificacion,
    });

    return res.status(200).json(documentos);
  } catch (error) {
    return handleApiError(
      res,
      error,
      "Error al consultar los documentos."
    );
  }
});

router.get("/:id", async (req, res) => {
  try {
    const documento = await documentosController.getById(
      req.params.id
    );

    return res.status(200).json(documento);
  } catch (error) {
    return handleApiError(
      res,
      error,
      "Error al consultar el documento."
    );
  }
});

router.post("/", async (req, res) => {
  try {
    const documento = await documentosController.create(
      req.body
    );

    return res.status(201).json(documento);
  } catch (error) {
    return handleApiError(
      res,
      error,
      "Error al crear el documento."
    );
  }
});

router.post("/:id/estado", async (req, res) => {
  try {
    const documento =
      await documentosController.cambiarEstado(
        req.params.id,
        req.body.nombre_estado,
        {
          fecha_respuesta: req.body.fecha_respuesta,
          respuesta_recibida:
            req.body.respuesta_recibida,
        }
      );

    return res.status(201).json(documento);
  } catch (error) {
    return handleApiError(
      res,
      error,
      "Error al cambiar el estado del documento."
    );
  }
});

router.put("/:id", async (req, res) => {
  try {
    const documento = await documentosController.update(
      req.params.id,
      req.body
    );

    return res.status(200).json(documento);
  } catch (error) {
    return handleApiError(
      res,
      error,
      "Error al actualizar el documento."
    );
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await documentosController.remove(req.params.id);

    return res.status(200).json({
      message: "Documento eliminado correctamente.",
    });
  } catch (error) {
    return handleApiError(
      res,
      error,
      "Error al eliminar el documento."
    );
  }
});

module.exports = router;