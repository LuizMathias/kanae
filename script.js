// script.js
const app = {}; // Nosso objeto global para comunicação

var utterance = new SpeechSynthesisUtterance();
let practiceHistory = [];
let historyListContainer;

function renderHistory() {
	if (!historyListContainer) return;
	historyListContainer.innerHTML = '';
	if (practiceHistory.length === 0) {
		historyListContainer.innerHTML = '<p style="color: #999;">Nenhuma palavra no histórico ainda.</p>';
		return;
	}
	practiceHistory.forEach(item => {
		const itemDiv = document.createElement('div');
		itemDiv.className = `history-item ${item.status}`;
		itemDiv.innerHTML = `
			<div class="history-word">${item.word}</div>
			<div class="history-label">Romaji:</div>
			<div class="history-value">${item.romaji}</div>
			<div class="history-label">Tradução:</div>
			<div class="history-value">${item.meaning}</div>
		`;
		historyListContainer.appendChild(itemDiv);
	});
}

function clearPracticeHistory() {
    if (confirm('Você tem certeza que deseja limpar todo o seu histórico de prática?')) {
        practiceHistory.length = 0; // Limpa o array
        localStorage.removeItem('japanesePracticeHistory');
        renderHistory(); // Re-renderiza a lista vazia
        alert('Histórico de prática limpo com sucesso!');
    }
}

