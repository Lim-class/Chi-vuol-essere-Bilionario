function nextMonth() {
    if (isNaN(playerMoney)) playerMoney = 0;
    if (calculateNetWorth() >= BILLION_TARGET) return endGame(true);

    const oldInvestmentsValue = calculateNetWorth() - playerMoney + unpaiedTaxDebt;

    let monthlyTax = 50; // Spesa fissa di base (es. TARI, bollo, ticket) se disoccupato
    
    if (currentJob && currentJob.title !== "Disoccupato" && currentJob.title !== "Disoccupata") {
        const stipendioAnnuo = currentJob.salary * 12;
        
        // 1. Contributi previdenziali INPS (stima 9.19% a carico del lavoratore)
        const inpsAnnuo = stipendioAnnuo * 0.0919;
        
        // La base su cui si calcolano le tasse è lo stipendio meno i contributi
        const imponibileIrpef = stipendioAnnuo - inpsAnnuo;
        
        // 2. Calcolo IRPEF progressiva (Scaglioni 2024/2025)
        let irpefAnnua = 0;
        if (imponibileIrpef <= 28000) {
            irpefAnnua = imponibileIrpef * 0.23;
        } else if (imponibileIrpef <= 50000) {
            irpefAnnua = (28000 * 0.23) + ((imponibileIrpef - 28000) * 0.35);
        } else {
            irpefAnnua = (28000 * 0.23) + (22000 * 0.35) + ((imponibileIrpef - 50000) * 0.43);
        }
        
        // 3. Addizionali Regionali e Comunali (stima forfettaria del 2%)
        const addizionaliAnnue = imponibileIrpef * 0.02;
        
        // Totale trattenute annuali divise per i 12 mesi
        monthlyTax = (inpsAnnuo + irpefAnnua + addizionaliAnnue) / 12;
    } 
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
    const datePicker = document.getElementById('date-picker');
    if (!datePicker) return;

    const selectedValue = datePicker.value; // Formato "YYYY-MM"
    if (!selectedValue) return;

    const [targetYear, targetMonth] = selectedValue.split('-').map(Number);
    // targetMonth - 1 perché l'oggetto Date di JS accetta mesi da 0 a 11
    const targetDate = new Date(targetYear, targetMonth - 1, 1);

    // Calcolo della differenza in mesi
    const currentMonthsTotal = currentDate.getFullYear() * 12 + currentDate.getMonth();
    const targetMonthsTotal = targetDate.getFullYear() * 12 + targetDate.getMonth();
    const totalMonths = targetMonthsTotal - currentMonthsTotal;

    // Se la data è uguale o precedente, non fare nulla
    if (totalMonths <= 0) return;

    if (totalMonths > 1200) {
        updateUI(); // Resetta la visualizzazione della data al valore corrente corretto
        return showMessage("Attenzione", "Puoi saltare massimo 100 anni alla volta per non sovraccaricare il sistema.");
    }

    let monthsPassed = 0;
    for (let i = 0; i < totalMonths; i++) {
        if (!document.getElementById('final-message').classList.contains('hidden')) break; 
        nextMonth();
        monthsPassed++;
    }

    if (document.getElementById('final-message').classList.contains('hidden')) {
        const anni = Math.floor(monthsPassed / 12);
        const mesi = monthsPassed % 12;
        let tempoStringa = "";
        
        if (anni > 0) tempoStringa += `${anni} ${anni === 1 ? 'anno' : 'anni'}`;
        if (mesi > 0) tempoStringa += `${anni > 0 ? ' e ' : ''}${mesi} ${mesi === 1 ? 'mese' : 'mesi'}`;

        showMessage("Tempo Trascorso", `Hai fatto avanzare la simulazione di <strong>${tempoStringa}</strong> arrivando alla data selezionata.`);
    }
}

function handleRandomEvents() {
    if (Math.random() < 0.15) {
        const amount = playerMoney * 0.05;
        if (Math.random() > 0.5) { playerMoney += amount; showMessage("Bonus Imprevisto!", `Hai trovato ${formatCurrency(amount)}!`); }
        else { playerMoney -= amount; showMessage("Spesa Imprevista", `Hai dovuto pagare una tassa o multa di ${formatCurrency(amount)}.`); }
    }
}