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