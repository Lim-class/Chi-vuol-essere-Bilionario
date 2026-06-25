function updateStartupStocksUI() {
    const startupStocksListEl = document.getElementById('startup-stocks-list');
    if (!startupStocksListEl) return;

    // Salviamo l'input temporaneo specifico della startup prima di rigenerarla
    const savedStartupInputs = {};
    document.querySelectorAll('[id^="buy-startup-stock-"]').forEach(input => {
        if (input.value) savedStartupInputs[input.id] = input.value;
    });

    let startupStocksHTML = ''; // Ottimizzazione string buffer
    
    playerStartups.forEach((startup, index) => {
        const pClass = startup.shareValue > startup.previousShareValue ? 'price-up' : (startup.shareValue < startup.previousShareValue ? 'price-down' : 'price-neutral');
        
        startupStocksHTML += `
            <div class="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-center mb-1">
                        <h4 class="text-base font-bold text-gray-800">LV. ${startup.level || 1} - StartUp #${index + 1}</h4>
                        <span class="text-sm font-bold ${pClass}">€${(startup.shareValue).toFixed(2)}</span>
                    </div>
                    <p class="text-xs text-gray-600 mb-3">Possedute: <span class="font-semibold">${startup.sharesOwned || 0}</span></p>
                </div>
                <div class="flex gap-1 mt-auto items-stretch">
                    <input type="number" id="buy-startup-stock-${index}" placeholder="Qtà" class="input-field text-sm flex-1 text-center !py-1 !px-1 font-semibold min-w-0" />
                    <button onclick="buyStartupShares(${index})" class="btn bg-green-500 text-white hover:bg-green-600 flex-none !px-2 !py-1 flex items-center justify-center rounded" title="Compra">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    </button>
                    <button onclick="sellStartupShares(${index})" class="btn bg-red-500 text-white hover:bg-red-600 flex-none !px-2 !py-1 flex items-center justify-center rounded" title="Vendi">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                    </button>
                </div>
            </div>`;
    });

    startupStocksListEl.innerHTML = startupStocksHTML; // Singola operazione di reflow

    // Ripristiniamo i quantitativi scritti dall'utente
    Object.keys(savedStartupInputs).forEach(id => {
        const inputEl = document.getElementById(id);
        if (inputEl) inputEl.value = savedStartupInputs[id];
    });
}