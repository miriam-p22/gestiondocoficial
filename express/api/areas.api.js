const express = require("express");
const router = express.Router();
const areasController = require("../controllers/areas.controller");
const { autenticar } = require("../middlewares/auth.middleware");
const { autenticarAppMovil } = require("../middlewares/app_movil.middleware");
const { requierePrivilegio } = require("../middlewares/permisos.middleware");
const PRIVILEGIO_GESTIONAR_AREAS = "Gestionar Áreas";

const handleApiError = (res, error, mensajePersonalizado = null) => {
  console.error("[Error API Áreas]:", {
    message: error.message,
    code: error.code,
    meta: error.meta,
  });

  if (["P1001", "P1002", "P1003"].includes(error.code)) {
    return res.status(503).json({
      error:
        "No se pudo conectar con la base de datos. Verifique que MySQL esté iniciado.",
    });
  }

  if (error.message === "INVALID_ID") {
    return res.status(400).json({
      error: "El identificador del área no es válido.",
    });
  }

  if (error.message === "INVALID_DATA") {
    return res.status(400).json({
      error: "El nombre del área es obligatorio.",
    });
  }

  if (error.message === "DUPLICATE" || error.code === "P2002") {
    return res.status(409).json({
      error: "Ya existe un área con ese nombre.",
    });
  }

  if (error.message === "AREA_IN_USE") {
    return res.status(409).json({
      error:
        "No se puede eliminar el área porque está siendo utilizada por usuarios, documentos, organigramas o direcciones IP.",
    });
  }

  if (error.message === "NOT_FOUND" || error.code === "P2025") {
    return res.status(404).json({
      error: "El área solicitada no existe.",
    });
  }

  if (error.code === "P2003") {
    return res.status(409).json({
      error:
        "No se puede realizar la operación porque el área tiene registros relacionados.",
    });
  }

  return res.status(500).json({
    error:
      mensajePersonalizado ||
      error.message ||
      "Ocurrió un error inesperado al procesar el área.",
  });
};

router.get("/app/listado", autenticarAppMovil, async (req, res) => {
  try {
    const areas = await areasController.getAll();

    return res.status(200).json(areas);
  } catch (error) {
    return handleApiError(res, error, "Error al consultar las áreas.");
  }
});

router.get("/", autenticar, async (req, res) => {
  try {
    const areas = await areasController.getAll();

    return res.status(200).json(areas);
  } catch (error) {
    return handleApiError(res, error, "Error al consultar las áreas.");
  }
});

router.get(
  "/:id/uso",
  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_AREAS),
  async (req, res) => {
    try {
      const uso = await areasController.getUso(req.params.id);

      return res.status(200).json(uso);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

router.get("/:id", autenticar, async (req, res) => {
  try {
    const area = await areasController.getById(req.params.id);

    return res.status(200).json(area);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post(
  "/",
  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_AREAS),
  async (req, res) => {
    try {
      const nuevaArea = await areasController.create(req.body);

      return res.status(201).json(nuevaArea);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

router.put(
  "/:id",
  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_AREAS),
  async (req, res) => {
    try {
      const area = await areasController.update(req.params.id, req.body);

      return res.status(200).json(area);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

router.delete(
  "/:id",
  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_AREAS),
  async (req, res) => {
    try {
      const area = await areasController.remove(req.params.id);

      return res.status(200).json({
        message: "Área eliminada correctamente.",
        area,
      });
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

module.exports = router;
