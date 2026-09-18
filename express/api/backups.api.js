const express = require("express");
const router = express.Router();

const backupsController = require("../controllers/backups.controller");
const { autenticar } = require("../middlewares/auth.middleware");
const { requierePrivilegio } = require("../middlewares/permisos.middleware");
const prisma = require("../db/client");

const PRIVILEGIO_GENERAR_RESPALDOS = "Generar Respaldos";

const tienePrivilegio = async (usuario, tituloPrivilegio) => {
  if (!usuario || !usuario.id_rol) {
    return false;
  }

  const permiso = await prisma.rolPermiso.findFirst({
    where: {
      id_rol: Number(usuario.id_rol),
      privilegio: {
        titulo_privilegio: tituloPrivilegio,
      },
    },
    select: {
      id_rol: true,
    },
  });

  return Boolean(permiso);
};

//Validación para generar respaldos
const validarAccesoArea = async (req, res, next) => {
  try {
    const idAreaSolicitada = Number(req.params.idArea);

    if (!Number.isInteger(idAreaSolicitada) || idAreaSolicitada <= 0) {
      return res.status(400).json({
        error: "El identificador del área no es válido.",
      });
    }

    const puedeGenerarRespaldos = await tienePrivilegio(
      req.usuario,
      PRIVILEGIO_GENERAR_RESPALDOS,
    );

    if (puedeGenerarRespaldos) {
      return next();
    }

    const idAreaUsuario = Number(req.usuario?.id_area);

    if (!Number.isInteger(idAreaUsuario) || idAreaUsuario <= 0) {
      return res.status(403).json({
        error:
          "Su usuario no tiene un área válida asignada para generar respaldos.",
      });
    }

    if (idAreaSolicitada !== idAreaUsuario) {
      return res.status(403).json({
        error:
          "Solo puede generar respaldos correspondientes a su propia área.",
      });
    }

    return next();
  } catch (error) {
    console.error("[BACKUPS ACCESO]", error);

    return res.status(500).json({
      error: "No fue posible validar el acceso al respaldo solicitado.",
    });
  }
};

// ERRORES
const handleApiError = (res, error) => {
  console.error("[Error API Backups]:", {
    message: error.message,
    code: error.code,
  });

  if (res.headersSent) {
    return;
  }

  if (error.message === "INVALID_ID") {
    return res.status(400).json({
      error: "El identificador no es válido.",
    });
  }

  if (error.message === "INVALID_DATE") {
    return res.status(400).json({
      error: "El rango de fechas no es válido.",
    });
  }

  if (error.message === "AREA_NOT_FOUND") {
    return res.status(404).json({
      error: "El área indicada no existe.",
    });
  }

  if (error.message === "NO_DOCUMENTS") {
    return res.status(404).json({
      error:
        "No existen documentos recibidos dentro del periodo seleccionado para generar este respaldo.",
    });
  }

  return res.status(500).json({
    error: error.message || "No fue posible generar la copia de seguridad.",
  });
};

// RESPALDO GENERAL
router.get(
  "/general",
  autenticar,
  requierePrivilegio(PRIVILEGIO_GENERAR_RESPALDOS),
  async (req, res) => {
    try {
      await backupsController.general(res, req.query);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

// RESPALDO POR ÁREA
router.get("/area/:idArea", autenticar, validarAccesoArea, async (req, res) => {
  try {
    await backupsController.porArea(res, req.params.idArea, req.query);
  } catch (error) {
    return handleApiError(res, error);
  }
});

module.exports = router;
