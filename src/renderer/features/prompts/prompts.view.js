export const PromptsView = {
    // Cache references
    elements: {},

    render(container, events) {
        // Usa as classes globais .split-view, .list-pane, .editor-pane definidas no CSS novo
        container.innerHTML = `
            <div class="feature-header">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span class="material-icons-round" style="color:#8b949e;">psychology</span>
                    <h2>Prompt Studio</h2>
                </div>
                <div class="header-actions">
                    <button id="btn-new" class="btn btn-primary">
                        <span class="material-icons-round">add</span> Novo
                    </button>
                </div>
            </div>

            <div class="split-view" style="height: calc(100vh - 60px);">
                <div class="list-pane">
                    <div style="padding:10px; border-bottom:1px solid #30363d; font-size:11px; font-weight:bold; color:#8b949e;">
                        MEUS PROMPTS
                    </div>
                    <div id="prompt-list" class="list-content">
                        </div>
                </div>

                <div class="editor-pane">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <input id="input-title" type="text" placeholder="Nome do Prompt" style="background:transparent; border:none; border-bottom:1px solid #30363d; font-size:16px; font-weight:bold; color:#e6edf3; width:60%; padding:5px;">
                        <div style="display:flex; gap:10px;">
                            <button id="btn-delete" class="btn" style="color:#da3633; border-color:#da3633;">Excluir</button>
                            <button id="btn-save" class="btn btn-primary">Salvar</button>
                        </div>
                    </div>

                    <div class="snippets-bar" style="display:flex; gap:8px; margin-bottom:10px; flex-wrap:wrap;">
                        <button class="filter-chip" data-insert="[Role: Expert]">Expert</button>
                        <button class="filter-chip" data-insert="[Lang: PT-BR]">PT-BR</button>
                        <button class="filter-chip" data-insert="[Format: JSON]">JSON</button>
                    </div>

                    <textarea id="input-content" class="textarea-editor" placeholder="Digite o conteúdo do prompt..."></textarea>
                </div>
            </div>
        `;

        // Cache elements inside container
        this.elements = {
            list: container.querySelector('#prompt-list'),
            title: container.querySelector('#input-title'),
            content: container.querySelector('#input-content')
        };

        // Bind events using container scope
        container.querySelector('#btn-new').onclick = events.onNew;
        container.querySelector('#btn-save').onclick = events.onSave;
        container.querySelector('#btn-delete').onclick = events.onDelete;

        container.querySelectorAll('.filter-chip').forEach(btn => {
            btn.onclick = () => this.insertText(btn.dataset.insert);
        });
    },

    renderList(prompts, activeId, onSelect) {
        const list = this.elements.list;
        if (!list) return;

        list.innerHTML = '';
        prompts.forEach(p => {
            const el = document.createElement('div');
            el.className = `prompt-item ${p.id === activeId ? 'active' : ''}`;
            el.innerHTML = `
                <div class="prompt-title">${p.title || 'Sem Título'}</div>
                <div class="prompt-preview">${p.content ? p.content.substring(0,40) : '...'}</div>
            `;
            el.onclick = () => onSelect(p.id);
            list.appendChild(el);
        });
    },

    updateEditor(prompt) {
        if(this.elements.title) this.elements.title.value = prompt ? prompt.title : '';
        if(this.elements.content) this.elements.content.value = prompt ? prompt.content : '';
    },

    getEditorValues() {
        // Safe access via cached elements
        return {
            title: this.elements.title ? this.elements.title.value : '',
            content: this.elements.content ? this.elements.content.value : ''
        };
    },

    insertText(text) {
        const area = this.elements.content;
        if (!area) return;
        
        const start = area.selectionStart;
        const end = area.selectionEnd;
        const val = area.value;
        area.value = val.substring(0, start) + text + val.substring(end);
        area.focus();
    }
};