// kanaequest/scenes/battle.js

import { state, saveGame } from "../utils/stateManager.js";
import { characterData } from "../utils/characters.js";
import { enemyData } from "../utils/enemies.js";

/**
 * Cria a cena de batalha principal.
 * @param {KaboomCtx} k - A instância do Kaboom.
 */
export default function createBattleScene(k) {
    return () => {
        // --- GUARDA DE SEGURANÇA ---
        // Se a cena for iniciada sem um personagem selecionado, volta para o título.
        if (!state.playerStats || !state.selectedCharacterKey) {
			console.log('go to title');
            k.go("title");
            return;
        }

        // --- INICIALIZAÇÃO DA CENA ---
        // Cria o "quadro de avisos" e o armazena no estado global.
        // É assim que o game-engine.js (via handleCorrectAnswer) se comunica com esta cena.
        state.eventBus = k.add([]);

        // Pega os dados do personagem e do inimigo.
        const selectedCharData = characterData[state.selectedCharacterKey];
        const currentEnemyData = enemyData.lizardman; // Para começar, sempre lutamos contra o lizardman
        
        // Cria uma cópia dos status do inimigo para esta batalha específica.
        let enemyStats = JSON.parse(JSON.stringify(currentEnemyData.stats));

		k.loadSprite("background", "../assets/background/forrest_01.png");



        // --- OBJETOS DE JOGO ---
        //const bgAsset = k.getSprite("background");
        //const scaleX = k.width() / bgAsset.width;
        //const scaleY = k.height() / bgAsset.height;
        k.add([
            k.sprite("background"),
            k.pos(k.center()),
			k.scale(scaleFactor),
            k.anchor("center"),
            //k.scale(Math.max(scaleX, scaleY)),
            k.z("bg"),
        ]);
        
        let enemy = k.add([
            k.sprite("lizardman"),
            k.pos(200 * scaleFactor, 280 * scaleFactor),
            k.scale(scaleFactor), // aplica escala proporcional
            k.anchor("center"),
            k.z("obj"),
            "enemy"
        ]);
        enemy.play("idle");

        let player = k.add([
            k.sprite(state.selectedCharacterKey), // Usa a chave do personagem (ex: "ronin")
            k.pos(600 * scaleFactor, 280 * scaleFactor),
            k.scale(scaleFactor), // aplica escala proporcional
            k.anchor("center"),
            k.z("obj"),
            "player"
        ]);
        player.play("idle");
        
        // --- INTERFACE (UI) ---
        //k.add([ k.sprite("ui_panel"), k.pos(k.center().x, k.height()), k.anchor("bot"), k.z("ui"), k.fixed() ]);
        const playerHpText = k.add([ 
			k.text(`HP ${state.playerStats.hp}`, { size: 16 }), 
			k.pos(295, k.height() - 62), 
			k.z("ui"), 
			k.fixed() 
		]);
        const playerMpText = k.add([ k.text(`MP ${state.playerStats.mp}`, { size: 16 }), k.pos(295, k.height() - 36), k.z("ui"), k.fixed() ]);
        const enemyHpText = k.add([ k.text(`${enemyStats.name} HP: ${enemyStats.hp}`, { size: 14 }), k.pos(10, 10), k.color(255, 255, 255), k.z("ui"), k.fixed() ]);

        function updateUI() {
            playerHpText.text = `HP ${state.playerStats.hp}`;
            playerMpText.text = `MP ${state.playerStats.mp}`;
            enemyHpText.text = `${enemyStats.name} HP: ${enemyStats.hp}`;
        }
        
        // --- ANIMAÇÕES DE COMBATE ---
        function playerAttackAnimation() {
            player.play("attack1");
            //enemy.shake(12);
            enemy.color = k.rgb(255, 100, 100);
            
            // Quando a animação de ataque do jogador terminar, ele volta para "idle".
			/*
            player.onAnimEnd("attack1", () => {
                player.play("idle");
            });
			*/

            k.wait(0.5, () => {
				player.play("idle");
                enemy.color = k.rgb(255, 255, 255);
            });
        }
        
        function playerDamageAnimation() {
            enemy.play("attack1");
            //player.shake(8);
            player.color = k.rgb(255, 100, 100);

			/*
            enemy.onAnimEnd("attack1", () => {
                enemy.play("idle");
            });
			*/

            k.wait(0.5, () => {
				enemy.play("idle");
                player.color = k.rgb(255, 255, 255);
            });
        }

        // --- EVENTOS DO JOGO (RECEBIDOS DO APP DE TREINO) ---
        state.eventBus.on("correctAnswer", (word, points) => {
            playerAttackAnimation();

            // Dano = Ataque do jogador + bônus de pontos - Defesa do inimigo
            const damageDealt = Math.max(1, state.playerStats.atk + (points / 2) - enemyStats.def);
            enemyStats.hp = Math.max(0, enemyStats.hp - damageDealt);
            
            updateUI();
            saveGame(); // Salva o estado atual do jogador

            if (enemyStats.hp <= 0) {
                //k.shake(20);
                k.wait(1, () => {
                    // Lógica para o próximo inimigo (ex: reaparece mais forte)
                    const nextEnemyData = enemyData.goblin; // Luta contra um goblin
                    enemyStats = JSON.parse(JSON.stringify(nextEnemyData.stats));
                    enemy.use(k.sprite(nextEnemyData.spriteDef));
                    updateUI();
                });
            }
        });

        state.eventBus.on("incorrectAnswer", () => {
            playerDamageAnimation();

            // Dano recebido = Ataque do inimigo - Defesa do jogador
            const damageTaken = Math.max(1, enemyStats.atk - state.playerStats.def);
            state.playerStats.hp = Math.max(0, state.playerStats.hp - damageTaken);

            updateUI();
            saveGame();

            if (state.playerStats.hp <= 0) {
                k.wait(1, () => k.go("gameOver")); // Espera um segundo antes da tela de game over
            }
        });
    };
}