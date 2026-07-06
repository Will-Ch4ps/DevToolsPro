// dev-tools-hub-pro/src/renderer/features/bundler/components/ssh-modal/ssh-modal.js

import { getModalTemplate } from './templates.js';
import { loadConfigData, pickKeyFile } from './ssh-config.js';
import { connectConfigHost, connectManual, disconnect } from './ssh-connection.js';
import { browsePath, selectFolder } from './ssh-browser.js';

/**
 * Componente do Modal SSH
 * Gerencia conexões SSH, hosts do config e navegação de pastas.
 * A lógica é dividida em módulos irmãos (ssh-config/ssh-connection/ssh-browser)
 * que recebem esta instância (`ctx`) para acessar elements/state/callbacks.
 */
export const SshModal = {
  elements: {},
  state: {
    configHosts: [],
    availableKeys: [],
    selectedKeyContent: null,
    currentConnection: null
  },
  callbacks: {
    onConnected: null,
    onDisconnected: null,
    onFolderSelected: null
  },

  init(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
    this._createModal();
    this._cacheElements();
    this._bindEvents();
  },

  _createModal() {
    const modal = document.createElement('div');
    modal.id = 'modal-ssh';
    modal.className = 'modal-overlay';
    modal.innerHTML = getModalTemplate();
    document.body.appendChild(modal);
  },

  _cacheElements() {
    const modal = document.getElementById('modal-ssh');

    this.elements = {
      modal,
      tabs: modal.querySelector('#ssh-tabs'),
      tabConfig: modal.querySelector('#tab-config'),
      tabManual: modal.querySelector('#tab-manual'),
      browser: modal.querySelector('#ssh-browser'),
      hostsList: modal.querySelector('#ssh-hosts-list'),
      keysList: modal.querySelector('#ssh-keys-list'),
      // Form fields
      host: modal.querySelector('#ssh-host'),
      user: modal.querySelector('#ssh-user'),
      port: modal.querySelector('#ssh-port'),
      password: modal.querySelector('#ssh-password'),
      keyPath: modal.querySelector('#ssh-key-path'),
      keyStatus: modal.querySelector('#ssh-key-status'),
      passphrase: modal.querySelector('#ssh-passphrase'),
      btnConnect: modal.querySelector('#btn-connect'),
      // Browser
      connectionLabel: modal.querySelector('#ssh-connection-label'),
      pathInput: modal.querySelector('#ssh-path'),
      folderList: modal.querySelector('#ssh-folder-list'),
      btnSelectFolder: modal.querySelector('#btn-select-folder')
    };
  },

  _bindEvents() {
    const modal = this.elements.modal;

    // Close
    modal.querySelector('[data-action="close"]').onclick = () => this.close();
    modal.onclick = (e) => {
      if (e.target === modal) this.close();
    };

    // Tabs
    modal.querySelectorAll('.ssh-tab').forEach(tab => {
      tab.onclick = () => this.switchTab(tab.dataset.tab);
    });

    // Auth toggle
    modal.querySelectorAll('.auth-btn').forEach(btn => {
      btn.onclick = () => this.switchAuth(btn.dataset.auth);
    });

    // Actions
    modal.querySelector('[data-action="refresh-hosts"]').onclick = () => this.loadConfigData();
    modal.querySelector('[data-action="pick-key"]').onclick = () => pickKeyFile(this);
    modal.querySelector('[data-action="go"]').onclick = () => this.browsePath();
    modal.querySelector('[data-action="disconnect"]').onclick = () => disconnect(this);

    // Connect button
    this.elements.btnConnect.onclick = () => connectManual(this);

    // Select folder
    this.elements.btnSelectFolder.onclick = () => selectFolder(this);

    // Quick paths
    modal.querySelectorAll('.quick-path-btn').forEach(btn => {
      btn.onclick = () => {
        this.elements.pathInput.value = btn.dataset.path;
        this.browsePath();
      };
    });

    // Enter no path input
    this.elements.pathInput.onkeydown = (e) => {
      if (e.key === 'Enter') this.browsePath();
    };
  },

  open() {
    this.elements.modal.classList.add('open');
    this._resetToInitialState();
    this.loadConfigData();
  },

  close() {
    this.elements.modal.classList.remove('open');
  },

  resetToInitialState() {
    this._resetToInitialState();
  },

  _resetToInitialState() {
    this.elements.tabs.style.display = 'flex';
    this.elements.tabConfig.style.display = 'flex';
    this.elements.tabManual.style.display = 'none';
    this.elements.browser.style.display = 'none';

    this.elements.modal.querySelectorAll('.ssh-tab').forEach(t => t.classList.remove('active'));
    this.elements.modal.querySelector('.ssh-tab[data-tab="config"]').classList.add('active');
  },

  loadConfigData() {
    return loadConfigData(this);
  },

  connectConfigHost(hostName) {
    return connectConfigHost(this, hostName);
  },

  browsePath() {
    return browsePath(this);
  },

  switchTab(tabName) {
    this.elements.modal.querySelectorAll('.ssh-tab').forEach(t => t.classList.remove('active'));
    this.elements.modal.querySelector(`.ssh-tab[data-tab="${tabName}"]`).classList.add('active');

    this.elements.tabConfig.style.display = tabName === 'config' ? 'flex' : 'none';
    this.elements.tabManual.style.display = tabName === 'manual' ? 'block' : 'none';
  },

  switchAuth(authType) {
    this.elements.modal.querySelectorAll('.auth-btn').forEach(b => b.classList.remove('active'));
    this.elements.modal.querySelector(`.auth-btn[data-auth="${authType}"]`).classList.add('active');

    this.elements.modal.querySelector('#auth-password-fields').style.display = authType === 'password' ? 'block' : 'none';
    this.elements.modal.querySelector('#auth-key-fields').style.display = authType === 'key' ? 'block' : 'none';
  },

  showBrowser() {
    this.elements.tabs.style.display = 'none';
    this.elements.tabConfig.style.display = 'none';
    this.elements.tabManual.style.display = 'none';
    this.elements.browser.style.display = 'flex';

    this.elements.connectionLabel.textContent = this.state.currentConnection.label;

    if (this.callbacks.onConnected) {
      this.callbacks.onConnected(this.state.currentConnection);
    }
  }
};
