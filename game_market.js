function buyAsset(type, name) {
    let asset, inputId;
    if (type === 'stock') { asset = stocks.find(s => s.name === name); inputId = `buy-stock-${name}`; }
    else if (type === 'currency') { asset = currencies.find(c => c.name === name); inputId = `buy-currency-${name}`; }
    else if (type === 'bond') { asset = bonds.find(b => b.name === name); inputId = `buy-bond-${name}`; }
    
    const quantity = parseInt(document.getElementById(inputId).value);
    if (isNaN(quantity) || quantity <= 0) return showMessage("Errore", "Quantità non valida.");
    if (asset.isFailed) return showMessage("Errore", `Asset fallito.`);
    
    const cost = quantity * asset.value;
    if (playerMoney >= cost) {
        playerMoney -= cost;
        asset.owned = (asset.owned || 0) + quantity;
        if (type === 'bond') asset.monthsLeft = asset.duration;
        updateUI();
    } else showMessage("Fondi Insufficienti", "Non hai soldi a sufficienza.");
}

function sellAsset(type, name) {
    let asset, inputId;
    if (type === 'stock') { asset = stocks.find(s => s.name === name); inputId = `buy-stock-${name}`; }
    else if (type === 'currency') { asset = currencies.find(c => c.name === name); inputId = `buy-currency-${name}`; }
    else if (type === 'bond') { asset = bonds.find(b => b.name === name); inputId = `buy-bond-${name}`; }
    
    const qty = parseInt(document.getElementById(inputId).value);
    if (isNaN(qty) || qty <= 0 || (asset.owned || 0) < qty) return showMessage("Errore", "Quantità errata.");
    if (asset.isFailed) return showMessage("Errore", `L'asset è fallito.`);
    
    playerMoney += qty * asset.value;
    asset.owned -= qty;
    updateUI();
}

function buyStartupShares(index) {
    const startup = playerStartups[index];
    const qty = parseInt(document.getElementById(`buy-startup-stock-${index}`).value);
    if (isNaN(qty) || qty <= 0) return showMessage("Errore", "Quantità errata.");
    
    const cost = qty * startup.shareValue;
    if (playerMoney >= cost) {
        playerMoney -= cost;
        startup.sharesOwned = (startup.sharesOwned || 0) + qty;
        updateUI();
    } else showMessage("Fondi", "Non hai abbastanza soldi.");
}

function sellStartupShares(index) {
    const startup = playerStartups[index];
    const qty = parseInt(document.getElementById(`buy-startup-stock-${index}`).value);
    if (isNaN(qty) || qty <= 0 || (startup.sharesOwned || 0) < qty) return showMessage("Errore", "Quantità errata.");
    playerMoney += qty * startup.shareValue;
    startup.sharesOwned -= qty;
    updateUI();
}

function buyStartup() {
    let startupCost = playerStartups.length === 0 ? 10000 : playerStartups.length * 5000 + 10000;
    if (playerMoney >= startupCost) {
        playerMoney -= startupCost;
        playerStartups.push({
            money: 5000, 
            productName: `Azienda #${playerStartups.length + 1}`,
            totalShares: 10000, 
            sharesOwned: 10000, 
            shareValue: 0.5, 
            previousShareValue: 0.5,
            level: 1 // La startup nasce a Livello 1
        });
        updateUI();
    } else showMessage("Fondi Insufficienti", "Non hai soldi sufficienti per la startup.");
}

function sellStartup() {
    if (playerStartups.length > 0) {
        const lastStartup = playerStartups.pop();
        playerMoney += lastStartup.money * (1 + Math.random() * 0.5);
        updateUI();
    }
}

// --- NUOVA LOGICA: Missioni Startup ---
function openStartupQuest(index) {
    const startup = playerStartups[index];
    // Seleziona una quest a caso
    const quest = startupQuests[Math.floor(Math.random() * startupQuests.length)];
    
    const dialogHTML = `
        <div class="text-left text-sm space-y-2 mt-2">
            <p><strong>Obiettivo:</strong> ${quest.desc}</p>
            <p><strong>Costo Investimento:</strong> <span class="text-red-600">${formatCurrency(quest.cost)}</span></p>
            <hr class="my-2 border-gray-200">
            <p><strong>Possibile Premio:</strong> Valore azioni dell'azienda <strong>x${quest.multiplier}</strong></p>
            <p><strong>Probabilità di Successo:</strong> ${quest.successChance * 100}%</p>
            <p class="mt-4 text-center italic text-gray-500">Accetti il rischio per far crescere la tua azienda?</p>
        </div>
    `;
    
    showDecisionPrompt(`Quest: ${quest.title}`, dialogHTML, () => {
        if (playerMoney < quest.cost) {
            return showMessage("Fondi Insufficienti", "Non hai liquidità a sufficienza per finanziare questa espansione.");
        }
        
        playerMoney -= quest.cost; // Paga la quest
        
        // Calcola l'esito
        if (Math.random() < quest.successChance) {
            startup.shareValue *= quest.multiplier;
            startup.level = (startup.level || 1) + 1;
            showMessage("🎉 Missione Compiuta!", `L'operazione è stata un successo totale! La tua azienda è passata al <strong>Livello ${startup.level}</strong> e il valore delle sue azioni è schizzato alle stelle.`);
        } else {
            showMessage("📉 Missione Fallita", `Purtroppo l'iniziativa non ha portato i risultati sperati e si è rivelata un buco nell'acqua. I ${formatCurrency(quest.cost)} investiti sono andati perduti.`);
        }
        updateUI();
    }, () => {}); // Se rifiuta, non fa nulla
}

