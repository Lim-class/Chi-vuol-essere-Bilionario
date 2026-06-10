function endGame(isWin, message = "") {
    document.getElementById('final-message').classList.remove('hidden');
    document.getElementById('final-message-title').textContent = isWin ? "Sei un Bilionario!" : "Game Over";
    document.getElementById('final-message-text').textContent = isWin ? "Incredibile! Hai raggiunto l'impensabile traguardo di €1 Bilione (1.000 Miliardi di Euro)." : message;
}

function restartGame() {
    playerMoney = 1000; playerAge = 18; playerTraining = 0; currentDate = new Date(2025, 0, 1);
    currentJob = null; playerStartups = []; playerLoans = []; unpaiedTaxDebt = 0; consecutiveTaxDeficitMonths = 0;
    marketBaseRate = 0.04;
    document.getElementById('final-message').classList.add('hidden');
    updateUI(); generateMonthlyAdvice();
}

function setupEventListeners() {
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('message-ok-btn').addEventListener('click', hideMessageBox);
    document.getElementById('skip-time-btn').addEventListener('click', skipTime);
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
    
    document.getElementById('startup-header').addEventListener('click', () => {
        document.getElementById('startup-content').classList.toggle('hidden');
        document.getElementById('startup-arrow').classList.toggle('rotated');
    });
}

window.onload = function() {
    setupEventListeners();
    restartGame();
};