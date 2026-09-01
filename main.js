const { app, BrowserWindow, shell, dialog, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const url = require("url");

// Silenciar las advertencias de seguridad de Electron en la consola
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

// Mantenemos la variable de entorno aquí, donde se establece primero.
process.env.PRISMA_FORCE_NAPI = "true";

let mainWindow;
let apiServer = null;

// ======================================================
// GUARDAR RESPALDO ZIP
// ======================================================
ipcMain.handle("guardar-respaldo-zip", async (event, datos) => {
  try {
    const nombreArchivo = String(
      datos?.nombreArchivo || "respaldo_documental.zip",
    )
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");

    const contenido = datos?.contenido;

    if (!contenido) {
      return {
        ok: false,
        cancelado: false,
        error: "No se recibió el contenido del respaldo.",
      };
    }

    const ventana = BrowserWindow.fromWebContents(event.sender) || mainWindow;

    const resultado = await dialog.showSaveDialog(ventana, {
      title: "Guardar respaldo documental",
      defaultPath: path.join(app.getPath("documents"), nombreArchivo),
      buttonLabel: "Guardar",

      filters: [
        {
          name: "Archivo ZIP",
          extensions: ["zip"],
        },
      ],

      properties: ["createDirectory", "showOverwriteConfirmation"],
    });

    if (resultado.canceled || !resultado.filePath) {
      return {
        ok: false,
        cancelado: true,
      };
    }

    let rutaFinal = resultado.filePath;

    if (path.extname(rutaFinal).toLowerCase() !== ".zip") {
      rutaFinal += ".zip";
    }

    const buffer = Buffer.from(new Uint8Array(contenido));
    await fs.promises.writeFile(rutaFinal, buffer);

    return {
      ok: true,
      cancelado: false,
      ruta: rutaFinal,
    };
  } catch (error) {
    console.error("[Electron] Error al guardar respaldo:", error);

    return {
      ok: false,
      cancelado: false,
      error: error?.message || "No fue posible guardar el respaldo.",
    };
  }
});

async function createWindow() {
  const { default: isDev } = await import("electron-is-dev");

  // Definir el CSP
  const csp = isDev
    ? "default-src 'self' http://localhost:3000; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval' http://localhost:3000"
    : "default-src 'self'; script-src 'self'";

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    maximizable: true,

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      contentSecurityPolicy: csp,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const startUrl = isDev
    ? "http://localhost:3000"
    : url.format({
        pathname: path.join(__dirname, "build/index.html"),
        protocol: "file:",
        slashes: true,
      });

  mainWindow.loadURL(startUrl);

  /*
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  */

  mainWindow.webContents.on("new-window", (event, targetUrl) => {
    event.preventDefault();

    if (
      targetUrl.startsWith("http://localhost") ||
      targetUrl.startsWith("file://")
    ) {
      mainWindow.loadURL(targetUrl);
    } else {
      shell.openExternal(targetUrl);
    }
  });

  mainWindow.webContents.on("will-navigate", (event, targetUrl) => {
    if (
      !targetUrl.startsWith("http://localhost") &&
      !targetUrl.startsWith("file://")
    ) {
      event.preventDefault();
      shell.openExternal(targetUrl);
    }
  });

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

// ------------------------------------------------------------------
// INICIAR EL SERVIDOR DENTRO DE app.whenReady()
// ------------------------------------------------------------------

app.whenReady().then(() => {
  if (!apiServer) {
    apiServer = require("./server");
  }

  createWindow();

  app.on("activate", () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
});

// ------------------------------------------------------------------
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
