const browserAPI = (typeof browser !== 'undefined' ? browser : chrome);

document.addEventListener('DOMContentLoaded', async function() {
    const statusElement = document.getElementById('status');
    const optionsButton = document.getElementById('optionsButton');
  
    try {
        // Use async/await and proper error handling
        const result = await new Promise((resolve) => {
            browserAPI.storage.sync.get({
                llmProvider: 'openai', // default value
                apiKey: ''
            }, resolve);
        });

        if (result.apiKey) {
            statusElement.textContent = `Extension is ready to use with ${result.llmProvider} provider.`;
            statusElement.style.color = '#4CAF50'; // Success color
        } else {
            statusElement.textContent = 'API key not set. Please set it in the options.';
            statusElement.style.color = '#f44336'; // Error color
        }
    } catch (error) {
        console.error('Error checking storage:', error);
        statusElement.textContent = 'Error checking extension status.';
        statusElement.style.color = '#f44336';
    }

    // Open options page when button is clicked
    optionsButton.addEventListener('click', function() {
        try {
            if (browserAPI.runtime.openOptionsPage) {
                // Chrome & Firefox support
                browserAPI.runtime.openOptionsPage();
            } else {
                // Fallback for older Firefox versions
                window.open(browserAPI.runtime.getURL('options.html'));
            }
        } catch (error) {
            console.error('Error opening options page:', error);
            // Fallback method
            window.open(browserAPI.runtime.getURL('options.html'));
        }
    });
});