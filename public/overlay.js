const { ipcRenderer } = require('electron');

// Show countdown and play notification sound
ipcRenderer.on('show-countdown', (event, { distance, lookAwayDuration, soundVolume }) => {
    // Display countdown message
    document.getElementById('message').textContent = `Look at something ${distance} away`;
    const countdownElem = document.getElementById('countdown');

    // Countdown setup
    let countdown = Math.floor(lookAwayDuration / 1000);
    countdownElem.textContent = countdown;

    // Countdown interval
    const interval = setInterval(() => {
        countdown -= 1;
        countdownElem.textContent = countdown;

        if (countdown <= 0) {
            clearInterval(interval);
            countdownElem.textContent = '0'; // Ensure it shows 0 at the end

            const endAudio = document.getElementById('endSound');
            if (endAudio) {
                endAudio.volume = soundVolume;
                endAudio.currentTime = 0;
                endAudio.play().catch(err => console.error("Error playing end sound:", err))
            }
        }
    }, 1000);

    // Play the start sound at specified volume
    const startAudio = document.getElementById('startSound');
    if (startAudio) {
        startAudio.volume = soundVolume;       // Set volume from main process
        startAudio.currentTime = 0;            // Reset to start
        startAudio.play().catch(err => console.error("Error playing start sound:", err));
    }
});
