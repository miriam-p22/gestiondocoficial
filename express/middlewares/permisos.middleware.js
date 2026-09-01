const prisma = require("../db/client");

const requierePrivilegio = (tituloPrivilegio) => {
  return async (req, res, next) => {
    try {
      if (!req.usuario || !req.usuario.id_rol) {
        return res.status(401).json({
          error: "Debe iniciar sesión para realizar esta operación.",
        });
      }

      const titulo = String(tituloPrivilegio || "").trim();

      if (!titulo) {
        return res.status(500).json({
          error: "No fue posible validar los permisos de la operación.",
        });
      }

      const permiso = await prisma.rolPermiso.findFirst({
        where: {
          id_rol: Number(req.usuario.id_rol),
          privilegio: {
            titulo_privilegio: titulo,
          },
        },
        select: {
          id_rol: true,
          id_privilegio: true,
        },
      });

      if (!permiso) {
        return res.status(403).json({
          error: `Su rol no cuenta con el privilegio "${titulo}".`,
        });
      }

      return next();
    } catch (error) {
      console.error("[PERMISOS MIDDLEWARE]", error);

      return res.status(500).json({
        error: "No fue posible validar los privilegios del usuario.",
      });
    }
  };
};

const requiereCualquierPrivilegio = (titulos = []) => {
  return async (req, res, next) => {
    try {
      if (!req.usuario || !req.usuario.id_rol) {
        return res.status(401).json({
          error: "Debe iniciar sesión para realizar esta operación.",
        });
      }

      const privilegios = Array.isArray(titulos)
        ? titulos.map((titulo) => String(titulo || "").trim()).filter(Boolean)
        : [];

      if (privilegios.length === 0) {
        return res.status(500).json({
          error: "No fue posible validar los permisos de la operación.",
        });
      }

      const permiso = await prisma.rolPermiso.findFirst({
        where: {
          id_rol: Number(req.usuario.id_rol),
          privilegio: {
            titulo_privilegio: {
              in: privilegios,
            },
          },
        },
        select: {
          id_rol: true,
          id_privilegio: true,
        },
      });

      if (!permiso) {
        return res.status(403).json({
          error:
            "Su rol no cuenta con los privilegios necesarios para realizar esta operación.",
        });
      }

      return next();
    } catch (error) {
      console.error("[PERMISOS MIDDLEWARE]", error);

      return res.status(500).json({
        error: "No fue posible validar los privilegios del usuario.",
      });
    }
  };
};

module.exports = {
  requierePrivilegio,
  requiereCualquierPrivilegio,
};
