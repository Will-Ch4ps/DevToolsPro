// dev-tools-hub-pro/src/renderer/features/bundler/bundler.controller.js

import { BundlerView } from './bundler.view.js';
import { state } from './state.js';
import {
  handleOpenLocal,
  handleOpenWsl,
  handleRefresh,
  handleCheck,
  handleFilter,
  handleSort,
  handleDisplayMetric,
  handleSelectByMetric,
  handleShowSelectedOnly,
  handleExpandDependencies,
  previewDependencies,
  handleSshConnected,
  handleSshFolderSelected,
  handleSshDisconnected,
  handleSshDisconnect
} from './handlers/index.js';
import { generateBundle, hasSelection } from './bundle/index.js';

const { ipcRenderer, clipboard } = require('electron');

export const BundlerController = {
  render(container) {
    BundlerView.render(container, {
      onOpen: handleOpenLocal,
      onOpenWsl: handleOpenWsl,
      onFilter: handleFilter,
      onSort: handleSort,
      onDisplayMetric: handleDisplayMetric,
      onSelectByMetric: handleSelectByMetric,
      onDepsPreview: previewDependencies,
      onDepsApply: handleExpandDependencies,
      onShowSelectedOnly: handleShowSelectedOnly,
      onCheck: handleCheck,
      onGenerate: () => this.handleGenerate(),
      onCopy: () => this.handleCopy(),
      onRefreshPrompts: () => this.loadPrompts(),
      onSshConnected: handleSshConnected,
      onSshDisconnected: handleSshDisconnected,
      onSshFolderSelected: handleSshFolderSelected,
      onSshDisconnect: handleSshDisconnect,
      onRefresh: handleRefresh
    });

    this.loadPrompts();
    this.detectWsl();
  },

  onResume() {
    this.loadPrompts();
    this.detectWsl();
  },

  async loadPrompts() {
    try {
      state.promptsCache = await ipcRenderer.invoke('prompts:list');
      BundlerView.renderPromptList(state.promptsCache);
    } catch (e) {
      console.error('[Bundler] Erro ao carregar prompts:', e);
    }
  },

  async detectWsl() {
    try {
      state.wslDistros = await ipcRenderer.invoke('bundler:wsl-list');
      BundlerView.renderWslOptions(state.wslDistros);
    } catch {
      state.wslDistros = [];
      BundlerView.renderWslOptions([]);
    }
  },

  async handleGenerate() {
    const mode = BundlerView.getBundleMode(); // 'full' | 'paths' | 'folders'

    // permite gerar apenas com diretórios vazios selecionados (local/WSL)
    if (!hasSelection()) {
      return alert('Selecione pelo menos um arquivo (ou uma pasta vazia no modo Local/WSL)!');
    }

    BundlerView.setGenerating(true);

    try {
      const result = await generateBundle(mode);

      if (result.success) {
        clipboard.writeText(result.data);
        BundlerView.openModal('Bundle Gerado com Sucesso!', result.data);
        BundlerView.showCopyFeedback();
      } else {
        alert(`Erro: ${result.error}`);
      }
    } catch (e) {
      console.error('[Bundler] Erro ao gerar:', e);
      alert(`Erro: ${e.message}`);
    } finally {
      BundlerView.setGenerating(false);
    }
  },

  handleCopy() {
    const content = document.getElementById('modal-textarea')?.value;
    if (content) {
      clipboard.writeText(content);
      BundlerView.showCopyFeedback();
    }
  }
};
