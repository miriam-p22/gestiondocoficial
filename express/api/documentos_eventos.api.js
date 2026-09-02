const express = require("express");

const router = express.Router();

const controller = require("../controllers/documentos_eventos.controller");

const { autenticar } = require("../middlewares/auth.middleware");

const { requierePrivilegio } = require("../middlewares/permisos.middleware");

const prisma = require("../db/client");

const PRIVILEGIO_GESTIONAR_DISPERSION = "Gestionar Dispersión";

//SEGURIDAD DE CONSULTA
const tieneGestionDispersion = async (usuario) => {
  if (!usuario || !usuario.id_rol) {
    return false;
  }

  const permiso = await prisma.rolPermiso.findFirst({
    where: {
      id_rol: Number(usuario.id_rol),

      privilegio: {
        titulo_privilegio: PRIVILEGIO_GESTIONAR_DISPERSION,
      },
    },

    select: {
      id_rol: true,
    },
  });

  return Boolean(permiso);
};

const tieneConsultaGlobal = async (usuario) => {
  const nombreRol = String(usuario?.rol?.nombre_rol || "").trim();
  const nombreArea = String(usuario?.area?.nombre_area || "").trim();

  if (nombreRol === "Administrador" || nombreArea === "Presidencia Municipal") {
    return true;
  }

  return tieneGestionDispersion(usuario);
};

const validarAccesoHistorial = async (req, res, next) => {
  try {
    const idDispersion = Number(req.params.idDispersion);

    if (!Number.isInteger(idDispersion) || idDispersion <= 0) {
      return res.status(400).json({
        error: "El identificador no es válido.",
      });
    }

    const global = await tieneConsultaGlobal(req.usuario);

    if (global) {
      return next();
    }

    const idArea = Number(req.usuario?.id_area);

    if (!Number.isInteger(idArea) || idArea <= 0) {
      return res.status(403).json({
        error: "Su usuario no tiene un área válida asignada.",
      });
    }

    const destino = await prisma.dispersionDestino.findUnique({
      where: {
        id_dispersion_id_area: {
          id_dispersion: idDispersion,
          id_area: idArea,
        },
      },

      select: {
        id: true,
      },
    });

    if (!destino) {
      return res.status(403).json({
        error: "No tiene acceso al historial de esta dispersión.",
      });
    }

    return next();
  } catch (error) {
    console.error("[Documentos Eventos - Acceso]", error);

    return res.status(500).json({
      error: "No fue posible validar el acceso al historial documental.",
    });
  }
};

//ERRORES
const handleApiError = (res, error) => {
  console.error("[Error API Documentos Eventos]:", {
    message: error.message,
    code: error.code,
    meta: error.meta,
  });

  //ERRORES 400
  const errores400 = {
    INVALID_ID: "El identificador no es válido.",
    INVALID_EVENT_TYPE: "El tipo de evento no es válido.",
    COMMENT_TOO_LONG: "El comentario no puede superar los 1000 caracteres.",
    AREA_REQUIRED: "Debe seleccionar el área correspondiente.",
    AREA_RESPONSE_REQUIRED: "El área todavía no ha enviado una respuesta para este documento.",
    OFFICE_RESPONSE_REQUIRED:
      "Oficialía debe confirmar primero que recibió una respuesta.",
  };

  if (errores400[error.message]) {
    return res.status(400).json({
      error: errores400[error.message],
    });
  }

  if (error.message === "DISPERSION_NOT_FOUND") {
    return res.status(404).json({
      error: "La dispersión indicada no existe.",
    });
  }

  if (error.message === "DESTINATION_NOT_FOUND") {
    return res.status(404).json({
      error: "El área no está registrada como destino de este documento.",
    });
  }

  if (error.message === "RESPONSE_ALREADY_RECEIVED") {
    return res.status(409).json({
      error: "Oficialía ya confirmó la recepción de esta respuesta.",
    });
  }

  if (error.message === "RESPONSE_ALREADY_DELIVERED") {
    return res.status(409).json({
      error: "Esta respuesta ya fue registrada como entregada al ciudadano.",
    });
  }

  if (error.message === "NOT_FOUND" || error.code === "P2025") {
    return res.status(404).json({
      error: "El evento solicitado no existe.",
    });
  }

  return res.status(500).json({
    error:
      error.message || "Ocurrió un error inesperado al procesar el historial.",
  });
};

//GET RESPUESTAS PARA OFICIALÍA
router.get(
  "/respuestas",

  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_DISPERSION),

  async (req, res) => {
    try {
      const respuestas = await controller.getResumenRespuestas();

      return res.status(200).json(respuestas);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

//GET HISTORIAL POR DISPERSIÓN
router.get(
  "/dispersion/:idDispersion",

  autenticar,
  validarAccesoHistorial,

  async (req, res) => {
    try {
      const eventos = await controller.getByDispersion(req.params.idDispersion);

      return res.status(200).json(eventos);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

//POST EVENT DE OFICIALÍA
router.post(
  "/",

  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_DISPERSION),

  async (req, res) => {
    try {
      const evento = await controller.create(req.body);

      return res.status(201).json(evento);
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

//DELETE EVENTO
router.delete(
  "/:id",

  autenticar,
  requierePrivilegio(PRIVILEGIO_GESTIONAR_DISPERSION),

  async (req, res) => {
    try {
      await controller.remove(req.params.id);

      return res.status(200).json({
        message: "Evento eliminado correctamente.",
      });
    } catch (error) {
      return handleApiError(res, error);
    }
  },
);

module.exports = router;