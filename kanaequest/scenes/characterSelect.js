// kanaequest/scenes/characterSelect.js

import { characterData } from "../utils/characters.js";
import { state, saveGame, clearSave } from "../utils/stateManager.js";

export default function createCharacterSelectScene(k) {
    return () => {

        k.add([
            k.rect(k.width(), k.height()),
            k.color(30, 10, 10),
            k.z("bg"),
        ]);

		k.loadSprite("background", "../assets/background/bridge_01.png");

        k.add([
            k.sprite("background"),
            k.pos(k.center()),
			k.scale(scaleFactor),
            k.anchor("center"),
            //k.scale(Math.max(scaleX, scaleY)),
            k.z("bg"),
        ]);

        k.add([
            k.text("Escolha seu Herói", { size: 40 }),
            k.pos(k.center().x, k.height() * 0.15),
            k.anchor("center"),
            k.z("ui"),
        ]);

        // Posição inicial para o primeiro personagem
        let yPos = k.height() * 0.5;
		let xPos = 600 * scaleFactor;
        
        // Loop para criar um botão para cada personagem
        for (const charKey in characterData) {
            const char = characterData[charKey];

			const charButton = k.add([
				k.sprite(charKey), // Usa a chave do personagem (ex: "ronin")
				k.pos(xPos, 280 * scaleFactor),
				k.scale(scaleFactor*0.7), // aplica escala proporcional
				k.anchor("center"),
				k.area(),
				k.z("ui"),
				"charBtn",
				{ charKey: charKey }
			]);
			charButton.play("idle");
            
			/*
            const charButton = k.add([
                k.rect(300, 60, { radius: 8 }),
                k.pos(k.center().x, yPos),
                k.anchor("center"),
                k.area(),
                k.z("ui"),
                "charBtn",
                { charKey: charKey }, // Guarda a chave do personagem no objeto
            ]);
			*/

            charButton.add([
				k.rect(300 * scaleFactor, 50 * scaleFactor , { radius: 8 }),
				k.pos(0, 300 * (scaleFactor)),
                k.anchor("top"),
                k.color(0, 0, 0),
            ]);

            charButton.add([
                k.text(
					`${char.name}`,// - ${char.description}`, 
					{ 
						size: 26,
						width: 300 * scaleFactor,
						height: 280 * scaleFactor,
						align: "center",
					}
				),
				k.pos(0, 300 * (scaleFactor)),
                k.anchor("top"),
                k.color(255, 255, 255),
            ]);

			xPos-= 150 * scaleFactor;


            //yPos += 70; // Incrementa a posição Y para o próximo botão
        }

        k.onClick("charBtn", (btn) => {
            // Limpa qualquer save anterior
            clearSave();
            
            // Define o personagem e os status no estado global
            state.selectedCharacterKey = btn.charKey;
            // Cria uma cópia profunda dos status para que o original não seja modificado
            state.playerStats = JSON.parse(JSON.stringify(characterData[btn.charKey].stats));
            
            // Salva o novo jogo
            saveGame();

            // Vai para a batalha
            k.go("battle");
        });
    };
}