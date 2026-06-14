# 🎨 UI Folder (User Interface)

Questa cartella è interamente dedicata alla manipolazione del DOM, alla formattazione visiva dei dati finanziari e al rendering dei grafici in tempo reale basati sull'andamento dei mercati.

## 📄 File contenuti

### 1. `ui_modals.js`
* **Scopo:** Gestisce le finestre di dialogo interattive che bloccano l'interfaccia per richiedere l'intervento dell'utente.
* **Funzioni principali:** `showMessage()` per i messaggi base, `showDecisionPrompt()` per le scelte binarie (es. Accetta/Rifiuta un lavoro o un'OPA), e `showSaveLoadPrompt()` per generare la lista interattiva dei salvataggi.

### 2. `ui_render_core.js`
* **Scopo:** È il motore di aggiornamento visivo principale delle statistiche vitali del giocatore.
* **Funzioni principali:** * `formatCurrency()`: Formatta i numeri float in stringhe valutarie nel formato ufficiale `it-IT` (es. `€1.500,00`).
  * `updateUI()`: Sincronizza i dati visivi di patrimonio, denaro, debito, età e lavoro, richiamando a cascata i sotto-rendering della borsa, delle startup e della banca.

### 3. `ui_market_assets.js`
* **Scopo:** Genera dinamicamente le schede HTML per i mercati tradizionali di Azioni, Valute estere e Obbligazioni Statali, iniettando i form di input e i pulsanti di acquisto/vendita.

### 4. `ui_market_startups.js`
* **Scopo:** Renderizza le schede delle aziende private avviate o scalate dal giocatore, mostrando il livello attuale, la cassa liquida interna e il pulsante per attivare le Quest.

### 5. `ui_market_charts.js`
* **Scopo:** Sfrutta la libreria **Chart.js** per disegnare due grafici lineari indipendenti. Divide gli asset in alta capitalizzazione (prezzo > 50€) e bassa capitalizzazione (prezzo <= 50€) per ottimizzare la leggibilità della scala lineare.