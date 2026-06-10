let marketChartHigh = null;
let marketChartLow = null;

function updateInvestmentUI() {
    updateStandardAssetsUI();
    updateStartupStocksUI();
}

function renderMarketChart() {
    const ctxHigh = document.getElementById('market-chart-high');
    const ctxLow = document.getElementById('market-chart-low');
    if (!ctxHigh || !ctxLow) return;

    // Etichette solo per gli ultimi 6 mesi
    const labels = Array.from({length: 6}, (_, i) => `- ${6 - i}m`);
    const datasetsHigh = [];
    const datasetsLow = [];

    // Funzione helper per recuperare gli ultimi 6 valori (riempie con il valore corrente se vuoto)
    const getLast6Months = (history, currentValue) => {
        const fullHistory = history || Array(12).fill(currentValue);
        return fullHistory.slice(-6);
    };

    // Funzione helper per creare e assegnare il dataset
    const assignToChart = (name, data, currentValue, colors, index) => {
        const dataset = {
            label: name,
            data: data,
            borderColor: colors[index % colors.length],
            tension: 0.2,
            borderWidth: 1.5,
            pointRadius: 0
        };
        // Logica di divisione: se supera i 50€ va a sinistra (High), altrimenti a destra (Low)
        if (currentValue > 50) {
            datasetsHigh.push(dataset);
        } else {
            datasetsLow.push(dataset);
        }
    };

    // 1. Azioni (Prendiamo le prime 2 attive)
    stocks.filter(s => !s.isDelisted && !s.isFailed).slice(0, 2).forEach((stock, i) => {
        assignToChart(`Az. ${stock.name}`, getLast6Months(stock.history, stock.value), stock.value, ['#3b82f6', '#60a5fa'], i);
    });

    // 2. Valute (Prendiamo le prime 2, escluso Euro)
    currencies.filter(c => c.name !== "Euro" && !c.isDelisted && !c.isFailed).slice(0, 2).forEach((currency, i) => {
        assignToChart(`Val. ${currency.name}`, getLast6Months(currency.history, currency.value), currency.value, ['#a855f7', '#c084fc'], i);
    });

    // 3. Azioni Startup (Prendiamo le prime 2 startup del giocatore)
    playerStartups.slice(0, 2).forEach((startup, i) => {
        assignToChart(`Startup ${startup.productName}`, getLast6Months(startup.history, startup.shareValue), startup.shareValue, ['#10b981', '#f59e0b'], i);
    });

    // Opzioni condivise per entrambi i grafici (scala LINEARE)
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
            legend: { 
                position: 'top', 
                labels: { boxWidth: 8, font: { size: 9 }, color: '#374151' } 
            } 
        },
        scales: { 
            x: { display: false }, 
            y: { 
                type: 'linear', 
                beginAtZero: false, 
                ticks: { font: { size: 9 }, callback: function(value) { return '€' + value; } } 
            } 
        }
    };

    // Renderizza/Aggiorna Grafico Sinistro (> 50)
    if (marketChartHigh) {
        marketChartHigh.data.labels = labels;
        marketChartHigh.data.datasets = datasetsHigh;
        marketChartHigh.update();
    } else {
        marketChartHigh = new Chart(ctxHigh, {
            type: 'line',
            data: { labels, datasets: datasetsHigh },
            options: chartOptions
        });
    }

    // Renderizza/Aggiorna Grafico Destro (<= 50)
    if (marketChartLow) {
        marketChartLow.data.labels = labels;
        marketChartLow.data.datasets = datasetsLow;
        marketChartLow.update();
    } else {
        marketChartLow = new Chart(ctxLow, {
            type: 'line',
            data: { labels, datasets: datasetsLow },
            options: chartOptions
        });
    }
}