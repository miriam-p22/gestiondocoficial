const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const url = require("url");

let mainWindow;

async function createWindow() {
  // 2. Importación dinámica de electron-is-dev
  const { default: isDev } = await import("electron-is-dev");

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    maximizable: true, //desactiva el boton de maximizar
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // ...
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // mainWindow.maximize(); //por defaul tla ventana estará maximizada

  const startUrl = isDev
    ? "http://localhost:3000" // Modo Desarrollo: carga el servidor de React
    : url.format({
        pathname: path.join(__dirname, "build/index.html"), // Modo Producción: carga el build estático
        protocol: "file:",
        slashes: true,
      });

  mainWindow.loadURL(startUrl);

  // if (isDev) {
  //   mainWindow.webContents.openDevTools(); //Esto se utiliza solo para relizar pruebas con el depurador
  // }

  // 1. Interceptar solicitudes para abrir nuevas ventanas (target="_blank")
  mainWindow.webContents.on("new-window", (event, url) => {
    event.preventDefault(); // Detiene la creación de la nueva ventana

    if (url.startsWith("http://localhost") || url.startsWith("file://")) {
      mainWindow.loadURL(url);
    } else {
      shell.openExternal(url);
    }
  });

  // 2. Interceptar redirecciones y navegación (para URLs externas)
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("http://localhost") && !url.startsWith("file://")) {
      event.preventDefault(); // Detiene la navegación
      shell.openExternal(url); // Abre la URL en el navegador del sistema
    }
  });

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
