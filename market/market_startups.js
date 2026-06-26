// Variabile globale per tracciare lo storico imprenditoriale (inizializzata dinamicamente per i vecchi salvataggi)
if (typeof window.totalStartupsFounded === 'undefined') {
    window.totalStartupsFounded = 0;
}

function buyStartup() {
    // Sincronizzatore per retrocompatibilità coi vecchi salvataggi
    if (window.totalStartupsFounded < playerStartups.length) {
        window.totalStartupsFounded = playerStartups.length;
    }

    // --- NUOVO ALGORITMO DI PREZZO DINAMICO ---
    
    // 1. Costo Base Storico: Cresce in base a quante startup hai fondato in tutta la partita (+15k a startup)
    const baseCost = 10000 + (window.totalStartupsFounded * 15000); 

    // 2. Scala del Patrimonio (Wealth Factor): 0.5% del tuo Patrimonio Netto totale
    const currentNetWorth = calculateNetWorth();
    const wealthFactor = currentNetWorth * 0.005; 

    // 3. Fattore Macroeconomico: Tassi d'interesse della Banca Centrale
    // marketBaseRate oscilla tra 1% e 8%. Il moltiplicatore va da x1.02 a x1.16 circa.
    const marketMultiplier = 1 + (marketBaseRate * 2); 

    // Calcolo finale del costo
    const startupCost = Math.floor((baseCost + wealthFactor) * marketMultiplier);
    // ------------------------------------------

    if (playerMoney >= startupCost) {
        
        // Finestra di conferma per informare il giocatore del preventivo variabile
        const dialogHTML = `
            <div class="text-left text-sm space-y-2 mt-2">
                <p>Fondare un'azienda richiede capitali variabili in base alla macroeconomia, al tuo storico e alla tua ricchezza.</p>
                <ul class="list-disc pl-4 mt-2 text-gray-700 text-xs">
                    <li>Ambizione Progetto (Storico): <span class="text-indigo-600">${formatCurrency(baseCost)}</span></li>
                    <li>Scala Patrimonio (0.5% net worth): <span class="text-indigo-600">${formatCurrency(wealthFactor)}</span></li>
                    <li>Fattore Tassi d'Interesse (${(marketBaseRate * 100).toFixed(1)}%): <span class="text-red-600">x${marketMultiplier.toFixed(2)}</span></li>
                </ul>
                <hr class="my-2 border-gray-200">
                <p class="font-bold text-base">Capitale Iniziale Richiesto: <span class="text-red-600">${formatCurrency(startupCost)}</span></p>
                <p class="italic text-gray-500 text-xs mt-2">Nota: Il 30% dell'importo diventerà la liquidità iniziale dell'azienda, il resto definirà il valore azionario di partenza e i costi burocratici.</p>
            </div>
        `;

        showDecisionPrompt("Fonda Nuova Startup", dialogHTML, () => {
            playerMoney -= startupCost;
            window.totalStartupsFounded++; 

            // Ripartizione del capitale investito
            const initialCompanyCash = startupCost * 0.30; 
            const initialShareValue = (startupCost * 0.70) / 10000; 

            playerStartups.push({
                money: initialCompanyCash, 
                productName: `Azienda #${window.totalStartupsFounded}`,
                totalShares: 10000, 
                sharesOwned: 10000, 
                shareValue: initialShareValue, 
                previousShareValue: initialShareValue,
                level: 1,
                ageMonths: 0,
                cooldown: 0,
                history: Array(12).fill(initialShareValue)
            });
            
            updateUI();
            showMessage(
                "Azienda Fondata", 
                `Hai completato le pratiche notarili per la tua nuova startup! <strong>${formatCurrency(initialCompanyCash)}</strong> sono stati accreditati nel fondo cassa aziendale.`
            );
        }, () => {});

    } else {
        showMessage(
            "Fondi Insufficienti", 
            `Il tuo progetto d'impresa attuale richiede <strong>${formatCurrency(startupCost)}</strong>, ma non hai abbastanza liquidità disponibile.`
        );
    }
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
            ageMonths: 0, // Traccia l'età per gli eventi finanziari
            history: Array(12).fill(0.5)
        });
        updateUI();
    } else showMessage("Fondi Insufficienti", "Non hai soldi sufficienti per la startup.");
}

