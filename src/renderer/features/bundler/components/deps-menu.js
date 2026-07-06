// dev-tools-hub-pro/src/renderer/features/bundler/components/deps-menu.js

/**
 * Menu "Ligações": escolhe direção (usa / usado por / ambos) e alcance
 * (diretos / tudo), mostra um preview de quantos arquivos serão adicionados
 * e só então aplica — pra ligar os pontos sem estourar a seleção.
 *
 * Recebe callbacks: onPreview({direction, depth}) -> Promise<{ok, added, total, reason}>
 *                   onApply({direction, depth})
 */
export const DepsMenu = {
  container: null,
  callbacks: {},

  render(containerEl, callbacks) {
    this.container = containerEl;
    this.callbacks = callbacks || {};

    containerEl.className = 'tt-group tt-deps';
    containerEl.innerHTML = `
      <span class="tt-label">Ligações</span>
      <button id="dm-toggle" class="tt-btn" title="Incluir arquivos ligados por import/export">
        <span class="material-icons-round">account_tree</span>
        Ligações
        <span class="material-icons-round dm-caret">arrow_drop_down</span>
      </button>

      <div id="dm-pop" class="dm-popover" hidden>
        <div class="dm-row">
          <span class="dm-label">O que incluir</span>
          <div class="tt-seg" id="dm-dir">
            <button class="tt-seg-btn active" data-dir="deps" title="Arquivos que a seleção importa">Usa</button>
            <button class="tt-seg-btn" data-dir="dependents" title="Arquivos que importam a seleção">Usado por</button>
            <button class="tt-seg-btn" data-dir="both">Ambos</button>
          </div>
        </div>

        <div class="dm-row">
          <span class="dm-label">Alcance</span>
          <div class="tt-seg" id="dm-depth">
            <button class="tt-seg-btn active" data-depth="1" title="Só os vizinhos imediatos">Diretos</button>
            <button class="tt-seg-btn" data-depth="all" title="Segue todo o fluxo de imports">Tudo</button>
          </div>
        </div>

        <div class="dm-preview" id="dm-preview">—</div>
        <button class="tt-btn tt-btn-primary dm-apply" id="dm-apply">Adicionar à seleção</button>
      </div>
    `;

    this._bind();
  },

  _bind() {
    const el = this.container;
    const pop = el.querySelector('#dm-pop');
    const toggle = el.querySelector('#dm-toggle');

    toggle.onclick = (e) => {
      e.stopPropagation();
      if (pop.hasAttribute('hidden')) this._open(); else this._close();
    };

    el.querySelectorAll('#dm-dir .tt-seg-btn, #dm-depth .tt-seg-btn').forEach(btn => {
      btn.onclick = () => {
        const group = btn.parentElement;
        group.querySelectorAll('.tt-seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._refreshPreview();
      };
    });

    el.querySelector('#dm-apply').onclick = () => {
      this.callbacks.onApply?.(this._opts());
      this._close();
    };

    // Fecha ao clicar fora
    document.addEventListener('click', (e) => {
      if (!el.contains(e.target)) this._close();
    });
  },

  _opts() {
    const dir = this.container.querySelector('#dm-dir .tt-seg-btn.active').dataset.dir;
    const depth = this.container.querySelector('#dm-depth .tt-seg-btn.active').dataset.depth;
    return { direction: dir, depth };
  },

  _open() {
    this.container.querySelector('#dm-pop').removeAttribute('hidden');
    this._refreshPreview();
  },

  _close() {
    this.container.querySelector('#dm-pop').setAttribute('hidden', '');
  },

  async _refreshPreview() {
    const prev = this.container.querySelector('#dm-preview');
    const apply = this.container.querySelector('#dm-apply');
    prev.className = 'dm-preview';
    prev.textContent = 'Analisando...';
    apply.disabled = true;

    const r = await this.callbacks.onPreview?.(this._opts());
    if (!r) { prev.textContent = '—'; return; }

    if (!r.ok) {
      prev.classList.add('muted');
      prev.textContent = r.reason === 'empty' ? 'Selecione um arquivo primeiro'
        : r.reason === 'remote' ? 'Disponível só em local/WSL'
          : 'Sem dados de dependência';
      apply.disabled = true;
      return;
    }

    if (r.added === 0) {
      prev.classList.add('muted');
      prev.textContent = 'Nada novo a adicionar';
      apply.disabled = true;
    } else {
      const tokens = fmtTokens(r.addedTokens);
      prev.textContent = `Adiciona +${r.added} arquivo${r.added > 1 ? 's' : ''}${tokens ? ` · ~${tokens} tokens` : ''}`;
      apply.disabled = false;
    }
  }
};

function fmtTokens(n) {
  if (!n) return '';
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
