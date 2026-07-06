// dev-tools-hub-pro/src/renderer/features/bundler/bundle/instruction.js

import { state } from '../state.js';
import { BundlerView } from '../bundler.view.js';

/**
 * Monta o bloco de instruções (prompts selecionados + texto customizado)
 */
export function buildInstruction() {
  const selectedIds = BundlerView.getSelectedPromptIds();
  const customText = BundlerView.getCustomInstruction();

  const parts = [];

  if (selectedIds.length > 0) {
    selectedIds.forEach(id => {
      const prompt = state.promptsCache.find(p => p.id === id);
      if (prompt) parts.push(`--- ${prompt.title.toUpperCase()} ---\n${prompt.content}`);
    });
  }

  if (customText && customText.trim()) {
    parts.push(`--- INSTRUÇÕES ADICIONAIS ---\n${customText}`);
  }

  return parts.join('\n\n');
}
