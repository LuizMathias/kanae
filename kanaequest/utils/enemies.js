// kanaequest/utils/enemies.js

export const enemyData = {
    lizardman: {
        name: "Homem Lagarto",
        assetPath: "sprites/lizardman_v1.png", // Caminho a partir da pasta assets/
        stats: {
            hp: 120,
            atk: 8,
            def: 5,
        },
        // Definição específica do sprite dentro do atlas
        spriteDef: {
            sliceX: 5,
            sliceY: 5,
            anims: {
                idle: { from: 0, to: 1, speed: 3, loop: true },
                attack1: { from: 2, to: 3, speed: 4, loop: false },
            },
        }
    },
    goblin: {
        name: "Goblin",
        assetPath: "sprites/goblin_v1.png", // Exemplo de um novo asset
        stats: {
            hp: 80,
            atk: 6,
            def: 3,
        },
        spriteDef: {
            sliceX: 5,
            sliceY: 5,
            anims: {
                idle: { from: 0, to: 1, speed: 2, loop: true },
                attack1: { from: 2, to: 3, speed: 5, loop: false },
            },
        }
    },
};

/**
 * Carrega todos os sprites dos inimigos.
 * @param {KaboomCtx} k - A instância do Kaboom.
 * @returns {Promise[]} - Um array de promessas de carregamento para usar com Promise.all.
 */
export function loadEnemySprites(k) {
    const promises = [];
    for (const [key, data] of Object.entries(enemyData)) {
        promises.push(k.loadSprite(key, data.assetPath, data.spriteDef));
    }
    return promises;
}