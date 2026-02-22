let timer = null;
let maxTime = 30;
let timeLeft = maxTime;
let timeElapsed = 0;



export function setMaxTime(value) {
    maxTime = value;
    timeLeft = value;
    timeElapsed = 0;
}


export function clearAppTimer() {
    if (timer) clearInterval(timer);
}


export function calculateLiveWPM(wpmDisplay) {
    const correctChars = document.querySelectorAll('.correct').length;
    let minutes = timeElapsed / 60;
    if (minutes === 0) {
        minutes = 1/60;
    }
    const wpm = Math.round((correctChars / 5) / minutes);
    if (wpmDisplay) {
        wpmDisplay.innerText = wpm;
    }
}


export function startCountdown(timerDisplay, wpmDisplay, input, onTimerEnd) {
    if (timer) clearInterval(timer);
    timeElapsed++;
    if (maxTime !== Infinity) {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
    }
    timer = setInterval(() => {
        timeElapsed++;
        if (maxTime !== Infinity) {
            timeLeft--;
            timerDisplay.innerText = timeLeft;
        }

        calculateLiveWPM(wpmDisplay);
        if (timeLeft <= 0) {
            finishGame(input);
            if (onTimerEnd) onTimerEnd();
        }
    }, 1000)
}


export function finishGame(input) {
    clearInterval(timer);
    input.disabled = true;
}

