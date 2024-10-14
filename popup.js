document.addEventListener('DOMContentLoaded', function() {
    const browserAPI = chrome || browser;
    
    const statusElement = document.getElementById('status');
    const optionsButton = document.getElementById('optionsButton');
  
    // Check if API key is set for the selected LLM provider
    browserAPI.storage.sync.get(['llmProvider', 'apiKey'], function(result) {
      if (result.apiKey) {
        statusElement.textContent = `Extension is ready to use with ${result.llmProvider || 'default'} provider.`;
      } else {
        statusElement.textContent = 'API key not set. Please set it in the options.';
        statusElement.style.color = '#f44336';
      }
    });
    // Open options page when button is clicked
    optionsButton.addEventListener('click', function() {
      browserAPI.runtime.openOptionsPage();
    });
  });
  