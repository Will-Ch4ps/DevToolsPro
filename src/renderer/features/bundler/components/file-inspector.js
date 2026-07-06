// dev-tools-hub-pro/src/renderer/features/bundler/components/file-inspector.js

import { pathLabel } from '../lib/path-label.js';

/**
 * Painel flutuante que mostra as ligações diretas de UM arquivo:
 *  - "Usa" (o que ele importa)
 *  - "Usado por" (quem importa ele)
 * Cada item é clicável para adicionar à seleção; há botão pra adicionar o grupo.
 *
 * Callbacks: onSelect(paths), onClose()
 */
export const FileInspector = {
  el: null,
  callbacks: {},

  init() {
    if (this.el) return;
    this.el = document.createElement('div');
    this.el.id = 'file-inspector';
    this.el.className = 'file-inspector';
    this.el.hidden = true;
    document.body.appendChild(this.el);

    // Fecha ao clicar fora
    document.addEventListener('click', (e) => {
      if (!this.el.hidden && !this.el.contains(e.target) && !e.target.closest('.file-inspect')) {
        this.close();
      }
    });
  },

  open({ filePath, uses = [], usedBy = [], rect }, callbacks) {
    this.init();
    this.callbacks = callbacks || {};

    this.el.innerHTML = `
      <div class="fi-header">
        <span class="material-icons-round">hub</span>
        <span class="fi-title" title="${filePath}">${pathLabel(filePath)}</span>
        <button class="fi-close" title="Fechar"><span class="material-icons-round">close</span></button>
      </div>
      ${this._section('Usa', 'o que este arquivo importa', uses)}
      ${this._section('Usado por', 'quem importa este arquivo', usedBy)}
    `;

    this.el.querySelector('.fi-close').onclick = () => this.close();
    this._wire(uses, usedBy);
    this._position(rect);
    this.el.hidden = false;
  },

  _section(title, hint, paths) {
    const items = paths.length
      ? paths.map(p => `<div class="fi-item" data-path="${p}"><span class="material-icons-round">description</span>${pathLabel(p)}</div>`).join('')
      : '<div class="fi-empty">nenhum</div>';
    const addAll = paths.length > 1
      ? `<button class="fi-addall" data-group="${title}">+ todos</button>`
      : '';
    return `
      <div class="fi-section">
        <div class="fi-head"><span>${title} (${paths.length})</span>${addAll}</div>
        <div class="fi-hint">${hint}</div>
        <div class="fi-list">${items}</div>
      </div>
    `;
  },

  _wire(uses, usedBy) {
    this.el.querySelectorAll('.fi-item[data-path]').forEach(it => {
      it.onclick = () => this.callbacks.onSelect?.([it.dataset.path]);
    });
    this.el.querySelectorAll('.fi-addall').forEach(btn => {
      btn.onclick = () => this.callbacks.onSelect?.(btn.dataset.group === 'Usa' ? uses : usedBy);
    });
  },

  _position(rect) {
    const W = 300;
    const margin = 8;
    let left = rect ? rect.left - W - margin : 120;   // à esquerda do ícone
    if (left < margin) left = rect ? rect.right + margin : margin; // senão, à direita
    left = Math.min(left, window.innerWidth - W - margin);

    let top = rect ? rect.top : 120;
    top = Math.min(top, window.innerHeight - 40); // não deixa sumir embaixo

    this.el.style.left = `${Math.max(margin, left)}px`;
    this.el.style.top = `${Math.max(margin, top)}px`;
  },

  close() {
    if (!this.el || this.el.hidden) return;
    this.el.hidden = true;
    this.callbacks.onClose?.();
  }
};
