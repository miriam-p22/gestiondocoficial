const express = require("express");
const router = express.Router();

const nivelesController = require("../controllers/niveles.controller");

// ======================================================
// MANEJO DE ERRORES
// ======================================================

const handleApiError = (res, error) => {
  console.error("[Error API Niveles]:", {
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
      error: "Uno de los identificadores no es válido.",
    });
  }
  if (error.message === "SUPERIOR_OTHER_ORGANIGRAMA") {
    return res.status(400).json({
      error: "El área superior seleccionada pertenece a otro organigrama.",
    });
  }

  if (error.message === "CIRCULAR_RELATION") {
    return res.status(409).json({
      error:
        "La relación no es válida porque generaría un ciclo dentro del organigrama.",
    });
  }

  if (error.message === "INVALID_DATA") {
    return res.status(400).json({
      error:
        "Debe seleccionar un organigrama, un área y capturar manualmente el nivel.",
    });
  }

  if (error.message === "INVALID_LEVEL") {
    return res.status(400).json({
      error: "El nivel debe ser un número entero mayor a cero.",
    });
  }

  if (error.message === "ORGANIGRAMA_NOT_FOUND") {
    return res.status(404).json({
      error: "El organigrama indicado no existe.",
    });
  }

  if (error.message === "AREA_NOT_FOUND") {
    return res.status(404).json({
      error: "El área seleccionada no existe.",
    });
  }

  if (error.message === "SUPERIOR_NOT_FOUND") {
    return res.status(400).json({
      error: "El área superior seleccionada no pertenece a este organigrama.",
    });
  }

  if (error.message === "ROOT_ALREADY_EXISTS") {
    return res.status(409).json({
      error: "Este organigrama ya tiene un área raíz.",
    });
  }

  if (error.message === "ROOT_CANNOT_HAVE_PARENT") {
    return res.status(400).json({
      error: "Un área de nivel 1 no puede tener un área superior.",
    });
  }

  if (error.message === "PARENT_REQUIRED") {
    return res.status(400).json({
      error: "Las áreas de nivel mayor a 1 deben tener un área superior.",
    });
  }

  if (error.message === "SELF_PARENT") {
    return res.status(400).json({
      error: "Un área no puede ser superior de sí misma.",
    });
  }

  if (error.message === "AREA_ALREADY_EXISTS" || error.code === "P2002") {
    return res.status(409).json({
      error: "Esta área ya está agregada en el organigrama.",
    });
  }

  if (error.message === "ORGANIGRAMA_AUTHORIZED") {
    return res.status(409).json({
      error:
        "El organigrama ya fue autorizado y su estructura no puede modificarse.",
    });
  }

  if (error.message === "LEVEL_HAS_CHILDREN") {
    return res.status(409).json({
      error:
        "No se puede eliminar el área porque tiene áreas dependientes. Reasigne o elimine primero sus áreas inferiores.",
    });
  }

  if (error.message === "NOT_FOUND" || error.code === "P2025") {
    return res.status(404).json({
      error: "La relación del organigrama solicitada no existe.",
    });
  }

  if (error.code === "P2003") {
    return res.status(400).json({
      error: "El organigrama o el área seleccionada no existe.",
    });
  }

  return res.status(500).json({
    error:
      error.message ||
      "Ocurrió un error inesperado al procesar la estructura del organigrama.",
  });
};

// ======================================================
// GET
// ======================================================

router.get("/", async (req, res) => {
  try {
    const niveles = await nivelesController.getAll(req.query);

    return res.status(200).json(niveles);
  } catch (error) {
    return handleApiError(res, error);
  }
});

// ======================================================
// GET BY ID
// ======================================================

router.get("/:id", async (req, res) => {
  try {
    const nivel = await nivelesController.getById(req.params.id);

    return res.status(200).json(nivel);
  } catch (error) {
    return handleApiError(res, error);
  }
});

// ======================================================
// POST
// ======================================================

router.post("/", async (req, res) => {
  try {
    const nuevo = await nivelesController.create(req.body);

    return res.status(201).json(nuevo);
  } catch (error) {
    return handleApiError(res, error);
  }
});

// ======================================================
// PUT
// ======================================================

router.put("/:id", async (req, res) => {
  try {
    const actualizado = await nivelesController.update(req.params.id, req.body);

    return res.status(200).json(actualizado);
  } catch (error) {
    return handleApiError(res, error);
  }
});

// ======================================================
// DELETE
// ======================================================

router.delete("/:id", async (req, res) => {
  try {
    await nivelesController.remove(req.params.id);

    return res.status(200).json({
      message: "Área eliminada del organigrama correctamente.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

module.exports = router;
