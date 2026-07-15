const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  db: {
    call: (op, payload) => ipcRenderer.invoke('db:call', { op, payload }),
  },
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    set: (data) => ipcRenderer.invoke('config:set', data),
  },
});
