const express = require("express");
const router = express.Router();

const rolesController = require(
  "../controllers/roles.controller"
);

const {
  autenticar,
} = require(
  "../middlewares/auth.middleware"
);

const {
  requierePrivilegio,
} = require(
  "../middlewares/permisos.middleware"
);

const PRIVILEGIO_GESTIONAR_ROLES =
  "Gestionar Roles y Privilegios";

const handleApiError = (res, error) => {
  console.error("[Error API Roles]:", {
    message: error.message,
    code: error.code,
    meta: error.meta,
  });

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

  if (error.message === "INVALID_ID") {
    return res.status(400).json({
      error: "El identificador del rol no es válido.",
    });
  }

  if (error.message === "INVALID_DATA") {
    return res.status(400).json({
      error: "El nombre del rol es obligatorio.",
    });
  }

  if (
    error.message === "DUPLICATE" ||
    error.code === "P2002"
  ) {
    return res.status(409).json({
      error: "Ya existe un rol con ese nombre.",
    });
  }

  if (error.message === "ROLE_HAS_USERS") {
    return res.status(409).json({
      error:
        "No se puede eliminar el rol porque tiene usuarios asignados.",
    });
  }

  if (
    error.message === "NOT_FOUND" ||
    error.code === "P2025"
  ) {
    return res.status(404).json({
      error: "El rol solicitado no existe.",
    });
  }

  return res.status(500).json({
    error:
      error.message ||
      "Ocurrió un error inesperado al procesar el rol.",
  });
};

router.get("/", autenticar, async (req, res) => {
  try {
    const roles = await rolesController.getAll();

    return res.status(200).json(roles);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/:id", autenticar, async (req, res) => {
  try {
    const rol = await rolesController.getById(
      req.params.id
    );

    return res.status(200).json(rol);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post(
  "/",
  autenticar,
  requierePrivilegio(
    PRIVILEGIO_GESTIONAR_ROLES
  ),
  async (req, res) => {
  try {
    const rol = await rolesController.create(req.body);

    return res.status(201).json(rol);
  } catch (error) {
    return handleApiError(res, error);
  }
  }
);

router.put(
  "/:id",
  autenticar,
  requierePrivilegio(
    PRIVILEGIO_GESTIONAR_ROLES
  ),
  async (req, res) => {
  try {
    const rol = await rolesController.update(
      req.params.id,
      req.body
    );

    return res.status(200).json(rol);
  } catch (error) {
    return handleApiError(res, error);
  }
  }
);

router.delete(
  "/:id",
  autenticar,
  requierePrivilegio(
    PRIVILEGIO_GESTIONAR_ROLES
  ),
  async (req, res) => {
  try {
    await rolesController.remove(req.params.id);

    return res.status(200).json({
      message: "Rol eliminado correctamente.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
  }
);

module.exports = router;