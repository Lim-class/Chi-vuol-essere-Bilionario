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

const BILLION_TARGET = 1000000000000; // OBIETTIVO: 1 Bilione (Scala Lunga: 1.000 Miliardi)
const LOCAL_STORAGE_PREFIX = 'billionaireGameSave_';
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
    { title: "Disoccupato", salary: 0, trainingRequired: 0 },
    { title: "Saltuario", salary: 302, trainingRequired: 0 },
    { title: "Lavoratore di fattoria", salary: 400, trainingRequired: 0 },
    { title: "Aiutante cuoco", salary: 500, trainingRequired: 0 },
    { title: "Commesso", salary: 700, trainingRequired: 0 },
    { title: "Operatore di call center", salary: 900, trainingRequired: 1 },
    { title: "Cassiere di banca", salary: 1500, trainingRequired: 1 },
    { title: "Sviluppatore software junior", salary: 2500, trainingRequired: 2 },
    { title: "Analista finanziario junior", salary: 3000, trainingRequired: 3 },
    { title: "Marketing Specialist", salary: 3500, trainingRequired: 4 },
    { title: "Sviluppatore software senior", salary: 5000, trainingRequired: 5 },
    { title: "Project Manager", salary: 6000, trainingRequired: 6 },
    { title: "Data Scientist", salary: 8000, trainingRequired: 7 },
    { title: "Consulente finanziario senior", salary: 10000, trainingRequired: 8 },
    { title: "Direttore delle vendite", salary: 15000, trainingRequired: 9 },
    { title: "Chief Technology Officer (CTO)", salary: 25000, trainingRequired: 10 },
    { title: "Direttore finanziario (CFO)", salary: 35000, trainingRequired: 11 },
    { title: "Amministratore Delegato (CEO)", salary: 50000, trainingRequired: 12 },
    { title: "Amministratore Delegato 2^ livello (CEO2)", salary: 500000, trainingRequired: 12 }
];

let stocks = [{ name: "EcoEnergy", value: 45, volatility: 0.25, previousValue: 45 }, { name: "FoodChain", value: 90, volatility: 0.05, previousValue: 90 }];
let currencies = [{ name: "Euro", value: 1, volatility: 0, previousValue: 1 }, { name: "Dollaro USA", value: 1.08, volatility: 0.05, previousValue: 1.08 }, { name: "Yen giapponese", value: 0.0068, volatility: 0.07, previousValue: 0.0068 }];
const bonds = [{ name: "Bund Alba", value: 1, interestRate: 0.05, duration: 240 }, { name: "Bund tedesco", value: 500, interestRate: 0.015, duration: 6 }, { name: "Bund Italiano", value: 100000, interestRate: 0.035, duration: 48 }, { name: "Bund Positivo", value: 1000, interestRate: 0.02, duration: 6 }];
const allPossibleStocks = [{ name: "TechCorp", value: 50, volatility: 0.15, previousValue: 50 }, { name: "GlobalMotors", value: 80, volatility: 0.10, previousValue: 80 }, { name: "HealthInnovations", value: 120, volatility: 0.20, previousValue: 120 }, { name: "Cybernetics Inc.", value: 200, volatility: 0.3, previousValue: 200 }, { name: "Aqua Pure Solutions", value: 70, volatility: 0.18, previousValue: 70 }, { name: "SpaceXplore", value: 500, volatility: 0.4, previousValue: 500 }];
const allPossibleCurrencies = [{ name: "Dollaro canadese", value: 0.74, volatility: 0.06, previousValue: 0.74 }, { name: "Sterlina britannica", value: 1.17, volatility: 0.04, previousValue: 1.17 }, { name: "Franco svizzero", value: 1.02, volatility: 0.03, previousValue: 1.02 }, { name: "Dollaro australiano", value: 0.66, volatility: 0.07, previousValue: 0.66 }];