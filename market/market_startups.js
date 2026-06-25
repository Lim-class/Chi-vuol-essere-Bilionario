function buyStartupShares(index) {
    const startup = playerStartups[index];
    const qty = parseInt(document.getElementById(`buy-startup-stock-${index}`).value);
    if (isNaN(qty) || qty <= 0) return showMessage("Errore", "Quantità errata.");
    
    const cost = qty * startup.shareValue;
    if (playerMoney >= cost) {
        playerMoney -= cost;
        startup.sharesOwned = (startup.sharesOwned || 0) + qty;
        updateUI();
    } else showMessage("Fondi", "Non hai abbastanza soldi.");
}

function sellStartupShares(index) {
    const startup = playerStartups[index];
    const qty = parseInt(document.getElementById(`buy-startup-stock-${index}`).value);
    if (isNaN(qty) || qty <= 0 || (startup.sharesOwned || 0) < qty) return showMessage("Errore", "Quantità errata.");
    playerMoney += qty * startup.shareValue;
    startup.sharesOwned -= qty;
    updateUI();
}

function buyStartup() {
    let startupCost = playerStartups.length === 0 ? 10000 : playerStartups.length * 5000 + 10000;
    if (playerMoney >= startupCost) {
        playerMoney -= startupCost;
        playerStartups.push({
            money: 5000, 
            productName: `Azienda #${playerStartups.length + 1}`,
            totalShares: 10000, 
            sharesOwned: 10000, 
            shareValue: 0.5, 
            previousShareValue: 0.5,
            level: 1,
            history: Array(12).fill(0.5)
        });
        updateUI();
    } else showMessage("Fondi Insufficienti", "Non hai soldi sufficienti per la startup.");
}

function sellStartup(index) {
    if (playerStartups.length > 0 && index >= 0 && index < playerStartups.length) {
        // Estraiamo la startup esatta usando splice
        const startupToSell = playerStartups.splice(index, 1)[0];
        
        const sharesValue = (startupToSell.sharesOwned || 0) * startupToSell.shareValue;
        const enterpriseValue = startupToSell.money * (1 + Math.random() * 0.5);
        const totalEarnings = sharesValue + enterpriseValue;
        
        playerMoney += totalEarnings;
        updateUI();
        
        showMessage(
            "Azienda Venduta", 
            `Hai venduto con successo <strong>${startupToSell.productName}</strong>!<br><br>` +
            `• Ricavo Liquidazione Quote: <span class="text-green-600 font-semibold">${formatCurrency(sharesValue)}</span><br>` +
            `• Valore Cassa Aziendale: <span class="text-green-600 font-semibold">${formatCurrency(enterpriseValue)}</span><br>` +
            `<hr class="my-2 border-gray-200">` +
            `• <strong>Totale Accreditato:</strong> <span class="text-indigo-600 font-bold">${formatCurrency(totalEarnings)}</span>`
        );
    } else {
        showMessage("Errore", "Nessuna azienda selezionata o disponibile per la vendita.");
    }
}

