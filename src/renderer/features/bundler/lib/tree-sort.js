// dev-tools-hub-pro/src/renderer/features/bundler/lib/tree-sort.js

/**
 * Ordena a árvore in-place por 'name' | 'lines' | 'size', em ordem 'asc' | 'desc'.
 * Pastas sempre vêm antes de arquivos (a direção só reordena dentro de cada grupo).
 */
export function sortTree(node, mode = 'name', dir = 'asc') {
  if (!node || !Array.isArray(node.children)) return;

  const factor = dir === 'desc' ? -1 : 1;

  const cmp = (a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1; // pastas primeiro
    const byName = a.name.localeCompare(b.name);
    if (mode === 'lines') return factor * (((a.lines || 0) - (b.lines || 0)) || byName);
    if (mode === 'size') return factor * (((a.size || 0) - (b.size || 0)) || byName);
    return factor * byName;
  };

  node.children.sort(cmp);
  node.children.forEach(child => sortTree(child, mode, dir));
}
