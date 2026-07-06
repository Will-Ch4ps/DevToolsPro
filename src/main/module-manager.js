// dev-tools-hub-pro/src/main/module-manager.js

const bundlerIpc = require('./features/bundler/bundler.ipc');
const promptsIpc = require('./features/prompts/prompts.ipc');
const sshIpc = require('./features/ssh/ssh.ipc');

module.exports = {
    loadModules: (mainWindow) => {
        bundlerIpc.init(mainWindow);
        promptsIpc.init(mainWindow);
        sshIpc.init(mainWindow);
        
        console.log('✅ [System] Todos os módulos backend foram iniciados.');
    }
};
