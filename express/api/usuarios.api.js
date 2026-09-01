const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const usuariosController = require("../controllers/usuarios.controller");
const { autenticar } = require("../middlewares/auth.middleware");
const { requierePrivilegio } = require("../middlewares/permisos.middleware");

const PRIVILEGIO_REGISTRAR_USUARIOS = "Registrar usuarios";

const JWT_SECRET = String(process.env.JWT_SECRET || "").trim();

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET_NOT_CONFIGURED: Defina JWT_SECRET en el archivo .env antes de iniciar el servidor."
  );
}

const handleApiError = (res, error, customMessage = null) => {
  console.error("[Error API Usuarios]:", {
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
      error: "El identificador del usuario no es válido.",
    });
  }

  if (error.message === "INVALID_DATA") {
    return res.status(400).json({
      error:
        "Revise los datos enviados. El nombre, usuario, contraseña, rol y área son obligatorios.",
    });
  }

  if (error.message === "DUPLICATE_USERNAME") {
    return res.status(409).json({
      error: "El nombre de usuario ya está registrado.",
    });
  }

  if (error.message === "DUPLICATE_EMAIL") {
    return res.status(409).json({
      error: "El correo electrónico ya está registrado.",
    });
  }

  if (error.message === "USER_IN_USE") {
    return res.status(409).json({
      error:
        "No se puede eliminar el usuario porque tiene organigramas o configuraciones relacionadas.",
    });
  }

  if (error.message === "NOT_FOUND" || error.code === "P2025") {
    return res.status(404).json({
      error: "El usuario solicitado no existe.",
    });
  }

  if (error.code === "P2002") {
    return res.status(409).json({
      error: "Ya existe un usuario con esos datos.",
    });
  }

  if (error.code === "P2003") {
    return res.status(400).json({
      error: "El rol o el área seleccionada no existe.",
    });
  }

  if (error.message === "LOGIN_DATA_REQUIRED") {
    return res.status(400).json({
      error: "Debe proporcionar usuario y contraseña.",
    });
  }

  if (error.message === "INVALID_CREDENTIALS") {
    return res.status(401).json({
      error: "Usuario o contraseña incorrectos.",
    });
  }

  if (error.message === "USER_INACTIVE") {
    return res.status(403).json({
      error: "El usuario se encuentra inactivo.",
    });
  }

  if (error.message === "RH_KEY_REQUIRED") {
    return res.status(400).json({
      error: "Debe proporcionar la clave especial.",
    });
  }

  if (error.message === "INVALID_RH_KEY") {
    return res.status(401).json({
      error: "La clave especial no es válida.",
    });
  }

  if (error.message === "RH_ALREADY_REGISTERED") {
    return res.status(409).json({
      error:
        "Recursos Humanos ya cuenta con un usuario inicial registrado.",
    });
  }

  if (error.message === "RH_AREA_NOT_FOUND") {
    return res.status(409).json({
      error:
        'No existe el área "Dirección de Recursos Humanos" en la base de datos.',
    });
  }

  if (error.message === "RH_ROLE_NOT_FOUND") {
    return res.status(409).json({
      error: 'No existe el rol "Recursos Humanos" en la base de datos.',
    });
  }

  if (error.message === "INVALID_INITIAL_RH_DATA") {
    return res.status(400).json({
      error:
        "Nombre, usuario y contraseña son obligatorios para el registro inicial.",
    });
  }

  return res.status(500).json({
    error:
      error.message ||
      customMessage ||
      "Ocurrió un error inesperado al procesar el usuario.",
    codigo: error.code || null,
    meta: error.meta || null,
  });
};

router.post("/login", async (req, res) => {
  try {
    const usuario = await usuariosController.login(req.body);

    const mantenerSesion =
      req.body?.mantener_sesion === true;

    /*
      La duración siempre la decide el backend.
      El cliente solamente expresa si desea mantener la sesión.
    */
    const duracionToken =
      mantenerSesion
        ? "7d"
        : "8h";

    const token = jwt.sign(
      { id_usuario: usuario.id },
      JWT_SECRET,
      { expiresIn: duracionToken }
    );

    return res.status(200).json({
      ok: true,
      token,
      usuario,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/validar-clave-rh", async (req, res) => {
  try {
    const resultado =
      await usuariosController.validarClaveRegistroRh(req.body);

    return res.status(200).json(resultado);
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/registro-inicial-rh", async (req, res) => {
  try {
    const usuario =
      await usuariosController.registroInicialRh(req.body);

    return res.status(201).json({
      ok: true,
      mensaje:
        "Usuario inicial de Recursos Humanos registrado correctamente.",
      usuario,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get(
  "/",
  autenticar,
  requierePrivilegio(PRIVILEGIO_REGISTRAR_USUARIOS),
  async (req, res) => {
    try {
      const usuarios = await usuariosController.getAll();
      return res.status(200).json(usuarios);
    } catch (error) {
      return handleApiError(
        res,
        error,
        "Error al consultar los usuarios."
      );
    }
  }
);

router.get(
  "/me",
  autenticar,
  async (req, res) => {
    return res.status(200).json({
      usuario: req.usuario,
    });
  }
);

router.get(
  "/:id",
  autenticar,
  requierePrivilegio(PRIVILEGIO_REGISTRAR_USUARIOS),
  async (req, res) => {
    try {
      const usuario =
        await usuariosController.getById(req.params.id);

      return res.status(200).json(usuario);
    } catch (error) {
      return handleApiError(
        res,
        error,
        "Error al consultar el usuario."
      );
    }
  }
);

router.post(
  "/",
  autenticar,
  requierePrivilegio(PRIVILEGIO_REGISTRAR_USUARIOS),
  async (req, res) => {
    try {
      const usuario =
        await usuariosController.create(req.body);

      return res.status(201).json(usuario);
    } catch (error) {
      return handleApiError(res, error);
    }
  }
);

router.put(
  "/:id",
  autenticar,
  requierePrivilegio(PRIVILEGIO_REGISTRAR_USUARIOS),
  async (req, res) => {
    try {
      const usuario =
        await usuariosController.update(
          req.params.id,
          req.body
        );

      return res.status(200).json(usuario);
    } catch (error) {
      return handleApiError(res, error);
    }
  }
);

router.delete(
  "/:id",
  autenticar,
  requierePrivilegio(PRIVILEGIO_REGISTRAR_USUARIOS),
  async (req, res) => {
    try {
      await usuariosController.remove(req.params.id);

      return res.status(200).json({
        message: "Usuario eliminado correctamente.",
      });
    } catch (error) {
      return handleApiError(res, error);
    }
  }
);

module.exports = router;