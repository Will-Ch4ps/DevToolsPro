// dev-tools-hub-pro/src/renderer/features/bundler/components/file-tree/tree-node-builder.js

/**
 * Construção dos elementos DOM da árvore (funções puras, recebem o callback de check)
 */

export function buildNode(node, level, onCheck) {
  const row = document.createElement('div');
  row.className = 'tree-row';
  row.style.paddingLeft = `${level * 20 + 10}px`;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'tree-checkbox';
  checkbox.checked = node._checked || false;
  node._elCheckbox = checkbox;

  checkbox.onchange = (e) => {
    if (onCheck) onCheck(node, e.target.checked);
  };

  if (node.type === 'folder') {
    return buildFolderNode(node, row, checkbox, level, onCheck);
  }
  return buildFileNode(node, row, checkbox);
}

function buildFolderNode(node, row, checkbox, level, onCheck) {
  row.innerHTML = `
        <span class="material-icons-round folder-icon">folder</span>
        <span class="folder-name">${escapeHtml(node.name)}</span>
      `;
  row.prepend(checkbox);

  const childrenDiv = document.createElement('div');
  childrenDiv.className = 'tree-children';
  childrenDiv.style.display = 'none';

  // Toggle ao clicar na linha
  row.onclick = (e) => {
    if (e.target === checkbox) return;

    const isOpen = childrenDiv.style.display !== 'none';
    childrenDiv.style.display = isOpen ? 'none' : 'block';

    const icon = row.querySelector('.folder-icon');
    if (icon) {
      icon.textContent = isOpen ? 'folder' : 'folder_open';
      icon.style.color = isOpen ? '#d29922' : '#e3b341';
    }
  };

  const wrapper = document.createElement('div');
  wrapper.className = 'tree-folder-wrapper';
  wrapper.append(row, childrenDiv);

  if (Array.isArray(node.children) && node.children.length > 0) {
    node.children.forEach((child) => {
      childrenDiv.appendChild(buildNode(child, level + 1, onCheck));
    });
  }

  return wrapper;
}

function buildFileNode(node, row, checkbox) {
  row.innerHTML = `
        <span class="material-icons-round file-icon">description</span>
        <span class="file-name">${escapeHtml(node.name)}</span>
        <span class="file-size">${formatBytes(node.size)}</span>
      `;
  row.prepend(checkbox);

  // Clicar na linha marca o checkbox
  row.onclick = (e) => {
    if (e.target !== checkbox) checkbox.click();
  };

  return row;
}

function formatBytes(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '0 B';

  const i = Math.floor(Math.log(n) / Math.log(1024));
  const value = n / Math.pow(1024, i);
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];

  return `${parseFloat(value.toFixed(1))} ${units[i] || 'B'}`;
}

/**
 * Escape simples para evitar injeção de HTML via nome de arquivo/pasta
 */
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
