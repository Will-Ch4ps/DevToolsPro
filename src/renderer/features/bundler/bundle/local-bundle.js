// dev-tools-hub-pro/src/renderer/features/bundler/bundle/local-bundle.js

import { state } from '../state.js';
import { toPosixRelLocal, prefixRootLocal, deriveFoldersFromRelFiles } from './path-utils.js';

const { ipcRenderer } = require('electron');
const path = require('path');

/**
 * Geração de bundle para projetos locais/WSL
 */

export async function generateLocalBundle(instruction) {
  return await ipcRenderer.invoke('bundler:copy', {
    root: state.rootPath,
    files: Array.from(state.selectedPaths),
    dirs: Array.from(state.selectedEmptyDirs),
    instruction
  });
}

export function generatePathsBundleLocal(mode, instruction) {
  const rootName = path.basename(state.rootPath);

  const fileRel = Array.from(state.selectedPaths)
    .map(abs => toPosixRelLocal(state.rootPath, abs))
    .filter(Boolean);

  const emptyDirRel = Array.from(state.selectedEmptyDirs)
    .map(abs => toPosixRelLocal(state.rootPath, abs))
    .filter(Boolean);

  const folderRelSet = deriveFoldersFromRelFiles(fileRel);
  emptyDirRel.forEach(d => folderRelSet.add(d));

  const folderEntries = Array.from(folderRelSet)
    .map(rel => prefixRootLocal(rootName, rel))
    .map(p => (p.endsWith('/') ? p : p + '/'));

  const fileEntries = fileRel
    .map(rel => prefixRootLocal(rootName, rel));

  // Ordena para ficar estável/legível
  folderEntries.sort((a, b) => a.localeCompare(b));
  fileEntries.sort((a, b) => a.localeCompare(b));

  let output = `<system_context>\n <date>${new Date().toISOString()}</date>\n</system_context>\n\n`;

  if (instruction && instruction.trim()) {
    output += `<instructions>\n${instruction}\n</instructions>\n\n`;
  }

  output += `<file_map>\n`;

  // Inclui a raiz (pasta do projeto) como contexto
  output += ` <entry>${rootName}/</entry>\n`;

  if (mode === 'folders') {
    folderEntries.forEach(e => {
      if (e === `${rootName}/`) return;
      output += ` <entry>${e}</entry>\n`;
    });
  } else {
    // mode === 'paths' => pastas + arquivos
    folderEntries.forEach(e => {
      if (e === `${rootName}/`) return;
      output += ` <entry>${e}</entry>\n`;
    });

    fileEntries.forEach(e => {
      output += ` <entry>${e}</entry>\n`;
    });
  }

  output += `</file_map>\n\n`;

  // Sem codebase
  output += `<codebase>\n</codebase>`;

  return { success: true, count: fileEntries.length, data: output };
}
