// dev-tools-hub-pro/src/renderer/features/bundler/bundler.view.js

import { FileTree, FilterBar, TreeTools, StatusPanel, SshModal } from './components/index.js';
import { getBundlerTemplate } from './bundler.view.template.js';
import * as PromptsPanel from './bundler.view.prompts.js';
import * as HeaderPanel from './bundler.view.header.js';

/**
 * View principal do Bundler
 * Orquestra os componentes e gerencia o layout
 */
export const BundlerView = {
  elements: {},
  events: {},

  /**
   * Renderiza a view completa
   */
  render(container, events) {
    this.events = events;

    container.innerHTML = getBundlerTemplate();
    this._cacheElements(container);
    this._initComponents();
    this._bindEvents();

    // estado inicial
    this.setRefreshEnabled(false);
  },

  /**
   * Cache de elementos
   */
  _cacheElements(container) {
    this.elements = {
      container,
      btnRefresh: container.querySelector('#btn-refresh'),
      pathDisplay: container.querySelector('#path-display'),
      currentPath: container.querySelector('#current-path'),
      btnDisconnect: container.querySelector('#btn-disconnect'),
      wslContainer: container.querySelector('#wsl-dropdown-container'),
      wslDropdown: container.querySelector('#wsl-dropdown'),
      wslList: container.querySelector('#wsl-list'),
      promptsContent: container.querySelector('#prompts-content'),
      promptList: container.querySelector('#prompt-list'),
      promptExtra: container.querySelector('#prompt-extra'),
      modal: container.querySelector('#modal-preview'),
      modalTitle: container.querySelector('#modal-title'),
      modalText: container.querySelector('#modal-textarea'),
      copyFeedback: container.querySelector('#copy-feedback')
    };
  },

  /**
   * Inicializa componentes filhos
   */
  _initComponents() {
    FileTree.init(
      this.elements.container.querySelector('#file-tree'),
      (node, checked) => this.events.onCheck?.(node, checked)
    );

    FilterBar.render(
      this.elements.container.querySelector('#filter-bar'),
      (filter) => this.events.onFilter?.(filter)
    );

    TreeTools.render(
      this.elements.container.querySelector('#tree-tools'),
      {
        onSort: (mode, dir) => this.events.onSort?.(mode, dir),
        onDisplayMetric: (metric) => this.events.onDisplayMetric?.(metric),
        onSelectByMetric: (opts) => this.events.onSelectByMetric?.(opts),
        onDepsPreview: (opts) => this.events.onDepsPreview?.(opts),
        onDepsApply: (opts) => this.events.onDepsApply?.(opts),
        onShowSelectedOnly: (on) => this.events.onShowSelectedOnly?.(on)
      }
    );

    StatusPanel.render(
      this.elements.container.querySelector('#status-panel'),
      () => this.events.onGenerate?.()
    );

    SshModal.init({
      onConnected: (conn) => this.events.onSshConnected?.(conn),
      onDisconnected: () => this.events.onSshDisconnected?.(),
      onFolderSelected: (data) => this.events.onSshFolderSelected?.(data)
    });
  },

  /**
   * Vincula eventos
   */
  _bindEvents() {
    const container = this.elements.container;

    // Header actions
    container.querySelector('#btn-open').onclick = () => this.events.onOpen?.();
    container.querySelector('#btn-ssh').onclick = () => SshModal.open();
    this.elements.btnRefresh.onclick = () => this.events.onRefresh?.();

    container.querySelector('#btn-refresh-prompts').onclick = () => this.events.onRefreshPrompts?.();
    container.querySelector('#btn-disconnect').onclick = () => this.events.onSshDisconnect?.();

    // WSL Dropdown
    const btnWsl = container.querySelector('#btn-wsl');
    if (btnWsl) {
      btnWsl.onclick = (e) => {
        e.stopPropagation();
        this.elements.wslDropdown.classList.toggle('open');
      };
    }

    // Fecha dropdown ao clicar fora
    document.addEventListener('click', () => {
      this.elements.wslDropdown?.classList.remove('open');
    });

    // Accordion
    container.querySelector('#toggle-prompts').onclick = () => {
      const content = this.elements.promptsContent;
      const arrow = container.querySelector('.accordion-arrow');
      content.classList.toggle('open');
      arrow.textContent = content.classList.contains('open') ? 'expand_less' : 'expand_more';
    };

    // Modal
    container.querySelector('#btn-close-modal').onclick = () => this.closeModal();
    container.querySelector('#btn-copy').onclick = () => this.events.onCopy?.();
    this.elements.modal.onclick = (e) => {
      if (e.target === this.elements.modal) this.closeModal();
    };
  },

  // === Métodos Públicos ===

  setRefreshEnabled(enabled) {
    HeaderPanel.setRefreshEnabled(this, enabled);
  },

  renderTree(data, onCheck) {
    FileTree.onCheckCallback = onCheck;
    FileTree.render(data);
  },

  showTreeLoading(show) {
    FileTree.showLoading(show);
  },

  setDisplayMetric(metric) {
    FileTree.setDisplayMetric(metric);
  },

  updateStats(count, size) {
    StatusPanel.updateStats(count, size);
    TreeTools.setSelectedCount(count);
  },

  revealSelected() {
    FileTree.revealSelected();
  },

  showSelectedOnly(on) {
    FileTree.applySelectedOnly(on);
  },

  setGenerating(loading) {
    StatusPanel.setLoading(loading);
  },

  getBundleMode() {
    return StatusPanel.getBundleMode();
  },

  updatePathDisplay(path, isRemote = false) {
    HeaderPanel.updatePathDisplay(this, path, isRemote);
  },

  hidePathDisplay() {
    HeaderPanel.hidePathDisplay(this);
  },

  renderWslOptions(distros) {
    HeaderPanel.renderWslOptions(this, distros);
  },

  renderPromptList(prompts) {
    PromptsPanel.renderPromptList(this, prompts);
  },

  getSelectedPromptIds() {
    return PromptsPanel.getSelectedPromptIds(this);
  },

  getCustomInstruction() {
    return PromptsPanel.getCustomInstruction(this);
  },

  openModal(title, content) {
    PromptsPanel.openModal(this, title, content);
  },

  closeModal() {
    PromptsPanel.closeModal(this);
  },

  showCopyFeedback() {
    PromptsPanel.showCopyFeedback(this);
  },

  resetToDisconnected() {
    this.hidePathDisplay();
    FileTree.showEmpty();
    StatusPanel.updateStats(0, 0);
  }
};
