// ==========================================
// GAME_STORAGE.JS - Gestione Salvataggi su File (JSON)
// ==========================================

/**
 * Serializza lo stato attuale del gioco in un oggetto strutturato.
 * Include metadati di controllo e tutte le variabili di stato necessarie.
 */
function serializeGameState() {
    return {
        metadata: {
            game: "Chi vuol essere Bilionario",
            saveDate: new Date().toISOString(),
            version: "1.2"
        },
        player: {
            money: playerMoney,
            age: playerAge,
            training: playerTraining,
            currentJob: currentJob,
            monthsAtCurrentJob: monthsAtCurrentJob,
            proposedJob: proposedJob
        },
        economy: {
            currentDate: currentDate.getTime(), // Salviamo il timestamp dell'oggetto Date
            marketBaseRate: marketBaseRate,
            unpaiedTaxDebt: unpaiedTaxDebt,
            consecutiveTaxDeficitMonths: consecutiveTaxDeficitMonths
        },
        assets: {
            playerStartups: playerStartups,
            playerLoans: playerLoans,
            stocks: stocks,
            currencies: currencies,
            bonds: bonds
        }
    };
}

/**
 * Ripristina le variabili globali di stato partendo dall'oggetto decodificato dal file JSON.
 */
function deserializeGameState(data) {
    try {
        // Validazione del file caricato
        if (!data || !data.metadata || data.metadata.game !== "Chi vuol essere Bilionario") {
            throw new Error("Il file selezionato non è un salvataggio valido per questo gioco.");
        }

        // 1. Ripristino dati Giocatore
        playerMoney = data.player.money;
        playerAge = data.player.age;
        playerTraining = data.player.training;
        currentJob = data.player.currentJob;
        monthsAtCurrentJob = data.player.monthsAtCurrentJob || 0;
        proposedJob = data.player.proposedJob || null;

        // 2. Ripristino dati Economici e Temporali
        currentDate = new Date(data.economy.currentDate);
        marketBaseRate = data.economy.marketBaseRate || 0.04;
        unpaiedTaxDebt = data.economy.unpaiedTaxDebt || 0;
        consecutiveTaxDeficitMonths = data.economy.consecutiveTaxDeficitMonths || 0;

        // 3. Ripristino Mercati e Asset
        playerStartups = data.assets.playerStartups || [];
        playerLoans = data.assets.playerLoans || [];
        stocks = data.assets.stocks || [];
        currencies = data.assets.currencies || [];
        bonds = data.assets.bonds || [];

        // 4. Aggiornamento Interfaccia Grafica e Feedback
        updateUI();
        showMessage("Caricamento", "Partita caricata correttamente dal file importato!");
    } catch (error) {
        showMessage("Errore Caricamento", error.message);
    }
}

/**
 * Gestisce l'apertura del modale di salvataggio o l'importazione del file.
 */
function showSaveLoadPrompt(mode) {
    if (mode === 'save') {
        const saveBox = document.getElementById('save-list-box');
        if (saveBox) {
            saveBox.classList.remove('hidden');
            
            // Adattamento della UI del modale esistente per il download del file
            document.getElementById('save-list-title').textContent = "Esporta Salvataggio (.json)";
            document.getElementById('save-input-area').classList.remove('hidden');
            document.getElementById('show-save-input-btn').classList.add('hidden');
            document.getElementById('saved-games-list').classList.add('hidden'); // Nasconde il vecchio box localStorage
        }
    } else if (mode === 'load') {
        // Se si preme Carica, invochiamo direttamente il file explorer di sistema
        triggerFileImport();
    }
}

/**
 * Nasconde il modale di salvataggio.
 */
function hideSaveLoadPrompt() {
    const saveBox = document.getElementById('save-list-box');
    if (saveBox) saveBox.classList.add('hidden');
}

/**
 * Genera il file JSON strutturato e avvia il download sul PC del giocatore.
 */
function saveGame(saveName) {
    if (!saveName) return;

    const gameState = serializeGameState();
    const jsonString = JSON.stringify(gameState, null, 2);
    
    // Creazione del file Blob in memoria
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // Sanificazione del nome del file (rimozione caratteri speciali)
    const safeFileName = saveName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Creazione del trigger di download fittizio nel DOM
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `${safeFileName}_save.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Pulizia del DOM e della memoria
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
    
    hideSaveLoadPrompt();
    showMessage("Salvataggio", `Partita esportata e scaricata come "${safeFileName}_save.json".`);
}

/**
 * Crea un input di tipo "file" nascosto per permettere l'importazione del file .json.
 */
function triggerFileImport() {
    let fileInput = document.getElementById('file-loader-input');
    
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.id = 'file-loader-input';
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const parsedData = JSON.parse(evt.target.result);
                    deserializeGameState(parsedData);
                } catch (err) {
                    showMessage("Errore File", "Il file selezionato non contiene dati JSON validi.");
                }
            };
            reader.readAsText(file);
            
            // Resetta l'input per permettere di ricaricare lo stesso file in futuro
            e.target.value = '';
        });
    }
    
    fileInput.click();
}

/**
 * Nota: La funzione deleteSave(saveName) non è più necessaria 
 * poiché la gestione dell'eliminazione fisica dei file è a carico del PC dell'utente.
 */