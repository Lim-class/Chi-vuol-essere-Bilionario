function nextMonth() {
    if (isNaN(playerMoney)) playerMoney = 0;
    if (calculateNetWorth() >= BILLION_TARGET) return endGame(true);

    const oldInvestmentsValue = calculateNetWorth() - playerMoney + unpaiedTaxDebt;

    const monthlyTax = currentJob ? currentJob.salary * 0.23 : 50; 
    const startupCosts = playerStartups.length * 200;
    
    const rateChange = (Math.random() * 0.006 - 0.003);
    marketBaseRate = Math.max(0.01, Math.min(0.08, marketBaseRate + rateChange)); 

    let monthlyLoanPayments = 0;
    for (let i = playerLoans.length - 1; i >= 0; i--) {
        let loan = playerLoans[i];
        
        let currentAnnualRate = marketBaseRate + loan.spread;
        let monthlyRate = currentAnnualRate / 12;
        
        let monthlyPayment = loan.remainingPrincipal * (monthlyRate * Math.pow(1 + monthlyRate, loan.remainingMonths)) / (Math.pow(1 + monthlyRate, loan.remainingMonths) - 1);
        if (isNaN(monthlyPayment) || !isFinite(monthlyPayment)) {
            monthlyPayment = loan.remainingPrincipal / loan.remainingMonths;
        }
        
        monthlyLoanPayments += monthlyPayment;
        
        let interest = loan.remainingPrincipal * monthlyRate;
        let principalPaid = monthlyPayment - interest;
        
        loan.remainingPrincipal -= principalPaid;
        loan.remainingMonths--;

        if (loan.remainingMonths <= 0 || loan.remainingPrincipal <= 0) {
            playerLoans.splice(i, 1);
        } else {
            loan.currentMonthlyPayment = monthlyPayment; 
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

function handleRandomEvents() {
    if (Math.random() < 0.15) {
        const amount = playerMoney * 0.05;
        if (Math.random() > 0.5) { playerMoney += amount; showMessage("Bonus Imprevisto!", `Hai trovato ${formatCurrency(amount)}!`); }
        else { playerMoney -= amount; showMessage("Spesa Imprevista", `Hai dovuto pagare una tassa o multa di ${formatCurrency(amount)}.`); }
    }
}