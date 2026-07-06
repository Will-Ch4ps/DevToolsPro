// dev-tools-hub-pro/src/renderer/features/bundler/components/filter-bar.js

/**
 * Componente de barra de filtros
 * Suporta seleção múltipla (multi-select) entre categorias.
 * "Todos" e "Limpar" continuam sendo ações exclusivas.
 */
export const FilterBar = {
    container: null,
    onFilterCallback: null,
    activeFilters: new Set(['all']),

    /**
     * Renderiza a barra de filtros
     */
    render(containerEl, onFilter) {
        this.container = containerEl;
        this.onFilterCallback = onFilter;
        this.activeFilters = new Set(['all']);

        containerEl.innerHTML = `
            <button class="filter-chip active" data-filter="all">Todos</button>
            <button class="filter-chip" data-filter="front">Frontend</button>
            <button class="filter-chip" data-filter="back">Backend</button>
            <button class="filter-chip" data-filter="config">Config</button>
            <div style="flex:1"></div>
            <button class="filter-chip filter-chip-danger" data-filter="clear">Limpar</button>
        `;

        this._bindEvents();
    },

    /**
     * Vincula eventos dos botões
     */
    _bindEvents() {
        this.container.querySelectorAll('.filter-chip').forEach(chip => {
            chip.onclick = () => this._handleChipClick(chip);
        });
    },

    /**
     * Trata clique em um chip, decidindo entre modo exclusivo ou multi-select
     */
    _handleChipClick(chip) {
        const filter = chip.dataset.filter;

        // "Limpar" zera tudo
        if (filter === 'clear') {
            this.activeFilters.clear();
            this._updateVisualState();
            this.onFilterCallback?.([]);
            return;
        }

        // "Todos" é exclusivo: substitui qualquer seleção específica
        if (filter === 'all') {
            this.activeFilters = new Set(['all']);
            this._updateVisualState();
            this.onFilterCallback?.(['all']);
            return;
        }

        // Categorias específicas (front/back/config) funcionam como toggle
        this.activeFilters.delete('all');

        if (this.activeFilters.has(filter)) {
            this.activeFilters.delete(filter);
        } else {
            this.activeFilters.add(filter);
        }

        // Se nada ficou selecionado, some para o estado "sem filtro" (lista vazia)
        this._updateVisualState();
        this.onFilterCallback?.(Array.from(this.activeFilters));
    },

    /**
     * Atualiza visual dos chips com base no estado atual
     */
    _updateVisualState() {
        this.container.querySelectorAll('.filter-chip').forEach(c => {
            const f = c.dataset.filter;
            if (f === 'clear') {
                c.classList.remove('active');
                return;
            }
            c.classList.toggle('active', this.activeFilters.has(f));
        });
    }
};
