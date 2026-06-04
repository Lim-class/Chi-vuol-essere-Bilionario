function calculateNetWorth() {
    let totalValue = playerMoney - unpaiedTaxDebt;
    stocks.forEach(s => totalValue += (s.owned || 0) * (s.isFailed ? 0 : s.value));
    currencies.forEach(c => { if (c.name !== "Euro") totalValue += (c.owned || 0) * (c.isFailed ? 0 : c.value); });
    bonds.forEach(b => totalValue += (b.owned || 0) * b.value);
    totalValue += playerStartups.reduce((sum, s) => sum + ((s.sharesOwned || 0) * s.shareValue), 0);
    
    playerLoans.forEach(l => totalValue -= l.remainingPrincipal);
    
    return isNaN(totalValue) ? 0 : totalValue;
}

function nextMonth() {
    if (isNaN(playerMoney)) playerMoney = 0;
    if (calculateNetWorth() >= BILLION_TARGET) return endGame(true);

    const oldInvestmentsValue = calculateNetWorth() - playerMoney + unpaiedTaxDebt;

    const monthlyTax = currentJob ? currentJob.salary * 0.23 : 50; 
    const startupCosts = playerStartups.length * 200;
    
    let monthlyLoanPayments = 0;
    for (let i = playerLoans.length - 1; i >= 0; i--) {
        let loan = playerLoans[i];
        monthlyLoanPayments += loan.monthlyPayment;
        
        let interest = loan.remainingPrincipal * loan.monthlyRate;
        let principalPaid = loan.monthlyPayment - interest;
        
        loan.remainingPrincipal -= principalPaid;
        loan.remainingMonths--;

        if (loan.remainingMonths <= 0 || loan.remainingPrincipal <= 0) {
            playerLoans.splice(i, 1);
        }
    }

    let totalExpenses = monthlyTax + startupCosts + monthlyLoanPayments;
    
    if (playerMoney < totalExpenses) {
        consecutiveTaxDeficitMonths++;
        unpaiedTaxDebt += totalExpenses * 1.10; 
        if (consecutiveTaxDeficitMonths >= MAX_TAX_DEFICIT_MONTHS) return endGame(false, "Hai accumulato un debito inarrestabile per 8 mesi consecutivi. Sei in bancarotta!");
    } else {
        if (unpaiedTaxDebt > 0) {
            const taxPayment = Math.min(unpaiedTaxDebt, playerMoney);
            playerMoney -= taxPayment;
            unpaiedTaxDebt -= taxPayment;
            if (unpaiedTaxDebt <= 0) {
                consecutiveTaxDeficitMonths = 0;
                showMessage("Debito Saldato", "Hai pagato tutti gli arretrati fiscali.");
            }
        } else {
            playerMoney -= totalExpenses;
            consecutiveTaxDeficitMonths = 0;
        }
    }

    if (Math.random() < JOB_EVENT_CHANCE) {
        if (currentJob && currentJob.title !== "Disoccupato") {
            currentJob = null; monthsAtCurrentJob = 0;
            showMessage("Licenziamento", "Hai perso il tuo lavoro a causa di tagli aziendali.");
        } else searchNewJobOffer();
    } else if (currentJob) {
        playerMoney += currentJob.salary;
        monthsAtCurrentJob++;
    }

    updateInvestments();
    updateStartups();
    
    const newInvestmentsValue = calculateNetWorth() - playerMoney + unpaiedTaxDebt;
    const investmentDelta = newInvestmentsValue - oldInvestmentsValue;

    handleRandomEvents();
    
    currentDate.setMonth(currentDate.getMonth() + 1);
    if (currentDate.getMonth() === 0) {
        playerAge++;
        if (playerAge >= 60) return endGame(false, "Hai raggiunto i 60 anni e ti sei ritirato prima di dominare il mondo. Game Over!");
    }
    
    updateUI();
    generateMonthlyAdvice(investmentDelta);
}

function skipTime() {
    const amount = parseInt(document.getElementById('skip-amount').value);
    const unit = document.getElementById('skip-unit').value;
    
    if (isNaN(amount) || amount <= 0) return showMessage("Errore", "Quantità di tempo non valida.");
    
    const totalMonths = unit === 'years' ? amount * 12 : amount;
    if (totalMonths > 1200) return showMessage("Attenzione", "Puoi saltare massimo 100 anni alla volta per non sovraccaricare il sistema.");
    
    for (let i = 0; i < totalMonths; i++) {
        if (!document.getElementById('final-message').classList.contains('hidden')) break; 
        nextMonth();
    }
    
    if (document.getElementById('final-message').classList.contains('hidden')) {
        const timeStr = unit === 'years' ? (amount === 1 ? 'anno' : 'anni') : (amount === 1 ? 'mese' : 'mesi');
        showMessage("Tempo Trascorso", `Hai mandato avanti il tempo di ${amount} ${timeStr}. Controlla i tuoi asset!`);
    }
}

function searchNewJobOffer() {
    const availableJobs = jobs.filter(job => job.trainingRequired <= playerTraining);
    if (availableJobs.length > 1) {
        const newJob = availableJobs[Math.floor(Math.random() * (availableJobs.length - 1)) + 1];
        showDecisionPrompt("Offerta di Lavoro", `Ruolo: ${newJob.title}. Stipendio: ${formatCurrency(newJob.salary)}/mese. Accetti?`, () => {
            currentJob = newJob; monthsAtCurrentJob = 0; updateUI();
        }, () => {});
    } else showMessage("Nessuna Offerta", "Non ci sono offerte di lavoro al momento.");
}

