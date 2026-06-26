function endGame(isWin, message = "") {
    document.getElementById('final-message').classList.remove('hidden');
    document.getElementById('final-message-title').textContent = isWin ? "Sei un Bilionario!" : "Game Over";
    document.getElementById('final-message-text').textContent = isWin ? "Incredibile! Hai raggiunto l'impensabile traguardo di €1 Bilione (1.000 Miliardi di Euro)." : message;
}

function restartGame() {
    playerMoney = 1000; 
    playerAge = 18; 
    playerTraining = 0; 
    currentDate = new Date(2025, 0, 1);
    currentJob = null; 
    playerStartups = []; 
    playerLoans = []; 
    unpaiedTaxDebt = 0; 
    consecutiveTaxDeficitMonths = 0;
    marketBaseRate = 0.04;
    currentCountry = "Italia"; 
    lastRelocationDate = new Date(2020, 0, 1);
    
    // --- NUOVI RESET CRITICI ---
    window.totalStartupsFounded = 0; 
    window.interruptedSkip = false;
    window.isSkippingTime = false;
    
    // Se l'inflazione ha modificato i lavori e le tasse, ricaricare la pagina 
    // è il modo più sicuro per pulire la RAM e riavere i valori originali puliti.
    if (typeof globalInflation !== 'undefined' && globalInflation > 1.0) {
        location.reload(); 
        return;
    }
    
    document.getElementById('final-message').classList.add('hidden');
    updateUI(); 
    
    if (typeof generateMonthlyAdvice === 'function') {
        generateMonthlyAdvice();
    }
}

function setupEventListeners() {
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('message-ok-btn').addEventListener('click', hideMessageBox);
    document.getElementById('date-picker').addEventListener('change', skipTime);
    document.getElementById('change-country-btn').addEventListener('click', openCountrySelection);
    
    // Listener per il pulsante +1 Mese (Versione corretta)
    document.getElementById('next-month-btn').addEventListener('click', () => {
        // Calcola il mese successivo basandosi sulla data corrente dello stato di gioco
        let nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        let year = nextDate.getFullYear();
        let month = String(nextDate.getMonth() + 1).padStart(2, '0');
        
        let datePicker = document.getElementById('date-picker');
        
        if (datePicker) {
            // Aggiorna il valore dell'input visivamente
            datePicker.value = `${year}-${month}`;
            
            // Forza l'evento 'change' in modo che skipTime venga chiamato naturalmente
            datePicker.dispatchEvent(new Event('change'));
        }
    });

    document.getElementById('take-loan-btn').addEventListener('click', takeLoan);
    document.getElementById('buy-startup-btn').addEventListener('click', buyStartup);
    document.getElementById('sell-startup-btn').addEventListener('click', sellStartup);
    document.getElementById('save-list-btn').addEventListener('click', () => showSaveLoadPrompt('save'));
    document.getElementById('load-list-btn').addEventListener('click', () => showSaveLoadPrompt('load'));
    document.getElementById('close-save-list-btn').addEventListener('click', hideSaveLoadPrompt);
    
    document.getElementById('show-save-input-btn').addEventListener('click', () => {
        document.getElementById('save-input-area').classList.remove('hidden');
        document.getElementById('show-save-input-btn').classList.add('hidden');
    });
    
    document.getElementById('confirm-save-btn').addEventListener('click', () => {
        const saveName = document.getElementById('save-game-name-input').value.trim();
        if (saveName) saveGame(saveName);
    });
    
    document.getElementById('search-job-btn').addEventListener('click', searchNewJobOffer);
    document.getElementById('career-training-btn').addEventListener('click', careerTraining);
    
    // Gestione Menu Startup a Scomparsa
    document.getElementById('startup-header').addEventListener('click', () => {
        document.getElementById('startup-content').classList.toggle('hidden');
        document.getElementById('startup-arrow').classList.toggle('rotated');
    });

    // Gestione Menu Banca a Scomparsa
    document.getElementById('bank-header').addEventListener('click', () => {
        document.getElementById('bank-content').classList.toggle('hidden');
        document.getElementById('bank-arrow').classList.toggle('rotated');
    });
}

window.onload = function() {
    setupEventListeners();
    restartGame();
};