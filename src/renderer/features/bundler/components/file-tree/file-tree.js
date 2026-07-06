// dev-tools-hub-pro/src/renderer/features/bundler/components/file-tree/file-tree.js

import { ensureContentWrapper, setState } from './tree-state.js';
import { buildNode } from './tree-node-builder.js';

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
  }
};
