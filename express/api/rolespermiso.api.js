const express = require("express");
const router = express.Router();

const rolespermisoController = require(
  "../controllers/rolespermiso.controller"
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

const handleApiError = (
  res,
  error
) => {
  console.error(
    "[Error API Roles Permiso]:",
    {
      message: error.message,
      code: error.code,
      meta: error.meta,
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

  if (error.message === "INVALID_ID") {
    return res.status(400).json({
      error:
        "Uno de los identificadores no es válido.",
    });
  }

  if (error.message === "INVALID_DATA") {
    return res.status(400).json({
      error:
        "Los datos enviados para los privilegios no son válidos.",
    });
  }

  if (error.message === "ROLE_NOT_FOUND") {
    return res.status(404).json({
      error:
        "El rol indicado no existe.",
    });
  }

  if (
    error.message ===
    "PRIVILEGE_NOT_FOUND"
  ) {
    return res.status(404).json({
      error:
        "Uno de los privilegios seleccionados no existe.",
    });
  }

  if (
    error.message === "NOT_FOUND" ||
    error.code === "P2025"
  ) {
    return res.status(404).json({
      error:
        "La asignación de privilegio solicitada no existe.",
    });
  }

  if (error.code === "P2002") {
    return res.status(409).json({
      error:
        "Ese privilegio ya está asignado al rol.",
    });
  }

  if (error.code === "P2003") {
    return res.status(400).json({
      error:
        "El rol o el privilegio indicado no existe.",
    });
  }

  return res.status(500).json({
    error:
      error.message ||
      "Ocurrió un error inesperado al procesar los privilegios.",
  });
};

router.get(
  "/",
  autenticar,
  requierePrivilegio(
    PRIVILEGIO_GESTIONAR_ROLES
  ),
  async (req, res) => {
    try {
      const permisos =
        await rolespermisoController.getAll();

      return res.status(200).json(permisos);
    } catch (error) {
      return handleApiError(res, error);
    }
  }
);

router.get(
  "/rol/:id_rol",
  autenticar,
  requierePrivilegio(
    PRIVILEGIO_GESTIONAR_ROLES
  ),
  async (req, res) => {
    try {
      const permisos =
        await rolespermisoController.getByRol(
          req.params.id_rol
        );

      return res.status(200).json(permisos);
    } catch (error) {
      return handleApiError(res, error);
    }
  }
);

router.get(
  "/:id_rol/:id_privilegio",
  autenticar,
  requierePrivilegio(
    PRIVILEGIO_GESTIONAR_ROLES
  ),
  async (req, res) => {
    try {
      const permiso =
        await rolespermisoController.getOne(
          req.params.id_rol,
          req.params.id_privilegio
        );

      return res.status(200).json(permiso);
    } catch (error) {
      return handleApiError(res, error);
    }
  }
);

router.post(
  "/",
  autenticar,
  requierePrivilegio(
    PRIVILEGIO_GESTIONAR_ROLES
  ),
  async (req, res) => {
    try {
      const permiso =
        await rolespermisoController.create(
          req.body
        );

      return res.status(201).json(permiso);
    } catch (error) {
      return handleApiError(res, error);
    }
  }
);

router.put(
  "/rol/:id_rol",
  autenticar,
  requierePrivilegio(
    PRIVILEGIO_GESTIONAR_ROLES
  ),
  async (req, res) => {
    try {
      const permisos =
        await rolespermisoController.replaceByRol(
          req.params.id_rol,
          req.body.privilegios
        );

      return res.status(200).json(permisos);
    } catch (error) {
      return handleApiError(res, error);
    }
  }
);

router.delete(
  "/:id_rol/:id_privilegio",
  autenticar,
  requierePrivilegio(
    PRIVILEGIO_GESTIONAR_ROLES
  ),
  async (req, res) => {
    try {
      await rolespermisoController.remove(
        req.params.id_rol,
        req.params.id_privilegio
      );

      return res.status(200).json({
        message:
          "Privilegio eliminado del rol correctamente.",
      });
    } catch (error) {
      return handleApiError(res, error);
    }
  }
);

module.exports = router;