// dev-tools-hub-pro/src/renderer/features/bundler/bundle/remote-bundle.js

import { state } from '../state.js';
import { SshService } from '../services/index.js';
import { toPosixRelRemote, deriveFoldersFromRelFiles } from './path-utils.js';

/**
 * Geração de bundle para projetos remotos (SSH)
 */

export async function generateRemoteBundle(instruction) {
  const filesResult = await SshService.readFiles(
    state.sshConnection.id,
    Array.from(state.selectedPaths),
    state.rootPath
  );

  if (!filesResult.success) return filesResult;

  let output = `<system_context>\n`;
  output += `  <date>${new Date().toISOString()}</date>\n`;
  output += `  <source>SSH: ${state.sshConnection.label}</source>\n`;
  output += `</system_context>\n\n`;

  if (instruction) {
    output += `<instructions>\n${instruction}\n</instructions>\n\n`;
  }

  output += `<file_map>\n`;
  filesResult.files.forEach(f => {
    output += `  <entry>${f.path}</entry>\n`;
  });
  output += `</file_map>\n\n`;

  output += `<codebase>\n`;
  filesResult.files.forEach(f => {
    output += `<file path="${f.path}">\n<![CDATA[\n${f.content}\n]]>\n</file>\n\n`;
  });
  output += `</codebase>`;

  return {
    success: true,
    count: filesResult.files.length,
    data: output
  };
}

export function generatePathsBundleRemote(mode, instruction) {
  // No remoto, state.selectedPaths já guarda os paths remotos absolutos.
  // Para manter o padrão do remote bundle atual, geramos entradas RELATIVAS ao rootPath.
  const relFiles = Array.from(state.selectedPaths)
    .map(pAbs => toPosixRelRemote(state.rootPath, pAbs))
    .filter(Boolean);

  const folderRelSet = deriveFoldersFromRelFiles(relFiles);
  const folderEntries = Array.from(folderRelSet).map(d => (d.endsWith('/') ? d : d + '/'));
  const fileEntries = relFiles.slice();

  folderEntries.sort((a, b) => a.localeCompare(b));
  fileEntries.sort((a, b) => a.localeCompare(b));

  let output = `<system_context>\n`;
  output += `  <date>${new Date().toISOString()}</date>\n`;
  output += `  <source>SSH: ${state.sshConnection.label}</source>\n`;
  output += `</system_context>\n\n`;

  if (instruction && instruction.trim()) {
    output += `<instructions>\n${instruction}\n</instructions>\n\n`;
  }

  output += `<file_map>\n`;

  // Inclui a raiz remota como primeira linha (relativa fica vazia -> representamos como "./")
  output += `  <entry>./</entry>\n`;

  if (mode === 'folders') {
    folderEntries.forEach(e => {
      if (e === './') return;
      output += `  <entry>${e}</entry>\n`;
    });
  } else {
    folderEntries.forEach(e => {
      if (e === './') return;
      output += `  <entry>${e}</entry>\n`;
    });
    fileEntries.forEach(e => {
      output += `  <entry>${e}</entry>\n`;
    });
  }

  output += `</file_map>\n\n`;
  output += `<codebase>\n</codebase>`;

  return { success: true, count: fileEntries.length, data: output };
}
