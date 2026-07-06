// dev-tools-hub-pro/src/renderer/features/bundler/components/ssh-modal/ssh-config.js

import { SshService } from '../../services/index.js';

/**
 * Carregamento e renderização de hosts do ~/.ssh/config e chaves disponíveis.
 * Recebe `ctx` (a própria SshModal) para acessar elements/state/callbacks.
 */

export async function loadConfigData(ctx) {
  // Carrega hosts
  ctx.elements.hostsList.innerHTML = '<div class="list-placeholder"><span class="material-icons-round spin">sync</span> Carregando...</div>';
  ctx.state.configHosts = await SshService.getConfigHosts();
  renderHosts(ctx);

  // Carrega chaves
  ctx.elements.keysList.innerHTML = '<div class="list-placeholder"><span class="material-icons-round spin">sync</span> Carregando...</div>';
  ctx.state.availableKeys = await SshService.getAvailableKeys();
  renderKeys(ctx);
}

function renderHosts(ctx) {
  const list = ctx.elements.hostsList;

  if (!ctx.state.configHosts.length) {
    list.innerHTML = '<div class="list-placeholder">Nenhum host em ~/.ssh/config</div>';
    return;
  }

  list.innerHTML = '';

  ctx.state.configHosts.forEach(host => {
    const item = document.createElement('div');
    item.className = 'ssh-list-item';
    item.innerHTML = `
                <div class="item-icon">
                    <span class="material-icons-round">computer</span>
                </div>
                <div class="item-info">
                    <div class="item-title">${host.name}</div>
                    <div class="item-subtitle">${host.user || 'user'}@${host.hostname || host.name}:${host.port || 22}</div>
                </div>
                ${host.identityFile ? '<span class="item-badge" title="Usa chave">🔑</span>' : ''}
                <button class="btn btn-sm btn-primary">Conectar</button>
            `;

    item.querySelector('button').onclick = () => ctx.connectConfigHost(host.name);
    list.appendChild(item);
  });
}

function renderKeys(ctx) {
  const list = ctx.elements.keysList;

  if (!ctx.state.availableKeys.length) {
    list.innerHTML = '<div class="list-placeholder">Nenhuma chave em ~/.ssh</div>';
    return;
  }

  list.innerHTML = '';

  ctx.state.availableKeys.forEach(key => {
    const item = document.createElement('div');
    item.className = 'ssh-list-item ssh-list-item-small clickable';
    item.innerHTML = `
                <span class="material-icons-round" style="color:var(--warning)">vpn_key</span>
                <span class="item-title">${key.name}</span>
                <span class="item-type">${key.type}</span>
            `;

    item.onclick = () => selectKey(ctx, key);
    list.appendChild(item);
  });
}

async function selectKey(ctx, key) {
  const result = await SshService.readKeyContent(key.path);

  if (result.success) {
    ctx.state.selectedKeyContent = result.content;
    ctx.elements.keyPath.value = key.path;
    ctx.elements.keyStatus.textContent = `✓ ${key.name} selecionada`;
    ctx.elements.keyStatus.className = 'input-status success';

    // Muda para aba manual com auth por chave
    ctx.switchTab('manual');
    ctx.switchAuth('key');
  } else {
    alert(`Erro ao ler chave: ${result.error}`);
  }
}

export async function pickKeyFile(ctx) {
  const result = await SshService.pickKeyFile();

  if (result.success) {
    ctx.state.selectedKeyContent = result.content;
    ctx.elements.keyPath.value = result.path;
    ctx.elements.keyStatus.textContent = `✓ ${result.name} selecionada`;
    ctx.elements.keyStatus.className = 'input-status success';
  } else if (result.error) {
    alert(`Erro: ${result.error}`);
  }
}
