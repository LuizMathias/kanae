// kanaequest/scenes/gameOver.js

import { clearSave } from "../utils/stateManager.js";

/**
 * Cria a cena de Game Over.
 * Esta cena é exibida quando o HP do jogador chega a zero.
 * @param {KaboomCtx} k - A instância do Kaboom.
 */
export default function createGameOverScene(k) {
    return () => {
        // --- LIMPEZA DE ESTADO ---
        // A primeira coisa que fazemos é apagar o save do jogo.
        // Isso garante que a opção "Continuar" na tela de título desapareça.
        clearSave();

        // --- OBJETOS DE CENA ---

        // Fundo preto sólido para dar um tom sombrio.
        k.add([
            k.rect(k.width(), k.height()),
            k.color(0, 0, 0),
            k.z("bg"),
        ]);

        // Texto principal "GAME OVER".
        k.add([
            k.text("GAME OVER", { size: 60, font: "sans-serif" }),
            k.pos(k.center()),
            k.anchor("center"),
            k.z("ui"),
        ]);

        // Texto de instrução para o jogador.
        k.add([
            k.text("Pressione [Enter] para voltar ao menu", { size: 20, font: "sans-serif" }),
            k.pos(k.center().x, k.height() - 50),
            k.anchor("center"),
            k.z("ui"),
        ]);

        // --- MANIPULAÇÃO DE INPUT ---

        // Fica ouvindo o pressionamento da tecla "Enter".
        k.onKeyPress("enter", () => {
            // Quando "Enter" é pressionado, volta para a cena de título.
            k.go("title");
        });

        // Adiciona também um listener para clique/toque para funcionar em mobile.
        k.onClick(() => {
            k.go("title");
        });
    };
}