function calculateNetWorth() {
    let totalValue = playerMoney - unpaiedTaxDebt;
    stocks.forEach(s => totalValue += (s.owned || 0) * (s.isFailed ? 0 : s.value));
    currencies.forEach(c => { if (c.name !== "Euro") totalValue += (c.owned || 0) * (c.isFailed ? 0 : c.value); });
    bonds.forEach(b => totalValue += (b.owned || 0) * b.value);
    totalValue += playerStartups.reduce((sum, s) => sum + ((s.sharesOwned || 0) * s.shareValue), 0);
    
    playerLoans.forEach(l => totalValue -= l.remainingPrincipal);
    
    return isNaN(totalValue) ? 0 : totalValue;
}

function searchNewJobOffer() {
    // 1. Filtriamo tutti i lavori compatibili con la formazione e l'età attuali
    let availableJobs = jobs.filter(job => 
        job.trainingRequired <= playerTraining && 
        playerAge >= (job.ageRequired || 18)
    );

    // 2. Escludiamo il ruolo fisso di "Disoccupato" dalle offerte di lavoro attive
    availableJobs = availableJobs.filter(job => job.title !== "Disoccupato" && job.title !== "Disoccupata");

    if (availableJobs.length > 0) {
        // 3. Identifichiamo il livello massimo di formazione disponibile nel pool filtrato
        const maxTrainingAvailable = Math.max(...availableJobs.map(job => job.trainingRequired));
        
        // 4. Selezioniamo solo i lavori che appartengono a questo livello massimo sbloccato.
        // Questo garantisce che investire in formazione escluda l'offerta di lavori di basso livello e sottopagati.
        const bestJobs = availableJobs.filter(job => job.trainingRequired === maxTrainingAvailable);
        
        // 5. Scegliamo casualmente tra le offerte di massimo livello disponibili
        const newJob = bestJobs[Math.floor(Math.random() * bestJobs.length)];
        
        showDecisionPrompt(
            "Offerta di Lavoro", 
            `Ruolo: ${newJob.title}. Stipendio: ${formatCurrency(newJob.salary)}/mese.<br><br><span class="text-xs text-gray-500">Richiede: Livello ${newJob.trainingRequired} | Età Minima: ${newJob.ageRequired || 18}</span><br>Accetti?`, 
            () => {
                currentJob = newJob; monthsAtCurrentJob = 0; updateUI();
            }, 
            () => {}
        );
    } else {
        showMessage("Nessuna Offerta", "Non ci sono nuove offerte di lavoro adatte alla tua attuale formazione ed età.");
    }
}

function careerTraining() {
    const trainingCost = 2000 + playerTraining * 100;
    if (playerMoney >= trainingCost) {
        playerMoney -= trainingCost; playerTraining++; updateUI();
    } else showMessage("Fondi Insufficienti", "Non hai abbastanza soldi per il corso.");
}

function generateMonthlyAdvice(investmentDelta = 0) {
    let advice = "Continua a lavorare sodo e a investire saggiamente.";
    const netWorth = calculateNetWorth();
    
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
    
    const reportEl = document.getElementById('monthly-report-text');
    if (reportEl) {
        reportEl.innerHTML = reportHtml;
    }
}

function openCountrySelection() {
    const monthsSinceRelocation = (currentDate.getFullYear() - lastRelocationDate.getFullYear()) * 12 + (currentDate.getMonth() - lastRelocationDate.getMonth());
    
    if (monthsSinceRelocation < 24) {
        return showMessage("Troppo presto", `Devi aspettare almeno 2 anni tra un trasferimento e l'altro. Mesi di attesa rimanenti: <strong>${24 - monthsSinceRelocation}</strong>`);
    }

    const countryBox = document.getElementById('country-box');
    countryBox.classList.remove('hidden');
    const listEl = document.getElementById('country-list');
    listEl.innerHTML = '';

    for (const [key, system] of Object.entries(taxSystems)) {
        if (key === currentCountry) continue; // Nascondi la nazione attuale
        listEl.innerHTML += `
            <div class="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50 bg-white">
                <div>
                    <p class="font-bold text-sm text-gray-800">${system.name}</p>
                    <p class="text-xs text-gray-500">Costo visto/trasloco: ${formatCurrency(system.fee)}</p>
                </div>
                <button onclick="relocateTo('${key}')" class="btn bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-4 text-xs">Vola</button>
            </div>
        `;
    }
}

function relocateTo(countryName) {
    const system = taxSystems[countryName];
    
    // Calcolo della tassa di cambio sul patrimonio in denaro liquido attuale
    const conversionTax = playerMoney * system.exchangeTaxRate;
    const totalCost = system.fee + conversionTax;

    if (playerMoney < totalCost) {
        return showMessage(
            "Fondi Insufficienti", 
            `Non hai abbastanza denaro per trasferirti. Richiesti: <strong>${formatCurrency(totalCost)}</strong>.<br><br>` +
            `<span class="text-xs text-gray-500">• Visto statico: ${formatCurrency(system.fee)}<br>` +
            `• Tassa cambio valuta (${system.exchangeTaxRate * 100}% sul liquido): ${formatCurrency(conversionTax)}</span>`
        );
    }
    
    showDecisionPrompt(
        "Conferma Trasferimento",
        `Vuoi davvero trasferirti in <strong>${countryName}</strong>?<br><br>` +
        `• Costo burocratico: ${formatCurrency(system.fee)}<br>` +
        `• Tassa conversione capitale: ${formatCurrency(conversionTax)} (${system.exchangeTaxRate * 100}%)<br>` +
        `• Spesa totale immediata: <strong>${formatCurrency(totalCost)}</strong>`,
        () => {
            playerMoney -= totalCost;
            currentCountry = countryName;
            lastRelocationDate = new Date(currentDate.getTime());
            
            // Se ci sono prestiti attivi, diventano "Prestiti Esteri Transfrontalieri"
            let loanWarning = "";
            if (playerLoans.length > 0) {
                playerLoans.forEach(loan => {
                    loan.isForeign = true; 
                });
                loanWarning = "<br><br>⚠️ <strong>Nota sui Prestiti:</strong> I tuoi debiti attivi sono ora transfrontalieri. Pagherai una tassa di cambio del +15% su ogni rata mensile.";
            }

            document.getElementById('country-box').classList.add('hidden');
            updateUI();
            showMessage("Trasferimento Completato!", `Benvenuto in ${countryName}! Il tuo capitale è stato convertito e tassato nella nuova valuta.${loanWarning}`);
        },
        () => {}
    );
}

function closeCountrySelection() {
    document.getElementById('country-box').classList.add('hidden');
}