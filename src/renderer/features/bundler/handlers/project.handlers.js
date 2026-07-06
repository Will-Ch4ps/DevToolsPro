// dev-tools-hub-pro/src/renderer/features/bundler/handlers/project.handlers.js

import { state } from '../state.js';
import { BundlerView } from '../bundler.view.js';
import { SshService } from '../services/index.js';
import { collectFilePaths, findNodeByPath, folderHasAnyFile } from '../lib/tree-utils.js';
import { handleCheck, toggleNode, updateStats } from './selection.handlers.js';

const { ipcRenderer } = require('electron');

/**
 * Abertura, carregamento e atualização (refresh) do projeto/pasta
 */

export async function handleOpenLocal() {
  const p = await ipcRenderer.invoke('bundler:open');
  if (p) {
    state.isRemoteMode = false;
    state.sshConnection = null;
    await loadProject(p);
  }
}

export async function handleOpenWsl(distroName) {
  const result = await ipcRenderer.invoke('bundler:open-wsl', distroName);
  if (result.success) {
    state.isRemoteMode = false;
    state.sshConnection = null;
    await loadProject(result.path);
  } else if (result.error) {
    alert(`Erro WSL: ${result.error}`);
  }
}

export async function loadProject(projectPath) {
  state.rootPath = projectPath;
  state.selectedPaths.clear();
  state.selectedEmptyDirs.clear();
  state.totalSize = 0;

  BundlerView.showTreeLoading(true);
  BundlerView.updatePathDisplay(projectPath, state.isRemoteMode);

  try {
    state.structure = await ipcRenderer.invoke('bundler:scan', projectPath);
    BundlerView.renderTree(state.structure, handleCheck);
  } catch (e) {
    console.error('[Bundler] Erro ao escanear:', e);
    alert('Erro ao escanear diretório');
  } finally {
    BundlerView.showTreeLoading(false);
  }

  updateStats();
}

export async function handleRefresh() {
  if (!state.rootPath) return;

  const prevSelectedFiles = new Set(state.selectedPaths);
  const prevSelectedEmptyDirs = new Set(state.selectedEmptyDirs);

  BundlerView.showTreeLoading(true);

  try {
    if (state.isRemoteMode && state.sshConnection) {
      const displayPath = `SSH: ${state.sshConnection.label} → ${state.rootPath}`;
      BundlerView.updatePathDisplay(displayPath, true);

      const result = await SshService.scanDirectory(state.sshConnection.id, state.rootPath);
      if (!result.success) {
        alert(`Erro: ${result.error}`);
        return;
      }

      state.structure = result.structure;
    } else {
      BundlerView.updatePathDisplay(state.rootPath, false);
      state.structure = await ipcRenderer.invoke('bundler:scan', state.rootPath);
    }

    BundlerView.renderTree(state.structure, handleCheck);

    // Reaplica seleção
    state.selectedPaths.clear();
    state.selectedEmptyDirs.clear();
    state.totalSize = 0;

    const existingPaths = new Set();
    collectFilePaths(state.structure, existingPaths);

    for (const p of prevSelectedFiles) {
      if (existingPaths.has(p)) {
        const node = findNodeByPath(state.structure, p);
        if (node) toggleNode(node, true);
      }
    }

    // Apenas local/WSL: reaplica diretórios vazios selecionados
    if (!state.isRemoteMode) {
      for (const d of prevSelectedEmptyDirs) {
        const node = findNodeByPath(state.structure, d);
        if (node && node.type === 'folder' && !folderHasAnyFile(node)) {
          toggleNode(node, true);
        }
      }
    }
  } catch (e) {
    console.error('[Bundler] Erro ao atualizar:', e);
    alert('Erro ao atualizar a pasta');
  } finally {
    BundlerView.showTreeLoading(false);
    updateStats();
  }
}
