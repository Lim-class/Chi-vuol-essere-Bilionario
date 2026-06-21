# ⚙️ Core Folder

Questa cartella contiene i file fondamentali che definiscono lo scheletro di dati, le variabili d'ambiente globali e le routine di inizializzazione all'avvio della pagina o al riavvio del gioco.

## 📄 File contenuti

### 1. `state.js`
* **Scopo:** È il database centrale e reattivo dello stato del gioco in memoria volatile.
* **Contenuto chiave:**
  * Variabili primitive del giocatore (`playerMoney`, `playerAge`, `playerTraining`).
  * Array di monitoraggio dinamico (`playerStartups`, `playerLoans`, `stocks`, `currencies`).
  * Bilanciamento dei parametri e costanti matematiche (`BILLION_TARGET`, `ASSET_FAILURE_CHANCE`, ecc.).
  * Database statico dei lavori disponibili (`jobs`) ordinati per livello formativo ed età minima, e delle missioni aziendali (`startupQuests`).

### 2. `game_init.js`
* **Scopo:** Gestisce i trigger di avvio del ciclo di vita dell'applicazione.
* **Contenuto chiave:**
  * `window.onload`: Configura i listener d'ascolto sui pulsanti HTML della UI.
  * `restartGame()`: Ripristina tutti i valori del giocatore allo stato iniziale (18 anni, 1000€).
  * `endGame()`: Interrompe i cicli e mostra la schermata di vittoria (raggiungimento del Bilione) o di Game Over (Bancarotta o raggiungimento dei 60 anni).