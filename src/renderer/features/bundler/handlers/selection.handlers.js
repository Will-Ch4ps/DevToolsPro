// dev-tools-hub-pro/src/renderer/features/bundler/handlers/selection.handlers.js

import { state, FILTERS } from '../state.js';
import { folderHasAnyFile } from '../lib/tree-utils.js';
import { BundlerView } from '../bundler.view.js';

/**
 * Seleção de arquivos/pastas na árvore e filtros por categoria
 */

export function handleCheck(node, isChecked) {
  toggleNode(node, isChecked);
  updateStats();
}

export function toggleNode(node, checked) {
  if (!node) return;

  if (node._elCheckbox) node._elCheckbox.checked = checked;
  node._checked = checked;

  // Diretórios vazios entram no bundle apenas em Local/WSL (não remoto)
  if (!state.isRemoteMode && node.type === 'folder') {
    const isEffectivelyEmpty = !folderHasAnyFile(node);
    if (checked && isEffectivelyEmpty) state.selectedEmptyDirs.add(node.path);
    if (!checked) state.selectedEmptyDirs.delete(node.path);
  }

  if (node.type === 'file') {
    if (checked && !state.selectedPaths.has(node.path)) {
      state.selectedPaths.add(node.path);
      state.totalSize += node.size;
    } else if (!checked && state.selectedPaths.has(node.path)) {
      state.selectedPaths.delete(node.path);
      state.totalSize -= node.size;
    }
  }

  if (node.children) {
    node.children.forEach(child => toggleNode(child, checked));
  }
}

export function handleFilter(types) {
  if (!state.structure) return;

  // limpa tudo
  toggleNode(state.structure, false);

  const list = Array.isArray(types) ? types : [types];

  // Nenhum filtro ativo (ex.: clicou "Limpar")
  if (list.length === 0) {
    updateStats();
    return;
  }

  // "Todos" seleciona tudo, sem filtro de extensão
  if (list.includes('all')) {
    applyFilter(state.structure, null);
    updateStats();
    return;
  }

  // Une as extensões de todas as categorias ativas (ex.: front + config)
  const allowedExts = new Set();
  list.forEach(type => {
    (FILTERS[type] || []).forEach(ext => allowedExts.add(ext));
  });

  applyFilter(state.structure, Array.from(allowedExts));
  updateStats();
}

function applyFilter(node, allowedExts) {
  if (node.type === 'file') {
    const shouldSelect = !allowedExts || allowedExts.includes(node.ext);
    if (shouldSelect) toggleNode(node, true);
  }

  if (node.children) {
    node.children.forEach(child => applyFilter(child, allowedExts));
  }
}

export function updateStats() {
  // Diretórios vazios não entram na estimativa de tokens (tamanho 0)
  BundlerView.updateStats(state.selectedPaths.size, state.totalSize);
}
