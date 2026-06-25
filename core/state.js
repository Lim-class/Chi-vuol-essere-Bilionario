let playerMoney = 1000;
let playerAge = 18;
let playerTraining = 0;
let currentDate = new Date(2025, 0, 1);
let currentJob = null;
let monthsAtCurrentJob = 0;
let proposedJob = null;
let playerStartups = [];
let playerLoans = []; 
let consecutiveTaxDeficitMonths = 0;
let unpaiedTaxDebt = 0;
let marketBaseRate = 0.04;

// --- NUOVE VARIABILI PER LE NAZIONI ---
const taxSystems = {
    "Italia": {
        name: "Italia",
        fee: 5000,
        exchangeTaxRate: 0.02, // 2% di commissione/tassa sul capitale in entrata
        calculateTax: (salaryAnnuale) => {
            if (salaryAnnuale === 0) return 50 * 12;
            const inps = salaryAnnuale * 0.0919;
            const imponibile = salaryAnnuale - inps;
            let irpef = 0;
            if (imponibile <= 28000) irpef = imponibile * 0.23;
            else if (imponibile <= 50000) irpef = (28000 * 0.23) + ((imponibile - 28000) * 0.35);
            else irpef = (28000 * 0.23) + (22000 * 0.35) + ((imponibile - 50000) * 0.43);
            const addizionali = imponibile * 0.02;
            return inps + irpef + addizionali;
        }
    },
    "Stati Uniti": {
        name: "Stati Uniti",
        fee: 15000,
        exchangeTaxRate: 0.04, // 4% di tassa cambio e trasferimento ricchezza
        calculateTax: (salaryAnnuale) => {
            if (salaryAnnuale === 0) return 150 * 12;
            let federalTax = 0;
            if (salaryAnnuale <= 11000) federalTax = salaryAnnuale * 0.10;
            else if (salaryAnnuale <= 44000) federalTax = (11000 * 0.10) + ((salaryAnnuale - 11000) * 0.12);
            else if (salaryAnnuale <= 95000) federalTax = (11000 * 0.10) + (33000 * 0.12) + ((salaryAnnuale - 44000) * 0.22);
            else federalTax = (11000 * 0.10) + (33000 * 0.12) + (51000 * 0.22) + ((salaryAnnuale - 95000) * 0.32);
            const stateTax = salaryAnnuale * 0.05;
            return federalTax + stateTax;
        }
    },
    "Svizzera": {
        name: "Svizzera",
        fee: 25000,
        exchangeTaxRate: 0.03, // 3% di barriera valutaria (CHF)
        calculateTax: (salaryAnnuale) => {
            if (salaryAnnuale === 0) return 350 * 12;
            return salaryAnnuale * 0.18; 
        }
    },
    "Emirati Arabi (Dubai)": {
        name: "Emirati Arabi (Dubai)",
        fee: 50000,
        exchangeTaxRate: 0.06, // 6% per l'esportazione di grossi capitali commerciali
        calculateTax: (salaryAnnuale) => {
            return 0; 
        }
    }
};

let currentCountry = "Italia";
let lastRelocationDate = new Date(2020, 0, 1); // Anno fittizio nel passato per permettere un trasferimento subito

const BILLION_TARGET = 1000000000000; 
const ASSET_FAILURE_CHANCE = 0.03;
const ASSET_REBIRTH_CHANCE = 0.10;
const ASSET_DELISTING_THRESHOLD = 3;
const ASSET_DELISTING_CHANCE = 0.20;
const JOB_EVENT_CHANCE = 0.10;
const MAX_TAX_DEFICIT_MONTHS = 8;

const startupQuests = [
    { title: "Marketing Virale", cost: 5000, successChance: 0.65, multiplier: 1.5, desc: "Lancia una campagna pubblicitaria virale sui social media." },
    { title: "Ricerca e Sviluppo", cost: 25000, successChance: 0.50, multiplier: 2.2, desc: "Investi nello sviluppo di una tecnologia rivoluzionaria." },
    { title: "Espansione Internazionale", cost: 100000, successChance: 0.40, multiplier: 3.5, desc: "Apri nuove sedi all'estero per aggredire il mercato globale." },
    { title: "Acquisizione Competitor", cost: 500000, successChance: 0.60, multiplier: 2.5, desc: "Tenta l'acquisizione di un'azienda rivale più piccola." },
    { title: "Sbarco a Wall Street", cost: 2000000, successChance: 0.30, multiplier: 6.0, desc: "Forza l'ingresso in borsa con un'IPO ultra-aggressiva." }
];

