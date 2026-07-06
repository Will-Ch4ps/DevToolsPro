// dev-tools-hub-pro/src/main/features/bundler/bundler.ipc.js

const { ipcMain, dialog } = require('electron');
const fs = require('fs/promises');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const { buildGraph } = require('./graph');

// --- CONFIGURAÇÃO DE SEGURANÇA ---
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const LINE_COUNT_MAX_SIZE = 2 * 1024 * 1024; // 2MB: acima disso não contamos linhas (evita I/O pesado)

/**
 * Conta linhas de um arquivo de texto de forma barata (conta bytes 0x0A no buffer).
 * Retorna null quando o arquivo é grande demais ou parece binário (tem byte nulo).
 */
async function countFileLines(filePath, size) {
  if (size > LINE_COUNT_MAX_SIZE) return null;
  if (size === 0) return 0;
  try {
    const buf = await fs.readFile(filePath);
    if (buf.includes(0)) return null; // provável binário
    let count = 0;
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] === 10) count++; // '\n'
    }
    // se o arquivo não termina em newline, a última linha ainda conta
    if (buf[buf.length - 1] !== 10) count++;
    return count;
  } catch {
    return null;
  }
}

const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg', '.vscode', '.idea', '.vs',
  'dist', 'build', 'out', 'target', 'bin', 'obj',
  'coverage', '.nyc_output',
  '.next', '.nuxt', '.angular', '.cache', '.parcel-cache',
  '__pycache__', 'venv', 'env', '.venv',
  'vendor', 'tmp', 'temp', 'logs'
]);

const IGNORE_FILES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'composer.lock',
  '.DS_Store', 'Thumbs.db', 'desktop.ini'
]);

const BINARY_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.bmp', '.tiff',
  '.mp4', '.mp3', '.wav', '.ogg', '.mov', '.avi', '.mkv',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.exe', '.dll', '.so', '.dylib', '.class', '.jar', '.war', '.pyc',
  '.zip', '.tar', '.gz', '.7z', '.rar', '.db', '.sqlite'
]);

function shouldIgnore(name, isDir) {
  if (isDir) return IGNORE_DIRS.has(name);
  return IGNORE_FILES.has(name) || BINARY_EXTS.has(path.extname(name).toLowerCase());
}

async function scanDirectory(dirPath) {
  const name = path.basename(dirPath);
  const node = { name, path: dirPath, type: 'folder', size: 0, children: [] };

  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });

    const promises = items.map(async (dirent) => {
      if (shouldIgnore(dirent.name, dirent.isDirectory())) return null;
      const fullPath = path.join(dirPath, dirent.name);

      if (dirent.isDirectory()) {
        return await scanDirectory(fullPath);
      } else {
        try {
          const stats = await fs.stat(fullPath);
          if (stats.size > MAX_FILE_SIZE) return null;
          return {
            name: dirent.name,
            path: fullPath,
            type: 'file',
            size: stats.size,
            lines: await countFileLines(fullPath, stats.size),
            ext: path.extname(dirent.name).toLowerCase()
          };
        } catch {
          return null;
        }
      }
    });

    const results = (await Promise.all(promises)).filter(Boolean);
    node.children = results.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });
    node.size = node.children.reduce((acc, c) => acc + (c.size || 0), 0);
    node.lines = node.children.reduce((acc, c) => acc + (c.lines || 0), 0);
  } catch (err) {
    console.error(`Erro em: ${dirPath}`, err.message);
  }

  return node;
}

// --- WSL UTILITIES ---

function isWindows() {
  return os.platform() === 'win32';
}

function listWslDistros() {
  return new Promise((resolve) => {
    if (!isWindows()) return resolve([]);

    exec('wsl -l -q', { encoding: 'utf8' }, (error, stdout) => {
      if (error) {
        console.warn('[WSL] Não foi possível listar distros:', error.message);
        return resolve([]);
      }

      const cleaned = stdout.replace(/\0/g, '').trim();
      if (!cleaned) return resolve([]);

      const distros = cleaned
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.includes('Windows Subsystem'))
        .map(name => ({
          name,
          path: `\\\\wsl$\\${name}`,
          pathAlt: `\\\\wsl.localhost\\${name}`
        }));

      console.log('[WSL] Distros encontradas:', distros.map(d => d.name));
      resolve(distros);
    });
  });
}

