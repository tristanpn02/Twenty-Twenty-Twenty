const { contextBridge } = require('electron');
const settings = require('electron-settings');

// Expose the settings API to the renderer process
contextBridge.exposeInMainWorld('electron', {
    settings: settings
});
