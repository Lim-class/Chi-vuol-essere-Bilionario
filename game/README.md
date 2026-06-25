# 🎮 Game Folder (Meccaniche e Progressioni)

Questa cartella ospita i motori comportamentali che regolano lo scorrere del tempo, la carriera del giocatore, gli eventi casuali mensili e la persistenza dei dati.

## 📄 File contenuti

### 1. `game_loop.js`
* **Scopo:** È l'orologio principale del gioco.
* **Logica Chiave:** * `nextMonth()`: Esegue tutti i calcoli mensili in sequenza ordinata: detrae le tasse automatiche (23% sullo stipendio o 50€ di tasse fisse da disoccupato), detrae i costi di mantenimento delle startup (200€ ad azienda), esegue i prelievi coatti delle rate dei prestiti, verifica lo stato di deficit fiscale (bancarotta se si resta in debito d'imposta per più di 8 mesi consecutivi), elabora i licenziamenti casuali o i pagamenti degli stipendi, fa avanzare la data e l'età del giocatore.
  * `skipTime()`: Permette di elaborare ciclicamente decine di mesi o anni in un singolo frame (fino a un massimo di 100 anni per evitare il congelamento del thread del browser).

### 2. `game_player.js`
* **Scopo:** Gestisce il bilancio complessivo del giocatore e le interazioni di carriera.
* **Logica Chiave:**
  * `calculateNetWorth()`: Calcola analiticamente il patrimonio netto aggregando la liquidità corrente, il valore corrente delle azioni possedute, il valore delle valute, il capitale nominale delle obbligazioni e il valore stimato delle quote di startup, sottraendo i debiti fiscali arretrati e i capitali residui dovuti alla banca.
  * Gestisce le promozioni/ricerche di impieghi migliori tramite `searchNewJobOffer()` basandosi sul livello di formazione (`playerTraining`) accumulato pagando i corsi di studio.
  * Genera la consulenza finanziaria testuale dinamica e i report mensili sulle variazioni percentuali del portafoglio asset.

### 3. `game_storage.js`
* **Scopo:** Assicura la persistenza dello stato di gioco.
* **Logica Chiave:** Serializza l'intero stato delle variabili globali in stringhe JSON salvandole nel `localStorage` del browser associandole a un nome personalizzato, consentendo il salvataggio, il caricamento istantaneo e la cancellazione delle partite memorizzate.