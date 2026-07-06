// dev-tools-hub-pro/src/renderer/features/bundler/bundler.view.prompts.js

/**
 * Lista de prompts e modal de preview/resultado.
 * Recebe `ctx` (a própria BundlerView) para acessar elements/events já cacheados.
 */

export function renderPromptList(ctx, prompts) {
  const list = ctx.elements.promptList;

  if (!prompts?.length) {
    list.innerHTML = '<div class="list-empty">Nenhum prompt salvo</div>';
    return;
  }

  list.innerHTML = '';

  prompts.forEach(p => {
    const row = document.createElement('div');
    row.className = 'prompt-row';
    row.innerHTML = `
        <label class="prompt-label">
          <input type="checkbox" value="${p.id}" class="prompt-checkbox">
          <span>${p.title}</span>
        </label>
        <button class="btn-icon btn-preview" title="Visualizar">
          <span class="material-icons-round">visibility</span>
        </button>
      `;

    row.querySelector('.btn-preview').onclick = (e) => {
      e.preventDefault();
      openModal(ctx, `Prompt: ${p.title}`, `\`\`\`\n${p.content}\n\`\`\``);
    };

    list.appendChild(row);
  });
}

export function getSelectedPromptIds(ctx) {
  const checkboxes = ctx.elements.promptList.querySelectorAll('.prompt-checkbox:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

export function getCustomInstruction(ctx) {
  return ctx.elements.promptExtra.value;
}

export function openModal(ctx, title, content) {
  ctx.elements.modalTitle.textContent = title;
  ctx.elements.modalText.value = content;
  ctx.elements.modal.classList.add('open');
}

export function closeModal(ctx) {
  ctx.elements.modal.classList.remove('open');
}

export function showCopyFeedback(ctx) {
  ctx.elements.copyFeedback.classList.add('show');
  setTimeout(() => ctx.elements.copyFeedback.classList.remove('show'), 2000);
}
