export function generateRandomWords(arr, outputTo) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    const selectedWords = shuffled.slice(0, 250);
    const strToAppend = selectedWords.join(' ');

    const currentText = outputTo.innerText.trim();

    if (currentText.length > 0) {
        outputTo.innerText = currentText + " " + strToAppend;
    }
    else {
        outputTo.innerText += strToAppend;
    }
    return selectedWords;
}
