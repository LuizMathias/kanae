// kanaequest/utils/stateManager.js

/**
 * Gerencia o estado global do jogo que precisa persistir entre as cenas.
 * - selectedCharacterKey: A chave do personagem escolhido (ex: "ronin").
 * - playerStats: Os status ATUAIS do jogador (HP, MP, etc.), que serão modificados durante a batalha.
 * - eventBus: O objeto que recebe os eventos do app de treino.
 */
export const state = {
    selectedCharacterKey: null,
    playerStats: null,
    eventBus: null,
};

/**
 * Salva o progresso atual do jogador no localStorage.
 */
export function saveGame() {
    if (!state.selectedCharacterKey || !state.playerStats) return;
    const saveData = {
        character: state.selectedCharacterKey,
        stats: state.playerStats,
    };
    localStorage.setItem("kanaeQuestSave", JSON.stringify(saveData));
}

/**
 * Carrega o progresso do jogador do localStorage.
 * @returns {boolean} - Retorna true se um save foi carregado com sucesso, false caso contrário.
 */
export function loadGame() {
    const savedData = localStorage.getItem("kanaeQuestSave");
    if (savedData) {
        const data = JSON.parse(savedData);
        state.selectedCharacterKey = data.character;
        state.playerStats = data.stats;
        return true;
    }
    return false;
}

/**
 * Limpa os dados salvos.
 */
export function clearSave() {
    localStorage.removeItem("kanaeQuestSave");
}