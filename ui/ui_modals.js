const messageBox = document.getElementById('message-box');
const decisionBox = document.getElementById('decision-box');
const saveListBox = document.getElementById('save-list-box');
const saveInputArea = document.getElementById('save-input-area');
const showSaveInputBtn = document.getElementById('show-save-input-btn');
const savedGamesList = document.getElementById('saved-games-list');
const noSavedGamesMessage = document.getElementById('no-saved-games-message');

function showMessage(title, message) {
    messageBox.classList.remove('hidden');
    document.getElementById('message-content-wrapper').classList.remove('opacity-0', 'scale-95');
    document.getElementById('message-content-wrapper').classList.add('opacity-100', 'scale-100');
    document.getElementById('message-title').textContent = title;
    document.getElementById('message-text').innerHTML = message;
}

function hideMessageBox() {
    messageBox.classList.add('hidden');
}

function showDecisionPrompt(title, message, onProceed, onDecline) {
    decisionBox.classList.remove('hidden');
    document.getElementById('decision-content-wrapper').classList.remove('opacity-0', 'scale-95');
    document.getElementById('decision-content-wrapper').classList.add('opacity-100', 'scale-100');
    document.getElementById('decision-title').textContent = title;
    document.getElementById('decision-text').innerHTML = message; 
    
    const proceedBtn = document.getElementById('proceed-btn');
    const declineBtn = document.getElementById('decline-btn');

    const handleProceed = () => { onProceed(); hideDecisionPrompt(); removeListeners(); };
    const handleDecline = () => { onDecline(); hideDecisionPrompt(); removeListeners(); };
    
    const removeListeners = () => {
        proceedBtn.removeEventListener('click', handleProceed);
        declineBtn.removeEventListener('click', handleDecline);
    };

    proceedBtn.addEventListener('click', handleProceed);
    declineBtn.addEventListener('click', handleDecline);
}

function hideDecisionPrompt() { decisionBox.classList.add('hidden'); }

function showSaveLoadPrompt(mode) {
    saveListBox.classList.remove('hidden');
    document.getElementById('save-list-content-wrapper').classList.remove('opacity-0', 'scale-95');
    document.getElementById('save-list-content-wrapper').classList.add('opacity-100', 'scale-100');
    
    document.getElementById('save-list-title').textContent = mode === 'save' ? "Salva Partita" : "Carica Partita";
    mode === 'save' ? saveInputArea.classList.remove('hidden') : saveInputArea.classList.add('hidden');
    mode === 'save' ? showSaveInputBtn.classList.add('hidden') : showSaveInputBtn.classList.remove('hidden');
    
    savedGamesList.innerHTML = '';
    const savedGameKeys = Object.keys(localStorage).filter(key => key.startsWith(LOCAL_STORAGE_PREFIX));
    
    if (savedGameKeys.length === 0) {
        noSavedGamesMessage.classList.remove('hidden');
    } else {
        noSavedGamesMessage.classList.add('hidden');
        savedGameKeys.forEach(key => {
            const saveName = key.substring(LOCAL_STORAGE_PREFIX.length);
            const listItem = document.createElement('div');
            listItem.className = 'flex items-center justify-between p-2 my-1 bg-gray-100 rounded-lg';
            listItem.innerHTML = `
                <span>${saveName}</span>
                <div class="flex gap-2">
                    ${mode === 'load' ? `<button class="bg-blue-500 text-white px-2 py-1 rounded text-sm" onclick="loadGame('${saveName}')">Carica</button>` : ''}
                    <button class="bg-red-500 text-white px-2 py-1 rounded text-sm" onclick="deleteSave('${saveName}')">Cancella</button>
                </div>
            `;
            savedGamesList.appendChild(listItem);
        });
    }
}

function hideSaveLoadPrompt() { saveListBox.classList.add('hidden'); }