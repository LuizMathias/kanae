// kanaequest/utils/characters.js

export const characterData = {
    ronin: {
        name: "Ronin",
        assetPath: "sprites/ronin_v2.png", // Caminho a partir da pasta assets/
        description: "Ataque alto, defesa baixa. Usa Ofudas místicos.",
        stats: { hp: 85, atk: 12, def: 6, mp: 20, matk: 15 },
        // Definição do sprite para k.loadSprite
        spriteDef: {
            sliceX: 5,
            sliceY: 5,
            anims: {
                idle: { from: 0, to: 1, loop: true, speed: 3 },
                attack1: { from: 2, to: 3, loop: false, speed: 5 },
            },
        }
    },
    samurai: {
        name: "Samurai",
        assetPath: "sprites/samurai_v1.png", // Exemplo
        description: "Guerreiro equilibrado com armadura resistente.",
        stats: { hp: 100, atk: 10, def: 9, mp: 10, matk: 5 },
        spriteDef: {
            sliceX: 5,
            sliceY: 5,
            anims: {
                idle: { from: 0, to: 1, loop: true, speed: 3 },
                attack1: { from: 2, to: 3, loop: false, speed: 4 },
            },
        }
    },
    // Adicione os outros personagens (knight, mage, sorceress) aqui...
};

/**
 * Carrega todos os sprites dos personagens jogáveis.
 * @param {KaboomCtx} k - A instância do Kaboom.
 * @returns {Promise[]} - Um array de promessas de carregamento.
 */
export function loadCharacterSprites(k) {
    const promises = [];
    // O 'key' será "ronin", "samurai", etc.
    // O 'data' será o objeto com nome, stats, spriteDef, etc.
    for (const [key, data] of Object.entries(characterData)) {
		console.log(data);
        promises.push(k.loadSprite(key, data.assetPath, data.spriteDef));
    }
    return promises;
}