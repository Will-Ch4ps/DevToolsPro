// dev-tools-hub-pro/src/renderer/features/bundler/components/ssh-modal/ssh-connection.js

import { SshService } from '../../services/index.js';

/**
 * Conexão (via host do config ou manual) e desconexão SSH.
 * Recebe `ctx` (a própria SshModal) para acessar elements/state/callbacks.
 */

export async function connectConfigHost(ctx, hostName) {
  setConnecting(ctx, true, `Conectando a ${hostName}...`);

  const result = await SshService.connectConfigHost(hostName);

  if (result.success) {
    ctx.state.currentConnection = {
      id: result.connectionId,
      hostName: result.hostName,
      label: result.message
    };
    ctx.showBrowser();

    // Navega para home
    const host = ctx.state.configHosts.find(h => h.name === hostName);
    const homePath = host?.user ? `/home/${host.user}` : '/home';
    ctx.elements.pathInput.value = homePath;
    ctx.browsePath();
  } else {
    alert(`Erro: ${result.error}`);
  }

  setConnecting(ctx, false);
}

export async function connectManual(ctx) {
  const authType = ctx.elements.modal.querySelector('.auth-btn.active').dataset.auth;

  const config = {
    host: ctx.elements.host.value.trim(),
    username: ctx.elements.user.value.trim(),
    port: parseInt(ctx.elements.port.value) || 22
  };

  if (!config.host || !config.username) {
    return alert('Preencha Host e Usuário');
  }

  if (authType === 'password') {
    config.password = ctx.elements.password.value;
    if (!config.password) return alert('Digite a senha');
  } else {
    if (!ctx.state.selectedKeyContent) return alert('Selecione uma chave');
    config.privateKey = ctx.state.selectedKeyContent;
    config.passphrase = ctx.elements.passphrase.value || undefined;
  }

  setConnecting(ctx, true, 'Conectando...');

  const result = await SshService.connect(config);

  if (result.success) {
    ctx.state.currentConnection = {
      id: result.connectionId,
      label: result.message
    };
    ctx.showBrowser();
    ctx.elements.pathInput.value = `/home/${config.username}`;
    ctx.browsePath();
  } else {
    alert(`Erro: ${result.error}`);
  }

  setConnecting(ctx, false);
}

function setConnecting(ctx, loading, message = 'Conectando...') {
  ctx.elements.btnConnect.disabled = loading;
  ctx.elements.btnConnect.innerHTML = loading
    ? `<span class="material-icons-round spin">sync</span> ${message}`
    : '<span class="material-icons-round">login</span> Conectar';
}

export async function disconnect(ctx) {
  if (ctx.state.currentConnection) {
    await SshService.disconnect(ctx.state.currentConnection.id);
    ctx.state.currentConnection = null;

    if (ctx.callbacks.onDisconnected) {
      ctx.callbacks.onDisconnected();
    }
  }

  ctx.resetToInitialState();
  ctx.loadConfigData();
}
