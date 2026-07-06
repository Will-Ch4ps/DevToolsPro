// dev-tools-hub-pro/src/renderer/features/bundler/handlers/ssh.handlers.js

import { state } from '../state.js';
import { BundlerView } from '../bundler.view.js';
import { SshService } from '../services/index.js';
import { handleCheck, updateStats } from './selection.handlers.js';

/**
 * Conexão/desconexão SSH e navegação de pasta remota
 */

export function handleSshConnected(connection) {
  state.sshConnection = connection;
  state.isRemoteMode = true;
}

export async function handleSshFolderSelected({ connection, path }) {
  state.sshConnection = connection;
  state.isRemoteMode = true;
  state.rootPath = path;
  state.selectedPaths.clear();
  state.selectedEmptyDirs.clear(); // SSH não usa
  state.totalSize = 0;

  const displayPath = `SSH: ${connection.label} → ${path}`;
  BundlerView.updatePathDisplay(displayPath, true);
  BundlerView.showTreeLoading(true);

  try {
    const result = await SshService.scanDirectory(connection.id, path);
    if (result.success) {
      state.structure = result.structure;
      BundlerView.renderTree(state.structure, handleCheck);
    } else {
      alert(`Erro: ${result.error}`);
    }
  } catch (e) {
    console.error('[Bundler] Erro SSH scan:', e);
    alert('Erro ao escanear diretório remoto');
  } finally {
    BundlerView.showTreeLoading(false);
  }

  updateStats();
}

export function handleSshDisconnected() {
  state.sshConnection = null;
  state.isRemoteMode = false;
}

export async function handleSshDisconnect() {
  if (state.sshConnection) {
    await SshService.disconnect(state.sshConnection.id);
  }

  state.sshConnection = null;
  state.isRemoteMode = false;
  state.rootPath = null;
  state.structure = null;
  state.selectedPaths.clear();
  state.selectedEmptyDirs.clear();
  state.totalSize = 0;

  BundlerView.resetToDisconnected();
}
