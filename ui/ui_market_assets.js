function updateStandardAssetsUI() {
    // 1. SALVATAGGIO TEMPORANEO DEGLI INPUT (UX Optimization)
    // Evita che l'utente perda ciò che sta digitando al cambio del mese
    const savedInputs = {};
    document.querySelectorAll('#investments input[type="number"]').forEach(input => {
        if (input.value) {
            savedInputs[input.id] = input.value;
        }
    });

    // 2. RENDERING AZIONI (Unico update al DOM)
    const stocksListEl = document.getElementById('stocks-list');
    if (stocksListEl) {
        let stocksHTML = ''; // Accumulatore in memoria
        stocks.forEach(stock => {
            if (stock.isDelisted) return;
            const pClass = stock.value > stock.previousValue ? 'price-up' : (stock.value < stock.previousValue ? 'price-down' : 'price-neutral');
            const vDisplay = stock.isFailed ? 'Fallito' : `€${stock.value.toFixed(2)}`;
            
            stocksHTML += `
                <div class="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <h4 class="text-base font-bold text-gray-800 truncate pr-1" title="${stock.name}">${stock.name}</h4>
                            <span class="text-sm font-bold ${pClass}">${vDisplay}</span>
                        </div>
                        <p class="text-xs text-gray-600 mb-3">Possedute: <span class="font-semibold">${stock.owned || 0}</span></p>
                    </div>
                    <div class="flex flex-col gap-1.5 mt-auto">
                        <div class="flex gap-1 items-stretch">
                            <input type="number" id="buy-stock-${stock.name}" placeholder="Qtà" class="input-field text-sm flex-1 text-center !py-1 !px-1 font-semibold min-w-0" />
                            <button onclick="buyAsset('stock', '${stock.name}')" class="btn bg-green-500 text-white hover:bg-green-600 flex-none !px-2 !py-1 flex items-center justify-center rounded" title="Compra" ${stock.isFailed ? 'disabled' : ''}>
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            </button>
                            <button onclick="sellAsset('stock', '${stock.name}')" class="btn bg-red-500 text-white hover:bg-red-600 flex-none !px-2 !py-1 flex items-center justify-center rounded" title="Vendi" ${stock.isFailed ? 'disabled' : ''}>
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                            </button>
                        </div>
                        <button onclick="launchTakeoverOffer('${stock.name}')" class="btn bg-purple-600 text-white hover:bg-purple-700 text-[11px] py-1 w-full font-bold tracking-wide uppercase rounded transition-all" ${stock.isFailed ? 'disabled' : ''}>
                            💼 Lancia OPA
                        </button>
                    </div>
                </div>`;
        });
        stocksListEl.innerHTML = stocksHTML; // Tocco singolo al DOM
    }

    // 3. RENDERING VALUTE
    const currenciesListEl = document.getElementById('currencies-list');
    if (currenciesListEl) {
        let currenciesHTML = '';
        currencies.forEach(currency => {
            if (currency.isDelisted || currency.name === "Euro") return;
            const pClass = currency.value > currency.previousValue ? 'price-up' : (currency.value < currency.previousValue ? 'price-down' : 'price-neutral');
            const vDisplay = currency.isFailed ? 'Fallita' : `€${currency.value.toFixed(4)}`;
            
            currenciesHTML += `
                <div class="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <h4 class="text-base font-bold text-gray-800 truncate pr-1" title="${currency.name}">${currency.name}</h4>
                            <span class="text-sm font-bold ${pClass}">${vDisplay}</span>
                        </div>
                        <p class="text-xs text-gray-600 mb-3">Possedute: <span class="font-semibold">${(currency.owned || 0).toFixed(2)}</span></p>
                    </div>
                    <div class="flex gap-1 mt-auto items-stretch">
                        <input type="number" id="buy-currency-${currency.name}" placeholder="Qtà" class="input-field text-sm flex-1 text-center !py-1 !px-1 font-semibold min-w-0" />
                        <button onclick="buyAsset('currency', '${currency.name}')" class="btn bg-green-500 text-white hover:bg-green-600 flex-none !px-2 !py-1 flex items-center justify-center rounded" title="Compra" ${currency.isFailed ? 'disabled' : ''}>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                        <button onclick="sellAsset('currency', '${currency.name}')" class="btn bg-red-500 text-white hover:bg-red-600 flex-none !px-2 !py-1 flex items-center justify-center rounded" title="Vendi" ${currency.isFailed ? 'disabled' : ''}>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                        </button>
                    </div>
                </div>`;
        });
        currenciesListEl.innerHTML = currenciesHTML;
    }

    // 4. RENDERING OBBLIGAZIONI
    const bondsListEl = document.getElementById('bonds-list');
    if (bondsListEl) {
        let bondsHTML = '';
        bonds.forEach(bond => {
            bondsHTML += `
                <div class="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-center mb-1">
                            <h4 class="text-base font-bold text-gray-800 truncate pr-1" title="${bond.name}">${bond.name}</h4>
                            <span class="text-sm font-bold">€${bond.value.toFixed(2)}</span>
                        </div>
                        <p class="text-xs text-gray-600 mb-3">Int: ${(bond.interestRate * 100).toFixed(1)}% | Poss: <span class="font-semibold">${bond.owned || 0}</span></p>
                    </div>
                    <div class="flex gap-1 mt-auto items-stretch">
                        <input type="number" id="buy-bond-${bond.name}" placeholder="Qtà" class="input-field text-sm flex-1 text-center !py-1 !px-1 font-semibold min-w-0" />
                        <button onclick="buyAsset('bond', '${bond.name}')" class="btn bg-green-500 text-white hover:bg-green-600 flex-none !px-2 !py-1 flex items-center justify-center rounded" title="Compra">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                        <button onclick="sellAsset('bond', '${bond.name}')" class="btn bg-red-500 text-white hover:bg-red-600 flex-none !px-2 !py-1 flex items-center justify-center rounded" title="Vendi">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                        </button>
                    </div>
                </div>`;
        });
        bondsListEl.innerHTML = bondsHTML;
    }

    // 3. RIPRISTINO DEGLI INPUT SALVATI
    Object.keys(savedInputs).forEach(id => {
        const inputEl = document.getElementById(id);
        if (inputEl) inputEl.value = savedInputs[id];
    });
}