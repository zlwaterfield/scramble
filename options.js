// Saves options to chrome.storage
function saveOptions() {
    const openaiApiKey = document.getElementById('openaiApiKey').value;
    chrome.storage.sync.set(
        { openaiApiKey },
        () => {
            // Update status to let user know options were saved.
            const status = document.getElementById('status');
            status.textContent = 'Options saved.';
            setTimeout(() => {
                status.textContent = '';
            }, 750);
        }
    );
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
    chrome.storage.sync.get(
        { openaiApiKey: '' },
        (items) => {
            document.getElementById('openaiApiKey').value = items.openaiApiKey;
        }
    );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);

// Add input masking for API key
document.getElementById('openaiApiKey').addEventListener('input', function(e) {
    const input = e.target;
    let masked = '';
    const unmasked = input.value.replace(/[^\w\d]/g, '');
    for (let i = 0; i < unmasked.length; i++) {
        if (i < unmasked.length - 4) {
            masked += '•';
        } else {
            masked += unmasked[i];
        }
    }
    input.value = masked;
});

// Show/hide API key
let showingApiKey = false;
document.getElementById('openaiApiKey').addEventListener('focus', function(e) {
    if (!showingApiKey) {
        chrome.storage.sync.get({ openaiApiKey: '' }, (items) => {
            e.target.value = items.openaiApiKey;
            showingApiKey = true;
        });
    }
});

document.getElementById('openaiApiKey').addEventListener('blur', function(e) {
    if (showingApiKey) {
        const unmasked = e.target.value;
        let masked = '';
        for (let i = 0; i < unmasked.length; i++) {
            if (i < unmasked.length - 4) {
                masked += '•';
            } else {
                masked += unmasked[i];
            }
        }
        e.target.value = masked;
        showingApiKey = false;
    }
});