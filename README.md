# 💰 Simulatore di Vita da Bilionario (Euro Edition)

Benvenuto nella documentazione tecnica del codice sorgente di **Simulatore di Vita da Bilionario**. Questo progetto è un gioco di simulazione economico-finanziaria testuale e grafico basato su passaggi di tempo mensili, in cui l'obiettivo finale è raggiungere un patrimonio netto di **1 Bilione di Euro** (1.000 Miliardi di €) prima del pensionamento (60 anni).

## 🚀 Requisiti di Avvio (CORS Policy)
A causa della divisione del codice in moduli JavaScript locali distinti, i browser moderni bloccano l'esecuzione diretta del file `index.html` tramite doppio clic (`file:///`). 
* **Per giocare/sviluppare:** È necessario avviare il progetto tramite un server locale locale. Si consiglia l'uso dell'estensione **Live Server** su VS Code o **Web Server for Chrome**.

## 🏗️ Architettura dei File
Il progetto è strutturato in modo modulare per separare i dati strutturali, l'interfaccia utente (UI), i mercati finanziari e i motori di gioco interni:

* **`index.html`** & **`style.css`**: Punto d'ingresso e foglio di stile (utilizza TailwindCSS e Chart.js da CDN).
* **`core/`**: Contiene lo stato globale del gioco e gli eventi di inizializzazione.
* **`ui/`**: Gestisce i rendering dei componenti grafici delle schede, dei grafici e dei nodi modali.
* **`market/`**: Contiene gli algoritmi di compravendita e le formule matematiche di finanza/credito.
* **`game/`**: Gestisce il ciclo temporale, la crescita del giocatore e il sistema di salvataggio localStorage.

---