function updateInvestments() {
    if (stocks.length < 5 && Math.random() < 0.5) {
        const newStock = allPossibleStocks[Math.floor(Math.random() * allPossibleStocks.length)];
        if (!stocks.find(s => s.name === newStock.name)) stocks.push({ ...newStock, previousValue: newStock.value });
    }
    if (currencies.length < 5 && Math.random() < 0.5) {
        const newCurrency = allPossibleCurrencies[Math.floor(Math.random() * allPossibleCurrencies.length)];
        if (!currencies.find(c => c.name === newCurrency.name)) currencies.push({ ...newCurrency, previousValue: newCurrency.value });
    }
    
    stocks.forEach((stock, i) => {
        stock.previousValue = stock.value;
        if (stock.isFailed) {
            if (Math.random() < ASSET_REBIRTH_CHANCE) { stock.isFailed = false; stock.value = Math.random() * 50 + 1; }
            else if ((stock.failedMonths || 0) >= ASSET_DELISTING_THRESHOLD && Math.random() < ASSET_DELISTING_CHANCE) stocks.splice(i, 1);
            else stock.failedMonths = (stock.failedMonths || 0) + 1;
        } else {
            const change = (Math.random() * stock.volatility * 2 - stock.volatility) * stock.value;
            stock.value = Math.max(1, stock.value + change);
            if (Math.random() < ASSET_FAILURE_CHANCE) { stock.isFailed = true; stock.value = 0.01; stock.failedMonths = 0; }
        }
    });
    
    currencies.forEach(currency => {
        if (currency.name === "Euro") return;
        currency.previousValue = currency.value;
        const change = (Math.random() * currency.volatility * 2 - currency.volatility) * currency.value;
        currency.value = Math.max(0.001, currency.value + change);
    });
    
    bonds.forEach(bond => {
        if (bond.owned > 0) {
            if (bond.monthsLeft > 0) {
                playerMoney += bond.owned * bond.value * (bond.interestRate / 12);
                bond.monthsLeft--;
            } else {
                playerMoney += bond.owned * bond.value;
                bond.owned = 0;
                showMessage("Obbligazione Maturata", `La tua obbligazione ${bond.name} è terminata, capitale restituito.`);
            }
        }
    });
}

function updateStartups() {
    playerStartups.forEach(startup => {
        startup.money += Math.random() * 2000;
        startup.previousShareValue = startup.shareValue;
        startup.shareValue = Math.max(0.01, startup.shareValue + (Math.random() * 0.4 - 0.2) * startup.shareValue);
    });
}

function takeLoan() {
    const amount = parseFloat(document.getElementById('loan-amount').value);
    const duration = parseInt(document.getElementById('loan-duration').value);

    if (isNaN(amount) || amount <= 0) return showMessage("Errore", "Inserisci un importo valido.");

    const maxLoan = Math.max(50000, calculateNetWorth() * 0.5);
    if (amount > maxLoan) {
        return showMessage("Prestito Rifiutato", `Le tue garanzie sono insufficienti. La banca ti concede al massimo ${formatCurrency(maxLoan)}.`);
    }

    const annualRate = 0.06; // Tasso fisso al 6% annuo
    const monthlyRate = annualRate / 12;
    
    const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, duration)) / (Math.pow(1 + monthlyRate, duration) - 1);

    playerLoans.push({
        remainingPrincipal: amount,
        monthlyPayment: monthlyPayment,
        remainingMonths: duration,
        monthlyRate: monthlyRate
    });

    playerMoney += amount;
    document.getElementById('loan-amount').value = '';
    updateUI();
    showMessage("Prestito Approvato", `Hai ricevuto ${formatCurrency(amount)}. La rata è di ${formatCurrency(monthlyPayment)} al mese.`);
}

function repayLoanEarly(index) {
    const loan = playerLoans[index];
    if (playerMoney >= loan.remainingPrincipal) {
        playerMoney -= loan.remainingPrincipal;
        playerLoans.splice(index, 1);
        updateUI();
        showMessage("Estinzione Anticipata", "Hai ripagato e chiuso questo prestito in anticipo!");
    } else {
        showMessage("Fondi Insufficienti", "Non hai abbastanza denaro liquido per estinguere tutto il prestito in una volta.");
    }
}