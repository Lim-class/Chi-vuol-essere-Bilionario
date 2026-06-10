function saveGame(saveName) {
    const gameState = { 
        playerMoney, playerAge, playerTraining, currentDate: currentDate.getTime(), 
        currentJob, monthsAtCurrentJob, playerStartups, playerLoans, consecutiveTaxDeficitMonths, unpaiedTaxDebt,
        stocks, currencies, bonds, marketBaseRate
    };
    localStorage.setItem(LOCAL_STORAGE_PREFIX + saveName, JSON.stringify(gameState));
    showMessage("Salvataggio", `Salvato come "${saveName}".`);
    hideSaveLoadPrompt();
}

function loadGame(saveName) {
    const savedState = localStorage.getItem(LOCAL_STORAGE_PREFIX + saveName);
    if (savedState) {
        const state = JSON.parse(savedState);
        playerMoney = state.playerMoney; 
        playerAge = state.playerAge; 
        playerTraining = state.playerTraining;
        currentDate = new Date(state.currentDate); 
        currentJob = state.currentJob; 
        
        playerStartups = state.playerStartups || [];
        playerLoans = state.playerLoans || [];
        unpaiedTaxDebt = state.unpaiedTaxDebt || 0;
        marketBaseRate = state.marketBaseRate || 0.04;
        
        stocks = state.stocks || stocks;
        currencies = state.currencies || currencies;
        bonds = state.bonds || bonds;

        showMessage("Caricamento", `Partita caricata.`);
        updateUI(); 
        hideSaveLoadPrompt();
    }
}

function deleteSave(saveName) {
    if (confirm(`Cancellare "${saveName}"?`)) { 
        localStorage.removeItem(LOCAL_STORAGE_PREFIX + saveName); 
        hideSaveLoadPrompt(); 
    }
}