function sellStartup(index) {
    if (playerStartups.length > 0 && index >= 0 && index < playerStartups.length) {
        const startupToSell = playerStartups.splice(index, 1)[0];
        
        const sharesValue = (startupToSell.sharesOwned || 0) * startupToSell.shareValue;
        
        // NUOVO: Calcolo corretto della quota di spettanza della cassa aziendale
        const ownershipPercentage = (startupToSell.sharesOwned || 0) / startupToSell.totalShares;
        const enterpriseValue = (startupToSell.money * (1 + Math.random() * 0.5)) * ownershipPercentage;
        
        const totalEarnings = sharesValue + enterpriseValue;
        
        playerMoney += totalEarnings;
        updateUI();
        
        showMessage(
            "Azienda Venduta", 
            `Hai venduto con successo <strong>${startupToSell.productName}</strong>!<br><br>` +
            `• Ricavo Liquidazione Quote: <span class="text-green-600 font-semibold">${formatCurrency(sharesValue)}</span><br>` +
            `• Valore Cassa Aziendale (${(ownershipPercentage * 100).toFixed(1)}% spettanza): <span class="text-green-600 font-semibold">${formatCurrency(enterpriseValue)}</span><br>` +
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
    
    const premiumMultiplier = 1.30 * (typeof globalInflation !== 'undefined' ? globalInflation : 1.0);

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
            ageMonths: 0,
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

    if (startup.cooldown > 0) {
        return showMessage("Pausa Strategica", `L'azienda si sta ancora riprendendo dall'ultima operazione. Devi attendere <strong>${startup.cooldown} mesi</strong> prima di lanciare una nuova Quest.`);
    }

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
        startup.cooldown = 6; 
        
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
        if (startup.cooldown > 0) startup.cooldown--;
        
        // Età per determinare gli eventi capitali
        startup.ageMonths = (startup.ageMonths || 0) + 1;
        
        // NUOVO: EVENTO BIENNALE SUL CAPITALE (Ogni 24 Mesi)
        if (startup.ageMonths % 24 === 0) {
            const isDilution = Math.random() > 0.5;
            if (isDilution) {
                // Aumento di capitale: +20% a +50% delle azioni
                const increaseRatio = 1 + (Math.random() * 0.3 + 0.2); 
                startup.totalShares = Math.floor(startup.totalShares * increaseRatio);
                startup.shareValue = startup.shareValue / increaseRatio; // Il valore unitario cala
                showMessage("Aumento di Capitale", `L'azienda <strong>${startup.productName}</strong> ha emesso nuove azioni per finanziarsi. Le azioni circolanti sono salite a ${startup.totalShares.toLocaleString()}. Il valore della singola quota si è diluito proporzionalmente.`);
            } else {
                // Buyback: riacquisto dal mercato (-5% a -20% delle azioni)
                const decreaseRatio = 1 - (Math.random() * 0.15 + 0.05); 
                const potentialNewTotal = Math.floor(startup.totalShares * decreaseRatio);
                
                // Impedisce di bruciare azioni forzando il giocatore a scendere sotto le proprie
                if (potentialNewTotal > startup.sharesOwned) {
                    startup.totalShares = potentialNewTotal;
                    startup.shareValue = startup.shareValue / decreaseRatio; // Il valore unitario sale
                    showMessage("Buyback Azionario", `L'azienda <strong>${startup.productName}</strong> ha riacquistato azioni dal libero mercato, bruciandole. Le azioni totali sono scese a ${startup.totalShares.toLocaleString()}. Le tue quote rimaste ora valgono di più!`);
                }
            }
        }

        startup.money += Math.random() * 2000;
        startup.previousShareValue = startup.shareValue;
        if (!startup.history) startup.history = Array(12).fill(startup.shareValue);

        // NUOVA LOGICA: Pressione Azionaria. Se il rapporto è > 1 c'è stata diluizione.
        const baselineShares = 10000;
        const sharesRatio = startup.totalShares / baselineShares; 
        
        let swing = (Math.random() * 0.4 - 0.2); // Volatilità Base
        
        if (swing > 0) {
            // Trend Positivo: Più azioni ci sono (sharesRatio > 1), più viene "frenato" l'aumento di prezzo
            swing = swing / Math.pow(sharesRatio, 0.7); 
        } else {
            // Trend Negativo: Più azioni ci sono, più è probabile crollare
            swing = swing * Math.pow(sharesRatio, 0.3);
        }

        startup.shareValue = Math.max(0.01, startup.shareValue + (swing * startup.shareValue));

        startup.history.push(startup.shareValue);
        if (startup.history.length > 12) startup.history.shift();
    });
}