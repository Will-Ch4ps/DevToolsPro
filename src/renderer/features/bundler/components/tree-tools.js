// dev-tools-hub-pro/src/renderer/features/bundler/components/tree-tools.js

import { DepsMenu } from './deps-menu.js';
import { AnalysisMenu } from './analysis-menu.js';

/**
 * Barra de ferramentas da árvore.
 * Uma métrica única (linhas OU tamanho) guia tudo: exibição, ordenação e seleção.
 * Ordem: Ordenar → Exibir → Selecionar → Ligações → Análise → (Só selecionados).
 */
export const TreeTools = {
  container: null,
  callbacks: {},
  metric: 'lines',      // 'lines' | 'size'
  sortField: 'name',    // 'name' | 'metric'
  sortDir: 'asc',
  selectedOnly: false,

  render(containerEl, callbacks) {
    this.container = containerEl;
    this.callbacks = callbacks || {};
    this.metric = 'lines';
    this.sortField = 'name';
    this.sortDir = 'asc';
    this.selectedOnly = false;

    containerEl.innerHTML = `
      <div class="tt-group">
        <span class="tt-label">Ordenar</span>
        <div class="tt-seg" id="tt-sort-seg">
          <button class="tt-seg-btn active" data-sort="name">Nome</button>
          <button class="tt-seg-btn" data-sort="metric" id="tt-sort-metric">Linhas</button>
        </div>
        <button id="tt-dir" class="tt-btn" title="Inverter ordem (crescente/decrescente)">
          <span class="material-icons-round">arrow_upward</span>
        </button>
      </div>

      <div class="tt-group">
        <span class="tt-label">Exibir</span>
        <div class="tt-seg" id="tt-metric-seg">
          <button class="tt-seg-btn active" data-metric="lines">Linhas</button>
          <button class="tt-seg-btn" data-metric="size">Tamanho</button>
        </div>
      </div>

      <div class="tt-group tt-metric">
        <span class="tt-label" id="tt-sel-label">Selecionar linhas</span>
        <input id="tt-min" class="tt-input" type="number" min="0" placeholder="mín">
        <span class="tt-sep">–</span>
        <input id="tt-max" class="tt-input" type="number" min="0" placeholder="máx">
        <span class="tt-unit" id="tt-unit">ln</span>
        <button id="tt-apply" class="tt-btn tt-btn-primary">Selecionar</button>
      </div>

      <div id="tt-deps-slot"></div>
      <div id="tt-analysis-slot"></div>

      <div class="tt-spacer"></div>

      <button id="tt-selected" class="tt-btn tt-selected" disabled title="Mostrar só os arquivos selecionados">
        <span class="material-icons-round">visibility</span>
        <span id="tt-selected-lbl">Só selecionados (0)</span>
      </button>
    `;

    DepsMenu.render(containerEl.querySelector('#tt-deps-slot'), {
      onPreview: (opts) => this.callbacks.onDepsPreview?.(opts),
      onApply: (opts) => this.callbacks.onDepsApply?.(opts)
    });

    AnalysisMenu.render(containerEl.querySelector('#tt-analysis-slot'), {
      onAnalyze: () => this.callbacks.onAnalyze?.(),
      onSelect: (paths) => this.callbacks.onSelectPaths?.(paths)
    });

    this._bind();
  },

  _bind() {
    const el = this.container;

    // Ordenar: campo (Nome | Métrica)
    el.querySelectorAll('#tt-sort-seg .tt-seg-btn').forEach(btn => {
      btn.onclick = () => {
        el.querySelectorAll('#tt-sort-seg .tt-seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.sortField = btn.dataset.sort;
        this._emitSort();
      };
    });

    // Ordenar: direção
    el.querySelector('#tt-dir').onclick = () => {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      const icon = el.querySelector('#tt-dir .material-icons-round');
      if (icon) icon.textContent = this.sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
      this._emitSort();
    };

    // Exibir: métrica (pivô)
    el.querySelectorAll('#tt-metric-seg .tt-seg-btn').forEach(btn => {
      btn.onclick = () => {
        el.querySelectorAll('#tt-metric-seg .tt-seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._setMetric(btn.dataset.metric);
      };
    });

    // Selecionar por faixa
    el.querySelector('#tt-apply').onclick = () => this._emitSelect();
    [el.querySelector('#tt-min'), el.querySelector('#tt-max')].forEach(input => {
      input.onkeydown = (e) => { if (e.key === 'Enter') this._emitSelect(); };
    });

    // Só selecionados
    el.querySelector('#tt-selected').onclick = () => {
      this.selectedOnly = !this.selectedOnly;
      el.querySelector('#tt-selected').classList.toggle('active', this.selectedOnly);
      this.callbacks.onShowSelectedOnly?.(this.selectedOnly);
    };
  },

  _setMetric(metric) {
    this.metric = metric === 'size' ? 'size' : 'lines';
    const isLines = this.metric === 'lines';
    const label = isLines ? 'Linhas' : 'Tamanho';

    this.container.querySelector('#tt-sort-metric').textContent = label;
    this.container.querySelector('#tt-sel-label').textContent = isLines ? 'Selecionar linhas' : 'Selecionar tamanho';
    this.container.querySelector('#tt-unit').textContent = isLines ? 'ln' : 'KB';
    this.container.querySelector('#tt-min').value = '';
    this.container.querySelector('#tt-max').value = '';

    this.callbacks.onDisplayMetric?.(this.metric);
    if (this.sortField === 'metric') this._emitSort(); // re-ordena pela nova métrica
  },

  _emitSort() {
    const mode = this.sortField === 'name' ? 'name' : this.metric;
    this.callbacks.onSort?.(mode, this.sortDir);
  },

  _emitSelect() {
    const el = this.container;
    const rawMin = el.querySelector('#tt-min').value;
    const rawMax = el.querySelector('#tt-max').value;
    const toValue = (v) => {
      if (v === '' || v == null) return v;
      return this.metric === 'size' ? Number(v) * 1024 : Number(v); // KB -> bytes
    };
    this.callbacks.onSelectByMetric?.({ metric: this.metric, min: toValue(rawMin), max: toValue(rawMax) });
  },

  /**
   * Atualiza o contador do botão "Só selecionados" e seu estado.
   */
  setSelectedCount(n) {
    const btn = this.container?.querySelector('#tt-selected');
    const lbl = this.container?.querySelector('#tt-selected-lbl');
    if (!btn || !lbl) return;
    lbl.textContent = `Só selecionados (${n})`;
    btn.disabled = n === 0;
    if (n === 0 && this.selectedOnly) {
      this.selectedOnly = false;
      btn.classList.remove('active');
      this.callbacks.onShowSelectedOnly?.(false);
    }
  }
};
