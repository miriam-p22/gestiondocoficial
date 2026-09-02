const { contextBridge, ipcRenderer, shell } = require("electron");

window.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("click", (event) => {
    const link = event.target.closest("a");

    if (link) {
      const url = link.href;

      if (link.target === "_blank" || !url.startsWith(window.location.origin)) {
        event.preventDefault();

        shell.openExternal(url);
      }
    }
  });
});

//API SEGURA EXPUESTA A REACT
contextBridge.exposeInMainWorld("electronAPI", {
  send: (channel, data) => {
    const validSendChannels = ["toMain"];

    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  receive: (channel, func) => {
    const validReceiveChannels = ["fromMain"];

    if (validReceiveChannels.includes(channel)) {
      ipcRenderer.once(channel, (event, ...args) => func(...args));
    }
  },

  guardarRespaldoZip: async ({ nombreArchivo, contenido }) => {
    return ipcRenderer.invoke("guardar-respaldo-zip", {
      nombreArchivo,
      contenido,
    });
  },
});
