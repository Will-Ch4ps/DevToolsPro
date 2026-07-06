// dev-tools-hub-pro/src/renderer/features/bundler/components/ssh-modal/templates.js

/**
 * Templates HTML do modal SSH (funções puras, sem estado)
 */

export function getModalTemplate() {
  return `
            <div class="modal-window modal-ssh-window">
                <div class="modal-header">
                    <span>🔐 Conexão SSH</span>
                    <button class="btn-icon" data-action="close">
                        <span class="material-icons-round">close</span>
                    </button>
                </div>

                <div class="modal-body ssh-modal-body">
                    <!-- Tabs -->
                    <div class="ssh-tabs" id="ssh-tabs">
                        <button class="ssh-tab active" data-tab="config">
                            <span class="material-icons-round">settings</span>
                            SSH Config
                        </button>
                        <button class="ssh-tab" data-tab="manual">
                            <span class="material-icons-round">edit</span>
                            Manual
                        </button>
                    </div>

                    <!-- Tab: Config Hosts -->
                    <div id="tab-config" class="ssh-tab-content active">
                        ${getConfigTabTemplate()}
                    </div>

                    <!-- Tab: Manual -->
                    <div id="tab-manual" class="ssh-tab-content">
                        ${getManualTabTemplate()}
                    </div>

                    <!-- Browser (após conectar) -->
                    <div id="ssh-browser" class="ssh-browser">
                        ${getBrowserTemplate()}
                    </div>
                </div>
            </div>
        `;
}

export function getConfigTabTemplate() {
  return `
            <div class="ssh-section">
                <div class="section-header">
                    <span class="material-icons-round">dns</span>
                    <span>Hosts do ~/.ssh/config</span>
                    <button class="btn-icon" data-action="refresh-hosts">
                        <span class="material-icons-round">refresh</span>
                    </button>
                </div>
                <div id="ssh-hosts-list" class="ssh-list">
                    <div class="list-placeholder">Carregando...</div>
                </div>
            </div>

            <div class="ssh-section">
                <div class="section-header">
                    <span class="material-icons-round">vpn_key</span>
                    <span>Chaves Disponíveis</span>
                </div>
                <div id="ssh-keys-list" class="ssh-list ssh-list-small">
                    <div class="list-placeholder">Carregando...</div>
                </div>
            </div>
        `;
}

export function getManualTabTemplate() {
  return `
            <div class="ssh-form">
                <div class="form-group">
                    <label>Host / IP</label>
                    <input type="text" id="ssh-host" placeholder="192.168.1.100">
                </div>

                <div class="form-row">
                    <div class="form-group flex-2">
                        <label>Usuário</label>
                        <input type="text" id="ssh-user" placeholder="root">
                    </div>
                    <div class="form-group flex-1">
                        <label>Porta</label>
                        <input type="number" id="ssh-port" value="22">
                    </div>
                </div>

                <div class="form-group">
                    <label>Autenticação</label>
                    <div class="auth-toggle">
                        <button class="auth-btn active" data-auth="password">Senha</button>
                        <button class="auth-btn" data-auth="key">Chave</button>
                    </div>
                </div>

                <div id="auth-password-fields">
                    <div class="form-group">
                        <label>Senha</label>
                        <input type="password" id="ssh-password" placeholder="••••••••">
                    </div>
                </div>

                <div id="auth-key-fields" style="display:none;">
                    <div class="form-group">
                        <label>Chave Privada</label>
                        <div class="input-with-button">
                            <input type="text" id="ssh-key-path" placeholder="Selecione..." readonly>
                            <button class="btn" data-action="pick-key">
                                <span class="material-icons-round">folder_open</span>
                            </button>
                        </div>
                        <div id="ssh-key-status" class="input-status"></div>
                    </div>
                    <div class="form-group">
                        <label>Passphrase (opcional)</label>
                        <input type="password" id="ssh-passphrase" placeholder="Se a chave tiver senha">
                    </div>
                </div>

                <button id="btn-connect" class="btn btn-primary btn-full">
                    <span class="material-icons-round">login</span>
                    Conectar
                </button>
            </div>
        `;
}

export function getBrowserTemplate() {
  return `
            <div class="ssh-connected-bar">
                <span class="material-icons-round" style="color:var(--success)">check_circle</span>
                <span id="ssh-connection-label">Conectado</span>
                <button class="btn-icon" data-action="disconnect" title="Desconectar">
                    <span class="material-icons-round" style="color:var(--danger)">logout</span>
                </button>
            </div>

            <div class="form-group">
                <label>Caminho</label>
                <div class="input-with-button">
                    <input type="text" id="ssh-path" placeholder="/home/user">
                    <button class="btn btn-primary" data-action="go">Ir</button>
                </div>
            </div>

            <div class="ssh-quick-paths">
                <button class="quick-path-btn" data-path="/">/</button>
                <button class="quick-path-btn" data-path="/home">home</button>
                <button class="quick-path-btn" data-path="/var/www">www</button>
                <button class="quick-path-btn" data-path="/opt">opt</button>
            </div>

            <div id="ssh-folder-list" class="ssh-folder-list">
                <div class="list-placeholder">Digite um caminho</div>
            </div>

            <div class="ssh-browser-footer">
                <button id="btn-select-folder" class="btn btn-primary" disabled>
                    <span class="material-icons-round">check</span>
                    Selecionar Esta Pasta
                </button>
            </div>
        `;
}
