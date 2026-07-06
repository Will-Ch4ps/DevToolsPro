// dev-tools-hub-pro/src/renderer/features/bundler/lib/tree-utils.js

/**
 * Utilitários puros de travessia da árvore de arquivos (sem dependência de estado)
 */

export function collectFilePaths(node, set) {
  if (!node) return;
  if (node.type === 'file') set.add(node.path);
  if (Array.isArray(node.children)) node.children.forEach(ch => collectFilePaths(ch, set));
}

export function findNodeByPath(node, targetPath) {
  if (!node) return null;
  if (node.path === targetPath) return node;
  if (!Array.isArray(node.children)) return null;

  for (const ch of node.children) {
    const found = findNodeByPath(ch, targetPath);
    if (found) return found;
  }
  return null;
}

export function folderHasAnyFile(folderNode) {
  if (!folderNode || folderNode.type !== 'folder') return false;
  const stack = Array.isArray(folderNode.children) ? [...folderNode.children] : [];
  while (stack.length) {
    const n = stack.pop();
    if (!n) continue;
    if (n.type === 'file') return true;
    if (Array.isArray(n.children)) stack.push(...n.children);
  }
  return false;
}
