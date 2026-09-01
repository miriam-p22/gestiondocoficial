const jwt = require("jsonwebtoken");
const prisma = require("../db/client");

const JWT_SECRET = String(process.env.JWT_SECRET || "").trim();

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET_NOT_CONFIGURED: Defina JWT_SECRET en el archivo .env antes de iniciar el servidor."
  );
}

const obtenerToken = (req) => {
  const authorization = String(
    req.headers.authorization || ""
  ).trim();

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return authorization.substring(7).trim();
};

const autenticar = async (req, res, next) => {
  try {
    const token = obtenerToken(req);

    if (!token) {
      return res.status(401).json({
        error:
          "Debe iniciar sesión para realizar esta operación.",
      });
    }

    let payload;

    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({
        error:
          "La sesión no es válida o ha expirado.",
      });
    }

    const idUsuario = Number(payload.id_usuario);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return res.status(401).json({
        error:
          "La sesión no contiene un usuario válido.",
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: {
        id: idUsuario,
      },
      select: {
        id: true,
        id_area: true,
        id_rol: true,
        nombre_usuario: true,
        nombre_completo: true,
        status: true,
        area: {
          select: {
            id: true,
            nombre_area: true,
          },
        },
        rol: {
          select: {
            id: true,
            nombre_rol: true,
          },
        },
      },
    });

    if (!usuario) {
      return res.status(401).json({
        error:
          "El usuario de la sesión ya no existe.",
      });
    }

    if (usuario.status !== true) {
      return res.status(403).json({
        error:
          "El usuario se encuentra inactivo.",
      });
    }

    req.usuario = usuario;
    return next();
  } catch (error) {
    console.error("[AUTH MIDDLEWARE]", error);

    return res.status(500).json({
      error:
        "No fue posible validar la sesión.",
    });
  }
};

module.exports = {
  autenticar,
};