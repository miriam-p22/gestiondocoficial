const express = require("express");
const router = express.Router();

const estadosController = require("../controllers/estados.controller");

const handleApiError = (res, error, customMessage) => {
  console.error("[Error API Estados]:", error);

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

  if (error.message === "INVALID_DATA") {
    return res.status(400).json({
      error: "Debe enviar el documento y el nombre del estado.",
    });
  }

  if (error.message === "INVALID_STATE") {
    return res.status(400).json({
      error: "El estado enviado no pertenece a la lista de estados permitidos.",
    });
  }

  if (error.message === "DOCUMENT_NOT_FOUND") {
    return res.status(404).json({
      error: "El documento indicado no existe.",
    });
  }

  if (error.message === "NOT_FOUND" || error.code === "P2025") {
    return res.status(404).json({
      error: "El estado solicitado no existe.",
    });
  }

  if (error.code === "P2003") {
    return res.status(400).json({
      error:
        "No se puede guardar el estado porque el documento relacionado no existe.",
    });
  }

  return res.status(500).json({
    error:
      customMessage || "Ocurrió un error inesperado al procesar el estado.",
  });
};

// Obtener estados
router.get("/", async (req, res) => {
  try {
    const estados = await estadosController.getAll({
      id_documento: req.query.id_documento,
    });

    return res.status(200).json(estados);
  } catch (error) {
    return handleApiError(res, error, "Error al consultar los estados.");
  }
});

// Obtener un estado por ID
router.get("/:id", async (req, res) => {
  try {
    const estado = await estadosController.getById(req.params.id);

    return res.status(200).json(estado);
  } catch (error) {
    return handleApiError(res, error, "Error al consultar el estado.");
  }
});

// Crear estado
router.post("/", async (req, res) => {
  try {
    const estado = await estadosController.create(req.body);

    return res.status(201).json(estado);
  } catch (error) {
    return handleApiError(res, error, "Error al crear el estado.");
  }
});

// Actualizar estado
router.put("/:id", async (req, res) => {
  try {
    const estado = await estadosController.update(req.params.id, req.body);

    return res.status(200).json(estado);
  } catch (error) {
    return handleApiError(res, error, "Error al actualizar el estado.");
  }
});

// Eliminar estado
router.delete("/:id", async (req, res) => {
  try {
    await estadosController.remove(req.params.id);

    return res.status(200).json({
      message: "Estado eliminado correctamente.",
    });
  } catch (error) {
    return handleApiError(res, error, "Error al eliminar el estado.");
  }
});

module.exports = router;
