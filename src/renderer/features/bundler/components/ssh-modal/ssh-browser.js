// dev-tools-hub-pro/src/renderer/features/bundler/components/ssh-modal/ssh-browser.js

import { SshService } from '../../services/index.js';

/**
 * Navegação de pastas remotas e seleção da pasta atual.
 * Recebe `ctx` (a própria SshModal) para acessar elements/state/callbacks.
 */

export async function browsePath(ctx) {
  const remotePath = ctx.elements.pathInput.value.trim() || '/';

  if (!ctx.state.currentConnection) return;

  ctx.elements.folderList.innerHTML = '<div class="list-placeholder"><span class="material-icons-round spin">sync</span> Carregando...</div>';

  const result = await SshService.listDirectory(
    ctx.state.currentConnection.id,
    remotePath
  );

  if (result.success) {
    ctx.elements.pathInput.value = result.currentPath;
    renderFolderList(ctx, result.items, result.currentPath);
    ctx.elements.btnSelectFolder.disabled = false;
  } else {
    ctx.elements.folderList.innerHTML = `<div class="list-placeholder error">${result.error}</div>`;
  }
}

function renderFolderList(ctx, items, currentPath) {
  const list = ctx.elements.folderList;
  list.innerHTML = '';

  // Botão voltar
  if (currentPath !== '/') {
    const backItem = document.createElement('div');
    backItem.className = 'folder-item';
    backItem.innerHTML = `
                <span class="material-icons-round">arrow_upward</span>
                <span>..</span>
            `;
    backItem.onclick = () => {
      const parent = currentPath.split('/').slice(0, -1).join('/') || '/';
      ctx.elements.pathInput.value = parent;
      browsePath(ctx);
    };
    list.appendChild(backItem);
  }

  // Itens
  items.forEach(item => {
    if (item.name === '..') return;

    const el = document.createElement('div');
    el.className = 'folder-item';
    el.innerHTML = `
                <span class="material-icons-round" style="color:${item.isDirectory ? 'var(--warning)' : 'var(--text-muted)'}">
                    ${item.isDirectory ? 'folder' : 'description'}
                </span>
                <span>${item.name}</span>
            `;

    if (item.isDirectory) {
      el.onclick = () => {
        ctx.elements.pathInput.value = item.path;
        browsePath(ctx);
      };
    }

    list.appendChild(el);
  });
}

export function selectFolder(ctx) {
  const path = ctx.elements.pathInput.value.trim();

  if (path && ctx.callbacks.onFolderSelected) {
    ctx.callbacks.onFolderSelected({
      connection: ctx.state.currentConnection,
      path: path
    });
    ctx.close();
  }
}
