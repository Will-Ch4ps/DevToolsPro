const { ipcMain } = require('electron');
const fs = require('fs/promises');
const path = require('path');

// AGORA: Salva na pasta 'data' dentro da raiz do projeto
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'prompts.json');

async function ensureDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

async function loadPrompts() {
    try {
        await ensureDir();
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // Se arquivo não existe, retorna array vazio e não faz nada
        return [];
    }
}

async function savePrompts(prompts) {
    try {
        await ensureDir();
        await fs.writeFile(DATA_FILE, JSON.stringify(prompts, null, 2));
        return true;
    } catch (error) {
        console.error("Erro ao salvar prompts:", error);
        return false;
    }
}

exports.init = (win) => {
    ipcMain.handle('prompts:list', async () => loadPrompts());
    
    ipcMain.handle('prompts:save', async (_, prompts) => savePrompts(prompts));

    console.log('📝 [Prompts] Storage local definido:', DATA_FILE);
};