function formatCurrency(amount) {
    if (isNaN(amount) || amount === null) return "N/A";
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
}

function updateUI() {
    document.getElementById('net-worth').textContent = formatCurrency(calculateNetWorth());
    document.getElementById('money').textContent = formatCurrency(playerMoney);
    document.getElementById('tax-debt').textContent = formatCurrency(unpaiedTaxDebt);
    document.getElementById('age').textContent = playerAge;
    document.getElementById('training-level').textContent = playerTraining;
    
    // Aggiornamento dinamico del Date Picker
    const datePicker = document.getElementById('date-picker');
    if (datePicker) {
        const year = currentDate.getFullYear();
        // I mesi in JS vanno da 0 a 11, formattiamo a 2 cifre per l'input standard HTML
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const formattedDate = `${year}-${month}`;
        
        datePicker.value = formattedDate;
        datePicker.min = formattedDate; // Impedisce di selezionare date passate
    }
    
    document.getElementById('job-title').textContent = currentJob ? currentJob.title : "Disoccupato";
    document.getElementById('job-salary').textContent = currentJob ? formatCurrency(currentJob.salary) : "N/A";
    document.getElementById('months-at-job').textContent = monthsAtCurrentJob;
    
    updateInvestmentUI();
    updateStartupUI();
    updateBankUI();
    renderMarketChart();
}

function updateStartupUI() {
    const totalStartupMoney = playerStartups.reduce((sum, s) => sum + s.money, 0);
    document.getElementById('startup-money').textContent = formatCurrency(totalStartupMoney);
    document.getElementById('startup-cost').textContent = formatCurrency(playerStartups.length === 0 ? 10000 : playerStartups.length * 5000 + 10000);
    
    const startupListEl = document.getElementById('startup-list');
    startupListEl.innerHTML = '';
    
    if (playerStartups.length === 0) {
        startupListEl.innerHTML = `<li class="text-gray-500 text-sm">Nessuna startup avviata.</li>`;
    } else {
        playerStartups.forEach((startup, index) => {
            let lvl = startup.level || 1;
            startupListEl.innerHTML += `
                <li class="mb-2 p-2.5 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col gap-1.5">
                    <div class="flex justify-between items-center border-b pb-1">
                        <span class="font-bold text-indigo-700 text-sm">Lv. ${lvl} - ${startup.productName}</span>
                        <span class="text-xs text-gray-500 font-semibold">Cassa: ${formatCurrency(startup.money)}</span>
                    </div>
                    <div class="flex justify-between items-center pt-1">
                        <span class="text-xs text-gray-600">Valore Stimato: <strong>${formatCurrency(startup.shareValue * startup.totalShares)}</strong></span>
                        <button onclick="openStartupQuest(${index})" class="btn bg-blue-500 hover:bg-blue-600 text-white text-[10px] uppercase font-bold py-1 px-3 !rounded">
                            🚀 Lancia Quest
                        </button>
                    </div>
                </li>`;
        });
    }
}

function updateBankUI() {
    const bankTitle = document.querySelector('#bank-section h2');
    if (bankTitle) {
        bankTitle.textContent = `Banca e Prestiti (Euribor Corrente: ${(marketBaseRate * 100).toFixed(2)}%)`;
    }

    const loansListEl = document.getElementById('loans-list');
    loansListEl.innerHTML = '';
    if (playerLoans.length === 0) {
        loansListEl.innerHTML = `<p class="text-xs text-gray-500 text-center py-2">Nessun prestito o mutuo attivo.</p>`;
    } else {
        playerLoans.forEach((loan, index) => {
            const currentRata = loan.currentMonthlyPayment || loan.monthlyPayment;
            loansListEl.innerHTML += `
                <div class="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-200">
                    <div class="flex flex-col">
                        <span class="text-sm font-bold text-gray-800">Debito Residuo: ${formatCurrency(loan.remainingPrincipal)}</span>
                        <span class="text-xs text-gray-600">Rata Variabile: ${formatCurrency(currentRata)}/mese (${loan.remainingMonths} mesi restanti | Tasso: +2% Spread)</span>
                    </div>
                    <button onclick="repayLoanEarly(${index})" class="btn bg-orange-500 text-white hover:bg-orange-600 text-xs py-1 px-3">Estingui</button>
                </div>
            `;
        });
    }
}