const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isDesktop: true,
  platform: process.platform,
  version: "1.0.0",
});
