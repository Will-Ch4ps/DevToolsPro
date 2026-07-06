// dev-tools-hub-pro/src/renderer/features/bundler/components/file-tree/file-tree.js

import { ensureContentWrapper, setState } from './tree-state.js';
import { buildNode, setDisplayMetric } from './tree-node-builder.js';

/**
 * Componente de árvore de arquivos
 *
 * Correções principais:
 * - Não exibir empty-state automaticamente quando loading termina.
 * - Estado vazio só aparece quando NÃO há dados (ou children vazio).
 * - Render usa um wrapper dedicado (.tree-content) para não “empurrar” a árvore.
 * - Mantém os elementos de estado (loading/empty) sem recriar o container inteiro.
 */
export const FileTree = {
  container: null,
  onCheckCallback: null,
  contentEl: null,
  data: null,
  selectedOnly: false,

  /**
   * Inicializa o componente
   */
  init(containerEl, onCheck) {
    this.container = containerEl;
    this.onCheckCallback = onCheck;

    if (!this.container) return;

    ensureContentWrapper(this);

    // Ao iniciar, mostra vazio (nenhum projeto aberto) até o primeiro render válido
    setState(this, 'empty');
  },

  /**
   * Renderiza a árvore de arquivos
   */
  render(data) {
    if (!this.container) return;

    this.data = data;
    ensureContentWrapper(this);

    // Limpa somente o conteúdo da árvore (não mexe nos overlays/estados)
    this.contentEl.innerHTML = '';

    const hasChildren =
      !!data &&
      Array.isArray(data.children) &&
      data.children.length > 0;

    if (!hasChildren) {
      setState(this, 'empty');
      return;
    }

    setState(this, 'content');

    data.children.forEach((node) => {
      this.contentEl.appendChild(buildNode(node, 0, this.onCheckCallback));
    });

    // Reaplica o filtro "só selecionados" se estiver ativo (o DOM foi reconstruído)
    if (this.selectedOnly) this.applySelectedOnly(true);
  },

  /**
   * Mostra/oculta estado de loading
   *
   * Importante:
   * - Quando show=false, NÃO força o empty-state a aparecer.
   *   (Isso era a origem do “Nenhum projeto aberto” por cima da árvore.)
   */
  showLoading(show) {
    if (!this.container) return;

    if (show) {
      setState(this, 'loading');
    } else {
      // Sai do loading, mas não decide sozinho entre empty/content.
      // Quem decide é o render().
      const loading = this.container.querySelector('.loading-state');
      if (loading) loading.style.display = 'none';
    }
  },

  /**
   * Mostra estado vazio
   */
  showEmpty() {
    setState(this, 'empty');
  },

  /**
   * Define qual métrica ('lines' | 'size') aparece em destaque nas linhas
   */
  setDisplayMetric(metric) {
    setDisplayMetric(metric);
  },

  /**
   * Abre as pastas que contêm arquivos selecionados (sem fechar as demais),
   * pra revelar o que foi marcado por uma ação em lote.
   */
  revealSelected() {
    if (!this.data) return;
    const walk = (node) => {
      if (node.type === 'file') return !!node._checked;
      let has = false;
      (node.children || []).forEach(ch => { if (walk(ch)) has = true; });
      if (has && node._elChildren) {
        node._elChildren.style.display = 'block';
        const icon = node._elRow?.querySelector('.folder-icon');
        if (icon) { icon.textContent = 'folder_open'; icon.style.color = '#e3b341'; }
      }
      return has;
    };
    (this.data.children || []).forEach(walk);
  },

  /**
   * Filtro "só selecionados": mostra apenas arquivos marcados e as pastas que os contêm.
   */
  applySelectedOnly(on) {
    this.selectedOnly = on;
    if (!this.data) return;

    const walk = (node) => {
      if (node.type === 'file') {
        const visible = !on || !!node._checked;
        if (node._elRow) node._elRow.style.display = visible ? '' : 'none';
        return !!node._checked;
      }
      let has = false;
      (node.children || []).forEach(ch => { if (walk(ch)) has = true; });
      const visible = !on || has;
      if (node._elWrapper) node._elWrapper.style.display = visible ? '' : 'none';
      if (on && has && node._elChildren) {
        node._elChildren.style.display = 'block';
        const icon = node._elRow?.querySelector('.folder-icon');
        if (icon) { icon.textContent = 'folder_open'; icon.style.color = '#e3b341'; }
      }
      return has;
    };
    (this.data.children || []).forEach(walk);
  }
};
