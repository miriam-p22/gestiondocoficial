// ======================================================
// Servidor principal de la API
// ======================================================

// 1. Dependencias
const express = require("express");
const cors = require("cors");
const path = require("path");

// 2. Importación de las rutas de la API
const pruebasApi = require("./express/api/prueba.api");
const areasApi = require("./express/api/areas.api");
const usuariosApi = require("./express/api/usuarios.api");
const clasificacionesApi = require("./express/api/clasificaciones.api");
const claverhApi = require("./express/api/claverh.api");
const configuracionesApi = require("./express/api/configuraciones.api");
const documentosApi = require("./express/api/documentos.api");
const estadosApi = require("./express/api/estados.api");
const ipsApi = require("./express/api/ips.api");
const nivelesApi = require("./express/api/niveles.api");
const organigramasApi = require("./express/api/organigramas.api");
const privilegiosApi = require("./express/api/privilegios.api");
const rolesApi = require("./express/api/roles.api");
const rolesPermisoApi = require("./express/api/rolespermiso.api");
const dispersionApi = require("./express/api/dispersion.api");
const documentosEventosApi = require("./express/api/documentos_eventos.api");
const backupsApi = require("./express/api/backups.api");
const archivoFisicoApi = require("./express/api/archivo_fisico.api");
const permisosUsuarioApi = require("./express/api/permisos_usuario.api");
const notificacionesApi = require("./express/api/notificaciones.api");

// 3. Servicio de alertas automáticas
const {
  revisarAlertasDocumentos,
} = require("./express/services/alertas_documentos.service");

// 4. Inicialización de Express
const app = express();
const port = process.env.PORT || 3001;

// ======================================================
// CONFIGURACIÓN DE ALERTAS (REVISION CADA 30 MINUTOS)
// ======================================================
const INTERVALO_ALERTAS_MS = 30 * 60 * 1000;

const RETRASO_PRIMERA_REVISION_MS = 10 * 1000;

let intervaloAlertas = null;
let timeoutPrimeraRevision = null;

// ======================================================
// FUNCIÓN PARA OBTENER CORRECTAMENTE EL ROUTER
// ======================================================

/*
  Esta función evita el error:

  Router.use() requires a middleware function but got an Object

  Reconoce las siguientes formas de exportación:

  module.exports = router;

  module.exports = { router };

  exports.router = router;

  export default router;
*/
const obtenerRouter = (api, nombreApi) => {
  if (typeof api === "function") {
    return api;
  }

  if (api && typeof api.router === "function") {
    return api.router;
  }

  if (api && typeof api.default === "function") {
    return api.default;
  }

  throw new TypeError(
    `La API "${nombreApi}" no exporta correctamente un Router de Express.`,
  );
};

// ======================================================
// EJECUTAR ALERTAS SIN DETENER EL SERVIDOR
// ======================================================
const ejecutarRevisionAlertas = async () => {
  try {
    await revisarAlertasDocumentos();
  } catch (error) {
    console.error(
      "[ALERTAS DOCUMENTOS] No fue posible completar la revisión:",
      error,
    );
  }
};

// 5. Middlewares generales
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use((req, res, next) => {
  console.log(
    `[${new Date().toLocaleString()}] ${req.method} ${req.originalUrl}`,
  );

  next();
});

// 6. Ruta inicial para comprobar que el servidor funciona
app.get("/", (req, res) => {
  res.status(200).json({
    ok: true,
    mensaje: "API de Gestión Documental funcionando correctamente",
  });
});

// 7. Rutas de la API
app.use("/api/pruebas", obtenerRouter(pruebasApi, "pruebas"));

app.use("/api/areas", obtenerRouter(areasApi, "areas"));

app.use("/api/usuarios", obtenerRouter(usuariosApi, "usuarios"));

app.use("/api/dispersion", obtenerRouter(dispersionApi, "dispersion"));

