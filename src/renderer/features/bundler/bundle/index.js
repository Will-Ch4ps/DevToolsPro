// dev-tools-hub-pro/src/renderer/features/bundler/bundle/index.js

import { state } from '../state.js';
import { buildInstruction } from './instruction.js';
import { generateLocalBundle, generatePathsBundleLocal } from './local-bundle.js';
import { generateRemoteBundle, generatePathsBundleRemote } from './remote-bundle.js';

export { buildInstruction };

/**
 * Dispara a geração do bundle no modo escolhido ('full' | 'paths' | 'folders')
 */
export async function generateBundle(mode) {
  const instruction = buildInstruction();

  if (mode === 'full') {
    return state.isRemoteMode && state.sshConnection
      ? generateRemoteBundle(instruction)
      : generateLocalBundle(instruction);
  }

  return generatePathsBundle(mode, instruction);
}

export function hasSelection() {
  return state.selectedPaths.size > 0 || state.selectedEmptyDirs.size > 0;
}

function generatePathsBundle(mode, instruction) {
  if (!state.rootPath) {
    return { success: false, error: 'Nenhum projeto/pasta selecionado.' };
  }

  return state.isRemoteMode && state.sshConnection
    ? generatePathsBundleRemote(mode, instruction)
    : generatePathsBundleLocal(mode, instruction);
}
