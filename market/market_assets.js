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
        
        // NUOVA LOGICA: Gestione lotti per obbligazioni
        if (type === 'bond') {
            asset.lots = asset.lots || [];
            // Se esiste un vecchio salvataggio con obbligazioni senza lotti, convertiamolo
            if ((asset.owned || 0) > 0 && asset.lots.length === 0) {
                asset.lots.push({ quantity: asset.owned, monthsLeft: asset.monthsLeft || asset.duration });
            }
            // Aggiungi il nuovo acquisto come lotto indipendente
            asset.lots.push({ quantity: quantity, monthsLeft: asset.duration });
        }
        
        asset.owned = (asset.owned || 0) + quantity;
        updateUI();
    } else showMessage("Fondi Insufficienti", "Non hai soldi a sufficienza.");
}

function sellAsset(type, name) {
    let asset, inputId;
    if (type === 'stock') { asset = stocks.find(s => s.name === name); inputId = `buy-stock-${name}`; }
    else if (type === 'currency') { asset = currencies.find(c => c.name === name); inputId = `buy-currency-${name}`; }
    else if (type === 'bond') { asset = bonds.find(b => b.name === name); inputId = `buy-bond-${name}`; }
    
    let qty = parseInt(document.getElementById(inputId).value);
    if (isNaN(qty) || qty <= 0 || (asset.owned || 0) < qty) return showMessage("Errore", "Quantità errata.");
    if (asset.isFailed) return showMessage("Errore", `L'asset è fallito.`);
    
    // NUOVA LOGICA: Rimozione lotti obbligazionari (metodo FIFO)
    if (type === 'bond') {
        asset.lots = asset.lots || [];
        let qtyToRemove = qty;
        for (let i = 0; i < asset.lots.length && qtyToRemove > 0; i++) {
            if (asset.lots[i].quantity <= qtyToRemove) {
                qtyToRemove -= asset.lots[i].quantity;
                asset.lots[i].quantity = 0;
            } else {
                asset.lots[i].quantity -= qtyToRemove;
                qtyToRemove = 0;
            }
        }
        // Pulisci i lotti vuoti
        asset.lots = asset.lots.filter(lot => lot.quantity > 0);
    }
    
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
        if (stock.isDelisted) return; // Ottimizzazione CPU: ignora le azioni opate!
        
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

        // Retro-compatibilità salvataggi
        if ((bond.owned || 0) > 0 && (!bond.lots || bond.lots.length === 0)) {
            bond.lots = [{ quantity: bond.owned, monthsLeft: bond.monthsLeft || bond.duration }];
        }

        // Calcolo rendimenti sui singoli lotti
        if (bond.lots && bond.lots.length > 0) {
            for (let i = bond.lots.length - 1; i >= 0; i--) {
                let lot = bond.lots[i];
                if (lot.monthsLeft > 0) {
                    playerMoney += lot.quantity * bond.value * (bond.interestRate / 12);
                    lot.monthsLeft--;
                } else {
                    playerMoney += lot.quantity * bond.value;
                    bond.owned -= lot.quantity;
                    bond.lots.splice(i, 1); // Rimuovi il lotto terminato
                    showMessage("Obbligazione Maturata", `Una tranche della tua obbligazione ${bond.name} è giunta a scadenza! Il capitale investito ti è stato interamente restituito.`);
                }
            }
        }

        bond.history.push(bond.value);
        if (bond.history.length > 12) bond.history.shift();
    });
}