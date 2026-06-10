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
        if (!stock.history) stock.history = Array(12).fill(stock.value); 

        if (stock.isFailed) {
            if (Math.random() < ASSET_REBIRTH_CHANCE) { stock.isFailed = false; stock.value = Math.random() * 50 + 1; }
            else if ((stock.failedMonths || 0) >= ASSET_DELISTING_THRESHOLD && Math.random() < ASSET_DELISTING_CHANCE) stocks.splice(i, 1);
            else stock.failedMonths = (stock.failedMonths || 0) + 1;
        } else {
            const change = (Math.random() * stock.volatility * 2 - stock.volatility) * stock.value;
            stock.value = Math.max(1, stock.value + change);
            if (Math.random() < ASSET_FAILURE_CHANCE) { stock.isFailed = true; stock.value = 0.01; stock.failedMonths = 0; }
        }

        stock.history.push(stock.value);
        if (stock.history.length > 12) stock.history.shift(); 
    });
    
    currencies.forEach(currency => {
        if (currency.name === "Euro") return;
        currency.previousValue = currency.value;
        if (!currency.history) currency.history = Array(12).fill(currency.value);

        const change = (Math.random() * currency.volatility * 2 - currency.volatility) * currency.value;
        currency.value = Math.max(0.001, currency.value + change);

        currency.history.push(currency.value);
        if (currency.history.length > 12) currency.history.shift();
    });
    
    bonds.forEach(bond => {
        if (!bond.history) bond.history = Array(12).fill(bond.value);

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

        bond.history.push(bond.value);
        if (bond.history.length > 12) bond.history.shift();
    });
}