// dev-tools-hub-pro/src/renderer/features/bundler/bundler.view.header.js

/**
 * Cabeçalho: caminho atual, botão de refresh e dropdown de distros WSL.
 * Recebe `ctx` (a própria BundlerView) para acessar elements/events já cacheados.
 */

export function setRefreshEnabled(ctx, enabled) {
  if (ctx.elements.btnRefresh) ctx.elements.btnRefresh.disabled = !enabled;
}

export function updatePathDisplay(ctx, path, isRemote = false) {
  ctx.elements.pathDisplay.style.display = 'flex';
  ctx.elements.currentPath.textContent = path;
  ctx.elements.currentPath.title = path;
  ctx.elements.btnDisconnect.style.display = isRemote ? 'block' : 'none';

  // Quando há uma pasta “aberta”, habilita refresh
  setRefreshEnabled(ctx, true);
}

export function hidePathDisplay(ctx) {
  ctx.elements.pathDisplay.style.display = 'none';
  setRefreshEnabled(ctx, false);
}

export function renderWslOptions(ctx, distros) {
  if (!distros?.length) {
    ctx.elements.wslContainer.style.display = 'none';
    return;
  }

  ctx.elements.wslContainer.style.display = 'block';
  ctx.elements.wslList.innerHTML = '';

  distros.forEach(distro => {
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    item.innerHTML = `
        <span class="material-icons-round" style="color:var(--warning)">deployed_code</span>
        <span>${distro.name}</span>
      `;
    item.onclick = (e) => {
      e.stopPropagation();
      ctx.elements.wslDropdown.classList.remove('open');
      ctx.events.onOpenWsl?.(distro.name);
    };
    ctx.elements.wslList.appendChild(item);
  });
}
