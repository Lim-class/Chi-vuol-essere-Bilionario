function nextMonth() {
    if (isNaN(playerMoney)) playerMoney = 0;
    if (calculateNetWorth() >= BILLION_TARGET) return endGame(true);

    const oldInvestmentsValue = calculateNetWorth() - playerMoney + unpaiedTaxDebt;

    // --- LOGICA FISCALE DINAMICA DELLA NAZIONE CORRENTE ---
    let monthlyTax = 0;
    if (currentJob && currentJob.title !== "Disoccupato" && currentJob.title !== "Disoccupata") {
        const stipendioAnnuo = currentJob.salary * 12;
        const tasseAnnue = taxSystems[currentCountry].calculateTax(stipendioAnnuo);
        monthlyTax = tasseAnnue / 12;
    } else {
        monthlyTax = taxSystems[currentCountry].calculateTax(0) / 12;
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
        
        let interest = loan.remainingPrincipal * monthlyRate;
        let principalPaid = monthlyPayment - interest;
        
        let finalLoanExpense = monthlyPayment;
        if (loan.isForeign) {
            finalLoanExpense = monthlyPayment * 1.15; 
        }
        
        monthlyLoanPayments += finalLoanExpense;
        
        loan.remainingPrincipal -= principalPaid;
        loan.remainingMonths--;

        if (loan.remainingMonths <= 0 || loan.remainingPrincipal <= 0) {
            playerLoans.splice(i, 1);
        } else {
            loan.currentMonthlyPayment = finalLoanExpense; 
        }
    }

    let totalExpenses = monthlyTax + startupCosts + monthlyLoanPayments;
    
    // ====================================================================
    // 🚀 NUOVA LOGICA: AUTO-LIQUIDAZIONE E RISOLUZIONE BUG DEBITI
    // ====================================================================
    if (playerMoney < totalExpenses) {
        let deficit = totalExpenses - playerMoney;
        
        // 1. La Banca tenta di auto-liquidare le Azioni
        for (let i = 0; i < stocks.length; i++) {
            let stock = stocks[i];
            if (stock.owned > 0 && !stock.isFailed && !stock.isDelisted) {
                let stockTotalValue = stock.owned * stock.value;
                if (stockTotalValue >= deficit) {
                    // Vendi solo le azioni necessarie
                    let sharesToSell = Math.ceil(deficit / stock.value);
                    stock.owned -= sharesToSell;
                    playerMoney += sharesToSell * stock.value;
                    deficit = 0;
                    showMessage("Liquidazione Forzata", `La banca ha venduto automaticamente ${sharesToSell} azioni di <strong>${stock.name}</strong> per coprire le tue spese ed evitarti la bancarotta.`);
                    break;
                } else {
                    // Vendi tutto per ridurre il debito
                    deficit -= stockTotalValue;
                    playerMoney += stockTotalValue;
                    stock.owned = 0;
                }
            }
        }

        // 2. Se le azioni non sono bastate, prova a liquidare le Valute (escluso l'Euro)
        if (deficit > 0) {
            for (let i = 0; i < currencies.length; i++) {
                let currency = currencies[i];
                if (currency.name !== "Euro" && currency.owned > 0 && !currency.isFailed && !currency.isDelisted) {
                    let currencyTotalValue = currency.owned * currency.value;
                    if (currencyTotalValue >= deficit) {
                        let amountToSell = deficit / currency.value;
                        currency.owned -= amountToSell;
                        playerMoney += amountToSell * currency.value;
                        deficit = 0;
                        showMessage("Liquidazione Forzata", `La banca ha convertito automaticamente ${(amountToSell).toFixed(2)} <strong>${currency.name}</strong> per coprire le tue uscite.`);
                        break;
                    } else {
                        deficit -= currencyTotalValue;
                        playerMoney += currencyTotalValue;
                        currency.owned = 0;
                    }
                }
            }
        }

        // 3. Se dopo aver svenduto tutto siamo ANCORA in rosso, scatta il debito fiscale
        if (playerMoney < totalExpenses) {
            consecutiveTaxDeficitMonths++;
            unpaiedTaxDebt += totalExpenses * 1.10; // +10% di mora e sanzioni
            if (consecutiveTaxDeficitMonths >= MAX_TAX_DEFICIT_MONTHS) {
                return endGame(false, `Hai accumulato un debito inarrestabile per ${MAX_TAX_DEFICIT_MONTHS} mesi consecutivi. I tuoi beni sono stati pignorati e sei in bancarotta!`);
            }
        } else {
            // Se le liquidazioni ci hanno salvato, paghiamo il mese in corso
            playerMoney -= totalExpenses;
            consecutiveTaxDeficitMonths = 0;
        }
    } else {
        // Se abbiamo già i contanti, paghiamo le spese del mese (Logica Bugfix)
        playerMoney -= totalExpenses;
        
        // E se ci avanzano soldi, cerchiamo di saldare i debiti fiscali pregressi!
        if (unpaiedTaxDebt > 0) {
            const taxPayment = Math.min(unpaiedTaxDebt, playerMoney);
            playerMoney -= taxPayment;
            unpaiedTaxDebt -= taxPayment;
            
            if (unpaiedTaxDebt <= 0) {
                consecutiveTaxDeficitMonths = 0;
                showMessage("Debito Saldato", "Hai finalmente pagato tutti i tuoi arretrati fiscali all'Agenzia delle Entrate.");
            }
        } else {
            consecutiveTaxDeficitMonths = 0;
        }
    }
    // ====================================================================

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
        
        // --- LOGICA INFLAZIONE ANNUALE ---
        const inflationRate = 1.025;
        jobs.forEach(job => job.salary = Math.round(job.salary * inflationRate));
        if (currentJob) currentJob.salary = Math.round(currentJob.salary * inflationRate);
        Object.keys(taxSystems).forEach(country => {
            taxSystems[country].fee = Math.round(taxSystems[country].fee * inflationRate);
            if (taxSystems[country].unemployedFixedTax > 0) {
                taxSystems[country].unemployedFixedTax = Math.round(taxSystems[country].unemployedFixedTax * inflationRate);
            }
        });
        window.inflationOccurredThisMonth = true;
        // ---------------------------------

        if (playerAge >= 60) return endGame(false, "Hai raggiunto i 60 anni e ti sei ritirato prima di dominare il mondo. Game Over!");
    }
    
    updateUI();
    generateMonthlyAdvice(investmentDelta);
}

function skipTime() {
    const datePicker = document.getElementById('date-picker');
    if (!datePicker) return;

    const selectedValue = datePicker.value; 
    if (!selectedValue) return;

    const [targetYear, targetMonth] = selectedValue.split('-').map(Number);
    const targetDate = new Date(targetYear, targetMonth - 1, 1);

    const currentMonthsTotal = currentDate.getFullYear() * 12 + currentDate.getMonth();
    const targetMonthsTotal = targetDate.getFullYear() * 12 + targetDate.getMonth();
    const totalMonths = targetMonthsTotal - currentMonthsTotal;

    if (totalMonths <= 0) return;

    if (totalMonths > 1200) {
        updateUI(); 
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