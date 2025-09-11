// srs-engine.js

const SrsEngine = (function () {
    // --- Configurações e Estado Interno ---
    const srsIntervals = [0.007, 1, 3, 7, 15, 30, 90]; // Intervalos em dias
    const srsDataKey = 'japanesePracticeSRS';
    let srsData = {};
    let allWords = [];

    // Regex para checagem de escrita
    const katakanaRegex = /[\u30A0-\u30FF]/;
    const hiraganaRegex = /[\u3040-\u309F]/;

    // --- Funções Privadas ---

    function loadSrsData() {
        const savedData = localStorage.getItem(srsDataKey);
        if (savedData) {
            srsData = JSON.parse(savedData);
        }
    }

    function saveSrsData() {
        localStorage.setItem(srsDataKey, JSON.stringify(srsData));
    }

    function isKanjiOnly(wordString) {
        if (!wordString) return false;
        return !hiraganaRegex.test(wordString) && !katakanaRegex.test(wordString);
    }

    // --- Funções Públicas (A "API" do nosso motor) ---

    function init(vocabularyObject) {
        allWords = Object.values(vocabularyObject).flatMap(categoryArray => {
            const categoryName = categoryArray[0].category;
            return categoryArray.slice(1).map(word => ({
                ...word,
                category: categoryName
            }));
        });
        loadSrsData();
        console.log(`Motor SRS inicializado com ${allWords.length} palavras.`);
    }

    function getNextWord(filters) {
        let filteredList = allWords.filter(word => {
            if (!filters.hiragana && !filters.katakana && filters.kanji) {
                return isKanjiOnly(word.kanji);
            }
            if (!filters.hiragana && !filters.katakana) {
                return false;
            }
            const hasKatakana = katakanaRegex.test(word.kana);
            if (filters.hiragana && filters.katakana) return true;
            if (filters.hiragana) return !hasKatakana;
            if (filters.katakana) return hasKatakana;
            return false;
        });

        if (filteredList.length === 0) {
            return { error: true, meaning: 'Nenhuma palavra encontrada. Ajuste os filtros.' };
        }

        const now = Date.now();
        const dueForReview = [];
        const newWords = [];

        for (const word of filteredList) {
            const wordData = srsData[word.kana];
            if (!wordData) {
                newWords.push(word);
            } else if (wordData.nextReview <= now) {
                dueForReview.push(word);
            }
        }

        if (dueForReview.length > 0) {
            return dueForReview[Math.floor(Math.random() * dueForReview.length)];
        }
        if (newWords.length > 0) {
            return newWords[Math.floor(Math.random() * newWords.length)];
        }
        return filteredList[Math.floor(Math.random() * filteredList.length)];
    }

    // ========================================================================
    // LÓGICA CORRIGIDA
    // ========================================================================
    function updateWord(word, difficultyScore) {
        const wordKey = word.kana;
        let wordData = srsData[wordKey] || { level: 0, nextReview: Date.now() };

        // REGRA DE APRENDIZADO CORRIGIDA:
        if (difficultyScore <= 1) { // Acerto perfeito (0) ou com pequena ajuda (1)
            wordData.level++; // Sobe de nível
        } else if (difficultyScore >= 3) { // Erro (5) ou ajuda grande como a dica (3)
            wordData.level = Math.max(0, wordData.level - 1); // Desce de nível
        }
        // Se a dificuldade for 2 (não usada no momento), o nível permanece o mesmo (reforço)

        wordData.level = Math.min(wordData.level, srsIntervals.length - 1);

        const intervalDays = srsIntervals[wordData.level];
        const intervalMillis = intervalDays * 24 * 60 * 60 * 1000;
        wordData.nextReview = Date.now() + intervalMillis;

        srsData[wordKey] = wordData;
        saveSrsData();
    }
    // ========================================================================
    
    return {
        init: init,
        getNextWord: getNextWord,
        updateWord: updateWord
    };
})();