document.addEventListener('DOMContentLoaded', () => {

	//window.matchMedia('(display-mode: standalone)')

    // --- Variáveis Globais de Estado da UI ---
    let currentWord = {};

	let { score, streak } = loadGameStats();

    let mode = 'hiragana-to-romaji';
    let isAnswered = false;    
    let currentReviewState = {}; // Rastreia ajudas (dica, áudio)

    // Criamos um objeto "placeholder" para o jogo.
    // As funções não fazem nada, apenas evitam erros se forem chamadas antes do jogo carregar.
    let KanaeQuest = {
        handleCorrectAnswer: () => {},
        handleIncorrectAnswer: () => {}
    };
    // Referências aos novos elementos
    const gamePlaceholder = document.getElementById('game-placeholder');
    const gameLoader = document.getElementById('game-loader');
    const gameCanvas = document.getElementById('game-canvas');

    let isGameLoaded = false;
	
	//Adicionamos o listener de clique ao placeholder
	gamePlaceholder.addEventListener('click', async () => {
		await carregamentoKanaeQuest();
	});

	async function carregamentoKanaeQuest() {

		if (isGameLoaded) return; // Não faz nada se o jogo já carregou

		// Mostra o loader e esconde o botão de "play"
		gamePlaceholder.style.display = 'none';
		gameLoader.style.display = 'flex';

		try {
			// 3. Carrega dinamicamente os scripts em ordem
			console.log('Carregando Kaplay.js...');
			//await import('https://unpkg.com/kaboom@3000.0.1/dist/kaboom.js');
			await import('https://unpkg.com/kaplay@3001.0.19/dist/kaplay.js');
			
			console.log('Carregando game-engine.js...');
			const gameModule = await import('./kanaequest/game-engine.js?v'+Date.now());
			
			// 4. Substitui nosso objeto placeholder pelo módulo real
			KanaeQuest = gameModule;
			
			// Esconde o loader e mostra o canvas
			gameLoader.style.display = 'none';
			gameCanvas.style.display = 'block';

			// 5. Inicializa o jogo!
			KanaeQuest.initGame();
			isGameLoaded = true;

		} catch (error) {
			console.error("Falha ao carregar o jogo:", error);
			gameLoader.innerHTML = '<p>Erro ao carregar o jogo.</p>';
		}

	}


    // --- Efeitos Sonoros ---
    const correctSound = new Audio('sounds/correct.mp3');
    const errorSound = new Audio('sounds/error.mp3');

    // --- Elementos do DOM ---
    const questionDisplay = document.getElementById('question-display');
    const meaningDisplay = document.getElementById('meaning-display');
    const romajiInput = document.getElementById('romaji-input');
    const checkBtn = document.getElementById('check-btn');
    const speakerBtn = document.getElementById('speaker-btn');
    const microphoneBtn = document.getElementById('microphone-btn');
    const optionButtons = document.querySelectorAll('.option-btn');
    const skipBtn = document.getElementById('skip-btn');
    const hintBtn = document.getElementById('hint-btn');
    const feedback = document.getElementById('feedback');
    const scorePoints = document.getElementById('score-points');
    const streakCount = document.getElementById('streak-count');
    const categoryDisplay = document.getElementById('category-display');
    const modeHiraganaToRomajiBtn = document.getElementById('mode-hiragana-to-romaji');
    const modeRomajiToHiraganaBtn = document.getElementById('mode-romaji-to-hiragana');
    const microphoneIcon = document.querySelector('#microphone-btn i');
    const hiraganaFilter = document.getElementById('hiragana-filter');
    const katakanaFilter = document.getElementById('katakana-filter');
    const kanjiModeToggle = document.getElementById('kanji-mode-toggle');
    const furiganaModeToggle = document.getElementById('furigana-mode-toggle');
	const showFuriganaBtn = document.getElementById('show-furigana-btn');
	const practicePageTitle = document.getElementById('practice-page-title');

    historyListContainer = document.getElementById('history-list-container');
    
    // --- Lógica de Configurações e Histórico ---
    const settingsKey = 'japanesePracticeSettings';

    /**
     * Calcula os pontos para uma palavra acertada com base na dificuldade e nas ajudas usadas.
     * @param {object} word - O objeto da palavra atual.
     * @param {object} helpState - O objeto com as flags de ajuda (hintUsed, etc.).
     * @returns {number} A quantidade de pontos ganhos.
     */
    function calculatePoints(word, helpState) {
        // 1. Calcular Pontos Base
        let basePoints = 5; // Ponto de partida
        basePoints += Math.floor(word.kana.length / 2); // Bônus por comprimento
        if (word.kanji) {
            basePoints += 5; // Bônus por Kanji
        }

        // 2. Calcular Penalidades por Ajuda
        let penaltyMultiplier = 0;
        if (helpState.hintUsed) penaltyMultiplier += 0.40;
        if (helpState.audioUsed) penaltyMultiplier += 0.30;
        if (helpState.furiganaRevealed) penaltyMultiplier += 0.60;

        let finalPoints = basePoints - (basePoints * penaltyMultiplier);

        // 3. Adicionar Bônus de Sequência (a cada 5 acertos)
        if (streak > 0 && streak % 5 === 0) {
            finalPoints += 10; // Bônus de 10 pontos
        }

        // 4. Garantir que a pontuação mínima seja 1 e arredondar
        return Math.max(1, Math.round(finalPoints));
    }

	/**
	 * Anima a contagem de um número em um elemento HTML.
	 * @param {HTMLElement} element - O elemento a ser animado (ex: scorePoints).
	 * @param {number} start - O número inicial.
	 * @param {number} end - O número final.
	 * @param {number} duration - A duração da animação em milissegundos.
	 */
	function animateCounter(element, start, end, duration) {
		let startTime = null;

		// A função que executa a cada frame da animação
		const step = (currentTime) => {
			if (!startTime) startTime = currentTime;
			const progress = Math.min((currentTime - startTime) / duration, 1); // Calcula o progresso (de 0 a 1)

			// Calcula o número a ser exibido no frame atual
			const currentValue = Math.floor(progress * (end - start) + start);
			element.textContent = currentValue;

			// Continua a animação até o final
			if (progress < 1) {
				requestAnimationFrame(step);
			} else {
				// Garante que o valor final seja exato
				element.textContent = end;
			}
		};

		// Inicia a animação
		requestAnimationFrame(step);
	}	

    function saveSettings_old() {
        const settings = {
            practiceHiragana: hiraganaFilter.checked,
            practiceKatakana: katakanaFilter.checked,
            practiceKanji: kanjiModeToggle.checked,
            showFurigana: furiganaModeToggle.checked,
            gameMode: mode
        };
        localStorage.setItem(settingsKey, JSON.stringify(settings));
    }

    function loadSettings_old() {
        const savedSettings = localStorage.getItem(settingsKey);
        if (savedSettings) {
            const loaded = JSON.parse(savedSettings);
            hiraganaFilter.checked = loaded.practiceHiragana;
            katakanaFilter.checked = loaded.practiceKatakana;
            kanjiModeToggle.checked = loaded.practiceKanji;
            furiganaModeToggle.checked = loaded.showFurigana;
            mode = loaded.gameMode || 'hiragana-to-romaji';
        }
    }

    function loadHistory() {
        const savedHistory = localStorage.getItem('japanesePracticeHistory');
        if (savedHistory) {
            practiceHistory = JSON.parse(savedHistory);
        }
        renderHistory();
    }

    function saveHistory() {
        localStorage.setItem('japanesePracticeHistory', JSON.stringify(practiceHistory));
    }

    function addToHistory(word, wasCorrect) {
        const historyEntry = {
            word: getDisplayWord(word),
            status: wasCorrect ? 'correct' : 'incorrect',
            romaji: word.romaji,
            meaning: word.meaning,
            timestamp: new Date().getTime()
        };
        practiceHistory.unshift(historyEntry);
        if (practiceHistory.length > 100) {
            practiceHistory.pop();
        }
        saveHistory();
        renderHistory();
    }

    // --- Lógica de Exibição e Interação da UI ---
    
    function getDisplayWord_(word) {
        if (!kanjiModeToggle.checked || !word.kanji) {
            return word.kana;
        }
        if (!word.furigana) {
            return word.kanji;
        }
        const furiganaMap = {};
        for (const f of word.furigana) {
            furiganaMap[f.position] = f.reading;
        }
        return word.kanji.split('').map((char, index) => {
            if (furiganaMap[index]) {
                return `<ruby>${char}<rt class="no-transition">${furiganaMap[index]}</rt></ruby>`;
            }
            return char;
        }).join('');
    }

	function getDisplayWord(word) {
		if (!kanjiModeToggle.checked || !word.kanji) {
			return word.kana;
		}
		if (!word.furigana || word.furigana.length === 0) {
			return word.kanji;
		}

		const furiganaMap = {};
		for (const f of word.furigana) {
			furiganaMap[f.position] = f;
		}

		let resultHTML = '';
		let i = 0;
		const kanjiStr = word.kanji;

		while (i < kanjiStr.length) {
			if (furiganaMap[i]) {
				const f = furiganaMap[i];
				const length = f.length || 1;
				const textToWrap = kanjiStr.substring(i, i + length);
				
				// ========================================================================
				// AQUI ESTÁ A MUDANÇA PRINCIPAL
				// ========================================================================
				// Verifica se o seletor global de furigana está desligado
				const hideClass = !furiganaModeToggle.checked ? 'hide-furigana' : '';

				// Adiciona a classe 'hide-furigana' diretamente ao <rt> se necessário
				resultHTML += `<ruby>${textToWrap}<rt class="no-transition ${hideClass}">${f.reading}</rt></ruby>`;
				// ========================================================================

				i += length;
			} else {
				resultHTML += kanjiStr[i];
				i++;
			}
		}
		return resultHTML;
	}

    function updateFuriganaVisibility(noTransition = false) {
        const furiganaElements = document.querySelectorAll('rt');
        const showFurigana = furiganaModeToggle.checked;
        furiganaElements.forEach(rt => {
            if (noTransition) {
                rt.classList.add('no-transition');
            } else {
                rt.classList.remove('no-transition');
            }
            rt.classList.toggle('hide-furigana', !showFurigana);
        });
    }

    function updateFuriganaToggleState(noTransition = false) {
        const kanjiOn = kanjiModeToggle.checked;
        furiganaModeToggle.disabled = !kanjiOn;
        if (noTransition) {
            document.querySelectorAll('rt').forEach(rt => { rt.classList.add('no-transition'); });
        }
        if (!kanjiOn) {
            document.querySelectorAll('rt').forEach(rt => rt.classList.add('hide-furigana'));
        } else {
            updateFuriganaVisibility(noTransition);
        }
    }

    function nextQuestion() {
        isAnswered = false;
        currentReviewState = { audioUsed: false, hintUsed: false, furiganaRevealed: false }; // Reseta o estado

        // Pede a próxima palavra ao motor SRS, passando os filtros atuais
        currentWord = SrsEngine.getNextWord({
            hiragana: hiraganaFilter.checked,
            katakana: katakanaFilter.checked,
            kanji: kanjiModeToggle.checked
        });
        
        kanjiModeToggle.disabled = false;
		showFuriganaBtn.disabled = false; // Reabilita o botão para a próxima palavra

        if (currentWord.error) {
            questionDisplay.innerHTML = 'Oops!';
            meaningDisplay.textContent = currentWord.meaning;
            meaningDisplay.style.visibility = 'visible';
            categoryDisplay.textContent = '';
            feedback.textContent = '';
            toggleInputs(true);
            furiganaModeToggle.disabled = !kanjiModeToggle.checked;
            return;
        }

		updateShowFuriganaButton();

        categoryDisplay.textContent = `${currentWord.category || 'Geral'}`;
        feedback.textContent = '';
        meaningDisplay.style.visibility = 'hidden';
        meaningDisplay.textContent = '';
        checkBtn.textContent = 'Verificar';
        toggleInputs(false);
        if (currentWord.meaning.includes('Partícula')) {
            meaningDisplay.textContent = `Partícula`;
            meaningDisplay.style.visibility = 'visible';
        }
        document.querySelectorAll('rt').forEach(rt => { rt.classList.add('no-transition'); });
        updateFuriganaToggleState(true);

        const h2rSection = document.getElementById('answer-section-hiragana-to-romaji');
        const r2hSection = document.getElementById('answer-section-romaji-to-hiragana');

        if (mode === 'hiragana-to-romaji') {
            questionDisplay.innerHTML = getDisplayWord(currentWord);
            romajiInput.value = '';
            romajiInput.focus();
            h2rSection.classList.remove('hidden');
            r2hSection.classList.add('hidden');
            checkBtn.style.display = 'inline-block';
            microphoneBtn.style.display = 'inline-block';
            speakerBtn.style.display = 'inline-block';
        } else {
            questionDisplay.textContent = currentWord.romaji;
            setupOptions();
            h2rSection.classList.add('hidden');
            r2hSection.classList.remove('hidden');
            checkBtn.style.display = 'none';
            microphoneBtn.style.display = 'none';
            speakerBtn.style.display = 'none';
        }
        updateFuriganaVisibility(true);
    }

    // NOVO: Controla a visibilidade do botão "Furigana"
    function updateShowFuriganaButton() {
        // O botão só aparece se: Kanji está LIGADO, Furigana geral está DESLIGADO, e a palavra TEM kanji/furigana
        const isHardMode = kanjiModeToggle.checked && !furiganaModeToggle.checked && currentWord.furigana;
        showFuriganaBtn.classList.toggle('visible', isHardMode);
    }	
    
    function handleResult(isCorrect) {
        isAnswered = true;
        toggleInputs(true);

        // Calcula a dificuldade da sessão com os novos pesos
        let difficultyScore = 0;
        if (isCorrect) {
            // Dica de significado: ajuda pequena
            if (currentReviewState.hintUsed) difficultyScore += 1;
            // Áudio: ajuda grande para a leitura
            if (currentReviewState.audioUsed) difficultyScore += 2;

            // MODIFICADO: Penalidade do Furigana só se aplica se a palavra tiver kanji
            if (kanjiModeToggle.checked && furiganaModeToggle.checked && currentWord.furigana) {
                difficultyScore += 1;
            }
            // NOVO: Penalidade por revelar o furigana sob demanda
            if (currentReviewState.furiganaRevealed) {
                difficultyScore += 2;
            }

        } else {
            difficultyScore = 5;
        }
        
        // Informa o motor SRS para atualizar a palavra com a nova dificuldade
        SrsEngine.updateWord(currentWord, difficultyScore);
        addToHistory(currentWord, isCorrect);
        
        if (isCorrect) {
            correctSound.play();

			const pointsGained = calculatePoints(currentWord, currentReviewState);
			const previousScore = score; // Guarda o placar antigo
            score += pointsGained;
            streak++;

			// >>> INTEGRAÇÃO COM O JOGO <<<
			KanaeQuest.handleCorrectAnswer(currentWord, pointsGained);

			feedback.textContent = 'Correto!';
            feedback.className = 'feedback correct';
            meaningDisplay.textContent = currentWord.meaning;
            meaningDisplay.style.visibility = 'visible';

			// 1. Anima o contador do placar
			animateCounter(scorePoints, previousScore, score, 500); // Anima por 500ms

			// 2. Aciona o efeito "pop"
			scorePoints.classList.add('score-updated');
			
			// 3. Remove a classe do efeito após a animação para que possa ser usada novamente
			setTimeout(() => {
				scorePoints.classList.remove('score-updated');
			}, 200); // 200ms é a duração da transição no CSS

			// 4. Atualiza a sequência e SALVA o progresso
			streakCount.textContent = streak;

			updateScore(); // Atualiza e salva o placar (com a nova sequência)

            setTimeout(nextQuestion, 2000);
        } else {
            errorSound.play();
            streak = 0;
            const correctAnswerDisplay = mode === 'hiragana-to-romaji' ? currentWord.romaji : getDisplayWord(currentWord);
            feedback.innerHTML = `Incorreto. A resposta era: <strong>${correctAnswerDisplay}</strong>`;
            feedback.className = 'feedback incorrect';
            updateScore();
            checkBtn.textContent = 'Próximo';
            checkBtn.style.display = 'inline-block';
            checkBtn.disabled = false;

			// >>> INTEGRAÇÃO COM O JOGO <<<
        	KanaeQuest.handleIncorrectAnswer();
        }
    }
    
    function skipQuestion() {
        errorSound.play();
        streak = 0; // Zera a sequência
        const correctAnswerDisplay = mode === 'hiragana-to-romaji' ? currentWord.romaji : getDisplayWord(currentWord);
        feedback.innerHTML = `A resposta é: <strong>${correctAnswerDisplay}</strong>`;
        feedback.className = 'feedback incorrect';
        showHint();
        updateScore(); // Atualiza e salva o placar (com a sequência zerada)
        isAnswered = true;
        toggleInputs(true);
        checkBtn.textContent = 'Próximo';
        checkBtn.style.display = 'inline-block';
        checkBtn.disabled = false;
        addToHistory(currentWord, false);
        SrsEngine.updateWord(currentWord, 5);
    }
    
    function showHint() {
        if (currentWord.meaning) {
            meaningDisplay.textContent = `Dica: ${currentWord.meaning}`;
            meaningDisplay.style.visibility = 'visible';
        }
        currentReviewState.hintUsed = true;
    }

    function speakJapanese(word, rate = 0.7) {
        currentReviewState.audioUsed = true;
        utterance.lang = 'ja-JP';
        utterance.rate = 0.1;
        utterance.text = ' ';
        window.speechSynthesis.speak(utterance);
        setTimeout(() => {
            speechSynthesis.cancel();
        }, 100);
        setTimeout(() => {
            utterance.rate = rate;
            utterance.text = word;
            window.speechSynthesis.speak(utterance);
        }, 200);
    }

    function toggleInputs(disabled) {
        romajiInput.disabled = disabled;
        checkBtn.disabled = disabled;
        skipBtn.disabled = disabled;
        hintBtn.disabled = disabled;
        optionButtons.forEach(btn => btn.disabled = disabled);
    }

    function setupOptions() {
        let options = [currentWord];
		let attempts = 0; // Nosso "disjuntor"
        while (options.length < 4) {
            let randomOption = SrsEngine.getNextWord({
                hiragana: hiraganaFilter.checked,
                katakana: katakanaFilter.checked,
                kanji: kanjiModeToggle.checked
            });
            if (!randomOption.error && !options.some(opt => opt.kana === randomOption.kana)) {
                options.push(randomOption);
            }
			if (attempts++ > 20) break; // Evita loop infinito
        }
        const shuffledOptions = shuffleArray(options);
        optionButtons.forEach((button, index) => {
            button.innerHTML = getDisplayWord(shuffledOptions[index]);
            button.onclick = () => checkOption(shuffledOptions[index]);
            button.style.backgroundColor = '';
        });
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function checkAnswer() {
        if (isAnswered) {
            nextQuestion();
            return;
        }
        const userAnswer = romajiInput.value.toLowerCase().trim();
        const isCorrect = userAnswer.replaceAll(' ', '') === currentWord.romaji.replaceAll(' ', '');
        handleResult(isCorrect);
    }

    function checkOption(selectedOption) {
        if (isAnswered) return;
        const isCorrect = selectedOption.kana === currentWord.kana;
        handleResult(isCorrect);
        optionButtons.forEach(btn => {
            if (btn.innerHTML === getDisplayWord(currentWord)) {
                btn.style.backgroundColor = 'var(--correct-color)';
            } else if (btn.innerHTML === getDisplayWord(selectedOption) && !isCorrect) {
                btn.style.backgroundColor = 'var(--incorrect-color)';
            }
        });
    }
    
    function updateScore() {
        scorePoints.textContent = score;
        streakCount.textContent = streak;
		saveGameStats({ score, streak });
    }
    
    function switchMode(newMode) {
        mode = newMode;
        updateScore();
        if (newMode === 'hiragana-to-romaji') {
			practicePageTitle.textContent = 'Treino | Leitura → Romaji';
            questionDisplay.classList.remove('romaji');
            modeHiraganaToRomajiBtn.classList.add('active');
            modeRomajiToHiraganaBtn.classList.remove('active');
        } else {
			practicePageTitle.textContent = 'Treino | Romaji → Leitura';
            questionDisplay.classList.add('romaji');
            modeHiraganaToRomajiBtn.classList.remove('active');
            modeRomajiToHiraganaBtn.classList.add('active');
        }
		saveGameMode(newMode);
        //saveSettings();
        nextQuestion();
    }
    
    const kanaTable = document.querySelectorAll('.kana-table td');
    kanaTable.forEach(function(o) { /* ... (código existente) ... */ });
    
    function SpeechRecognitionJapanese() { /* ... (código existente) ... */ }
    // Colando para manter completo

    kanaTable.forEach(function(o){
		var content = o.innerHTML;
		if(content!="") content=content.split("<br>")[0];
		if(content!="") o.addEventListener("click",function(e){
			var content=e.target.innerHTML;
			if(content!="") content=content.split("<br>")[0];
			speakJapanese(content+"!!!",.5)
		})
	});

	SpeechRecognitionJapanese = function(){
		const recognition=new(window.SpeechRecognition||window.webkitSpeechRecognition);
		if(recognition){
			recognition.lang="ja-JP";
			recognition.continuous=!1;
			recognition.interimResults=!1;
			recognition.onstart=()=>{
				microphoneIcon.classList.add("fa-ear-listen")
			};
			recognition.onend=()=>{
				microphoneIcon.classList.remove("fa-ear-listen")
			};
			recognition.onerror=event=>{
				console.log("Erro no reconhecimento de voz:",event.error);
				microphoneIcon.classList.remove("fa-ear-listen")
			};
			recognition.onresult=event=>{
				const kanji=currentWord.kanji??"",kana=currentWord.kana;
				let transcript=event.results[0][0].transcript;

				feedback.textContent = `Você disse: "${transcript}"`;

				transcript=transcript.replace("\u3002","").replace("\u3001","").replace("?","").replace(" ","");

				feedback.textContent+=` ("${transcript}")`;
				
				if(transcript==kanji||transcript==kana) {
					romajiInput.value=currentWord.romaji;
					checkBtn.click()
				}
			}
		} else console.log("erro");
		recognition.start()
	};

    // --- Event Listeners ---
    checkBtn.addEventListener('click', checkAnswer);
    skipBtn.addEventListener('click', skipQuestion);
    hintBtn.addEventListener('click', () => {
        romajiInput.focus();
        showHint();
    });
    showFuriganaBtn.addEventListener('click', () => {
        // Remove a classe que esconde todos os furiganas (<rt>)
        document.querySelectorAll('rt').forEach(rt => {
            rt.classList.remove('hide-furigana');
        });
        // Marca que a ajuda foi usada para o SRS
        currentReviewState.furiganaRevealed = true;
        // Desabilita o botão para não ser clicado de novo na mesma palavra
        showFuriganaBtn.disabled = true;
    });
    romajiInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') checkAnswer(); });
    modeHiraganaToRomajiBtn.addEventListener('click', () => { switchMode('hiragana-to-romaji'); app.showPage('practice-page'); });
    modeRomajiToHiraganaBtn.addEventListener('click', () => { switchMode('romaji-to-leitura'); app.showPage('practice-page'); });
    speakerBtn.addEventListener('click', () => { speakJapanese(currentWord.kana); });
    microphoneBtn.addEventListener('click', () => { SpeechRecognitionJapanese(); });
    //hiraganaFilter.addEventListener('change', () => { saveSettings(); nextQuestion(); });
    //katakanaFilter.addEventListener('change', () => { saveSettings(); nextQuestion(); });
    //kanjiModeToggle.addEventListener('change', () => { saveSettings(); nextQuestion(); });
    //furiganaModeToggle.addEventListener('change', () => { saveSettings(); updateFuriganaVisibility(); });

	scorePoints.addEventListener('transitionend', () => {
		scorePoints.classList.remove('score-updated');
	});	

    // --- Inicialização ---
	const loadingOverlay = document.getElementById('loading-overlay');
	loadingOverlay.classList.remove('hidden'); // Mostra o indicador de carregamento
    setTimeout(() => {
        if (typeof vocabulary !== 'undefined' && vocabulary) {
            SrsEngine.init(vocabulary);
            loadHistory();
			updateScore();
            switchMode(getGameMode());
        } else {
            questionDisplay.textContent = "Erro: Vocabulário não encontrado.";
        }
        
        // Esconde o indicador de carregamento quando tudo estiver pronto
        loadingOverlay.classList.add('hidden');
    }, 100); // 100ms é um bom tempo para garantir que a UI seja desenhada
    // ========================================================================

    app.nextQuestion = nextQuestion;
    app.updateFuriganaVisibility = updateFuriganaVisibility;	
});