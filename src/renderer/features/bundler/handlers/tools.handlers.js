// dev-tools-hub-pro/src/renderer/features/bundler/handlers/tools.handlers.js

import { state } from '../state.js';
import { BundlerView } from '../bundler.view.js';
import { sortTree } from '../lib/tree-sort.js';
import { handleCheck, toggleNode, updateStats } from './selection.handlers.js';

/**
 * Ferramentas da árvore: ordenação e seleção por faixa de métrica (linhas/tamanho)
 */

export function handleSort(mode, dir) {
  if (!state.structure) return;
  sortTree(state.structure, mode, dir);
  BundlerView.renderTree(state.structure, handleCheck);
}

export function handleDisplayMetric(metric) {
  BundlerView.setDisplayMetric(metric);
  if (state.structure) BundlerView.renderTree(state.structure, handleCheck);
}

/**
 * Seleciona (substituindo a seleção atual) os arquivos cuja métrica cai na faixa [min, max].
 * min/max vazios viram 0 e Infinito. metric: 'lines' | 'size'.
 */
export function handleSelectByMetric({ metric = 'lines', min, max }) {
  if (!state.structure) return;

  const lo = (min === '' || min == null) ? 0 : Number(min);
  const hi = (max === '' || max == null) ? Infinity : Number(max);
  if (Number.isNaN(lo) || Number.isNaN(hi)) return;

  toggleNode(state.structure, false); // limpa seleção atual (comportamento previsível, igual aos chips)
  selectMatching(state.structure, metric, lo, hi);
  updateStats();
  BundlerView.revealSelected(); // abre as pastas com seleção pra revelar o que foi marcado
}

export function handleShowSelectedOnly(on) {
  BundlerView.showSelectedOnly(on);
}

function selectMatching(node, metric, lo, hi) {
  if (node.type === 'file') {
    const val = metric === 'size' ? (node.size || 0) : node.lines;
    if (metric === 'lines' && val == null) return; // linhas desconhecidas: não seleciona
    const n = val || 0;
    if (n >= lo && n <= hi) toggleNode(node, true);
    return;
  }
  if (Array.isArray(node.children)) {
    node.children.forEach(ch => selectMatching(ch, metric, lo, hi));
  }
}
