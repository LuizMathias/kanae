/**
 * game-engine.js
 * Ponto de entrada e orquestrador principal do Kanae Quest.
 */

// Importa as funções das cenas
import createTitleScene from "./scenes/title.js";
import createCharacterSelectScene from "./scenes/characterSelect.js?v=2";
import createBattleScene from "./scenes/battle.js?v=2";
import createGameOverScene from "./scenes/gameOver.js";

// Importa o gerenciador de estado
import { state } from "./utils/stateManager.js";

import { loadCharacterSprites } from "./utils/characters.js?v=2"; // <-- IMPORTAÇÃO
import { loadEnemySprites } from "./utils/enemies.js";       // <-- IMPORTAÇÃO

// A API de comunicação com o script.js (o "cérebro" do app de treino)
let gameApi;

export async function initGame() {
    const k = kaboom({
        canvas: document.getElementById("game-canvas"),
        global: false,
        width: window.innerWidth,
        height: window.innerWidth * 0.6, // Proporção 5:3
		scale: 1,
        background: [0, 0, 0],
        layers: ["bg", "obj", "ui"],
    });

    // --- CARREGAMENTO DE ASSETS ---
    k.loadRoot("./assets/");
    
    // --- CARREGAMENTO DE ASSETS CENTRALIZADO ---
    await Promise.all([
        // Chama as funções de carregamento e espalha os arrays de promessas
        ...loadCharacterSprites(k),
        ...loadEnemySprites(k),

        // Carrega outros assets globais
        k.loadSprite("background", "background/forrest_01.png"),
        //k.loadSprite("ui_panel", "sprites/ui_panel.png"),
    ]);

    // --- REGISTRO DAS CENAS ---
    // Passamos a instância 'k' e o gerenciador de estado para cada cena.
    k.scene("title", createTitleScene(k, state));
    k.scene("characterSelect", createCharacterSelectScene(k, state));
    k.scene("battle", createBattleScene(k, state, () => gameApi)); // Passa a API como função
    k.scene("gameOver", createGameOverScene(k, state));

    // --- INÍCIO DO JOGO ---
    k.go("title");

    // Cria a API de comunicação que as cenas poderão usar
    gameApi = {
        // As cenas usarão isso para se comunicar com o app de treino
        // Ex: const api = gameApi(); api.handleCorrectAnswer(...)
    };
}

/**
 * API PÚBLICA: Usada pelo script.js para enviar comandos para o jogo.
 * Esta parte é a ponte entre o "app de treino" e o "jogo".
 */
export function handleCorrectAnswer(word, points) {
    if (state.eventBus) {
        state.eventBus.trigger("correctAnswer", word, points);
    }
}

export function handleIncorrectAnswer() {
    if (state.eventBus) {
        state.eventBus.trigger("incorrectAnswer");
    }
}