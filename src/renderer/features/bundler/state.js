// dev-tools-hub-pro/src/renderer/features/bundler/state.js

/**
 * Estado do módulo Bundler (singleton compartilhado entre os handlers)
 */
export const state = {
  rootPath: null,
  structure: null,
  selectedPaths: new Set(),        // arquivos
  selectedEmptyDirs: new Set(),    // diretórios vazios (apenas local/WSL)
  totalSize: 0,
  promptsCache: [],
  wslDistros: [],
  sshConnection: null,
  isRemoteMode: false
};

/**
 * Filtros de extensão por categoria
 */
export const FILTERS = {
  front: ['.html', '.htm', '.css', '.scss', '.sass', '.less', '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.json'],
  back: ['.js', '.ts', '.py', '.php', '.go', '.java', '.rb', '.sql', '.cs', '.rs'],
  config: ['.json', '.xml', '.yaml', '.yml', '.env', '.toml', '.ini', 'dockerfile', '.dockerignore', '.gitignore']
};
