const APP_MOVIL_TOKEN = String(process.env.APP_MOVIL_TOKEN || "").trim();

const autenticarAppMovil = (req, res, next) => {
  if (!APP_MOVIL_TOKEN) {
    console.error("[APP MÓVIL] APP_MOVIL_TOKEN no está configurado.");

    return res.status(500).json({
      error: "La aplicación móvil no está configurada en el servidor.",
    });
  }

  const token = String(req.headers["x-app-token"] || "").trim();

  if (!token || token !== APP_MOVIL_TOKEN) {
    return res.status(401).json({
      error: "La aplicación móvil no está autorizada.",
    });
  }

  return next();
};

module.exports = {
  autenticarAppMovil,
};
