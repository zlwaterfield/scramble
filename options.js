const browserAPI = chrome || browser;

// Saves options to browserAPI.storage
function saveOptions() {
  const options = {
    llmProvider: document.getElementById('llmProvider').value,
    apiKey: document.getElementById('apiKey').value,
    llmModel: document.getElementById('llmModel').value,
    customEndpoint: document.getElementById('customEndpoint').value,
    showDiff: document.getElementById('showDiff').checked
  };

  browserAPI.storage.sync.set(options, () => {
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in browserAPI.storage.
function restoreOptions() {
  const defaults = {
    llmProvider: 'openai',
    apiKey: '',
    llmModel: 'gpt-3.5-turbo',
    customEndpoint: '',
    showDiff: false
  };

  browserAPI.storage.sync.get(defaults, (items) => {
    document.getElementById('llmProvider').value = items.llmProvider;
    document.getElementById('apiKey').value = items.apiKey;
    document.getElementById('llmModel').value = items.llmModel;
    document.getElementById('customEndpoint').value = items.customEndpoint;
    document.getElementById('showDiff').checked = items.showDiff;
    updateUIForProvider(items.llmProvider);
  });
}

// Updates UI elements based on the selected LLM provider
function updateUIForProvider(provider) {
  const apiKeyLabel = document.querySelector('label[for="apiKey"]');
  const llmModelLabel = document.querySelector('label[for="llmModel"]');
  const customEndpointLabel = document.querySelector('label[for="customEndpoint"]');

  switch (provider) {
    case 'openai':
      apiKeyLabel.textContent = 'OpenAI API Key:';
      llmModelLabel.textContent = 'OpenAI Model:';
      customEndpointLabel.style.display = 'block';
      break;
    case 'anthropic':
      apiKeyLabel.textContent = 'Anthropic API Key:';
      llmModelLabel.textContent = 'Anthropic Model:';
      customEndpointLabel.style.display = 'block';
      break;
    case 'ollama':
      apiKeyLabel.textContent = 'Ollama API Key (if required):';
      llmModelLabel.textContent = 'Ollama Model:';
      customEndpointLabel.style.display = 'block';
      break;
    case 'groq':
      apiKeyLabel.textContent = 'Groq API Key:';
      llmModelLabel.textContent = 'Groq Model:';
      customEndpointLabel.style.display = 'block';
      break;
  }
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('llmProvider').addEventListener('change', (e) => updateUIForProvider(e.target.value));
