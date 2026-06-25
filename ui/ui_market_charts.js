let marketChartHigh = null;
let marketChartMid = null;
let marketChartLow = null;

function updateInvestmentUI() {
    updateStandardAssetsUI();
    updateStartupStocksUI();
}

function renderMarketChart() {
    const ctxHigh = document.getElementById('market-chart-high');
    const ctxMid = document.getElementById('market-chart-mid');
    const ctxLow = document.getElementById('market-chart-low');
    if (!ctxHigh || !ctxMid || !ctxLow) return;

    // Etichette a 12 mesi con l'ultimo punto "Ora"
    const labels = Array.from({length: 12}, (_, i) => i === 11 ? 'Ora' : `- ${11 - i}m`);
    
    // Tre array separati per i tre grafici
    const datasetsHigh = [];
    const datasetsMid = [];
    const datasetsLow = [];

    // Recupera gli ultimi 12 mesi di storico
    const getLast12Months = (history, currentValue) => {
        const fullHistory = history || Array(12).fill(currentValue);
        return fullHistory.slice(-12);
    };

    // Palette colori globale per evitare duplicati
    const chartColors = [
        '#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ef4444', 
        '#06b6d4', '#ec4899', '#14b8a6', '#6366f1', '#f97316',
        '#84cc16', '#0ea5e9', '#d946ef', '#f43f5e', '#eab308'
    ];
    let colorIdx = 0;

    // Configura la linea e il pallino speciale sull'ultimo mese
    const assignToChart = (name, data, currentValue) => {
        const lineColor = chartColors[colorIdx % chartColors.length];
        colorIdx++;

        const dataset = {
            label: name,
            data: data,
            borderColor: lineColor,
            tension: 0.2,
            borderWidth: 1.5,
            pointRadius: Array.from({length: 12}, (_, i) => i === 11 ? 4.5 : 0),
            pointBackgroundColor: lineColor,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1,
            pointHoverRadius: Array.from({length: 12}, (_, i) => i === 11 ? 6 : 0)
        };
        
        // NUOVA LOGICA A TRE FASCE:
        if (currentValue > 40) {
            datasetsHigh.push(dataset);           // Grafico 1: Alto valore (> 40)
        } else if (currentValue > 2) {
            datasetsMid.push(dataset);            // Grafico 2: Medio valore (da 2 a 40)
        } else {
            datasetsLow.push(dataset);            // Grafico 3: Penny/Micro valore (<= 2)
        }
    };

    // Popolamento dei dati
    stocks.filter(s => !s.isDelisted && !s.isFailed).forEach((stock) => {
        assignToChart(`Az. ${stock.name}`, getLast12Months(stock.history, stock.value), stock.value);
    });

    currencies.filter(c => c.name !== "Euro" && !c.isDelisted && !c.isFailed).forEach((currency) => {
        assignToChart(`Val. ${currency.name}`, getLast12Months(currency.history, currency.value), currency.value);
    });

    playerStartups.forEach((startup) => {
        assignToChart(`Startup ${startup.productName}`, getLast12Months(startup.history, startup.shareValue), startup.shareValue);
    });

    // Opzioni di rendering condivise
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
            x: { 
                display: true,
                ticks: { font: { size: 9 }, color: '#4b5563' },
                grid: { display: false }
            }, 
            y: { 
                type: 'linear', 
                beginAtZero: false, 
                ticks: { font: { size: 9 }, callback: function(value) { return '€' + value; } } 
            } 
        }
    };

    // 1. Renderizza/Aggiorna Grafico Alto (> 40)
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

    // 2. Renderizza/Aggiorna Grafico Medio (2 - 40)
    if (marketChartMid) {
        marketChartMid.data.labels = labels;
        marketChartMid.data.datasets = datasetsMid;
        marketChartMid.update();
    } else {
        marketChartMid = new Chart(ctxMid, {
            type: 'line',
            data: { labels, datasets: datasetsMid },
            options: chartOptions
        });
    }

    // 3. Renderizza/Aggiorna Grafico Basso (<= 2)
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