function careerTraining() {
    const trainingCost = 2000 + playerTraining * 100;
    if (playerMoney >= trainingCost) {
        playerMoney -= trainingCost; playerTraining++; updateUI();
    } else showMessage("Fondi Insufficienti", "Non hai abbastanza soldi per il corso.");
}

function handleRandomEvents() {
    if (Math.random() < 0.15) {
        const amount = playerMoney * 0.05;
        if (Math.random() > 0.5) { playerMoney += amount; showMessage("Bonus Imprevisto!", `Hai trovato ${formatCurrency(amount)}!`); }
        else { playerMoney -= amount; showMessage("Spesa Imprevista", `Hai dovuto pagare una tassa o multa di ${formatCurrency(amount)}.`); }
    }
}

function generateMonthlyAdvice(investmentDelta = 0) {
    let advice = "Continua a lavorare sodo e a investire saggiamente.";
    const netWorth = calculateNetWorth();
    
    // Testi ricalibrati per supportare la corsa fino al Bilione (1.000 Miliardi)
    if (netWorth < 5000) advice = "Fondi limitati. Concentrati sulla stabilità lavorativa prima di spendere.";
    else if (netWorth < 500000) advice = "Ottima base economica. Inizia ad accumulare azioni nei crolli.";
    else if (netWorth < 10000000) advice = "Sulla buona strada! Spingi forte sulle Startup completando le Quest.";
    else if (netWorth < 1000000000) advice = "Sei Multimilionario! Usa le acquisizioni in borsa per scalare rapidamente.";
    else if (netWorth < 1000000000000) advice = "Sei un Miliardario! Le tue aziende valgono un impero. Punta al Bilione!";
    else advice = "Sei ufficialmente un Bilionario!";
    
    let bestAsset = null;
    let worstAsset = null;
    let maxDrop = 0;
    let maxRise = 0;

    [...stocks, ...currencies].forEach(asset => {
        if (asset.name === "Euro" || asset.isFailed || !asset.previousValue) return;
        let change = (asset.value - asset.previousValue) / asset.previousValue;
        if (change < maxDrop) { maxDrop = change; worstAsset = asset; }
        if (change > maxRise) { maxRise = change; bestAsset = asset; }
    });

    let marketInsights = "";
    if (worstAsset && maxDrop <= -0.06) {
        marketInsights = `📉 <strong>Crollo:</strong> <em>${worstAsset.name}</em> ha perso gravemente valore in borsa. Potrebbe essere un ottimo momento per speculare e "comprare basso".`;
    } else if (bestAsset && maxRise >= 0.06) {
        marketInsights = `📈 <strong>Bolla:</strong> Le quote di <em>${bestAsset.name}</em> sono decollate. Valuta se vendere e incassare prima che la bolla esploda!`;
    } else {
        marketInsights = `⚖️ I mercati finanziari sembrano stabili questo mese.`;
    }

    let reportHtml = `<p class="mb-2 text-gray-800">${advice}</p>`;
    reportHtml += `<p class="mb-3 text-sm text-indigo-800 bg-indigo-50 p-2 rounded border border-indigo-100">${marketInsights}</p>`;
    
    const hasInvestments = stocks.some(s => s.owned > 0) || currencies.some(c => c.name !== "Euro" && c.owned > 0) || bonds.some(b => b.owned > 0) || playerStartups.some(s => s.sharesOwned > 0);

    if (hasInvestments) {
        if (investmentDelta > 0) reportHtml += `<div class="p-2.5 bg-green-50 border border-green-200 rounded text-sm"><p class="text-green-700 font-semibold">📈 Valore Asset: +${formatCurrency(investmentDelta)}</p></div>`;
        else if (investmentDelta < 0) reportHtml += `<div class="p-2.5 bg-red-50 border border-red-200 rounded text-sm"><p class="text-red-700 font-semibold">📉 Valore Asset: ${formatCurrency(investmentDelta)}</p></div>`;
        else reportHtml += `<div class="p-2.5 bg-gray-50 border border-gray-200 rounded text-sm"><p class="text-gray-600 font-semibold">⚖️ Nessuna variazione sugli Asset.</p></div>`;
    } else {
        reportHtml += `<div class="p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-500">Nessun investimento attivo in portafoglio.</div>`;
    }
    
    document.getElementById('monthly-report-text').innerHTML = reportHtml;
}

function endGame(isWin, message = "") {
    document.getElementById('final-message').classList.remove('hidden');
    // Testi aggiornati alla scala lunga (Bilione)
    document.getElementById('final-message-title').textContent = isWin ? "Sei un Bilionario!" : "Game Over";
    document.getElementById('final-message-text').textContent = isWin ? "Incredibile! Hai raggiunto l'impensabile traguardo di €1 Bilione (1.000 Miliardi di Euro)." : message;
}

function restartGame() {
    playerMoney = 1000; playerAge = 18; playerTraining = 0; currentDate = new Date(2025, 0, 1);
    currentJob = null; playerStartups = []; playerLoans = []; unpaiedTaxDebt = 0; consecutiveTaxDeficitMonths = 0;
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