// dev-tools-hub-pro/src/renderer/features/bundler/components/file-tree/tree-node-builder.js

/**
 * Construção dos elementos DOM da árvore (funções puras, recebem o callback de check)
 */

// Métrica exibida em destaque na árvore: 'lines' (padrão) | 'size'
let DISPLAY_METRIC = 'lines';

export function setDisplayMetric(metric) {
  DISPLAY_METRIC = metric === 'size' ? 'size' : 'lines';
}

// Limiares de "peso" por métrica (para a cor suave)
const THRESHOLDS = {
  lines: { mid: 200, high: 500 },
  size: { mid: 20 * 1024, high: 75 * 1024 }
};

export function buildNode(node, level, onCheck, onInspect) {
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
    return buildFolderNode(node, row, checkbox, level, onCheck, onInspect);
  }
  return buildFileNode(node, row, checkbox, onInspect);
}

function buildFolderNode(node, row, checkbox, level, onCheck, onInspect) {
  const val = metricValue(node, DISPLAY_METRIC);
  const folderMeta = (val == null || val === 0)
    ? ''
    : `<span class="folder-meta">${formatMetric(DISPLAY_METRIC, val)}</span>`;

  row.innerHTML = `
        <span class="material-icons-round folder-icon">folder</span>
        <span class="folder-name">${escapeHtml(node.name)}</span>
        ${folderMeta}
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

  // refs para destaque/filtro de seleção
  node._elRow = row;
  node._elWrapper = wrapper;
  node._elChildren = childrenDiv;

  if (Array.isArray(node.children) && node.children.length > 0) {
    node.children.forEach((child) => {
      childrenDiv.appendChild(buildNode(child, level + 1, onCheck, onInspect));
    });
  }

  return wrapper;
}

function buildFileNode(node, row, checkbox, onInspect) {
  row.innerHTML = `
        <span class="material-icons-round file-icon">description</span>
        <span class="file-name">${escapeHtml(node.name)}</span>
        <button class="file-inspect" title="Ver ligações deste arquivo">
          <span class="material-icons-round">hub</span>
        </button>
        <span class="file-meta">${renderMetric(node, DISPLAY_METRIC)}</span>
      `;
  row.prepend(checkbox);
  node._elRow = row;
  if (node._derived) row.classList.add('is-derived'); // preserva marca ao re-renderizar

  const inspectBtn = row.querySelector('.file-inspect');
  inspectBtn.onclick = (e) => {
    e.stopPropagation();
    onInspect?.(node.path, inspectBtn.getBoundingClientRect());
  };

  // Clicar na linha marca o checkbox (menos no botão de inspeção)
  row.onclick = (e) => {
    if (e.target !== checkbox && !inspectBtn.contains(e.target)) checkbox.click();
  };

  return row;
}

function renderMetric(node, metric) {
  const val = metricValue(node, metric);
  const cls = weightClass(metric, val);
  const title = metric === 'lines' ? 'linhas' : 'tamanho';
  return `<span class="file-metric primary ${cls}" title="${formatMetric(metric, val)} (${title})">
            <span class="metric-dot"></span>${formatMetric(metric, val)}
          </span>`;
}

function metricValue(node, metric) {
  return metric === 'size' ? (node.size ?? null) : (node.lines ?? null);
}

function formatMetric(metric, value) {
  if (value == null) return '—';
  return metric === 'size' ? formatBytes(value) : `${formatNumber(value)} ln`;
}

/**
 * Classe de "peso" por métrica (cor suave). Linhas: convenção de 200 saudável.
 */
function weightClass(metric, value) {
  if (value == null) return 'weight-none';
  const t = THRESHOLDS[metric] || THRESHOLDS.lines;
  if (value > t.high) return 'weight-high';
  if (value > t.mid) return 'weight-mid';
  return 'weight-low';
}

function formatBytes(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '0 B';

  const i = Math.floor(Math.log(n) / Math.log(1024));
  const value = n / Math.pow(1024, i);
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];

  return `${parseFloat(value.toFixed(1))} ${units[i] || 'B'}`;
}

function formatNumber(n) {
  return Number(n).toLocaleString('pt-BR');
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