async function getAccessibleWslPath(distroName) {
  const paths = [
    `\\\\wsl.localhost\\${distroName}`,
    `\\\\wsl$\\${distroName}`
  ];

  for (const p of paths) {
    try {
      await fs.access(p);
      return p;
    } catch {
      continue;
    }
  }
  return null;
}

function toPosixRel(root, absolutePath) {
  return path.relative(root, absolutePath).replace(/\\/g, '/');
}

function prefixRoot(root, relPath) {
  const rootName = path.basename(root);
  // relPath pode ser '' se alguém passar o próprio root, mas aqui não usamos isso.
  if (!relPath) return rootName;
  return `${rootName}/${relPath}`;
}

exports.init = (win) => {
  ipcMain.handle('bundler:open', async () => {
    const result = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('bundler:wsl-list', async () => {
    return await listWslDistros();
  });

  ipcMain.handle('bundler:open-wsl', async (_, distroName) => {
    if (!isWindows()) {
      return { success: false, error: 'WSL só está disponível no Windows' };
    }

    const wslPath = await getAccessibleWslPath(distroName);
    if (!wslPath) {
      return { success: false, error: `Não foi possível acessar a distro: ${distroName}` };
    }

    try {
      const result = await dialog.showOpenDialog(win, {
        defaultPath: wslPath,
        properties: ['openDirectory']
      });

      if (result.canceled) return { success: false, canceled: true };
      return { success: true, path: result.filePaths[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('bundler:browse-wsl', async (_, distroName, subPath = '') => {
    if (!isWindows()) {
      return { success: false, error: 'WSL só está disponível no Windows' };
    }

    const basePath = await getAccessibleWslPath(distroName);
    if (!basePath) {
      return { success: false, error: `Distro não acessível: ${distroName}` };
    }

    const fullPath = subPath ? path.join(basePath, subPath) : basePath;

    try {
      await fs.access(fullPath);
      return { success: true, path: fullPath };
    } catch {
      return { success: false, error: `Caminho não encontrado: ${fullPath}` };
    }
  });

  ipcMain.handle('bundler:scan', async (_, p) => await scanDirectory(p));

  // Grafo de dependências (import/require/from) dos arquivos locais informados.
  ipcMain.handle('bundler:graph', async (_, { root, files }) => await buildGraph({ root, files }));

  /**
   * ✅ Suporta:
   * - files: arquivos selecionados
   * - dirs: diretórios vazios selecionados (local/WSL)
   *
   * ✅ E agora prefixa tudo com a pasta raiz (ex.: dev-tools-hub-pro/...)
   */
  ipcMain.handle('bundler:copy', async (_, { root, files, dirs, instruction }) => {
    try {
      const safeFiles = Array.isArray(files) ? files : [];
      const safeDirs = Array.isArray(dirs) ? dirs : [];

      let filesRead = 0;

      let out = `<system_context>\n <date>${new Date().toISOString()}</date>\n</system_context>\n\n`;

      if (instruction && instruction.trim()) {
        out += `<instructions>\n${instruction}\n</instructions>\n\n`;
      }

      out += `<file_map>\n`;

      // 1) Diretórios vazios (apenas caminhos)
      for (const d of safeDirs) {
        const rel = toPosixRel(root, d);
        const relWithRoot = prefixRoot(root, rel);
        out += ` <entry>${relWithRoot.endsWith('/') ? relWithRoot : relWithRoot + '/'}</entry>\n`;
      }

      // 2) Arquivos
      for (const f of safeFiles) {
        const rel = toPosixRel(root, f);
        const relWithRoot = prefixRoot(root, rel);
        out += ` <entry>${relWithRoot}</entry>\n`;
      }

      out += `</file_map>\n\n<codebase>\n`;

      for (const f of safeFiles) {
        try {
          const content = await fs.readFile(f, 'utf8');

          // inclui arquivo vazio também (content === '')
          if (!content.includes('\0')) {
            const rel = toPosixRel(root, f);
            const relWithRoot = prefixRoot(root, rel);

            out += `<file path="${relWithRoot}">\n<![CDATA[\n${content}\n]]>\n</file>\n\n`;
            filesRead++;
          }
        } catch {
          // ignora leitura que falhar
        }
      }

      out += `</codebase>`;

      return { success: true, count: filesRead, data: out };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  console.log('📦 [Bundler] IPC inicializado com suporte a WSL e paths com raiz no bundle');
};