app.use(
  "/api/clasificaciones",
  obtenerRouter(clasificacionesApi, "clasificaciones"),
);

app.use("/api/claverh", obtenerRouter(claverhApi, "claverh"));

app.use(
  "/api/configuraciones",
  obtenerRouter(configuracionesApi, "configuraciones"),
);

app.use("/api/documentos", obtenerRouter(documentosApi, "documentos"));

app.use("/api/estados", obtenerRouter(estadosApi, "estados"));

app.use("/api/ips", obtenerRouter(ipsApi, "ips"));

app.use("/api/niveles", obtenerRouter(nivelesApi, "niveles"));

app.use("/api/organigramas", obtenerRouter(organigramasApi, "organigramas"));

app.use("/api/privilegios", obtenerRouter(privilegiosApi, "privilegios"));

app.use("/api/roles", obtenerRouter(rolesApi, "roles"));

app.use("/api/rolespermiso", obtenerRouter(rolesPermisoApi, "rolespermiso"));

app.use(
  "/api/documentos-eventos",
  obtenerRouter(documentosEventosApi, "documentos-eventos"),
);

app.use("/api/backups", obtenerRouter(backupsApi, "backups"));

app.use(
  "/api/archivo-fisico",
  obtenerRouter(archivoFisicoApi, "archivofisico"),
);

app.use(
  "/api/permisos-usuario",
  obtenerRouter(permisosUsuarioApi, "permisos-usuario"),
);

app.use(
  "/api/notificaciones",
  obtenerRouter(notificacionesApi, "notificaciones"),
);

// 8. Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    mensaje: `La ruta ${req.method} ${req.originalUrl} no existe.`,
  });
});

// 9. Control general de errores
app.use((error, req, res, next) => {
  console.error("=================================");

  console.error("ERROR EN LA API");

  console.error("Ruta:", req.method, req.originalUrl);

  console.error("Mensaje:", error.message);

  console.error("Código:", error.code || "N/A");

  console.error(error);

  console.error("=================================");

  res.status(error.status || 500).json({
    ok: false,

    mensaje: error.message || "Ocurrió un error interno en el servidor.",

    codigo: error.code || null,
  });
});

// 10. Iniciar el servidor
const servidor = app.listen(port, () => {
  console.log(`🚀 Express API interna corriendo en http://localhost:${port}`);

  console.log(
    "💡 Prisma se conectará automáticamente al recibir la primera petición.",
  );

  // ================================================
  // PRIMERA REVISIÓN
  // ================================================

  timeoutPrimeraRevision = setTimeout(
    ejecutarRevisionAlertas,
    RETRASO_PRIMERA_REVISION_MS,
  );

  // ================================================
  // REVISIONES PERIÓDICAS
  // ================================================

  intervaloAlertas = setInterval(ejecutarRevisionAlertas, INTERVALO_ALERTAS_MS);

  console.log(
    "🔔 Alertas automáticas de documentos activadas cada 30 minutos.",
  );
});

// 11. Manejo de errores al iniciar el servidor
servidor.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`El puerto ${port} ya está siendo utilizado.`);

    console.error(
      "Cierra el proceso que está utilizando ese puerto y vuelve a iniciar.",
    );

    return;
  }

  console.error("No fue posible iniciar el servidor:", error);
});

// ======================================================
// LIMPIAR TAREAS PROGRAMADAS
// ======================================================

const detenerAlertas = () => {
  if (timeoutPrimeraRevision) {
    clearTimeout(timeoutPrimeraRevision);

    timeoutPrimeraRevision = null;
  }

  if (intervaloAlertas) {
    clearInterval(intervaloAlertas);

    intervaloAlertas = null;
  }
};

process.on("SIGINT", () => {
  console.log("\nCerrando servidor...");

  detenerAlertas();

  servidor.close(() => {
    console.log("Servidor detenido correctamente.");

    process.exit(0);
  });
});

// 12. Exportación para Electron o pruebas
module.exports = app;
