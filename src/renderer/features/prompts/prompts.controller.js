import { PromptsView } from './prompts.view.js';
const { ipcRenderer } = require('electron');

let prompts = [];
let activeId = null;

export const PromptsController = {
    render(container) {
        PromptsView.render(container, {
            onNew: this.handleNew.bind(this),
            onSave: this.handleSave.bind(this),
            onDelete: this.handleDelete.bind(this)
        });
        this.loadData();
    },

    // Chamado pelo Router quando a aba é foca
    onResume() {
        this.loadData();
    },

    async loadData() {
        prompts = await ipcRenderer.invoke('prompts:list');
        // Se temos prompts e nenhum selecionado (ou o selecionado sumiu), seleciona o primeiro
        if (prompts.length > 0) {
            const exists = prompts.find(p => p.id === activeId);
            if (!activeId || !exists) {
                activeId = prompts[0].id;
            }
        } else {
            activeId = null;
        }
        this.refreshUI();
    },

    handleSelect(id) {
        activeId = id;
        this.refreshUI();
    },

    handleNew() {
        const newId = Date.now().toString();
        const newPrompt = { id: newId, title: 'Novo Prompt', content: '' };
        prompts.unshift(newPrompt); // Adiciona no topo
        activeId = newId;
        this.refreshUI();
        
        // Foca no título automaticamente
        setTimeout(() => document.getElementById('input-title')?.focus(), 100);
    },

    async handleSave() {
        if (!activeId) return;
        
        const data = PromptsView.getEditorValues();
        if(!data.title.trim()) data.title = "Sem Título";

        const index = prompts.findIndex(p => p.id === activeId);
        
        if (index !== -1) {
            prompts[index] = { ...prompts[index], ...data };
            
            // Salva no Disco
            await ipcRenderer.invoke('prompts:save', prompts);
            
            const btn = document.getElementById('btn-save');
            if(btn) {
                const original = btn.innerHTML;
                btn.innerHTML = `<span class="material-icons-round">check</span> Salvo!`;
                btn.classList.add('btn-success');
                setTimeout(() => {
                    btn.innerHTML = original;
                    btn.classList.remove('btn-success');
                }, 1500);
            }
            this.refreshUI();
        }
    },

    async handleDelete() {
        if (!activeId || !confirm("Tem certeza que deseja excluir este prompt?")) return;
        
        prompts = prompts.filter(p => p.id !== activeId);
        await ipcRenderer.invoke('prompts:save', prompts);
        
        activeId = prompts.length > 0 ? prompts[0].id : null;
        this.refreshUI();
    },

    refreshUI() {
        PromptsView.renderList(prompts, activeId, this.handleSelect.bind(this));
        const activePrompt = prompts.find(p => p.id === activeId);
        PromptsView.updateEditor(activePrompt);
    }
};