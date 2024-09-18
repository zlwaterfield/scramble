document.addEventListener('DOMContentLoaded', function() {
    const statusElement = document.getElementById('status');
    const optionsButton = document.getElementById('optionsButton');

    // Check if API key is set
    chrome.storage.sync.get(['openaiApiKey'], function(result) {
        if (result.openaiApiKey) {
            statusElement.textContent = 'Extension is ready to use.';
        } else {
            statusElement.textContent = 'API key not set. Please set it in the options.';
            statusElement.style.color = '#f44336';
        }
    });

    // Open options page when button is clicked
    optionsButton.addEventListener('click', function() {
        chrome.runtime.openOptionsPage();
    });
});