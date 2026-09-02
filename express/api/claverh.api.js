const express = require("express");
const router = express.Router();
const claverhController = require("../controllers/claverh.controller");

const handleApiError = (res, error, customMessage) => {
  console.error("[Error API Clave RH]:", error);

  if (["P1001", "P1002", "P1003"].includes(error.code)) {
    return res.status(503).json({
      error:
        "No se pudo conectar con la base de datos. Verifique que MySQL esté encendido.",
    });
  }

  if (error.message === "INVALID_ID") {
    return res.status(400).json({
      error: "El identificador de la clave no es válido.",
    });
  }

  if (error.message === "INVALID_DATA") {
    return res.status(400).json({
      error: "La clave RH es obligatoria.",
    });
  }

  if (error.message === "DUPLICATE" || error.code === "P2002") {
    return res.status(409).json({
      error: "Ya existe un registro con esa clave RH.",
    });
  }

  if (error.message === "NOT_FOUND" || error.code === "P2025") {
    return res.status(404).json({
      error: "La clave RH solicitada no existe.",
    });
  }

  return res.status(500).json({
    error:
      customMessage || "Ocurrió un error inesperado al procesar la clave RH.",
  });
};

// Obtener todas las claves
router.get("/", async (req, res) => {
  try {
    const claves = await claverhController.getAll();

    return res.status(200).json(claves);
  } catch (error) {
    return handleApiError(res, error, "Error al consultar las claves RH.");
  }
});

// Obtener una clave por ID
router.get("/:id", async (req, res) => {
  try {
    const clave = await claverhController.getById(req.params.id);

    return res.status(200).json(clave);
  } catch (error) {
    return handleApiError(res, error, "Error al consultar la clave RH.");
  }
});

// Crear una clave
router.post("/", async (req, res) => {
  try {
    const clave = await claverhController.create(req.body);

    return res.status(201).json(clave);
  } catch (error) {
    return handleApiError(res, error, "Error al crear la clave RH.");
  }
});

// Actualizar una clave
router.put("/:id", async (req, res) => {
  try {
    const clave = await claverhController.update(req.params.id, req.body);

    return res.status(200).json(clave);
  } catch (error) {
    return handleApiError(res, error, "Error al actualizar la clave RH.");
  }
});

// Eliminar una clave
router.delete("/:id", async (req, res) => {
  try {
    await claverhController.remove(req.params.id);

    return res.status(200).json({
      message: "Clave RH eliminada correctamente.",
    });
  } catch (error) {
    return handleApiError(res, error, "Error al eliminar la clave RH.");
  }
});

module.exports = router;
