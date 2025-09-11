// config.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Chaves e Padrões de Configuração ---
    const settingsKey = 'kanaeAppSettings';
    const defaultSettings = {
        isDarkMode: false,
        speechRate: 0.7,
        practiceHiragana: true,
        practiceKatakana: true,
        practiceKanji: true,
        showFurigana: true,
		gameMode: 'hiragana-to-romaji'
    };
    let currentSettings = {};

    // --- Elementos do DOM ---
    const settingsPanel = document.getElementById('settings-panel');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const speechRateSlider = document.getElementById('speech-rate-slider');
    const speechRateLabel = document.getElementById('speech-rate-label');
    const resetSrsBtn = document.getElementById('reset-srs-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const hiraganaFilter = document.getElementById('hiragana-filter');
    const katakanaFilter = document.getElementById('katakana-filter');
    const kanjiModeToggle = document.getElementById('kanji-mode-toggle');
    const furiganaModeToggle = document.getElementById('furigana-mode-toggle');

    // --- Funções de Lógica ---

    /**
     * Salva o objeto de configurações atual no localStorage.
     */
    function saveSettings() {
        localStorage.setItem(settingsKey, JSON.stringify(currentSettings));
    }

    /**
     * Carrega as configurações do localStorage. Se não houver, usa os padrões.
     */
    function loadSettings() {
        const saved = localStorage.getItem(settingsKey);
        // Mescla as configurações salvas com as padrão para garantir que novas configurações sejam aplicadas
        currentSettings = saved ? { ...defaultSettings, ...JSON.parse(saved) } : { ...defaultSettings };
    }

    /**
     * Atualiza a interface do usuário para refletir as configurações carregadas.
     */
    function applySettings() {
        // Aplica o Tema Escuro
        document.body.classList.toggle('dark-mode', currentSettings.isDarkMode);
        darkModeToggle.checked = currentSettings.isDarkMode;

        // Aplica a Velocidade da Pronúncia
        speechRateSlider.value = currentSettings.speechRate;
        updateSpeechRateLabel(currentSettings.speechRate);

        // Aplica o estado dos Filtros de Prática
        hiraganaFilter.checked = currentSettings.practiceHiragana;
        katakanaFilter.checked = currentSettings.practiceKatakana;
        kanjiModeToggle.checked = currentSettings.practiceKanji;
        furiganaModeToggle.checked = currentSettings.showFurigana;
    }

    /**
     * Atualiza o texto do label do slider de velocidade.
     * @param {number} rate - A velocidade atual.
     */
    function updateSpeechRateLabel(rate) {
        if (rate <= 0.6) speechRateLabel.textContent = 'Lento';
        else if (rate <= 0.9) speechRateLabel.textContent = 'Normal';
        else speechRateLabel.textContent = 'Rápido';
    }

    // --- Event Listeners ---

    // Listener do Tema Escuro
    darkModeToggle.addEventListener('change', () => {
        currentSettings.isDarkMode = darkModeToggle.checked;
        document.body.classList.toggle('dark-mode', currentSettings.isDarkMode);
        saveSettings();
    });

    // Listener da Velocidade da Pronúncia
    speechRateSlider.addEventListener('input', () => {
        const newRate = parseFloat(speechRateSlider.value);
        currentSettings.speechRate = newRate;
        updateSpeechRateLabel(newRate);
    });
    speechRateSlider.addEventListener('change', () => {
        saveSettings(); // Salva apenas quando o usuário solta o slider
    });

    // Listener do Reset SRS
    resetSrsBtn.addEventListener('click', () => {
        if (confirm('Você tem certeza que deseja apagar todo o seu progresso de estudo (SRS)? Esta ação não pode ser desfeita.')) {
            localStorage.removeItem('japanesePracticeSRS');
            alert('Progresso de estudo resetado! A página será recarregada.');
            location.reload();
        }
    });

    // Listener de Limpar Histórico
	clearHistoryBtn.addEventListener('click', () => {
		// A lógica complexa foi movida para script.js
		// Agora apenas chamamos a função global.
		clearPracticeHistory();
	});

    // Listeners dos Filtros de Prática
    hiraganaFilter.addEventListener('change', () => {
        currentSettings.practiceHiragana = hiraganaFilter.checked;
        saveSettings();
        if (app && typeof app.nextQuestion === 'function') app.nextQuestion();
    });

    katakanaFilter.addEventListener('change', () => {
        currentSettings.practiceKatakana = katakanaFilter.checked;
        saveSettings();
        if (app && typeof app.nextQuestion === 'function') app.nextQuestion();
    });

    kanjiModeToggle.addEventListener('change', () => {
        currentSettings.practiceKanji = kanjiModeToggle.checked;
        saveSettings();
        if (app && typeof app.nextQuestion === 'function') app.nextQuestion();
    });

    furiganaModeToggle.addEventListener('change', () => {
        currentSettings.showFurigana = furiganaModeToggle.checked;
        saveSettings();
        if (app && typeof app.updateFuriganaVisibility === 'function') app.updateFuriganaVisibility();
    });


    // --- Inicialização ---
    //loadSettings();
    //applySettings();
});

/**
 * Função global para que outros scripts possam obter a velocidade da fala.
 * @returns {number} A velocidade da fala salva.
 */
function getSpeechRate() {
    const saved = localStorage.getItem('kanaeAppSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        return settings.speechRate || 0.7;
    }
    return 0.7; // Padrão
}

/**
 * Salva o modo de jogo atual nas configurações.
 * @param {string} newMode - O novo modo de jogo.
 */
function saveGameMode(newMode) {
    const saved = localStorage.getItem('kanaeAppSettings');
    let currentSettings = saved ? JSON.parse(saved) : {};
    currentSettings.gameMode = newMode;
    localStorage.setItem('kanaeAppSettings', JSON.stringify(currentSettings));
}

/**
 * Obtém o modo de jogo salvo.
 * @returns {string} O modo de jogo salvo.
 */
function getGameMode() {
    const saved = localStorage.getItem('kanaeAppSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        return settings.gameMode || 'hiragana-to-romaji';
    }
    return 'hiragana-to-romaji'; // Padrão
}