// dev-tools-hub-pro/src/renderer/features/bundler/components/analysis-menu.js

import { pathLabel } from '../lib/path-label.js';

/**
 * Menu "Análise": visão geral das dependências do projeto —
 * órfãos (código morto/entradas), núcleo (mais usados) e ciclos.
 * Cada item é clicável para selecionar os arquivos correspondentes.
 *
 * Callbacks: onAnalyze() -> Promise<{ok, analysis, reason}>
 *            onSelect(paths)
 */
export const AnalysisMenu = {
  container: null,
  callbacks: {},

  render(containerEl, callbacks) {
    this.container = containerEl;
    this.callbacks = callbacks || {};

    containerEl.className = 'tt-group tt-analysis';
    containerEl.innerHTML = `
      <button id="am-toggle" class="tt-btn" title="Visão geral das dependências do projeto">
        <span class="material-icons-round">insights</span>
        Análise
        <span class="material-icons-round dm-caret">arrow_drop_down</span>
      </button>
      <div id="am-pop" class="dm-popover am-popover" hidden>
        <div id="am-body" class="am-body"><div class="am-empty">Analisando...</div></div>
      </div>
    `;

    this._bind();
  },

  _bind() {
    const el = this.container;
    const pop = el.querySelector('#am-pop');
    el.querySelector('#am-toggle').onclick = (e) => {
      e.stopPropagation();
      if (pop.hasAttribute('hidden')) this._open(); else this._close();
    };
    document.addEventListener('click', (e) => { if (!el.contains(e.target)) this._close(); });
  },

  _open() {
    this.container.querySelector('#am-pop').removeAttribute('hidden');
    this._load();
  },

  _close() {
    this.container.querySelector('#am-pop').setAttribute('hidden', '');
  },

  async _load() {
    const body = this.container.querySelector('#am-body');
    body.innerHTML = '<div class="am-empty">Analisando...</div>';

    const r = await this.callbacks.onAnalyze?.();
    if (!r || !r.ok) {
      const msg = r && r.reason === 'remote' ? 'Disponível só em local/WSL'
        : r && r.reason === 'no-project' ? 'Abra um projeto primeiro'
          : 'Sem dados de dependência';
      body.innerHTML = `<div class="am-empty">${msg}</div>`;
      return;
    }
    this._render(r.analysis || {});
  },

  _render(a) {
    const orphans = a.orphans || [];
    const ignored = a.ignoredOrphans || 0;
    const core = a.core || [];
    const cycles = a.cycles || [];

    const items = (arr, mapFn) => arr.length ? arr.map(mapFn).join('') : '<div class="am-empty">—</div>';

    this.container.querySelector('#am-body').innerHTML = `
      <div class="am-section">
        <div class="am-head">
          <span>Possível código morto (${orphans.length})</span>
          ${orphans.length ? '<button class="am-link" data-act="orphans">selecionar</button>' : ''}
        </div>
        <div class="am-note">Não é importado por ninguém${ignored ? ` · ${ignored} de config/entrada/framework ignorados (usados por ferramentas)` : ''}</div>
        <div class="am-list">${orphans.length
          ? orphans.map(p => `<div class="am-item" data-path="${p}"><span class="material-icons-round">description</span>${pathLabel(p)}</div>`).join('')
          : '<div class="am-empty">nada suspeito 👍</div>'}</div>
      </div>
      <div class="am-section">
        <div class="am-head"><span>Núcleo (mais usados)</span></div>
        <div class="am-list">${items(core, c => `<div class="am-item" data-path="${c.path}"><span class="am-count">${c.count}</span>${pathLabel(c.path)}</div>`)}</div>
      </div>
      <div class="am-section">
        <div class="am-head"><span>Ciclos (${cycles.length})</span></div>
        <div class="am-list">${cycles.length ? cycles.map((c, i) => `<div class="am-item" data-cycle="${i}"><span class="material-icons-round">sync_problem</span>${c.map(pathLabel).join(' ↔ ')}</div>`).join('') : '<div class="am-empty">nenhum ciclo 👍</div>'}</div>
      </div>
    `;

    this._wire(orphans, cycles);
  },

  _wire(orphans, cycles) {
    const body = this.container.querySelector('#am-body');
    body.querySelector('[data-act="orphans"]')?.addEventListener('click', () => this.callbacks.onSelect?.(orphans));
    body.querySelectorAll('.am-item[data-path]').forEach(it => {
      it.onclick = () => this.callbacks.onSelect?.([it.dataset.path]);
    });
    body.querySelectorAll('.am-item[data-cycle]').forEach(it => {
      it.onclick = () => this.callbacks.onSelect?.(cycles[Number(it.dataset.cycle)]);
    });
  }
};
