// dev-tools-hub-pro/src/renderer/features/bundler/components/status-panel.js

/**
 * Componente de painel de status (arquivos selecionados, tokens, botão gerar)
 * + seletor de modo de bundle
 */
export const StatusPanel = {
    elements: {},
    onGenerateCallback: null,

    /**
     * Renderiza o painel de status
     */
    render(containerEl, onGenerate) {
        this.onGenerateCallback = onGenerate;

        containerEl.innerHTML = `
            <div class="status-info">
                <span>Selecionado: <b id="lbl-files">0</b> arquivos</span>
                <span>Est. Tokens: <b id="lbl-tokens">0</b></span>
            </div>

            <div style="display:flex; gap:10px; align-items:center; margin: 8px 0 10px;">
                <div style="flex:1; min-width: 0;">
                    <div style="font-size:11px; color: var(--text-muted); font-weight:bold; text-transform: uppercase; margin-bottom:6px;">
                        Modo do Bundle
                    </div>
                    <select id="bundle-mode" class="bundle-mode-select" style="
                        width: 100%;
                        padding: 10px 12px;
                        background: var(--bg-input);
                        border: 1px solid var(--border);
                        border-radius: var(--radius);
                        color: var(--text-main);
                        font-size: 13px;
                        outline: none;
                    ">
                        <option value="full">Caminhos + Código (padrão)</option>
                        <option value="paths">Somente pastas e arquivos (sem código)</option>
                        <option value="folders">Somente pastas</option>
                    </select>
                </div>
            </div>

            <div class="token-bar-container">
                <div id="token-bar" class="token-bar"></div>
            </div>

            <button id="btn-generate" class="btn-generate">
                <span class="material-icons-round">auto_awesome</span>
                GERAR BUNDLE
            </button>
        `;

        this.elements = {
            lblFiles: containerEl.querySelector('#lbl-files'),
            lblTokens: containerEl.querySelector('#lbl-tokens'),
            tokenBar: containerEl.querySelector('#token-bar'),
            btnGenerate: containerEl.querySelector('#btn-generate'),
            bundleMode: containerEl.querySelector('#bundle-mode')
        };

        this.elements.btnGenerate.onclick = () => {
            if (this.onGenerateCallback) this.onGenerateCallback();
        };
    },

    /**
     * Retorna o modo selecionado
     */
    getBundleMode() {
        return this.elements.bundleMode?.value || 'full';
    },

    /**
     * Atualiza estatísticas
     */
    updateStats(fileCount, totalSize) {
        const tokens = Math.ceil(totalSize / 3.5);
        const pct = Math.min((tokens / 128000) * 100, 100);

        this.elements.lblFiles.textContent = fileCount;
        this.elements.lblTokens.textContent = `${(tokens / 1000).toFixed(1)}k`;
        this.elements.tokenBar.style.width = `${pct}%`;

        // Cor baseada no uso
        if (pct > 90) {
            this.elements.tokenBar.style.backgroundColor = 'var(--danger)';
        } else if (pct > 50) {
            this.elements.tokenBar.style.backgroundColor = 'var(--warning)';
        } else {
            this.elements.tokenBar.style.backgroundColor = 'var(--success)';
        }
    },

    /**
     * Define estado de loading do botão
     */
    setLoading(loading) {
        this.elements.btnGenerate.disabled = loading;
        this.elements.btnGenerate.innerHTML = loading
            ? '<span class="material-icons-round spin">sync</span> PROCESSANDO...'
            : '<span class="material-icons-round">auto_awesome</span> GERAR BUNDLE';
    }
};
