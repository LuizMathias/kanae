// ui-manager.js - Nova Lógica de Navegação

document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-button, .nav-button-link');
    const pages = document.querySelectorAll('.page');

    function showPage(targetId) {
        // Esconde todas as páginas
        pages.forEach(page => {
            page.classList.remove('active');
        });

        // Remove a classe 'active' de todos os botões da navbar principal
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.classList.remove('active');
        });

        // Mostra a página alvo
        const targetPage = document.getElementById(targetId);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Marca o botão correspondente na navbar como ativo
        const activeButton = document.querySelector(`.nav-button[data-target="${targetId}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    // Adiciona o listener para cada botão de navegação
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            showPage(targetId);
        });
    });

    // Inicia na página Home
    showPage('home-page');
});