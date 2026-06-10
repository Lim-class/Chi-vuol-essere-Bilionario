function takeLoan() {
    const amount = parseFloat(document.getElementById('loan-amount').value);
    const duration = parseInt(document.getElementById('loan-duration').value);

    if (isNaN(amount) || amount <= 0) return showMessage("Errore", "Inserisci un importo valido.");

    if (!currentJob || currentJob.salary <= 0) {
        return showMessage("Prestito Rifiutato", "La banca ha respinto la tua pratica. È necessario avere un impiego e un reddito mensile dimostrabile per richiedere finanziamenti o mutui.");
    }

    const initialAnnualRate = marketBaseRate + 0.02; 
    const monthlyRate = initialAnnualRate / 12;
    const estimatedMonthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, duration)) / (Math.pow(1 + monthlyRate, duration) - 1);

    const currentTotalMonthlyPayments = playerLoans.reduce((sum, loan) => sum + (loan.currentMonthlyPayment || loan.monthlyPayment), 0);
    const maxAllowedPayment = currentJob.salary * 0.35; 

    if ((currentTotalMonthlyPayments + estimatedMonthlyPayment) > maxAllowedPayment) {
        const availableCapacity = maxAllowedPayment - currentTotalMonthlyPayments;
        
        if (availableCapacity <= 0) {
            return showMessage("Prestito Rifiutato", "Hai già raggiunto o superato la soglia massima di indebitamento (35% del tuo reddito). La banca richiede l'estinzione dei debiti precedenti prima di erogare nuova liquidità.");
        } else {
            const maxLoanSuggest = (availableCapacity * (Math.pow(1 + monthlyRate, duration) - 1)) / (monthlyRate * Math.pow(1 + monthlyRate, duration));
            return showMessage("Prestito Rifiutato", `Hai già delle rate attive! Con il tuo lavoro attuale ti rimangono solo ${formatCurrency(availableCapacity)}/mese di capacità di credito. L'importo massimo ulteriore che puoi richiedere per questa durata è circa ${formatCurrency(maxLoanSuggest)}.`);
        }
    }

    playerLoans.push({
        remainingPrincipal: amount,
        spread: 0.02, 
        remainingMonths: duration,
        currentMonthlyPayment: estimatedMonthlyPayment
    });

    playerMoney += amount;
    document.getElementById('loan-amount').value = '';
    updateUI();
    showMessage("Finanziamento Approvato", `La banca ha accreditato ${formatCurrency(amount)}. La tua nuova rata è di ${formatCurrency(estimatedMonthlyPayment)} (Tasso Variabile iniziale: ${(initialAnnualRate * 100).toFixed(2)}%).`);
}

function repayLoanEarly(index) {
    const loan = playerLoans[index];
    if (playerMoney >= loan.remainingPrincipal) {
        playerMoney -= loan.remainingPrincipal;
        playerLoans.splice(index, 1);
        updateUI();
        showMessage("Estinzione Anticipata", "Hai liquidato interamente il debito residuo chiudendo la pratica in anticipo!");
    } else {
        showMessage("Fondi Insufficienti", "Non hai abbastanza denaro contante per rimborsare il capitale residuo in un'unica soluzione.");
    }
}