/**
 * game-engine.js
 * 
 * Motor do mini-jogo Kanae Quest, construído com Kaboom.js v3000.
 * VERSÃO CORRIGIDA: Usa um objeto "Event Bus" para comunicação,
 * um padrão robusto que funciona de forma consistente.
 */

// A instância do Kaboom.
let k;
// O nosso "quadro de avisos" para eventos.
let eventBus;

// A API de comunicação com o script.js.
let gameApi;

// --- DADOS DO JOGO ---
const playerStats = { name: 'ロナン', hp: 450, maxHp: 450, mp: 354, maxMp: 354 };
let enemyStats = { name: 'スライム', hp: 100, maxHp: 100 };

import titleScene from "./scenes/title.js";
import characterSelectScene from "./scenes/character-select.js";
import battleScene from "./scenes/battle.js";

/**
 * Inicializa a instância do Kaboom, carrega os assets e define as cenas do jogo.
 */
export function initGame() {
    k = kaboom({
        canvas: document.getElementById("game-canvas"),
        //width: 450,
        //height: 338,
        global: false,
        background: [0, 0, 0],
        layers: ["bg", "obj", "ui"],
    });


    // --- CARREGAMENTO DE ASSETS ---
    k.loadRoot("kanaequest/assets/"); 

	k.loadSpriteAtlas("spriteatlas2.png", {
		"ronin": {
			"sliceX": 5,
			"sliceY": 5,
			"anims": {
				"idle": {
					"from": 0,
					"to": 1,
					"speed": 3,
					"loop": true
				},
				"attack1": {
					"from": 2,
					"to": 2,
					"speed": 10,
					"loop": false
				}
			}
		},
		"lizardman": {
			"x": 0,
			"y": 342,
			"width": 341,
			"height": 341,
			"sliceX": 5,
			"sliceY": 5,
			"anims": {
				"idle": {
					"from": 0,
					"to": 1,
					"speed": 3,
					"loop": true,
				},
				"attack1": {
					"from": 2,
					"to": 2,
					"speed": 10,
					"loop": true,
				},
			},
		}
	})

    k.loadSprite("background", "background.png");
    k.loadSprite("hero", "spriteatlas2.png", {
		sliceX: 5,
		sliceY: 5,
		anims: {
			idle: { 
				from: 0, 
				to: 1, 
				loop: true, 
				speed: 3 
			},
			attack1: { 
				from: 2, 
				to: 2, 
				loop: false, 
				speed: 2 
			},
		}
	});
	k.loadSprite("hero_attack", "hero_attack.png");
    k.loadSprite("enemy", "spriteatlas2.png", {
		sliceX: 5,
		sliceY: 5,
		anims: {
			idle: { 
				from: 0, 
				to: 1, 
				loop: true, 
				speed: 3 
			},
			attack1: { 
				from: 2, 
				to: 2, 
				loop: false, 
				speed: 2 
			},
		}
	});
    k.loadSprite("ui_panel", "ui_panel.png");

    // --- DEFINIÇÃO DA CENA PRINCIPAL ---
    k.scene("battle", () => {

        // SOLUÇÃO: Criamos um objeto de jogo vazio que servirá como nosso Event Bus.
        eventBus = k.add([]);

        // --- OBJETOS DE JOGO ---
        const bg = k.add([ 
			k.sprite("background"), 
			k.z("bg"), 
            // Para garantir que ele cubra a tela ao ser escalado, o posicionamos no centro.
            k.pos(k.center()),
            k.anchor("center"),
			k.scale(0.3),
		]);

        const enemy = k.add([ 
			k.sprite("enemy"), 
			k.pos(80, 150), 
			k.scale(0.3), 
			k.anchor("center"), 
			k.z("obj"), 
			"enemy" 
		]);

        const player = k.add([ 
			k.sprite("hero", { anim: "idle" }), 
			k.pos(270, 150), 
			k.scale(0.3), 
			k.anchor("center"), 
			k.z("obj"), 
			"player" 
		]);
        
        // --- INTERFACE (UI) ---
		/*
        k.add([ 
			k.sprite("ui_panel"), 
			k.pos(k.center().x, 
			k.height()), 
			k.anchor("bot"), 
			k.z("ui"), 
			k.fixed() 
		]);
		*/

        const playerHpText = k.add([ 
			k.text(`HP ${playerStats.hp}`, { size: 16, font: "sans-serif" }), 
			k.pos(290, k.height() - 78), 
			k.z("ui"), 
			k.fixed() 
		]);
        const playerMpText = k.add([ 
			k.text(`MP ${playerStats.mp}`, { size: 16, font: "sans-serif" }), 
			k.pos(290, k.height() - 52), 
			k.z("ui"), 
			k.fixed() ]);
        const enemyHpText = k.add([ 
			k.text(`${enemyStats.name} HP: ${enemyStats.hp}`, { size: 14, font: "sans-serif" }), 
			k.pos(10, 10), 
			k.color(255, 255, 255), 
			k.z("ui"), 
			k.fixed() 
		]);

        function updateUI() {
            playerHpText.text = `HP ${playerStats.hp}`;
            playerMpText.text = `MP ${playerStats.mp}`;
            enemyHpText.text = `${enemyStats.name} HP: ${enemyStats.hp}`;
			
        }
        
        // --- ANIMAÇÕES ---
        function playerAttackAnimation() {
			var idlePos = player.pos;
			player.pos.x = 100;
			//player.swap("hero_attack");
			//TODO: usar spriteatlas para animação real
			player.play("attack1");
			
			
			enemy.color = k.rgb(255, 100, 100);
			
            k.wait(0.2, () => {
				player.pos = idlePos;
				player.play("idle");
                enemy.color = k.rgb(255, 255, 255);
            });
        }
        
        function playerDamageAnimation() {
			enemy.play("attack1");
			enemy.pos.x = 100;
            player.color = k.rgb(255, 100, 100);
            k.wait(0.2, () => {
				enemy.play("idle");
                player.color = k.rgb(255, 255, 255);
            });
        }

        // --- EVENTOS DO JOGO ---
        // Agora, os eventos são ouvidos PELO NOSSO EVENT BUS.
        eventBus.on("correctAnswer", (word, points) => {
            playerAttackAnimation();
            const damage = 5 + points;
            enemyStats.hp = Math.max(0, enemyStats.hp - damage);
            updateUI();

            if (enemyStats.hp <= 0) {
                k.shake(20);
                k.wait(1, () => {
                    enemyStats = { name: 'ゴブリン', hp: 150, maxHp: 150 };
                    updateUI();
                });
            }
        });

        eventBus.on("incorrectAnswer", () => {
            playerDamageAnimation();
            const damage = 15;
            playerStats.hp = Math.max(0, playerStats.hp - damage);
            updateUI();

            if (playerStats.hp <= 0) {
                k.add([ k.text("GAME OVER", { size: 40 }), k.pos(k.center()), k.anchor("center"), k.z("ui") ]);
            }
        });
    });

    // --- INÍCIO DO JOGO ---
    k.go("battle");

    // A API de comunicação agora dispara eventos no nosso Event Bus.
    // A função para disparar um evento em um objeto de jogo é .trigger()
    gameApi = {
        handleCorrectAnswer: (word, points) => eventBus.trigger("correctAnswer", word, points),
        handleIncorrectAnswer: () => eventBus.trigger("incorrectAnswer"),
    };
}

/**
 * API PÚBLICA: Manipula o evento de resposta correta.
 */
export function handleCorrectAnswer(word, points) {
    if (gameApi) {
        gameApi.handleCorrectAnswer(word, points);
    }
}

/**
 * API PÚBLICA: Manipula o evento de resposta incorreta.
 */
export function handleIncorrectAnswer() {
    if (gameApi) {
        gameApi.handleIncorrectAnswer();
    }
}