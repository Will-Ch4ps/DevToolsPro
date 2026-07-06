// dev-tools-hub-pro/src/renderer/features/bundler/services/ssh.service.js
const { ipcRenderer } = require('electron');

export const SshService = {
  async getConfigHosts() {
    try { return await ipcRenderer.invoke('ssh:list-config-hosts'); }
    catch { return []; }
  },

  async getAvailableKeys() {
    try { return await ipcRenderer.invoke('ssh:list-keys'); }
    catch { return []; }
  },

  async readKeyContent(keyPath) {
    try { return await ipcRenderer.invoke('ssh:read-key', keyPath); }
    catch (err) { return { success: false, error: err.message }; }
  },

  async pickKeyFile() {
    try { return await ipcRenderer.invoke('ssh:pick-key-file'); }
    catch (err) { return { success: false, error: err.message }; }
  },

  async connect(config) {
    try { return await ipcRenderer.invoke('ssh:connect', config); }
    catch (err) { return { success: false, error: err.message }; }
  },

  async connectConfigHost(hostName) {
    try { return await ipcRenderer.invoke('ssh:connect-config-host', hostName); }
    catch (err) { return { success: false, error: err.message }; }
  },

  async disconnect(connectionId) {
    try { return await ipcRenderer.invoke('ssh:disconnect', connectionId); }
    catch (err) { return { success: false, error: err.message }; }
  },

  async listDirectory(connectionId, remotePath) {
    try { return await ipcRenderer.invoke('ssh:list-dir', { connectionId, remotePath }); }
    catch (err) { return { success: false, error: err.message }; }
  },

  async scanDirectory(connectionId, remotePath) {
    // agora no backend isso usa find/exec e fica bem mais rápido
    try { return await ipcRenderer.invoke('ssh:scan', { connectionId, remotePath }); }
    catch (err) { return { success: false, error: err.message }; }
  },

  async readFiles(connectionId, files, rootPath) {
    // agora no backend isso usa batch/exec e fica bem mais rápido
    try { return await ipcRenderer.invoke('ssh:read-files', { connectionId, files, rootPath }); }
    catch (err) { return { success: false, error: err.message }; }
  },

  async getActiveConnections() {
    try { return await ipcRenderer.invoke('ssh:list-connections'); }
    catch { return []; }
  }
};
