/**
 * game-engine.js
 * Ponto de entrada e orquestrador principal do Kanae Quest.
 */

// Importa as funções das cenas (agora usa importação dinâmica abaixo no loadScene)
//import createTitleScene from "./scenes/title.js?v=7";
//import createCharacterSelectScene from "./scenes/characterSelect.js?v=5";
//import createBattleScene from "./scenes/battle.js?v=5";
//import createGameOverScene from "./scenes/gameOver.js?v=5";

// Importa o gerenciador de estado
import { state } from "./utils/stateManager.js";

import { loadCharacterSprites } from "./utils/characters.js";
import { loadEnemySprites } from "./utils/enemies.js";


/**
 * Carrega dinamicamente um módulo de cena a partir do nome.
 * Adiciona um timestamp para evitar problemas de cache durante o desenvolvimento.
 * @param {string} sceneName - O nome do arquivo da cena (sem a extensão .js).
 * @returns {Promise<Function|null>} Uma promise que resolve para a função de criação da cena (export default), ou null se ocorrer um erro.
 */
async function loadScene(sceneName) {
  // Constrói a URL do módulo da cena dinamicamente
  const timestamp = new Date().getTime();
  const moduleUrl = `./scenes/${sceneName}.js?t=${timestamp}`;

  console.log(`Tentando carregar a cena: ${sceneName}...`);

  try {
    // Espera o carregamento do módulo
    const module = await import(moduleUrl);

    // Retorna a função 'export default' do módulo
    return module.default;

  } catch (error) {
    // Se o arquivo não for encontrado ou houver outro erro, avisa no console
    console.error(`Falha ao carregar a cena "${sceneName}":`, error);

    // Retorna null para que o código que chamou saiba que houve uma falha
    return null;
  }
}

/**
 * Carrega dinamicamente um módulo e retorna um export específico (nomeado ou default).
 * @param {string} modulePath - O caminho para o módulo, sem a extensão .js (ex: "utils/stateManager").
 * @param {string} [exportName='default'] - O nome do export a ser retornado. Se omitido, assume 'default'.
 * @returns {Promise<any|null>} Uma promise que resolve para o asset exportado, ou null se ocorrer um erro.
 */
async function loadAsset(modulePath, exportName = 'default') {
  const timestamp = new Date().getTime();
  const moduleUrl = `./${modulePath}.js?t=${timestamp}`;

  console.log(`Carregando asset "${exportName}" de ${modulePath}...`);

  try {
    // Carrega o módulo inteiro
    const module = await import(moduleUrl);

    // Verifica se o export solicitado existe no módulo
    if (exportName in module) {
      // Retorna o export específico usando a sintaxe de colchetes,
      // que permite acessar propriedades com base em uma variável.
      return module[exportName];
    } else {
      console.error(`Export "${exportName}" não foi encontrado em ${modulePath}. Exports disponíveis:`, Object.keys(module));
      return null;
    }
  } catch (error) {
    console.error(`Falha ao carregar o módulo "${modulePath}":`, error);
    return null;
  }
}

// Importa as funções das cenas dinamicamente
const createTitleScene = await loadScene("title");
const createCharacterSelectScene = await loadScene("characterSelect");
const createBattleScene = await loadScene("battle");
const createGameOverScene = await loadScene("gameOver");


// A API de comunicação com o script.js (o "cérebro" do app de treino)
let gameApi;

export async function initGame() {	

	const gameContainer = document.getElementById("kanae-quest-container");

	// Pega as dimensões do container
	const BASE_WIDTH = 800;
	const BASE_HEIGHT = 500;

    const k = kaplay({
		width: BASE_WIDTH,
		height: BASE_HEIGHT,
		canvas: gameContainer.querySelector("canvas"),
		letterbox: true,
        global: true,
		/*
        canvas: document.getElementById("game-canvas"),
        width: 800, //window.innerWidth,
        height: 600, //window.innerWidth * 0.6, // Proporção 5:3
		*/
		//stretch: true,    // estica para preencher
		//letterbox: true,  // adiciona bordas pretas se a proporção não bater
		//scale: 0.5,
        background: [0, 0, 0],
        layers: ["bg", "obj", "ui"],
    });


	// Função para recalcular escala conforme tamanho do container
	function resizeCanvas() {
		const container = document.getElementById("kanae-quest-container");
		const scaleX = container.clientWidth / BASE_WIDTH;
		const scaleY = container.clientHeight / BASE_HEIGHT;

		// usa o menor fator para manter proporção
		const scale = Math.min(scaleX, scaleY);

		k.camScale(k.vec2(scale));
		k.camPos(k.vec2(BASE_WIDTH / 2, BASE_HEIGHT / 2)); // centraliza câmera
	}	

    // --- CARREGAMENTO DE ASSETS ---
    k.loadRoot("./kanaequest/assets/");
    
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
	console.log('handleCorrectAnswer', word, points, state);
    if (state.eventBus) {
        state.eventBus.trigger("correctAnswer", word, points);
    }
}

export function handleIncorrectAnswer() {
    if (state.eventBus) {
        state.eventBus.trigger("incorrectAnswer");
    }
}