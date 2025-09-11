// ui-manager.js - Lógica de Navegação com History API

document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-button, .nav-button-link');
    const pages = document.querySelectorAll('.page');

    /**
     * Função principal para mostrar uma página. Apenas manipula o DOM.
     * @param {string} targetId - O ID da página a ser exibida.
     */
    function updateActivePage(targetId) {
        // Garante que um target válido exista, senão volta para home
        const finalTargetId = document.getElementById(targetId) ? targetId : 'home-page';

        // Esconde todas as páginas
        pages.forEach(page => {
            page.classList.remove('active');
        });

        // Remove a classe 'active' de todos os botões da navbar principal
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.classList.remove('active');
        });

        // Mostra a página alvo
        const targetPage = document.getElementById(finalTargetId);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Marca o botão correspondente na navbar como ativo
        const activeButton = document.querySelector(`.nav-button[data-target="${finalTargetId}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

		if (targetId === 'home-page' && app && typeof app.updateDashboard === 'function') {
			app.updateDashboard();
		}
    }

    /**
     * Navega para uma nova página e adiciona ao histórico do navegador.
     * @param {string} targetId - O ID da página de destino.
     */
    function navigateTo(targetId) {
        // Pega o hash atual para evitar adicionar a mesma página duas vezes no histórico
        const currentHash = window.location.hash.substring(1);
        if (currentHash === targetId) return; // Já estamos na página certa

        updateActivePage(targetId);
        history.pushState({ pageId: targetId }, `Kanae - ${targetId}`, `#${targetId}`);
    }

    // --- EVENT LISTENERS ---

    // Listener para os cliques nos botões de navegação
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault(); // Previne qualquer comportamento padrão
            const targetId = button.dataset.target;
            navigateTo(targetId);
        });
    });

    // Listener para o botão "Voltar" do navegador
    window.addEventListener('popstate', (e) => {
        // Se e.state é null, significa que voltamos ao início (antes do primeiro pushState)
        if (e.state && e.state.pageId) {
            updateActivePage(e.state.pageId);
        } else {
            updateActivePage('home-page'); // Página padrão
        }
    });

    // --- INICIALIZAÇÃO ---

    // Define a página inicial baseada na URL (caso o usuário recarregue a página ou use um link direto)
    const initialPageId = window.location.hash ? window.location.hash.substring(1) : 'home-page';
    updateActivePage(initialPageId);
    
    // Garante que o estado inicial do histórico corresponda à página exibida
    // Usamos replaceState para não criar uma entrada de histórico "extra" no carregamento
    history.replaceState({ pageId: initialPageId }, `Kanae - ${initialPageId}`, `#${initialPageId}`);


    // Expõe a função de navegação para outros scripts, se necessário
    app.showPage = navigateTo;
});