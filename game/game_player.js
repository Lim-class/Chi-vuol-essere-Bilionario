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
    let availableJobs = jobs.filter(job => 
        job.trainingRequired <= playerTraining && 
        playerAge >= (job.ageRequired || 18) &&
        job.title !== "Disoccupato" && job.title !== "Disoccupata"
    );

    if (availableJobs.length > 0) {
        // Mischiamo l'array casualmente
        availableJobs.sort(() => 0.5 - Math.random());
        // Prendiamo fino a 3 offerte disponibili
        const offers = availableJobs.slice(0, 3);
        
        // Creiamo una lista HTML per far scegliere il giocatore
        let offersHTML = `<div class="text-left space-y-3 mt-3">`;
        offers.forEach((job, idx) => {
            offersHTML += `
                <div class="p-2 border rounded bg-gray-50 flex justify-between items-center">
                    <div>
                        <p class="font-bold text-sm">${job.title}</p>
                        <p class="text-xs text-green-600 font-semibold">${formatCurrency(job.salary)}/mese</p>
                    </div>
                    <button onclick="acceptJobOffer('${job.title}')" class="btn bg-indigo-600 text-white text-xs px-3 py-1">Accetta</button>
                </div>
            `;
        });
        offersHTML += `</div><p class="text-xs text-gray-500 mt-4 italic">Se rifiuti, manterrai il tuo stato attuale.</p>`;
        
        // Usiamo un modale senza il tasto "Accetta" globale, dato che i tasti sono nelle singole card
        showDecisionPrompt("Offerte di Lavoro Ricevute", offersHTML, () => {}, () => {
            document.getElementById('proceed-btn').classList.remove('hidden');
        });
        
        // Nascondiamo il bottone "Accetta" principale del modale per forzare il clic sulle card
        document.getElementById('proceed-btn').classList.add('hidden');

    } else {
        showMessage("Nessuna Offerta", "Non ci sono nuove offerte di lavoro adatte alla tua attuale formazione ed età.");
    }
}

// Funzione helper per accettare il lavoro scelto
window.acceptJobOffer = function(jobTitle) {
    const selectedJob = jobs.find(j => j.title === jobTitle);
    if (selectedJob) {
        currentJob = selectedJob;
        monthsAtCurrentJob = 0;
        updateUI();
        hideDecisionPrompt();
        document.getElementById('proceed-btn').classList.remove('hidden'); // Ripristina il bottone del modale
        
        // BUG FIX: Utilizziamo showMessage che è correttamente definito nel sistema UI
        showMessage("Lavoro Accettato", `Hai iniziato la tua nuova carriera come <strong>${selectedJob.title}</strong>!`);
    }
};

function careerTraining() {
    // NUOVO: Il costo della formazione si adegua all'inflazione globale
    const trainingCost = (2000 + playerTraining * 100) * globalInflation;
    if (playerMoney >= trainingCost) {
        playerMoney -= trainingCost; 
        playerTraining++; 
        updateUI();
        showMessage("Corso Completato", `Hai completato con successo un nuovo corso di specializzazione! Ti è costato ${formatCurrency(trainingCost)}.`);
    } else {
        showMessage("Fondi Insufficienti", `Non hai abbastanza soldi. Il corso attualmente costa ${formatCurrency(trainingCost)} a causa dell'inflazione.`);
    }
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
    
    // --- NOTIFICA VISIVA INFLAZIONE ---
    if (window.inflationOccurredThisMonth) {
        reportHtml += `
            <div class="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 font-semibold flex items-center gap-1">
                ⚠️ <span><strong>Rivalutazione Monetaria:</strong> Scattato il nuovo anno. L'inflazione (+2.5%) ha aumentato stipendi, tasse e costi.</span>
            </div>`;
        window.inflationOccurredThisMonth = false; // Reset del flag per il mese successivo
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
    
    // NUOVO CALCOLO: Tassa di espatrio sul Patrimonio Netto Totale (impedisce l'evasione nascondendo soldi in asset)
    const totalNetWorth = calculateNetWorth();
    const conversionTax = totalNetWorth * system.exchangeTaxRate;
    const totalCost = system.fee + conversionTax;

    if (playerMoney < totalCost) {
        return showMessage(
            "Fondi Insufficienti", 
            `Non hai abbastanza liquidità per trasferirti. Richiesti: <strong>${formatCurrency(totalCost)}</strong> in contanti.<br><br>` +
            `<span class="text-xs text-gray-500">• Visto statico: ${formatCurrency(system.fee)}<br>` +
            `• Tassa di espatrio (${system.exchangeTaxRate * 100}% sul tuo intero Patrimonio Netto di ${formatCurrency(totalNetWorth)}): ${formatCurrency(conversionTax)}<br><br>` +
            `<em>💡 Suggerimento: Devi liquidare alcuni dei tuoi investimenti (Azioni, Obbligazioni, ecc.) per ottenere i contanti necessari a pagare l'espatrio.</em></span>`
        );
    }
    
    showDecisionPrompt(
        "Conferma Trasferimento",
        `Vuoi davvero trasferirti in <strong>${countryName}</strong>?<br><br>` +
        `• Costo burocratico: ${formatCurrency(system.fee)}<br>` +
        `• Tassa di espatrio globale: ${formatCurrency(conversionTax)} (${system.exchangeTaxRate * 100}% del patrimonio totale)<br>` +
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
            showMessage("Trasferimento Completato!", `Benvenuto in ${countryName}! Hai pagato le tasse di espatrio e ti sei stabilito con successo.${loanWarning}`);
        },
        () => {}
    );
}

function closeCountrySelection() {
    document.getElementById('country-box').classList.add('hidden');
}