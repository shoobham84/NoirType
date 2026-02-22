import { WORD_LIST } from './words.js';
import { generateRandomWords } from './board.js';
import { setMaxTime, clearAppTimer, startCountdown, calculateLiveWPM } from './timer.js';



const overlay = document.querySelector('.words-overlay');
const input = document.querySelector('.words-input');
const timerDisplay = document.querySelector('.timer-display');
const wpmDisplay = document.querySelector('.live-wpm');

const modal = document.querySelector('#result-modal')
const modalCurrentWPM = document.querySelector('#modal-current-wpm');
const modalAccuracy = document.querySelector('#modal-accuracy');
const modalMaxWPM = document.querySelector('#modal-max-wpm');
const restartBtn = document.querySelector('.restart-btn');



generateBoard();
let timerStarted = false;



function generateBoard() {
    overlay.innerHTML = "";
    overlay.innerText = "";

    generateRandomWords(WORD_LIST, overlay);

    let targetString = overlay.innerText;
    overlay.innerHTML = '';
    targetString.split('').forEach(char => {
        const span = document.createElement('span');
        span.innerText = char;
        overlay.appendChild(span);
    });
}


function initTimeSelectors() {
    const buttons = document.querySelectorAll('.time-set');

    buttons.forEach(button => {
        if (button.value === '30') {
            button.classList.add('active');
        }
        else button.classList.remove('active');

        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const selectedMode = button.value;

            if (selectedMode === 'endless') {
                setMaxTime(Infinity);
                timerDisplay.innerText = '∞';
                timerDisplay.style.fontSize = '2.5rem';
            }
            else {
                setMaxTime(parseInt(selectedMode));
                timerDisplay.innerText = parseInt(selectedMode);
                timerDisplay.style.fontSize = '1.5rem';
            }

            clearAppTimer();
            timerStarted = false;

            resetGame();
            input.focus();
        });
    });
}
initTimeSelectors();


function resetGame() {
    input.disabled = false;
    timerStarted = false;
    clearAppTimer();

    input.value = '';
    input.scrollTop = 0;

    overlay.style.top = '0';

    input.value = '';

    if (wpmDisplay) wpmDisplay.innerText = '0';
    generateBoard();
}


function showResultsModal(finalWPM, finalAccuracy, maxWPM) {
    modal.classList.remove('hidden');

    modalCurrentWPM.innerText = finalWPM;
    modalAccuracy.innerText = finalAccuracy + '%';
    modalMaxWPM.innerText = maxWPM;
}



input.addEventListener('input', () => {
    if (!timerStarted) {
        startCountdown(timerDisplay, wpmDisplay, input, async () => {
            timerStarted = false;

            const finalWPM = parseInt(wpmDisplay.innerText) || 0;
            const correctChars = document.querySelectorAll('.correct').length;
            const totalTyped = input.value.length;

            let accuracy = 0;
            if (totalTyped > 0) {
                accuracy = Math.round((correctChars / totalTyped) * 100);
            }

            const activeModeBtn = document.querySelector('.time-set.active');
            const playedMode = activeModeBtn ? activeModeBtn.value : '30';

            try {
                const response = await fetch('/api/save_score', {
                    method: 'POST',
                    headers: {'Content-Type':'application/json'},
                    body: JSON.stringify({
                        wpm: finalWPM,
                        accuracy: accuracy,
                        mode: playedMode
                    })
                });
                const data = await response.json();
                showResultsModal(finalWPM, accuracy, data.max_wpm);
            }
            catch (error) {
                console.error("Failed to connect to database: ", error);
                showResultsModal(finalWPM, accuracy, finalWPM);
            }
        });
        timerStarted = true;
    }

    const arrayQuote = overlay.querySelectorAll('span');
    const arrayValue = input.value.split('');

    arrayQuote.forEach((characterSpan, index) => {
        let character = arrayValue[index];
        if (character === '\n') character = ' ';

        if (character == null) {
            characterSpan.classList.remove('correct', 'incorrect');
        }
        else if (character === characterSpan.innerText) {
            characterSpan.classList.add('correct');
            characterSpan.classList.remove('incorrect');
        }
        else {
            characterSpan.classList.add('incorrect');
            characterSpan.classList.remove('correct');
        }
    });
    calculateLiveWPM(wpmDisplay);
});


['copy', 'paste', 'cut'].forEach(eventType => {
    overlay.addEventListener(eventType, (e) => e.preventDefault());
});


input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() == 'a') {
        e.preventDefault();
    }
});


input.addEventListener('scroll', () => {
    overlay.style.top = -input.scrollTop + 'px';
});

restartBtn.addEventListener('click', () => {

    const activeModeBtn = document.querySelector('.time-set.active');
    if (activeModeBtn) activeModeBtn.click();
    else resetGame();

    modal.classList.add('hidden');
    input.focus();
})