function launchTakeoverOffer(stockName) {
    const stock = stocks.find(s => s.name === stockName);
    if (!stock) return;
    if (stock.isDelisted || stock.isFailed) return showMessage("Errore", "Questo asset non è disponibile per l'acquisizione.");

    const TOTAL_COMPANY_SHARES = 50000;
    const ownedShares = stock.owned || 0;
    const sharesToAcquire = TOTAL_COMPANY_SHARES - ownedShares;
    
    const premiumMultiplier = 1.30; 
    const offerPricePerShare = stock.value * premiumMultiplier;
    const totalCost = sharesToAcquire * offerPricePerShare;

    const dialogHTML = `
        <div class="text-left text-sm space-y-2 mt-2">
            <p>Vuoi lanciare un'<strong>Offerta Pubblica di Acquisto (OPA)</strong> per rilevare il 100% di <strong>${stock.name}</strong>?</p>
            <p>• Azioni da rilevare: <strong>${sharesToAcquire.toLocaleString()}</strong> / ${TOTAL_COMPANY_SHARES.toLocaleString()}</p>
            <p>• Prezzo di mercato: <span>${formatCurrency(stock.value)}</span></p>
            <p>• Prezzo offerto (+30% Premio): <span class="text-green-600 font-semibold">${formatCurrency(offerPricePerShare)}</span></p>
            <hr class="my-2 border-gray-200">
            <p>• <strong>Costo Totale Scalata:</strong> <span class="text-red-600 font-bold">${formatCurrency(totalCost)}</span></p>
            <p class="mt-2 text-xs text-gray-500 italic">In caso di successo, l'azienda verrà delistata dalla borsa e diventerà una tua azienda privata al 100%, ereditando il prezzo azionario e ricevendo una cassa iniziale liquida.</p>
        </div>
    `;

    showDecisionPrompt(`OPA: Acquisizione ${stock.name}`, dialogHTML, () => {
        if (playerMoney < totalCost) {
            return showMessage("Fondi Insufficienti", "Non hai abbastanza liquidità per completare questa scalata societaria.");
        }

        playerMoney -= totalCost;
        stock.isDelisted = true; 
        stock.owned = 0; 

        const initialCompanyCash = TOTAL_COMPANY_SHARES * stock.value * 0.05; 

        playerStartups.push({
            money: initialCompanyCash, 
            productName: `${stock.name} Corp`,
            totalShares: 10000, 
            sharesOwned: 10000, 
            shareValue: stock.value, 
            previousShareValue: stock.value,
            level: 4, 
            history: Array(12).fill(stock.value)
        });

        updateUI();
        showMessage(
            "🎉 Acquisizione Riuscita!", 
            `L'OPA ha avuto un successo totale! <strong>${stock.name} Corp</strong> è ora sotto il tuo controllo diretto al 100%. La trovi nella sezione "Gestione Startup" dove potrai finanziare espansioni e completare Quest ad alto budget.`
        );
    }, () => {});
}

function openStartupQuest(index) {
    const startup = playerStartups[index];

    // --- NUOVO: Controllo del Cooldown ---
    if (startup.cooldown > 0) {
        return showMessage("Pausa Strategica", `L'azienda si sta ancora riprendendo dall'ultima operazione. Devi attendere <strong>${startup.cooldown} mesi</strong> prima di lanciare una nuova Quest.`);
    }
    // -------------------------------------

    const quest = startupQuests[Math.floor(Math.random() * startupQuests.length)];
    
    const dialogHTML = `
        <div class="text-left text-sm space-y-2 mt-2">
            <p><strong>Obiettivo:</strong> ${quest.desc}</p>
            <p><strong>Costo Investimento:</strong> <span class="text-red-600">${formatCurrency(quest.cost)}</span></p>
            <hr class="my-2 border-gray-200">
            <p><strong>Possibile Premio:</strong> Valore azioni dell'azienda <strong>x${quest.multiplier}</strong></p>
            <p><strong>Probabilità di Successo:</strong> ${quest.successChance * 100}%</p>
            <p class="mt-4 text-center italic text-gray-500">Accetti il rischio per far crescere la tua azienda?</p>
        </div>
    `;
    
    showDecisionPrompt(`Quest: ${quest.title}`, dialogHTML, () => {
        if (playerMoney < quest.cost) {
            return showMessage("Fondi Insufficienti", "Non hai liquidità a sufficienza per finanziare questa espansione.");
        }
        
        playerMoney -= quest.cost;
        startup.cooldown = 6; // <-- NUOVO: Imposta un tempo di ricarica di 6 mesi
        
        if (Math.random() < quest.successChance) {
            startup.shareValue *= quest.multiplier;
            startup.level = (startup.level || 1) + 1;
            showMessage("🎉 Missione Compiuta!", `L'operazione è stata un successo totale! La tua azienda è passata al <strong>Livello ${startup.level}</strong> e il valore delle sue azioni è schizzato alle stelle.`);
        } else {
            showMessage("📉 Missione Fallita", `Purtroppo l'iniziativa non ha portato i risultati sperati e si è rivelata un buco nell'acqua. I ${formatCurrency(quest.cost)} investiti sono andati perduti.`);
        }
        updateUI();
    }, () => {}); 
}

function updateStartups() {
    playerStartups.forEach(startup => {
        // --- NUOVO: Riduce l'attesa del cooldown ogni mese ---
        if (startup.cooldown > 0) startup.cooldown--;
        
        startup.money += Math.random() * 2000;
        startup.previousShareValue = startup.shareValue;
        if (!startup.history) startup.history = Array(12).fill(startup.shareValue);

        startup.shareValue = Math.max(0.01, startup.shareValue + (Math.random() * 0.4 - 0.2) * startup.shareValue);

        startup.history.push(startup.shareValue);
        if (startup.history.length > 12) startup.history.shift();
    });
}