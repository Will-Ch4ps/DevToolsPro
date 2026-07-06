// dev-tools-hub-pro/src/main/features/ssh/ssh.ipc.js

const { ipcMain, dialog } = require('electron');
const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs/promises');
const os = require('os');

const connections = new Map();

// Sem limites (como você pediu)
const MAX_FILE_SIZE = Number.POSITIVE_INFINITY;

function getSshDir() {
  return path.join(os.homedir(), '.ssh');
}

async function parseSshConfig() {
  const configPath = path.join(getSshDir(), 'config');
  const hosts = [];

  try {
    const content = await fs.readFile(configPath, 'utf8');
    const lines = content.split('\n');

    let currentHost = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const hostMatch = trimmed.match(/^Host\s+(.+)$/i);
      if (hostMatch) {
        if (currentHost && currentHost.name && !currentHost.name.includes('*')) {
          hosts.push(currentHost);
        }
        currentHost = {
          name: hostMatch[1].trim(),
          hostname: null,
          user: null,
          port: 22,
          identityFile: null
        };
        continue;
      }

      if (currentHost) {
        const [key, ...valueParts] = trimmed.split(/\s+/);
        const value = valueParts.join(' ');

        switch (key.toLowerCase()) {
          case 'hostname':
            currentHost.hostname = value;
            break;
          case 'user':
            currentHost.user = value;
            break;
          case 'port':
            currentHost.port = parseInt(value) || 22;
            break;
          case 'identityfile':
            currentHost.identityFile = value.replace(/^~/, os.homedir());
            break;
        }
      }
    }

    if (currentHost && currentHost.name && !currentHost.name.includes('*')) {
      hosts.push(currentHost);
    }

    return hosts;
  } catch {
    return [];
  }
}

async function listSshKeys() {
  const sshDir = getSshDir();
  const keys = [];

  try {
    const files = await fs.readdir(sshDir);

    for (const file of files) {
      if (
        file.endsWith('.pub') ||
        file === 'known_hosts' ||
        file === 'config' ||
        file === 'authorized_keys' ||
        file.startsWith('known_hosts')
      ) continue;

      const filePath = path.join(sshDir, file);

      try {
        const stat = await fs.stat(filePath);
        if (!stat.isFile()) continue;

        const content = await fs.readFile(filePath, 'utf8');
        if (
          content.includes('PRIVATE KEY') ||
          content.includes('OPENSSH PRIVATE KEY') ||
          content.includes('BEGIN RSA PRIVATE KEY') ||
          content.includes('BEGIN EC PRIVATE KEY') ||
          content.includes('BEGIN DSA PRIVATE KEY')
        ) {
          keys.push({
            name: file,
            path: filePath,
            type: content.includes('OPENSSH') ? 'openssh'
              : content.includes('RSA') ? 'rsa'
              : content.includes('EC') ? 'ecdsa'
              : content.includes('DSA') ? 'dsa'
              : 'unknown'
          });
        }
      } catch {}
    }

    return keys;
  } catch {
    return [];
  }
}

async function readKeyFile(keyPath) {
  try {
    const expandedPath = keyPath.replace(/^~/, os.homedir());
    const content = await fs.readFile(expandedPath, 'utf8');
    return { success: true, content };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function createConnection(config) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const timeout = setTimeout(() => {
      conn.end();
      reject(new Error('Timeout de conexão (30s)'));
    }, 30000);

    conn.on('ready', () => {
      clearTimeout(timeout);
      resolve(conn);
    });

    conn.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    const connConfig = {
      host: config.host,
      port: config.port || 22,
      username: config.username,
      readyTimeout: 30000,
      keepaliveInterval: 10000
    };

    if (config.privateKey) {
      connConfig.privateKey = config.privateKey;
      if (config.passphrase) connConfig.passphrase = config.passphrase;
    } else if (config.password) {
      connConfig.password = config.password;
    }

    if (!config.privateKey && !config.password) {
      connConfig.agent = process.env.SSH_AUTH_SOCK;
    }

    conn.connect(connConfig);
  });
}

function getSftp(conn) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) reject(err);
      else resolve(sftp);
    });
  });
}

function execCommand(conn, command, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 120000;

  return new Promise((resolve, reject) => {
    let timer = null;
    let stdout = '';
    let stderr = '';

    conn.exec(command, { pty: false }, (err, stream) => {
      if (err) return reject(err);

      timer = setTimeout(() => {
        try { stream.close(); } catch {}
        reject(new Error(`Timeout exec (${timeoutMs}ms)`));
      }, timeoutMs);

      stream.on('data', (chunk) => { stdout += chunk.toString('utf8'); });
      stream.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8'); });

      stream.on('close', (code) => {
        if (timer) clearTimeout(timer);
        resolve({ code, stdout, stderr });
      });
    });
  });
}

function shSingleQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

/**
 * ✅ Scan remoto rápido, sem filtros (traz tudo)
 */
async function scanRemoteFast(conn, rootPath) {
  const rootQ = shSingleQuote(rootPath);
  // Importante: 2>/dev/null para não poluir stderr com permission denied
  // Importante 2: "|| true" para não deixar o exit code quebrar o scan
  // Sem prune/ignore: lista todos os arquivos (com size)
  const cmd = `sh -lc ${shSingleQuote(
    `LC_ALL=C find ${rootQ} -type f -printf '%p\\0%s\\0' 2>/dev/null || true`
  )}`;

  const { code, stdout, stderr } = await execCommand(conn, cmd, { timeoutMs: 300000 });
  if (code !== 0) {
    throw new Error((stderr || '').trim() || `find falhou (code ${code})`);
  }

  const parts = stdout.split('\0');
  if (parts.length && parts[parts.length - 1] === '') parts.pop();

  const rootNode = {
    name: path.posix.basename(rootPath) || rootPath,
    path: rootPath,
    type: 'folder',
    size: 0,
    children: [],
    isRemote: true
  };

  const dirMap = new Map();
  dirMap.set(rootPath, rootNode);

  const addDir = (dirPath) => {
    if (dirMap.has(dirPath)) return dirMap.get(dirPath);
    const parent = path.posix.dirname(dirPath);
    const parentNode = addDir(parent);

    const node = {
      name: path.posix.basename(dirPath),
      path: dirPath,
      type: 'folder',
      size: 0,
      children: [],
      isRemote: true
    };

    parentNode.children.push(node);
    dirMap.set(dirPath, node);
    return node;
  };

  for (let i = 0; i < parts.length; i += 2) {
    const filePath = parts[i];
    const size = Number(parts[i + 1] ?? '0') || 0;

    if (!Number.isFinite(size)) continue;
    if (size > MAX_FILE_SIZE) continue; // hoje é Infinity

    const fileName = path.posix.basename(filePath);
    const ext = path.extname(fileName).toLowerCase();

    const parentDir = path.posix.dirname(filePath);
    const parentNode = addDir(parentDir);

    parentNode.children.push({
      name: fileName,
      path: filePath,
      type: 'file',
      size,
      ext,
      isRemote: true
    });
  }

  const sortAndSum = (node) => {
    if (node.type !== 'folder') return node.size || 0;
    if (!node.children) node.children = [];

    node.children.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
    });

    let sum = 0;
    for (const child of node.children) sum += sortAndSum(child);
    node.size = sum;
    return sum;
  };

  sortAndSum(rootNode);
  return rootNode;
}

/**
 * ✅ Read rápido em batch via base64 (sem filtro por extensão)
 * Pula só se detectar binário (null byte) após decodificar.
 */
async function readRemoteFilesFast(conn, files, rootPath) {
  const BATCH = 60;
  const results = [];

  const remoteScript = `
set -e
for f in "$@"; do
  if [ -f "$f" ]; then
    printf "__FILE__%s\\n" "$f"
    base64 -w0 "$f" 2>/dev/null || base64 "$f" 2>/dev/null
    printf "\\n__END__\\n"
  fi
done
`.trim();

  for (let i = 0; i < files.length; i += BATCH) {
    const chunk = files.slice(i, i + BATCH);
    if (chunk.length === 0) continue;

    const args = chunk.map(shSingleQuote).join(' ');
    const cmd = `sh -lc ${shSingleQuote(remoteScript)} -- ${args}`;

    const { code, stdout, stderr } = await execCommand(conn, cmd, { timeoutMs: 300000 });
    if (code !== 0) {
      throw new Error((stderr || '').trim() || `read batch falhou (code ${code})`);
    }

    const lines = stdout.split('\n');
    let currentPath = null;
    let currentB64 = null;

    for (const line of lines) {
      if (line.startsWith('__FILE__')) {
        currentPath = line.slice('__FILE__'.length);
        currentB64 = '';
        continue;
      }
      if (line === '__END__') {
        if (currentPath != null && currentB64 != null) {
          try {
            const content = Buffer.from(currentB64, 'base64').toString('utf8');

            // Heurística simples para binário:
            if (!content.includes('\0')) {
              const rel = path.posix.relative(rootPath, currentPath);
              results.push({ path: rel, content });
            }
          } catch {}
        }
        currentPath = null;
        currentB64 = null;
        continue;
      }
      if (currentB64 != null) currentB64 += line.trim();
    }
  }

  return results;
}

