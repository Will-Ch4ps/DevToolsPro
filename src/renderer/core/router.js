export const Router = {
    container: null,
    routes: {},
    activeRoute: null,
    views: new Map(), // Cache de Views (DOM Elements)
    
    // Inicializa definindo onde as telas serão desenhadas
    init(containerEl) {
        this.container = containerEl;
        this.container.style.position = 'relative';
        this.container.style.height = '100%';
        this.container.style.overflow = 'hidden';

        // Remove o placeholder inicial ("Inicializando módulos...") para não
        // ficar preso atrás/acima das telas depois que uma view monta.
        this.container.querySelectorAll(':scope > .empty-state').forEach(el => el.remove());
    },
    
    // Registra uma nova rota
    register(name, controller) {
        this.routes[name] = controller;
    },
    
    // Navega mantendo o estado (Keep-Alive)
    navigate(name) {
        if (!this.routes[name]) {
            console.error(`Rota não encontrada: ${name}`);
            return;
        }

        // 1. Atualiza Menu Lateral
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.route === name);
        });

        this.activeRoute = name;

        // 2. Oculta todas as views
        this.views.forEach(view => view.style.display = 'none');

        // 3. Verifica se a view já existe no cache
        if (this.views.has(name)) {
            const cachedView = this.views.get(name);
            cachedView.style.display = 'flex'; // Flex para layout full height
            
            // Opcional: Avisar o controller que a view acordou (se tiver método onResume)
            if(this.routes[name].onResume) this.routes[name].onResume();
        } else {
            // 4. Cria a view pela primeira vez
            const viewContainer = document.createElement('div');
            viewContainer.className = 'view-container fade-in';
            viewContainer.style.height = '100%';
            viewContainer.style.display = 'flex';
            viewContainer.style.flexDirection = 'column';
            viewContainer.style.flex = '1';

            this.routes[name].render(viewContainer);
            
            this.container.appendChild(viewContainer);
            this.views.set(name, viewContainer);
        }
    }
};