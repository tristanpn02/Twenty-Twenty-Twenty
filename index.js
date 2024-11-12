const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('node:path');
const settings = require('electron-settings');

// Initial settings
let metric = settings.getSync('metric') || false; // Default to imperial
let soundVolume = settings.getSync('soundVolume') !== undefined ? settings.getSync('soundVolume') : 1.0; // Default volume is 1 (max)

// Intervals
const notifyInterval = 20 * 60 * 1000;   // 20 minutes
const lookAwayDuration = 20 * 1000; // 20 seconds

let mainWindow;
let tray;
let overlayWindow;
let intervalId;

// Create main window (hidden by default)
const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 300,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'renderer.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'public/index.html'));

    // When the window is closed, dereference the `mainWindow` object
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};



// Create overlay window
const createOverlayWindow = () => {
    overlayWindow = new BrowserWindow({
        width: 250,
        height: 110,
        alwaysOnTop: true,
        frame: false,
        transparent: true,
        resizable: false,
        skipTaskbar: true,
        focusable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    // Load overlay html file
    overlayWindow.loadFile(path.join(__dirname, 'public/overlay.html'));

    // Set the window to ignore mouse events
    overlayWindow.setIgnoreMouseEvents(true);

    // Position window in the top-right corner of the screen
    const { width, height } = overlayWindow.getBounds();
    const { workAreaSize } = require('electron').screen.getPrimaryDisplay();
    overlayWindow.setPosition(workAreaSize.width - width - 10, 10); // Offset for padding
};

// Handle metric change from renderer
ipcMain.on('update-metric', (event, newMetricValue) => {
    metric = newMetricValue;
    settings.setSync('metric', metric);
    mainWindow.webContents.send('metric-changed', metric); // Update renderer with new metric value
});

// Handle volume change
ipcMain.on('update-volume', (event, newVolume) => {
    soundVolume = newVolume;
    settings.setSync('soundVolume', soundVolume);
});

// Create tray icon and menu with volume control
function createTray() {
    tray = new Tray(path.join(__dirname, 'public/icon.png'));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => {
                if (!mainWindow) {
                    createWindow()
                }
                mainWindow.show()
            }
        },
        {
            label: 'Unit System',
            submenu: [
                {
                    label: 'Feet',
                    type: 'radio',
                    checked: !metric,
                    click: () => {
                        metric = false; // Feet
                        settings.setSync('metric', metric);
                        mainWindow.webContents.send('metric-changed', metric); // Send updated metric to renderer
                    }
                },
                {
                    label: 'Meters',
                    type: 'radio',
                    checked: metric,
                    click: () => {
                        metric = true; // Meters
                        settings.setSync('metric', metric);
                        mainWindow.webContents.send('metric-changed', metric); // Send updated metric to renderer
                    }
                }
            ]
        },
        {
            label: 'Sound Volume',
            submenu: [
                {
                    label: '0%',
                    type: 'radio',
                    checked: soundVolume === 0,
                    click: () => {
                        soundVolume = 0;
                        settings.setSync('soundVolume', soundVolume);
                    },
                },
                {
                    label: '25%',
                    type: 'radio',
                    checked: soundVolume === 0.25,
                    click: () => {
                        soundVolume = 0.25;
                        settings.setSync('soundVolume', soundVolume);
                    },
                },
                {
                    label: '50%',
                    type: 'radio',
                    checked: soundVolume === 0.5,
                    click: () => {
                        soundVolume = 0.5;
                        settings.setSync('soundVolume', soundVolume);
                    },
                },
                {
                    label: '75%',
                    type: 'radio',
                    checked: soundVolume === 0.75,
                    click: () => {
                        soundVolume = 0.75;
                        settings.setSync('soundVolume', soundVolume);
                    },
                },
                {
                    label: '100%',
                    type: 'radio',
                    checked: soundVolume === 1.0,
                    click: () => {
                        soundVolume = 1.0;
                        settings.setSync('soundVolume', soundVolume);
                    },
                },
            ],
        },
        { label: 'Quit', click: () => app.quit() },
    ]);
    tray.setToolTip('Twenty-Twenty-Twenty');
    tray.setContextMenu(contextMenu);
}

// Show overlay with countdown
function showOverlay() {
    const distance = metric ? '6 meters' : '20 feet';

    if (!overlayWindow) createOverlayWindow();

    // Send countdown event with sound volume to overlay
    overlayWindow.webContents.send('show-countdown', { 
        distance, 
        lookAwayDuration, 
        soundVolume 
    });
    overlayWindow.show();

    // Hide overlay after countdown, then schedule next reminder
    setTimeout(() => {
        overlayWindow.hide();
        setTimeout(showOverlay, notifyInterval);
    }, lookAwayDuration);
}



// Main reminder loop function
function startReminder() {
    showOverlay();
}

app.whenReady().then(() => {
    createWindow();
    createTray();
    startReminder();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', (e) => {
    e.preventDefault(); // Prevent quitting on window close
});

app.on('before-quit', () => {
    clearInterval(intervalId);
});