exports.init = (win) => {
  ipcMain.handle('ssh:list-config-hosts', async () => {
    return await parseSshConfig();
  });

  ipcMain.handle('ssh:list-keys', async () => {
    return await listSshKeys();
  });

  ipcMain.handle('ssh:read-key', async (_, keyPath) => {
    return await readKeyFile(keyPath);
  });

  ipcMain.handle('ssh:pick-key-file', async () => {
    const result = await dialog.showOpenDialog(win, {
      title: 'Selecionar Chave Privada SSH',
      defaultPath: getSshDir(),
      properties: ['openFile'],
      filters: [
        { name: 'Chaves SSH', extensions: ['pem', 'key', ''] },
        { name: 'Todos os Arquivos', extensions: ['*'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const keyPath = result.filePaths[0];
    const keyContent = await readKeyFile(keyPath);

    if (keyContent.success) {
      return {
        success: true,
        path: keyPath,
        name: path.basename(keyPath),
        content: keyContent.content
      };
    }

    return keyContent;
  });

  ipcMain.handle('ssh:connect', async (_, config) => {
    const connectionId = `${config.host}:${config.port || 22}`;

    try {
      if (connections.has(connectionId)) {
        connections.get(connectionId).conn.end();
        connections.delete(connectionId);
      }

      const conn = await createConnection(config);
      const sftp = await getSftp(conn);

      connections.set(connectionId, { conn, sftp, config });

      return {
        success: true,
        connectionId,
        message: `Conectado a ${config.username}@${config.host}`
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('ssh:connect-config-host', async (_, hostName) => {
    try {
      const hosts = await parseSshConfig();
      const hostConfig = hosts.find(h => h.name === hostName);

      if (!hostConfig) {
        return { success: false, error: `Host "${hostName}" não encontrado no config` };
      }

      const config = {
        host: hostConfig.hostname || hostConfig.name,
        port: hostConfig.port || 22,
        username: hostConfig.user || os.userInfo().username
      };

      if (hostConfig.identityFile) {
        const keyResult = await readKeyFile(hostConfig.identityFile);
        if (keyResult.success) config.privateKey = keyResult.content;
      }

      const connectionId = `${config.host}:${config.port}`;

      if (connections.has(connectionId)) {
        connections.get(connectionId).conn.end();
        connections.delete(connectionId);
      }

      const conn = await createConnection(config);
      const sftp = await getSftp(conn);

      connections.set(connectionId, {
        conn,
        sftp,
        config,
        configHostName: hostName
      });

      return {
        success: true,
        connectionId,
        hostName,
        message: `Conectado a ${hostName} (${config.username}@${config.host})`
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('ssh:disconnect', async (_, connectionId) => {
    if (connections.has(connectionId)) {
      connections.get(connectionId).conn.end();
      connections.delete(connectionId);
      return { success: true };
    }
    return { success: false, error: 'Conexão não encontrada' };
  });

  ipcMain.handle('ssh:list-connections', async () => {
    const list = [];
    connections.forEach((value, key) => {
      list.push({
        id: key,
        host: value.config.host,
        username: value.config.username,
        port: value.config.port || 22,
        configHostName: value.configHostName || null
      });
    });
    return list;
  });

  ipcMain.handle('ssh:scan', async (_, { connectionId, remotePath }) => {
    if (!connections.has(connectionId)) {
      return { success: false, error: 'Conexão não encontrada. Reconecte.' };
    }

    const { conn } = connections.get(connectionId);

    try {
      const structure = await scanRemoteFast(conn, remotePath);
      return { success: true, structure };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('ssh:list-dir', async (_, { connectionId, remotePath }) => {
    if (!connections.has(connectionId)) {
      return { success: false, error: 'Conexão não encontrada' };
    }

    const { sftp } = connections.get(connectionId);

    const listDirectory = (dirPath) => new Promise((resolve, reject) => {
      sftp.readdir(dirPath, (err, list) => {
        if (err) reject(err);
        else resolve(list);
      });
    });

    try {
      const items = await listDirectory(remotePath);
      const result = items
        .map(item => ({
          name: item.filename,
          path: path.posix.join(remotePath, item.filename),
          isDirectory: item.attrs.isDirectory(),
          size: item.attrs.size || 0
        }))
        .sort((a, b) => {
          if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
          return a.isDirectory ? -1 : 1;
        });

      return { success: true, items: result, currentPath: remotePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('ssh:read-files', async (_, { connectionId, files, rootPath }) => {
    if (!connections.has(connectionId)) {
      return { success: false, error: 'Conexão não encontrada' };
    }

    const { conn } = connections.get(connectionId);

    try {
      const outFiles = await readRemoteFilesFast(conn, files, rootPath);
      return { success: true, files: outFiles };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  console.log('🔐 [SSH] IPC inicializado (scan/read rápidos, sem filtros/limites)');
};

process.on('exit', () => {
  connections.forEach((value) => {
    try { value.conn.end(); } catch {}
  });
});
