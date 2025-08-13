// script.js
var utterance = new SpeechSynthesisUtterance();

document.addEventListener('DOMContentLoaded', () => {
    // --- Variáveis Globais ---
    let currentWord = {};
    let score = 0;
    let streak = 0;
    let mode = 'hiragana-to-romaji';
    let isAnswered = false;
    let practiceHistory = []; // NOVO: Array para o histórico
	
    // ========================================================================
    // NOVO: Carrega os efeitos sonoros
    // ========================================================================
    const correctSound = new Audio('sounds/correct.mp3');
    const errorSound = new Audio('sounds/error.mp3');
    // Opcional: ajuste o volume se achar necessário (0.0 a 1.0)
    // correctSound.volume = 0.5;
    // errorSound.volume = 0.5;	
	
    // ========================================================================
    // NOVO: Processa a nova estrutura do vocabulário
    // ========================================================================
    // Junta todos os arrays de categorias do objeto 'vocabulary' em um único array plano.
    // O .filter(item => item.kana) remove os objetos de cabeçalho (ex: {category: '...'}).
    const allWords = Object.values(vocabulary).flatMap(categoryArray =>
        categoryArray.filter(item => item.kana)
    );
    // ========================================================================
	

    // --- Elementos do DOM ---
    const questionDisplay = document.getElementById('question-display');
    const meaningDisplay = document.getElementById('meaning-display');
    const romajiInput = document.getElementById('romaji-input');
    const checkBtn = document.getElementById('check-btn');
    const speakerBtn = document.getElementById('speaker-btn');
    const microphoneBtn = document.getElementById('microphone-btn');
    const kanjiModeToggle = document.getElementById('kanji-mode-toggle');
    const furiganaModeToggle = document.getElementById('furigana-mode-toggle');
    const historyListContainer = document.getElementById('history-list-container'); // NOVO
    // (outros elementos do DOM)
	
	romajiInput.addEventListener('blur', () => {
		document.getElementById('inflate').style.height = '0';
	});
	
    romajiInput.addEventListener('focus', () => {
		return;
        setTimeout(() => {
			document.getElementById('inflate').style.height = '400px';

            const viewport = window.visualViewport;
            const rect = romajiInput.getBoundingClientRect();

            // Calcula a posição que deixa o input encostado no teclado
			
            var targetScroll = window.scrollY + rect.top - (viewport.height - rect.height - 10);
			//targetScroll = viewport.height*-1;
			romajiInput.value = targetScroll;
            window.scrollTo({
                top: targetScroll,
                behavior: 'instant'
            });
			
        }, 300); // espera o teclado abrir
    });	
	

    // --- LÓGICA DO HISTÓRICO ---

    // NOVO: Carrega o histórico do localStorage quando a página abre
    function loadHistory() {
        const savedHistory = localStorage.getItem('japanesePracticeHistory');
        if (savedHistory) {
            practiceHistory = JSON.parse(savedHistory);
        }
        renderHistory();
    }

    // NOVO: Salva o histórico no localStorage
    function saveHistory() {
        localStorage.setItem('japanesePracticeHistory', JSON.stringify(practiceHistory));
    }

    // NOVO: Adiciona um item ao histórico
    function addToHistory(word, wasCorrect) {
        const historyEntry = {
            word: getDisplayWord(word), // Pega a palavra com ou sem furigana
            status: wasCorrect ? 'correct' : 'incorrect',
            romaji: word.romaji,
            meaning: word.meaning,
            timestamp: new Date().getTime()
        };

        // Adiciona o novo registro no início do array
        practiceHistory.unshift(historyEntry);

        // Limita o histórico aos últimos 100 itens para não sobrecarregar
        if (practiceHistory.length > 100) {
            practiceHistory.pop();
        }

        saveHistory();
        renderHistory();
    }

    // NOVO: Renderiza a lista de histórico no painel
    function renderHistory() {
        if (!historyListContainer) return;

        historyListContainer.innerHTML = ''; // Limpa a lista atual

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


    // MODIFICADO: Função `handleResult` para chamar a adição ao histórico
    function handleResult(isCorrect) {
        isAnswered = true;
        toggleInputs(true);
        
        // CHAMA A FUNÇÃO PARA ADICIONAR AO HISTÓRICO
        addToHistory(currentWord, isCorrect);

        if (isCorrect) {
			correctSound.play(); // Toca o som de acerto
            score++;
            streak++;
            feedback.textContent = 'Correto!';
            feedback.className = 'feedback correct';
            meaningDisplay.textContent = currentWord.meaning;
            meaningDisplay.style.visibility = 'visible';
            updateScore();
            setTimeout(nextQuestion, 2000);
        } else {
			errorSound.play(); // Toca o som de erro
            streak = 0;
            const correctAnswerDisplay = mode === 'hiragana-to-romaji' ? currentWord.romaji : getDisplayWord(currentWord);
            feedback.innerHTML = `Incorreto. A resposta era: <strong>${correctAnswerDisplay}</strong>`;
            feedback.className = 'feedback incorrect';
            updateScore();
            checkBtn.textContent = 'Próximo';
            checkBtn.style.display = 'inline-block';
            checkBtn.disabled = false;
        }
    }

    // --- O restante do seu script.js ---
    // (Cole o resto do seu script.js aqui, ele não precisa de mais alterações para o histórico funcionar)
    const optionButtons = document.querySelectorAll('.option-btn');
    const skipBtn = document.getElementById('skip-btn');
    const hintBtn = document.getElementById('hint-btn');
    const feedback = document.getElementById('feedback');
    const scorePoints = document.getElementById('score-points');
    const streakCount = document.getElementById('streak-count');
    const modeHiraganaToRomajiBtn = document.getElementById('mode-hiragana-to-romaji');
    const modeRomajiToHiraganaBtn = document.getElementById('mode-romaji-to-hiragana');
    const microphoneIcon = document.querySelector('#microphone-btn i');
    const hiraganaFilter = document.getElementById('hiragana-filter');
    const katakanaFilter = document.getElementById('katakana-filter');
    const katakanaRegex = /[\u30A0-\u30FF]/;
    const hiraganaRegex = /[\u3040-\u309F]/;
	
    // ========================================================================
    // NOVO: LÓGICA PARA MEMORIZAR AS CONFIGURAÇÕES
    // ========================================================================

    const settings = {
        practiceHiragana: true,
        practiceKatakana: true,
        practiceKanji: true,
        showFurigana: true
    };
    const settingsKey = 'japanesePracticeSettings';

    function saveSettings() {
        settings.practiceHiragana = hiraganaFilter.checked;
        settings.practiceKatakana = katakanaFilter.checked;
        settings.practiceKanji = kanjiModeToggle.checked;
        settings.showFurigana = furiganaModeToggle.checked;
		settings.gameMode = mode // Salva o modo atual
        localStorage.setItem(settingsKey, JSON.stringify(settings));
    }

    function loadSettings() {
        const savedSettings = localStorage.getItem(settingsKey);
        if (savedSettings) {
            const loaded = JSON.parse(savedSettings);
            hiraganaFilter.checked = loaded.practiceHiragana;
            katakanaFilter.checked = loaded.practiceKatakana;
            kanjiModeToggle.checked = loaded.practiceKanji;
            furiganaModeToggle.checked = loaded.showFurigana;
			mode = loaded.gameMode || 'hiragana-to-romaji'; // Define o modo de jogo
        }
    }

    // ========================================================================
    // FIM DA NOVA LÓGICA
    // ========================================================================
	

    function isKanjiOnly(wordString) {
        if (!wordString) return false;
        return !hiraganaRegex.test(wordString) && !katakanaRegex.test(wordString);
    }

    function getFilteredVocabulary() {
        const practiceHiragana = hiraganaFilter.checked;
        const practiceKatakana = katakanaFilter.checked;
        const practiceKanji = kanjiModeToggle.checked;

        if (!practiceHiragana && !practiceKatakana && practiceKanji) {
            return allWords.filter(word => isKanjiOnly(word.kanji));
        }

        if (!practiceHiragana && !practiceKatakana) {
            return [];
        }

        return allWords.filter(word => {
            const hasKatakana = katakanaRegex.test(word.kana);
            if (practiceHiragana && practiceKatakana) return true;
            if (practiceHiragana) return !hasKatakana;
            if (practiceKatakana) return hasKatakana;
            return false;
        });
    }

    function getRandomWord() {
        const filteredList = getFilteredVocabulary();
        if (filteredList.length === 0) {
            return { error: true, meaning: 'Nenhuma palavra encontrada. Ajuste os filtros.' };
        }
        const randomIndex = Math.floor(Math.random() * filteredList.length);
        return filteredList[randomIndex];
    }
    
    function getDisplayWord(word) {
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

    function updateFuriganaVisibility(noTransition=false) {
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

    function updateFuriganaToggleState(noTransition=false) {
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
        currentWord = getRandomWord();
        kanjiModeToggle.disabled = false;
        if (currentWord.error) {
            questionDisplay.innerHTML = 'Oops!';
            meaningDisplay.textContent = currentWord.meaning;
            meaningDisplay.style.visibility = 'visible';
            feedback.textContent = '';
            toggleInputs(true);
            furiganaModeToggle.disabled = !kanjiModeToggle.checked;
            return;
        }
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
    
    function toggleInputs(disabled) {
        romajiInput.disabled = disabled;
        checkBtn.disabled = disabled;
        skipBtn.disabled = disabled;
        hintBtn.disabled = disabled;
        optionButtons.forEach(btn => btn.disabled = disabled);
    }

    function setupOptions() {
        let options = [currentWord];
        while (options.length < 4) {
            let randomOption = getRandomWord();
            if (!randomOption.error && !options.some(opt => opt.kana === randomOption.kana)) {
                options.push(randomOption);
            }
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
        const isCorrect = userAnswer === currentWord.romaji;
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
    }

    function skipQuestion() {
		errorSound.play(); // Toca o som de erro
        streak = 0;
        const correctAnswerDisplay = mode === 'hiragana-to-romaji' ? currentWord.romaji : getDisplayWord(currentWord);
        feedback.innerHTML = `A resposta é: <strong>${correctAnswerDisplay}</strong>`;
        feedback.className = 'feedback incorrect';
        showHint();
        updateScore();
        isAnswered = true;
        toggleInputs(true);
        checkBtn.textContent = 'Próximo';
        checkBtn.style.display = 'inline-block';
        checkBtn.disabled = false;
        // Adiciona ao histórico como erro ao pular
        addToHistory(currentWord, false);
    }
    
    function showHint() {
        if (currentWord.meaning) {
            meaningDisplay.textContent = `Dica: ${currentWord.meaning}`;
            meaningDisplay.style.visibility = 'visible';
        }
    }
    
    function switchMode(newMode) {
        mode = newMode;
        score = 0;
        streak = 0;
        updateScore();
        if (newMode === 'hiragana-to-romaji') {
            modeHiraganaToRomajiBtn.classList.add('active');
            modeRomajiToHiraganaBtn.classList.remove('active');
        } else {
            modeHiraganaToRomajiBtn.classList.remove('active');
            modeRomajiToHiraganaBtn.classList.add('active');
        }
		saveSettings();
        nextQuestion();
    }
    
	function speakJapanese(word, rate=0.7) {
		utterance.lang = 'ja-JP'; // Define o idioma para japonês
		utterance.rate = 0.1; // Ajusta a velocidade da fala		
		
		// Placeholder to start the buffer
		utterance.text = 'aaaaa';
		window.speechSynthesis.speak(utterance);

		setTimeout(function(){
			// Speak
			speechSynthesis.cancel(); // Cancela qualquer fala pendente
		},100);		
		setTimeout(function(){
			// Speak
			utterance.rate = rate;
			utterance.text = word;
			window.speechSynthesis.speak(utterance);
		},200);
	}	
	
	const kanaTable = document.querySelectorAll('.kana-table td');
	kanaTable.forEach(function(o) {
		var content = o.innerHTML;
		if (content!='') content = content.split('<br>')[0];
		if (content!='') {
			o.addEventListener('click', function(e) {
				var content = e.target.innerHTML;
				if (content!='') content = content.split('<br>')[0];
				speakJapanese(content+'!!!', 0.5);
			});
		}
	});		
	
	function SpeechRecognitionJapanese() {
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		let recognition;
		console.log(SpeechRecognition);
		if (SpeechRecognition) {
			recognition = new SpeechRecognition();
			recognition.lang = 'ja-JP'; // Reconhecer o idioma japonês
			recognition.continuous = false; // Apenas uma tentativa por vez
			recognition.interimResults = false; // Queremos apenas o resultado final

			// Evento chamado quando o reconhecimento começa
			recognition.onstart = () => {
				microphoneIcon.classList.add('fa-ear-listen');
			};

			// Evento chamado quando o reconhecimento termina
			recognition.onend = () => {
				microphoneIcon.classList.remove('fa-ear-listen');
			};

			// Evento chamado em caso de erro
			recognition.onerror = (event) => {
				console.log("Erro no reconhecimento de voz:", event.error);
				microphoneIcon.classList.remove('fa-ear-listen');
			};
			
			recognition.onaudiostart = () => console.log("🎤 Áudio detectado");
			recognition.onaudioend = () => console.log("🔇 Áudio finalizado");
			recognition.onsoundstart = () => console.log("🔊 Som detectado");
			recognition.onsoundend = () => console.log("🔇 Som finalizado");
			recognition.onspeechstart = () => console.log("🗣 Fala detectada");
			recognition.onspeechend = () => console.log("🤐 Fala finalizada");
			recognition.onnomatch = () => console.log("❓ Não entendi o que foi dito");			

			// Evento PRINCIPAL: chamado quando um resultado é obtido
			recognition.onresult = (event) => {
				const kanji = currentWord.kanji ?? '';
				const kana = currentWord.kana;
				var transcript = event.results[0][0].transcript;
				transcript = transcript.replace('。','').replace('、','').replace('?','').replace(' ','');
				console.log(event.results);
				console.log('transcript', transcript);
				console.log('kanji', kanji);
				console.log('kana', kana);
				const isCorrect = transcript==kanji || transcript==kana;
				if (isCorrect) {
					console.log('correto');
					romajiInput.value = currentWord.romaji;
					checkBtn.click();
				}
			};
		} else {
			console.log('erro');
		}
		recognition.start();
	}		

    // --- Event Listeners ---
    checkBtn.addEventListener('click', checkAnswer);
    skipBtn.addEventListener('click', skipQuestion);
    hintBtn.addEventListener('click', () => {
		romajiInput.focus();
		showHint();
	});
    romajiInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') checkAnswer(); });
    modeHiraganaToRomajiBtn.addEventListener('click', () => switchMode('hiragana-to-romaji'));
    modeRomajiToHiraganaBtn.addEventListener('click', () => switchMode('romaji-to-leitura'));
    speakerBtn.addEventListener('click', () => { speakJapanese(currentWord.kana); });
    microphoneBtn.addEventListener('click', () => { SpeechRecognitionJapanese(); });

    // Listeners para os toggles
	hiraganaFilter.addEventListener('change', () => { saveSettings(); nextQuestion(); });
	katakanaFilter.addEventListener('change', () => { saveSettings(); nextQuestion(); });
    kanjiModeToggle.addEventListener('change', () => { saveSettings(); nextQuestion(); });
    furiganaModeToggle.addEventListener('change', () => { saveSettings(); updateFuriganaVisibility(); });

    // --- Inicialização ---
    if (typeof allWords !== 'undefined' && allWords.length > 0) {
		loadSettings(); // Carrega as configurações salvas
        loadHistory(); // Carrega o histórico ao iniciar
        // A função switchMode agora é chamada com o modo que foi carregado do localStorage
        // e apenas ajusta a UI e busca a primeira palavra.
        switchMode(mode);
    } else {
        questionDisplay.textContent = "Erro: Vocabulário não encontrado.";
    }
});