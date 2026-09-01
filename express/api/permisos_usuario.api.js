const express = require("express");
const router = express.Router();

const permisosUsuarioController = require(
  "../controllers/permisos_usuario.controller"
);

const {
  autenticar,
} = require(
  "../middlewares/auth.middleware"
);

const handleApiError = (res, error) => {
  console.error("[Error API Permisos Usuario]:", {
    message: error.message,
    code: error.code,
    meta: error.meta,
  });

  if (
    ["P1001", "P1002", "P1003"].includes(error.code)
  ) {
    return res.status(503).json({
      error:
        "No fue posible conectarse con la base de datos.",
    });
  }

  if (error.message === "ACCESS_DENIED") {
    return res.status(401).json({
      error:
        "Debe iniciar sesión para consultar sus permisos.",
    });
  }

  return res.status(500).json({
    error:
      error.message ||
      "No fue posible consultar los permisos del usuario.",
  });
};

router.get(
  "/",
  autenticar,
  async (req, res) => {
    try {
      const resultado =
        await permisosUsuarioController.getActuales(
          req.usuario
        );

      return res.status(200).json(resultado);
    } catch (error) {
      return handleApiError(res, error);
    }
  }
);

module.exports = router;