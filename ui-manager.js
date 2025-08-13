// ui-manager.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos da UI ---
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const mainMenu = document.getElementById('main-menu');
    const panelLinks = document.querySelectorAll('.menu-item[data-panel-id]');
    const sidePanels = document.querySelectorAll('.side-panel');
    const panelBackBtns = document.querySelectorAll('.panel-back-btn');

    let currentOpenView = null; // 'menu' ou o ID de um painel

    // --- Funções de Controle de UI ---

    const closeAllViews = () => {
        mainMenu.classList.remove('is-open');
        sidePanels.forEach(p => p.classList.remove('is-open'));
        currentOpenView = null;
    };

    const openView = (viewId) => {
        closeAllViews(); // Garante que tudo está fechado antes de abrir algo novo
        
        if (viewId === 'menu') {
            mainMenu.classList.add('is-open');
        } else {
            const panel = document.getElementById(viewId);
            if (panel) {
                panel.classList.add('is-open');
            }
        }
        currentOpenView = viewId;
        // Adiciona uma entrada no histórico para "capturar" o botão voltar
        history.pushState({ viewId: viewId }, `View ${viewId}`, `#${viewId}`);
    };

    // --- Event Listeners ---

    // Botão principal do menu
    menuToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (mainMenu.classList.contains('is-open')) {
            history.back(); // Se já está aberto, voltar fecha ele
        } else {
            openView('menu');
        }
    });

    // Links dentro do menu que abrem os painéis
    panelLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.stopPropagation();
            const panelId = link.dataset.panelId;
            openView(panelId);
        });
    });

    // Botões "Voltar" dentro de cada painel
    panelBackBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            history.back();
        });
    });

    // Clicar fora do menu para fechar
    window.addEventListener('click', () => {
        if (currentOpenView === 'menu') {
            history.back();
        }
    });
    // Impede que cliques dentro do menu o fechem
    mainMenu.addEventListener('click', (e) => e.stopPropagation());

    // Listener do botão Voltar do Navegador/Android
    window.addEventListener('popstate', (e) => {
        // O popstate já nos tirou do estado "aberto", então só precisamos
        // garantir que a UI reflita isso (removendo as classes).
        closeAllViews();
    });
	
    window.addEventListener('keydown', (event) => {
        // Verifica se a tecla pressionada foi a 'Escape'
        if (event.key === 'Escape') {
            // E verifica se temos alguma view (menu ou painel) aberta
            if (currentOpenView) {
                // Se sim, executa a mesma ação do botão "voltar"
                history.back();
            }
        }
    });	
});