import { Router } from './core/router.js';
import { BundlerController } from './features/bundler/index.js';
import { PromptsController } from './features/prompts/index.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Inicializa o Roteador na div principal
    const contentArea = document.getElementById('content-area');
    Router.init(contentArea);
    
    // 2. Registra as Telas (Módulos)
    Router.register('bundler', BundlerController);
    Router.register('prompts', PromptsController);
    
    // 3. Configura o Menu Lateral
    const nav = document.getElementById('main-nav');
    nav.innerHTML = `
        <button class="nav-item active" data-route="bundler" onclick="window.navigateTo('bundler')">
            <span class="material-icons-round">folder_zip</span>
            Bundler
        </button>
        <button class="nav-item" data-route="prompts" onclick="window.navigateTo('prompts')">
            <span class="material-icons-round">psychology</span>
            Prompt Studio
        </button>
    `;

    // 4. Função Global de Navegação
    window.navigateTo = (route) => {
        Router.navigate(route);
        
        // Atualiza classe 'active' no menu
        document.querySelectorAll('.nav-item').forEach(btn => {
            if (btn.dataset.route === route) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    };

    // 5. Inicia o app no Bundler
    window.navigateTo('bundler');
});