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
    document.getElementById('date').textContent = currentDate.toLocaleDateString('it-IT', { year: 'numeric', month: 'long' });
    document.getElementById('job-title').textContent = currentJob ? currentJob.title : "Disoccupato";
    document.getElementById('job-salary').textContent = currentJob ? formatCurrency(currentJob.salary) : "N/A";
    document.getElementById('months-at-job').textContent = monthsAtCurrentJob;
    
    updateInvestmentUI();
    updateStartupUI();
    updateBankUI();
}

function updateInvestmentUI() {
    const stocksListEl = document.getElementById('stocks-list');
    stocksListEl.innerHTML = '';
    stocks.forEach(stock => {
        if (stock.isDelisted) return;
        const pClass = stock.value > stock.previousValue ? 'price-up' : (stock.value < stock.previousValue ? 'price-down' : 'price-neutral');
        const vDisplay = stock.isFailed ? 'Fallito' : `€${stock.value.toFixed(2)}`;
        stocksListEl.innerHTML += `
            <div class="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-center mb-1">
                        <h4 class="text-base font-bold text-gray-800 truncate pr-1" title="${stock.name}">${stock.name}</h4>
                        <span class="text-sm font-bold ${pClass}">${vDisplay}</span>
                    </div>
                    <p class="text-xs text-gray-600 mb-3">Possedute: <span class="font-semibold">${stock.owned || 0}</span></p>
                </div>
                <div class="flex flex-col gap-1.5 mt-auto">
                    <input type="number" id="buy-stock-${stock.name}" placeholder="Quantità" class="input-field text-sm w-full text-center !py-1.5 font-semibold" />
                    <div class="flex gap-1.5">
                        <button onclick="buyAsset('stock', '${stock.name}')" class="btn bg-green-500 text-white hover:bg-green-600 text-xs flex-1 !px-1 !py-1.5" ${stock.isFailed ? 'disabled' : ''}>Compra</button>
                        <button onclick="sellAsset('stock', '${stock.name}')" class="btn bg-red-500 text-white hover:bg-red-600 text-xs flex-1 !px-1 !py-1.5" ${stock.isFailed ? 'disabled' : ''}>Vendi</button>
                    </div>
                </div>
            </div>`;
    });

    const currenciesListEl = document.getElementById('currencies-list');
    currenciesListEl.innerHTML = '';
    currencies.forEach(currency => {
        if (currency.isDelisted || currency.name === "Euro") return;
        const pClass = currency.value > currency.previousValue ? 'price-up' : (currency.value < currency.previousValue ? 'price-down' : 'price-neutral');
        const vDisplay = currency.isFailed ? 'Fallita' : `€${currency.value.toFixed(4)}`;
        currenciesListEl.innerHTML += `
            <div class="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-center mb-1">
                        <h4 class="text-base font-bold text-gray-800 truncate pr-1" title="${currency.name}">${currency.name}</h4>
                        <span class="text-sm font-bold ${pClass}">${vDisplay}</span>
                    </div>
                    <p class="text-xs text-gray-600 mb-3">Possedute: <span class="font-semibold">${(currency.owned || 0).toFixed(2)}</span></p>
                </div>
                <div class="flex flex-col gap-1.5 mt-auto">
                    <input type="number" id="buy-currency-${currency.name}" placeholder="Quantità" class="input-field text-sm w-full text-center !py-1.5 font-semibold" />
                    <div class="flex gap-1.5">
                        <button onclick="buyAsset('currency', '${currency.name}')" class="btn bg-green-500 text-white hover:bg-green-600 text-xs flex-1 !px-1 !py-1.5" ${currency.isFailed ? 'disabled' : ''}>Compra</button>
                        <button onclick="sellAsset('currency', '${currency.name}')" class="btn bg-red-500 text-white hover:bg-red-600 text-xs flex-1 !px-1 !py-1.5" ${currency.isFailed ? 'disabled' : ''}>Vendi</button>
                    </div>
                </div>
            </div>`;
    });

    const bondsListEl = document.getElementById('bonds-list');
    bondsListEl.innerHTML = '';
    bonds.forEach(bond => {
        bondsListEl.innerHTML += `
            <div class="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-center mb-1">
                        <h4 class="text-base font-bold text-gray-800 truncate pr-1" title="${bond.name}">${bond.name}</h4>
                        <span class="text-sm font-bold">€${bond.value.toFixed(2)}</span>
                    </div>
                    <p class="text-xs text-gray-600 mb-3">Int: ${(bond.interestRate * 100).toFixed(1)}% | Poss: <span class="font-semibold">${bond.owned || 0}</span></p>
                </div>
                <div class="flex flex-col gap-1.5 mt-auto">
                    <input type="number" id="buy-bond-${bond.name}" placeholder="Quantità" class="input-field text-sm w-full text-center !py-1.5 font-semibold" />
                    <div class="flex gap-1.5">
                        <button onclick="buyAsset('bond', '${bond.name}')" class="btn bg-green-500 text-white hover:bg-green-600 text-xs flex-1 !px-1 !py-1.5">Compra</button>
                        <button onclick="sellAsset('bond', '${bond.name}')" class="btn bg-red-500 text-white hover:bg-red-600 text-xs flex-1 !px-1 !py-1.5">Vendi</button>
                    </div>
                </div>
            </div>`;
    });

    const startupStocksListEl = document.getElementById('startup-stocks-list');
    startupStocksListEl.innerHTML = '';
    playerStartups.forEach((startup, index) => {
        const pClass = startup.shareValue > startup.previousShareValue ? 'price-up' : (startup.shareValue < startup.previousShareValue ? 'price-down' : 'price-neutral');
        startupStocksListEl.innerHTML += `
            <div class="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-center mb-1">
                        <h4 class="text-base font-bold text-gray-800">LV. ${startup.level || 1} - StartUp #${index + 1}</h4>
                        <span class="text-sm font-bold ${pClass}">€${(startup.shareValue).toFixed(2)}</span>
                    </div>
                    <p class="text-xs text-gray-600 mb-3">Possedute: <span class="font-semibold">${startup.sharesOwned || 0}</span></p>
                </div>
                <div class="flex flex-col gap-1.5 mt-auto">
                    <input type="number" id="buy-startup-stock-${index}" placeholder="Quantità" class="input-field text-sm w-full text-center !py-1.5 font-semibold" />
                    <div class="flex gap-1.5">
                        <button onclick="buyStartupShares(${index})" class="btn bg-green-500 text-white hover:bg-green-600 text-xs flex-1 !px-1 !py-1.5">Compra</button>
                        <button onclick="sellStartupShares(${index})" class="btn bg-red-500 text-white hover:bg-red-600 text-xs flex-1 !px-1 !py-1.5">Vendi</button>
                    </div>
                </div>
            </div>`;
    });
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
        // --- NUOVO: Card interattiva per la lista Startup (Quest abilitate) ---
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
    const loansListEl = document.getElementById('loans-list');
    loansListEl.innerHTML = '';
    if (playerLoans.length === 0) {
        loansListEl.innerHTML = `<p class="text-xs text-gray-500 text-center py-2">Nessun prestito attivo.</p>`;
    } else {
        playerLoans.forEach((loan, index) => {
            loansListEl.innerHTML += `
                <div class="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-200">
                    <div class="flex flex-col">
                        <span class="text-sm font-bold text-gray-800">Debito Residuo: ${formatCurrency(loan.remainingPrincipal)}</span>
                        <span class="text-xs text-gray-600">Rata: ${formatCurrency(loan.monthlyPayment)}/mese (${loan.remainingMonths} mesi restanti)</span>
                    </div>
                    <button onclick="repayLoanEarly(${index})" class="btn bg-orange-500 text-white hover:bg-orange-600 text-xs py-1 px-3">Estingui</button>
                </div>
            `;
        });
    }
}