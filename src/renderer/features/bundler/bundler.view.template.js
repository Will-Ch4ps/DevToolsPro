// dev-tools-hub-pro/src/renderer/features/bundler/bundler.view.template.js

/**
 * Template HTML principal da view do Bundler (função pura, sem estado)
 */
export function getBundlerTemplate() {
  return `
      <div class="feature-header">
        <div class="header-title">
          <span class="material-icons-round">folder_zip</span>
          <h2>Bundler AI</h2>
        </div>
        <div class="header-actions">
          <button id="btn-refresh" class="btn" title="Reescanear a pasta atual" disabled>
            <span class="material-icons-round">refresh</span>
            Atualizar
          </button>

          <button id="btn-ssh" class="btn" title="Conectar via SSH">
            <span class="material-icons-round">terminal</span>
            SSH
          </button>

          <div id="wsl-dropdown-container" class="dropdown-container" style="display:none;">
            <button id="btn-wsl" class="btn">
              <span class="material-icons-round">dns</span>
              WSL
              <span class="material-icons-round arrow">arrow_drop_down</span>
            </button>
            <div id="wsl-dropdown" class="dropdown-menu">
              <div class="dropdown-header">Distribuições WSL</div>
              <div id="wsl-list"></div>
            </div>
          </div>

          <button id="btn-open" class="btn btn-primary">
            <span class="material-icons-round">create_new_folder</span>
            Local
          </button>
        </div>
      </div>

      <div id="path-display" class="path-display" style="display:none;">
        <span class="material-icons-round">folder</span>
        <span id="current-path"></span>
        <button id="btn-disconnect" class="btn-icon" style="display:none;" title="Desconectar">
          <span class="material-icons-round" style="color:var(--danger)">link_off</span>
        </button>
      </div>

      <div class="bundler-layout">
        <div id="filter-bar" class="filter-bar"></div>

        <div class="accordion-section">
          <div class="accordion-header" id="toggle-prompts">
            <span class="material-icons-round">psychology</span>
            <span>Contexto & Prompts</span>
            <span class="material-icons-round accordion-arrow">expand_more</span>
          </div>
          <div class="accordion-content" id="prompts-content">
            <div class="prompt-composer">
              <div class="composer-list">
                <div class="composer-header">
                  <span>SELECIONAR PROMPTS</span>
                  <button id="btn-refresh-prompts" class="btn-icon" title="Recarregar">
                    <span class="material-icons-round">refresh</span>
                  </button>
                </div>
                <div id="prompt-list" class="composer-scroll"></div>
              </div>
              <div class="composer-custom">
                <div class="composer-header">INSTRUÇÕES EXTRAS</div>
                <textarea id="prompt-extra" placeholder="Instruções específicas..."></textarea>
              </div>
            </div>
          </div>
        </div>

        <div id="file-tree" class="file-tree-container">
          <div class="empty-state-icon">
            <span class="material-icons-round">inventory_2</span>
            <p>Nenhum projeto aberto</p>
          </div>
          <div class="loading-state" style="display:none;">
            <span class="material-icons-round spin">sync</span>
            <p>Escaneando...</p>
          </div>
        </div>

        <div id="status-panel" class="status-panel"></div>
      </div>

      <!-- Modal de Preview -->
      <div id="modal-preview" class="modal-overlay">
        <div class="modal-window">
          <div class="modal-header">
            <span id="modal-title">Preview</span>
            <button id="btn-close-modal" class="btn-icon">
              <span class="material-icons-round">close</span>
            </button>
          </div>
          <div class="modal-body">
            <textarea id="modal-textarea" readonly></textarea>
          </div>
          <div class="modal-footer">
            <span id="copy-feedback" class="feedback-text">Copiado!</span>
            <button id="btn-copy" class="btn btn-primary">
              <span class="material-icons-round">content_copy</span>
              Copiar
            </button>
          </div>
        </div>
      </div>
    `;
}