const jobs = [
    // --- LIVELLO BASE (Senza esperienza, 18+ anni) ---
    { title: "Disoccupato", salary: 0, trainingRequired: 0, ageRequired: 18 },
    { title: "Fattorino (Rider)", salary: 250, trainingRequired: 0, ageRequired: 18 },
    { title: "Saltuario", salary: 302, trainingRequired: 0, ageRequired: 18 },
    { title: "Lavoratore di fattoria", salary: 400, trainingRequired: 0, ageRequired: 18 },
    { title: "Aiutante cuoco", salary: 500, trainingRequired: 0, ageRequired: 18 },
    { title: "Barista", salary: 600, trainingRequired: 0, ageRequired: 18 },
    { title: "Commesso", salary: 700, trainingRequired: 0, ageRequired: 18 },
    { title: "Magazziniere", salary: 850, trainingRequired: 0, ageRequired: 18 },

    // --- LIVELLO APPRENDISTA (Bassa formazione, 19-20+ anni) ---
    { title: "Operatore di call center", salary: 900, trainingRequired: 1, ageRequired: 19 },
    { title: "Impiegato amministrativo", salary: 1200, trainingRequired: 1, ageRequired: 20 },
    { title: "Cassiere di banca", salary: 1500, trainingRequired: 1, ageRequired: 20 },

    // --- LIVELLO SPECIALIZZATO (Media formazione, 21-24+ anni) ---
    { title: "Idraulico", salary: 1800, trainingRequired: 2, ageRequired: 21 },
    { title: "Elettricista", salary: 1900, trainingRequired: 2, ageRequired: 21 },
    { title: "Infermiere", salary: 2000, trainingRequired: 3, ageRequired: 22 },
    { title: "Insegnante scolastico", salary: 2200, trainingRequired: 3, ageRequired: 24 },
    { title: "Sviluppatore software junior", salary: 2500, trainingRequired: 2, ageRequired: 21 },
    { title: "Analista finanziario junior", salary: 3000, trainingRequired: 3, ageRequired: 22 },

    // --- LIVELLO ESPERTO (Alta formazione, 24-28+ anni) ---
    { title: "Marketing Specialist", salary: 3500, trainingRequired: 4, ageRequired: 24 },
    { title: "Avvocato Junior", salary: 4000, trainingRequired: 5, ageRequired: 25 },
    { title: "Ingegnere edile", salary: 4500, trainingRequired: 5, ageRequired: 26 },
    { title: "Sviluppatore software senior", salary: 5000, trainingRequired: 5, ageRequired: 26 },
    { title: "Project Manager", salary: 6000, trainingRequired: 6, ageRequired: 28 },
    { title: "Architetto Senior", salary: 7000, trainingRequired: 6, ageRequired: 28 },
    { title: "Data Scientist", salary: 8000, trainingRequired: 7, ageRequired: 28 },

    // --- LIVELLO PRESTIGIO (Altissima formazione, 29-32+ anni) ---
    { title: "Medico di base", salary: 9000, trainingRequired: 8, ageRequired: 29 },
    { title: "Consulente finanziario senior", salary: 10000, trainingRequired: 8, ageRequired: 30 },
    { title: "Avvocato Partner", salary: 12000, trainingRequired: 9, ageRequired: 32 },
    { title: "Direttore delle vendite", salary: 15000, trainingRequired: 9, ageRequired: 32 },

    // --- LIVELLO EXECUTIVE (Formazione massima ed esperienza, 35+ anni) ---
    { title: "Chirurgo Primario", salary: 20000, trainingRequired: 10, ageRequired: 35 },
    { title: "Chief Technology Officer (CTO)", salary: 25000, trainingRequired: 10, ageRequired: 35 },
    { title: "Direttore Generale", salary: 30000, trainingRequired: 11, ageRequired: 37 },
    { title: "Direttore Finanziario (CFO)", salary: 35000, trainingRequired: 11, ageRequired: 38 },
    { title: "Amministratore Delegato (CEO)", salary: 50000, trainingRequired: 12, ageRequired: 42 },

    // --- LIVELLO ÉLITE (I veri padroni del gioco, 45+ anni) ---
    { title: "Membro del CdA Azionario", salary: 100000, trainingRequired: 12, ageRequired: 45 },
    { title: "Amministratore Delegato 2^ livello (CEO2)", salary: 500000, trainingRequired: 12, ageRequired: 50 }
];
let stocks = [{ name: "EcoEnergy", value: 45, volatility: 0.25, previousValue: 45 }, { name: "FoodChain", value: 90, volatility: 0.05, previousValue: 90 }];
let currencies = [{ name: "Euro", value: 1, volatility: 0, previousValue: 1 }, { name: "Dollaro USA", value: 1.08, volatility: 0.05, previousValue: 1.08 }, { name: "Yen giapponese", value: 0.0068, volatility: 0.07, previousValue: 0.0068 }];
const bonds = [
  { 
    name: "BTP Valore", 
    value: 10000,          // Lotto minimo realistico per piccoli risparmiatori
    interestRate: 0.0335,   // 3.35% (Rendimento medio attuale per i BTP a lungo termine)
    duration: 72           // 6 anni (Durata classica di molte emissioni recenti)
  }, 
  { 
    name: "Bund Tedesco", 
    value: 5000,           // Taglio più accessibile
    interestRate: 0.0220,  // 2.20% (I titoli tedeschi rendono sempre meno di quelli italiani perché considerati più sicuri)
    duration: 120          // 10 anni (Il Bund decennale è il punto di riferimento europeo)
  }, 
  { 
    name: "BOT Italiano", 
    value: 100000,         // Ottimo per grandi liquidità a breve termine
    interestRate: 0.0305,  // 3.05% (Rendimento per scadenze brevi)
    duration: 12           // 12 mesi (I BOT durano massimo un anno)
  }
];
const allPossibleStocks = [{ name: "TechCorp", value: 50, volatility: 0.15, previousValue: 50 }, { name: "GlobalMotors", value: 80, volatility: 0.10, previousValue: 80 }, { name: "HealthInnovations", value: 120, volatility: 0.20, previousValue: 120 }, { name: "Cybernetics Inc.", value: 200, volatility: 0.3, previousValue: 200 }, { name: "Aqua Pure Solutions", value: 70, volatility: 0.18, previousValue: 70 }, { name: "SpaceXplore", value: 500, volatility: 0.4, previousValue: 500 }];
const allPossibleCurrencies = [{ name: "Dollaro canadese", value: 0.74, volatility: 0.06, previousValue: 0.74 }, { name: "Sterlina britannica", value: 1.17, volatility: 0.04, previousValue: 1.17 }, { name: "Franco svizzero", value: 1.02, volatility: 0.03, previousValue: 1.02 }, { name: "Dollaro australiano", value: 0.66, volatility: 0.07, previousValue: 0.66 }];