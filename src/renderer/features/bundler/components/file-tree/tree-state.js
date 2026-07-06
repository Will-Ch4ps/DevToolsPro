// dev-tools-hub-pro/src/renderer/features/bundler/components/file-tree/tree-state.js

/**
 * Gerencia os estados visuais do painel (loading / empty / content) e o
 * wrapper de conteúdo. Recebe `ctx` (a própria FileTree) para acessar `container`/`contentEl`.
 */

/**
 * Garante que existe um wrapper de conteúdo para a árvore.
 * Isso evita que elementos de estado “empurrem” a árvore e melhora previsibilidade do layout.
 */
export function ensureContentWrapper(ctx) {
  if (!ctx.container) return;

  let content = ctx.container.querySelector('.tree-content');
  if (!content) {
    content = document.createElement('div');
    content.className = 'tree-content';

    // Insere o conteúdo no final, mantendo overlays/estados existentes
    ctx.container.appendChild(content);
  }

  ctx.contentEl = content;
}

/**
 * Define estado visual do painel:
 * - loading: mostra spinner, esconde empty
 * - empty: mostra empty, esconde spinner
 * - content: esconde ambos
 */
export function setState(ctx, targetState) {
  if (!ctx.container) return;

  const loading = ctx.container.querySelector('.loading-state');
  const empty = ctx.container.querySelector('.empty-state-icon');

  // Estado padrão: esconde tudo
  if (loading) loading.style.display = 'none';
  if (empty) empty.style.display = 'none';

  if (targetState === 'loading') {
    if (loading) loading.style.display = 'flex';
    return;
  }

  if (targetState === 'empty') {
    if (empty) empty.style.display = 'flex';
    return;
  }

  // targetState === 'content' => ambos escondidos
}
