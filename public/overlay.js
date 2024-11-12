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
        }
    }, 1000);

    // Play the notification sound at specified volume
    const audio = document.getElementById('notificationSound');
    if (audio) {
        audio.volume = soundVolume;       // Set volume from main process
        audio.currentTime = 0;            // Reset to start
        audio.play().catch(err => console.error("Error playing sound:", err));
    }
});
