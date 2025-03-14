const Toastify = require("toastify-js");
const os = require("os");
const path = require("path");
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("os", {
  homedir: () => os.homedir(),
});

contextBridge.exposeInMainWorld("path", {
  join: (...args) => path.join(...args),
});

contextBridge.exposeInMainWorld("versions", {
  chrome: () => process.versions.chrome,
  node: () => process.versions.node,
  electron: () => process.versions.electron,
});

contextBridge.exposeInMainWorld("Toastify", {
  toast: (options) => Toastify(options).showToast(),
});

contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel, data) => {
    console.log(
      "ipcRenderer.send called with channel:",
      channel,
      "data:",
      data
    );
    ipcRenderer.send(channel, data);
  },
  on: (channel, func) => {
    // Ensure the event and all arguments are passed to the listener
    ipcRenderer.on(channel, (event, ...args) => {
      console.log(`Received event on channel ${channel} with args:`, args);
      func(...args); // Pass all arguments directly, excluding the event object if not needed
    });
  },
});

console.log("Preload script loaded, ipcRenderer available:", !!ipcRenderer);
