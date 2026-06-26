function nextMonth() {
    if (isNaN(playerMoney)) playerMoney = 0;
    if (calculateNetWorth() >= BILLION_TARGET) return endGame(true);

    const oldInvestmentsValue = calculateNetWorth() - playerMoney + unpaiedTaxDebt;

    // ====================================================================
    // 1. INCASSO DELLO STIPENDIO E GESTIONE LAVORO (Prima delle spese!)
    // ====================================================================
    if (typeof JOB_EVENT_CHANCE === 'undefined') window.JOB_EVENT_CHANCE = 0.05; 
    
    if (Math.random() < JOB_EVENT_CHANCE) {
        if (currentJob && currentJob.title !== "Disoccupato" && currentJob.title !== "Disoccupata") {
            currentJob = null; 
            monthsAtCurrentJob = 0;
            // Se c'è un salto temporale attivo, silenziamo il popup e scriviamo nel log
            if (window.isSkippingTime) {
                window.skipEventsLog = window.skipEventsLog || [];
                window.skipEventsLog.push(`Licenziamento: <span class="text-red-600">Hai perso il tuo lavoro!</span>`);
            } else {
                showMessage("Licenziamento", "Hai perso il tuo lavoro a causa di tagli aziendali.");
            }
        } else {
            // Evita che il gioco apra modali di lavoro durante il salto temporale
            if (!window.isSkippingTime) {
                searchNewJobOffer();
            }
        }
    } else if (currentJob && currentJob.title !== "Disoccupato" && currentJob.title !== "Disoccupata") {
        // ACCREDITO STIPENDIO
        playerMoney += currentJob.salary;
        monthsAtCurrentJob++;
    }

    // ====================================================================
    // 2. CALCOLO SPESE FISSE E TASSE
    // ====================================================================
    let monthlyTax = 0;
    if (currentJob && currentJob.title !== "Disoccupato" && currentJob.title !== "Disoccupata") {
        const stipendioAnnuo = currentJob.salary * 12;
        const tasseAnnue = taxSystems[currentCountry].calculateTax(stipendioAnnuo);
        monthlyTax = tasseAnnue / 12;
    } else {
        monthlyTax = taxSystems[currentCountry].calculateTax(0) / 12;
    }
    
    // Il mantenimento delle aziende subisce l'inflazione globale
    const startupCosts = playerStartups.length * (200 * (typeof globalInflation !== 'undefined' ? globalInflation : 1));
    
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
            finalLoanExpense = monthlyPayment * 1.15; // Tassa di transazione su mutuo estero
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
    // 3. PAGAMENTI, AUTO-LIQUIDAZIONE E LOGICA BANCAROTTA IBRIDA
    // ====================================================================
    if (playerMoney < totalExpenses) {
        let deficit = totalExpenses - playerMoney;
        
        // Tentativo Banca 1: Liquidare Azioni per salvarsi
        for (let i = 0; i < stocks.length; i++) {
            let stock = stocks[i];
            if (stock.owned > 0 && !stock.isFailed && !stock.isDelisted) {
                let stockTotalValue = stock.owned * stock.value;
                if (stockTotalValue >= deficit) {
                    let sharesToSell = Math.ceil(deficit / stock.value);
                    stock.owned -= sharesToSell;
                    playerMoney += sharesToSell * stock.value;
                    deficit = 0;
                    if (!window.isSkippingTime) showMessage("Liquidazione Forzata", `La banca ha venduto automaticamente ${sharesToSell} azioni di <strong>${stock.name}</strong> per coprire le tue spese ed evitarti la bancarotta.`);
                    break;
                } else {
                    deficit -= stockTotalValue;
                    playerMoney += stockTotalValue;
                    stock.owned = 0;
                }
            }
        }

        // Tentativo Banca 2: Liquidare Valute (escluso Euro)
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
                        if (!window.isSkippingTime) showMessage("Liquidazione Forzata", `La banca ha convertito automaticamente ${(amountToSell).toFixed(2)} <strong>${currency.name}</strong> per coprire le tue uscite.`);
                        break;
                    } else {
                        deficit -= currencyTotalValue;
                        playerMoney += currencyTotalValue;
                        currency.owned = 0;
                    }
                }
            }
        }

        // Se dopo aver svenduto tutto siamo ANCORA in rosso, scatta il debito
        if (playerMoney < totalExpenses) {
            unpaiedTaxDebt += totalExpenses * 1.10; // +10% di mora e sanzioni
            window.interruptedSkip = true; // Freno d'emergenza per il salto temporale
            
            // --- LOGICA BANCAROTTA LOMBARD CREDIT (Reddito + Patrimonio) ---
            
            // 1. Capacità Reddituale (1 anno di stipendio)
            let incomeCapacity = 0;
            if (currentJob && currentJob.title !== "Disoccupato" && currentJob.title !== "Disoccupata") {
                incomeCapacity = currentJob.salary * 12; 
            }

            // 2. Capacità Patrimoniale (Tolleranza Banca: 20% dei tuoi asset totali lordi)
            const grossAssets = calculateNetWorth() + unpaiedTaxDebt;
            const assetCapacity = grossAssets * 0.20; 

            // 3. Soglia Definitiva con paracadute di tolleranza minima a 20.000€
            const maxAllowedDebt = Math.max(20000, incomeCapacity + assetCapacity);

            if (unpaiedTaxDebt >= maxAllowedDebt) {
                const formattedDebt = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(unpaiedTaxDebt);
                const formattedLimit = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(maxAllowedDebt);
                
                return endGame(false, `Hai accumulato un debito inarrestabile di ${formattedDebt}! Nonostante il valore delle tue aziende e del tuo reddito (tolleranza massima bancaria: ${formattedLimit}), la situazione è fuori controllo. Lo Stato ha pignorato tutti i tuoi beni residui. Sei in bancarotta!`);
            }
            
            consecutiveTaxDeficitMonths++; 
        } else {
            // Se le liquidazioni ci hanno salvato, paghiamo il mese in corso e azzeriamo il deficit
            playerMoney -= totalExpenses;
        }
    } else {
        // Se abbiamo contanti sufficienti, paghiamo le spese del mese 
        playerMoney -= totalExpenses;
        
        // Saldiamo i debiti fiscali pregressi con il contante avanzato
        if (unpaiedTaxDebt > 0) {
            const taxPayment = Math.min(unpaiedTaxDebt, playerMoney);
            playerMoney -= taxPayment;
            unpaiedTaxDebt -= taxPayment;
            
            if (unpaiedTaxDebt <= 0) {
                consecutiveTaxDeficitMonths = 0;
                if (!window.isSkippingTime) showMessage("Debito Saldato", "Hai finalmente pagato tutti i tuoi arretrati e sei tornato in positivo!");
            }
        } else {
            consecutiveTaxDeficitMonths = 0;
        }
    }

    // ====================================================================
    // 4. AGGIORNAMENTI MERCATO, INFLAZIONE ED EVENTI CASUALI
    // ====================================================================

    updateInvestments();
    updateStartups();
    
    const newInvestmentsValue = calculateNetWorth() - playerMoney + unpaiedTaxDebt;
    const investmentDelta = newInvestmentsValue - oldInvestmentsValue;

    handleRandomEvents();
    
    currentDate.setMonth(currentDate.getMonth() + 1);
    
    // Scatta l'anno nuovo (Gennaio)
    if (currentDate.getMonth() === 0) {
        playerAge++;
        
        // --- LOGICA INFLAZIONE ANNUALE ---
        const inflationRate = 1.025;
        if (typeof globalInflation !== 'undefined') globalInflation *= inflationRate;
        
        jobs.forEach(job => job.salary = Math.round(job.salary * inflationRate));
        if (currentJob) currentJob.salary = Math.round(currentJob.salary * inflationRate);
        Object.keys(taxSystems).forEach(country => {
            taxSystems[country].fee = Math.round(taxSystems[country].fee * inflationRate);
            if (taxSystems[country].unemployedFixedTax > 0) {
                taxSystems[country].unemployedFixedTax = Math.round(taxSystems[country].unemployedFixedTax * inflationRate);
            }
        });
        window.inflationOccurredThisMonth = true; // Flag per avviso UI
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
    
    // Variabili globali per gestire lo skip in totale sicurezza
    window.isSkippingTime = true;       
    window.skipEventsLog = [];          
    window.interruptedSkip = false;     

    for (let i = 0; i < totalMonths; i++) {
        // Interrompe se c'è un game over
        if (!document.getElementById('final-message').classList.contains('hidden')) break; 
        
        nextMonth();
        monthsPassed++;

        // Freno di emergenza: ferma il ciclo for se andiamo in bancarotta parziale
        if (window.interruptedSkip) {
            break;
        }
    }

    window.isSkippingTime = false; // Reset dello stato

    if (document.getElementById('final-message').classList.contains('hidden')) {
        const anni = Math.floor(monthsPassed / 12);
        const mesi = monthsPassed % 12;
        let tempoStringa = "";
        
        if (anni > 0) tempoStringa += `${anni} ${anni === 1 ? 'anno' : 'anni'}`;
        if (mesi > 0) tempoStringa += `${anni > 0 ? ' e ' : ''}${mesi} ${mesi === 1 ? 'mese' : 'mesi'}`;

        let reportMsg = `Hai fatto avanzare la simulazione di <strong>${tempoStringa}</strong>.`;
        
        // Messaggio differenziato in caso di blocco di emergenza
        if (window.interruptedSkip) {
            reportMsg = `⚠️ <strong class="text-red-600">Salto Interrotto per Emergenza Finanziaria!</strong><br>Il tempo si è fermato in anticipo (dopo ${tempoStringa}) perché hai accumulato debiti pericolosi e la liquidità automatica non è bastata a saldarti. Ferma tutto e vendi alcuni investimenti manualmente!`;
        }

        // Stampa a schermo tutti gli eventi invisibili accaduti durante il salto
        if (window.skipEventsLog.length > 0) {
            reportMsg += `<br><br><strong>Eventi occorsi durante il salto:</strong><br><ul class="text-xs text-gray-600 list-disc pl-4 mt-1 space-y-1">`;
            const ultimiEventi = window.skipEventsLog.slice(-6); // Mostriamo solo gli ultimi 6
            ultimiEventi.forEach(ev => reportMsg += `<li>${ev}</li>`);
            if (window.skipEventsLog.length > 6) {
                reportMsg += `<li>... e altri <span class="font-bold">${window.skipEventsLog.length - 6}</span> eventi minori in background.</li>`;
            }
            reportMsg += `</ul>`;
        }

        showMessage(window.interruptedSkip ? "Emergenza Finanziaria" : "Tempo Trascorso", reportMsg);
    }
}

function handleRandomEvents() {
    if (Math.random() < 0.15) {
        const amount = playerMoney * 0.05;
        if (Math.random() > 0.5) { 
            playerMoney += amount; 
            if (window.isSkippingTime) {
                window.skipEventsLog.push(`Bonus fortunato: <span class="text-green-600">+${formatCurrency(amount)}</span>`);
            } else {
                showMessage("Bonus Imprevisto!", `Hai trovato ${formatCurrency(amount)}!`); 
            }
        } else { 
            playerMoney -= amount; 
            if (window.isSkippingTime) {
                window.skipEventsLog.push(`Multa pagata: <span class="text-red-600">-${formatCurrency(amount)}</span>`);
            } else {
                showMessage("Spesa Imprevista", `Hai dovuto pagare una tassa o multa di ${formatCurrency(amount)}.`); 
            }
        }
    }
}