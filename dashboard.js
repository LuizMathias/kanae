// dashboard.js

//const app = window.app || {};

document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM do Dashboard
    const statLearnedEl = document.getElementById('stat-learned');
    const statReviewEl = document.getElementById('stat-review');
    const statStreakEl = document.getElementById('stat-streak');
    const accuracyChartCanvas = document.getElementById('accuracy-chart');

    let accuracyChart = null; // Variável para guardar a instância do gráfico

    /**
     * Cria e renderiza o gráfico de rosca de precisão.
     * @param {number} accuracy - A porcentagem de precisão (0 a 100).
     */
    function createOrUpdateAccuracyChart(accuracy) {
        if (!accuracyChartCanvas) return;
        
        const isDarkMode = document.body.classList.contains('dark-mode');
        const textColor = isDarkMode ? '#e0e0e0' : '#333';
        const inactiveColor = isDarkMode ? '#444' : '#eee';

        const data = {
            datasets: [{
                data: [accuracy, 100 - accuracy],
                backgroundColor: ['#28a745', inactiveColor], // Verde para acertos, cinza para o resto
                borderColor: isDarkMode ? '#2a2a2a' : '#fff', // Cor de fundo do card
                borderWidth: 4,
                borderRadius: 5,
            }]
        };

        const centerText = {
            id: 'centerText',
            afterDraw(chart) {
                const { ctx, _active } = chart;
                const { top, left, width, height } = chart.chartArea;
                ctx.save();
                ctx.font = 'bold 1.8rem Roboto, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = textColor;
                ctx.fillText(`${accuracy}%`, left + (width / 2), top + (height / 2) + 8);
                ctx.restore();
            }
        };

        // Se o gráfico já existe, apenas atualiza os dados
        if (accuracyChart) {
            accuracyChart.data = data;
            accuracyChart.update();
        } else { // Senão, cria um novo
            accuracyChart = new Chart(accuracyChartCanvas, {
                type: 'doughnut',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false },
                        centerText: {} // Plugin customizado
                    }
                },
                plugins: [centerText] // Registra o plugin
            });
        }
    }
    
    /**
     * Calcula e atualiza todas as estatísticas na tela Home.
     */
    function updateDashboard() {
        if (!statLearnedEl || !accuracyChartCanvas) return;

        // --- 1. Calcular Estatísticas do SRS ---
        const srsDataRaw = localStorage.getItem('japanesePracticeSRS');
        const srsData = srsDataRaw ? JSON.parse(srsDataRaw) : {};
        const learnedWords = Object.keys(srsData).length;

        let reviewsDue = 0;
        const now = Date.now();
        for (const key in srsData) {
            if (srsData[key].nextReview <= now) {
                reviewsDue++;
            }
        }

        // --- 2. Calcular Estatísticas do Histórico ---
        const historyRaw = localStorage.getItem('japanesePracticeHistory');
        const history = historyRaw ? JSON.parse(historyRaw) : [];
        
        let correctCount = 0;
        const recentHistory = history.slice(0, 50); // Usa apenas os últimos 50 itens para "Precisão Recente"
        if (recentHistory.length > 0) {
            recentHistory.forEach(item => {
                if (item.status === 'correct') {
                    correctCount++;
                }
            });
        }
        const accuracy = (recentHistory.length === 0) ? 0 : Math.round((correctCount / recentHistory.length) * 100);

        // --- 3. Obter Sequência ---
        const streakCount = document.getElementById('streak-count')?.textContent || 0;

        // --- 4. Atualizar o HTML e o Gráfico ---
        statLearnedEl.textContent = learnedWords;
        statReviewEl.textContent = reviewsDue;
        statStreakEl.textContent = streakCount;
        createOrUpdateAccuracyChart(accuracy);
    }
    
    // Expõe a função de atualização para que o ui-manager possa chamá-la
    app.updateDashboard = updateDashboard;
});