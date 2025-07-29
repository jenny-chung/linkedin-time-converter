let settings = {
    enabled: true,
    showTime: true,
    hour24: false,
    showTimezone: true,
    showYear: true
};

const toggleIDs = ['enabled', 'showTime', 'hour24', 'showTimezone', 'showYear'];

function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(settings, (result) => {
            settings = { ...settings, ...result};
            resolve(settings);
        });
    });
}

function saveSettings() {
    chrome.storage.sync.set(settings);
}

function generatePreview() {
    const now = new Date();

    const options = {
        month: 'short',
        day: 'numeric'
    };

    if (settings.showYear) {
        options.year = 'numeric';
    }

    if (settings.showTime) {
        options.hour = 'numeric';
        options.minute = '2-digit';
        options.hour12 = !settings.hour24;
    }

    const dateTimeFormatted = now.toLocaleString(undefined, options);

    if (settings.showTime && settings.showTimezone) {
        const timezone = now.toLocaleString(undefined, {
            timeZoneName: 'short',
        }).split(' ').pop();

        return `${dateTimeFormatted} (${timezone})`;
    }

    return dateTimeFormatted;
}

function updatePreview() {
    const previewText = document.getElementById('previewText');
    if (previewText) {
        previewText.textContent = generatePreview();
    }
}

function updateUI() {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.classList.toggle('inactive', !settings.enabled);
    }
    showToast(settings.enabled ? "Extension enabled" : "Extension disabled");
    
    toggleIDs.forEach(id => {
        updateToggleSwitch(id, settings[id]);
    });
    updatePreview();
}

function updateToggleSwitch(elementId, isActive) {
    const toggle = document.getElementById(elementId);
    if (toggle) {
        toggle.classList.toggle('active', isActive);
    }
}

// Setup event listeners for toggle switches
function setupEventListeners() {
    
    toggleIDs.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', () => {
                // Toggle the setting
                settings[id] = !settings[id];
                updateToggleSwitch(id, settings[id]);
                saveSettings();

                if (id === 'enabled') {
                    // Page reload on enable or disable
                    showToast(settings.enabled ? 'Extension enabled. Reloading...' : 'Extension disabled. Reloading...');
                    // updateUI();

                    // Notify content script about setting changes
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        if (tabs.length === 0) {
                            return;
                        }

                        const tabId = tabs[0].id;

                        chrome.tabs.sendMessage(tabId, {
                            action: 'settingsChanged',
                            settings: settings
                        });

                        // Reload the current tab
                        chrome.tabs.reload(tabId);

                    });
                } else {
                    // For other settings, just update toggle state and notify
                    // updateToggleSwitch(id, settings[setting]);
                    showToast("Settings updated successfully!");
                    updatePreview();

                    // Notify content script about setting changes
                    chrome.tabs.query({ active: true, currentWindow: true}, (tabs) => {
                        if (tabs.length === 0) {
                            return;
                        }
                        
                        console.log(tabs[0].url)

                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: 'settingsChanged',
                            settings: settings
                        });
            
                    });
                }

            });
        }
    });
}

function showToast(message, duration = 3000) {
    const statusElement = document.getElementById('status');
    const span = statusElement?.querySelector('span');
    
    console.log("Calling showToast with:", message);
    if (span) {
        span.textContent = message;
    }

    setTimeout(() => {
        console.log('Resetting span text');

        if (span) {
            // Reset the text to a permanent message based on settings
            const permanentMessage = settings.enabled ? "Extension enabled" : "Extension disabled";
            span.textContent = permanentMessage;

            // Update the status element's class based on enabled state
            statusElement.classList.toggle('inactive', !settings.enabled);

            const displayToggles = toggleIDs.filter(id => id !== 'enabled');
            displayToggles.forEach(id => {
                const toggle = document.getElementById(id);
                if (toggle) {
                    const disabled = !settings.enabled;

                    toggle.classList.toggle('disabled', disabled);

                    if (disabled) {
                        toggle.setAttribute('title', 'Enable the extension to use this setting');
                    } else {
                        toggle.removeAttribute('title');
                    }               
                }
            });
        }
    }, duration);

}

function initializePopup() {
    loadSettings().then(() => {
        updateUI();
        setupEventListeners();
    });
}

document.addEventListener('DOMContentLoaded', initializePopup);