const express = require("express");
const router = express.Router();

const ipsController = require(
  "../controllers/ips.controller"
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

const PRIVILEGIO_GESTIONAR_IP =
  "Gestionar Direcciones IP";

const handleApiError = (
  res,
  error,
  customMessage
) => {
  console.error(
    "[Error API IPs]:",
    {
      message:
        error.message,

      code:
        error.code,

      meta:
        error.meta,
    }
  );

  if (
    [
      "P1001",
      "P1002",
      "P1003",
    ].includes(
      error.code
    )
  ) {
    return res
      .status(503)
      .json({
        error:
          "No se pudo conectar con la base de datos. Verifique que MySQL esté encendido.",
      });
  }

  if (
    error.message ===
    "INVALID_ID"
  ) {
    return res
      .status(400)
      .json({
        error:
          "El identificador proporcionado no es válido.",
      });
  }

  if (
    error.message ===
    "INVALID_DATA"
  ) {
    return res
      .status(400)
      .json({
        error:
          "Debe enviar un área válida y revisar los datos de la dirección IP.",
      });
  }

  if (
    error.message ===
    "INVALID_IP"
  ) {
    return res
      .status(400)
      .json({
        error:
          "La dirección IP no tiene un formato IPv4 válido.",
      });
  }

  if (
    error.message ===
    "DUPLICATE_IP"
  ) {
    return res
      .status(409)
      .json({
        error:
          "La dirección IP ya está registrada en otra asignación.",
      });
  }

  if (
    error.message ===
    "AREA_NOT_FOUND"
  ) {
    return res
      .status(404)
      .json({
        error:
          "El área seleccionada no existe.",
      });
  }

  if (
    error.message ===
      "NOT_FOUND" ||
    error.code ===
      "P2025"
  ) {
    return res
      .status(404)
      .json({
        error:
          "El registro de dirección IP no existe.",
      });
  }

  if (
    error.code ===
    "P2002"
  ) {
    return res
      .status(409)
      .json({
        error:
          "Ya existe un registro con esos datos de dirección IP.",
      });
  }

  if (
    error.code ===
    "P2003"
  ) {
    return res
      .status(400)
      .json({
        error:
          "El área indicada no existe.",
      });
  }

  return res
    .status(500)
    .json({
      error:
        customMessage ||
        error.message ||
        "Ocurrió un error inesperado al procesar la dirección IP.",
    });
};

router.get(
  "/",
  autenticar,
  requierePrivilegio(
    PRIVILEGIO_GESTIONAR_IP
  ),
  async (
    req,
    res
  ) => {
    try {
      const registros =
        await ipsController.getAll({
          id_area:
            req.query.id_area,
        });

      return res
        .status(200)
        .json(
          registros
        );
    } catch (error) {
      return handleApiError(
        res,
        error,
        "Error al consultar las direcciones IP."
      );
    }
  }
);

router.get(
  "/:id",
  autenticar,
  requierePrivilegio(
    PRIVILEGIO_GESTIONAR_IP
  ),
  async (
    req,
    res
  ) => {
    try {
      const registro =
        await ipsController.getById(
          req.params.id
        );

      return res
        .status(200)
        .json(
          registro
        );
    } catch (error) {
      return handleApiError(
        res,
        error,
        "Error al consultar la dirección IP."
      );
    }
  }
);

router.post(
  "/",
  autenticar,
  requierePrivilegio(
    PRIVILEGIO_GESTIONAR_IP
  ),
  async (
    req,
    res
  ) => {
    try {
      const registro =
        await ipsController.create(
          req.body
        );

      return res
        .status(201)
        .json(
          registro
        );
    } catch (error) {
      return handleApiError(
        res,
        error,
        "Error al crear la dirección IP."
      );
    }
  }
);

router.put(
  "/:id",
  autenticar,
  requierePrivilegio(
    PRIVILEGIO_GESTIONAR_IP
  ),
  async (
    req,
    res
  ) => {
    try {
      const registro =
        await ipsController.update(
          req.params.id,
          req.body
        );

      return res
        .status(200)
        .json(
          registro
        );
    } catch (error) {
      return handleApiError(
        res,
        error,
        "Error al actualizar la dirección IP."
      );
    }
  }
);

router.delete(
  "/:id",
  autenticar,
  requierePrivilegio(
    PRIVILEGIO_GESTIONAR_IP
  ),
  async (
    req,
    res
  ) => {
    try {
      await ipsController.remove(
        req.params.id
      );

      return res
        .status(200)
        .json({
          message:
            "Dirección IP eliminada correctamente.",
        });
    } catch (error) {
      return handleApiError(
        res,
        error,
        "Error al eliminar la dirección IP."
      );
    }
  }
);

module.exports = router;