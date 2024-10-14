const browserAPI = chrome || browser;

// Saves options to browserAPI.storage
function saveOptions() {
  const options = {
    llmProvider: document.getElementById('llmProvider').value,
    apiKey: document.getElementById('apiKey').value,
    llmModel: document.getElementById('llmModel').value,
    customEndpoint: document.getElementById('customEndpoint').value,
    showDiff: document.getElementById('showDiff').checked,
    customPrompts: getCustomPrompts()
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

function getCustomPrompts() {
  const promptContainers = document.querySelectorAll('.prompt-container');
  return Array.from(promptContainers).map(container => ({
    id: snakeCase(container.querySelector('.prompt-title').value),
    title: container.querySelector('.prompt-title').value,
    prompt: container.querySelector('.prompt-text').value
  }));
}

// Helper function to convert a string to snake case
function snakeCase(str) {
  return str.toLowerCase().replace(/\s+/g, '_');
}

// Restores select box and checkbox state using the preferences
// stored in browserAPI.storage.
function restoreOptions() {
  const defaults = {
    llmProvider: 'openai',
    apiKey: '',
    llmModel: 'gpt-3.5-turbo',
    customEndpoint: '',
    showDiff: false,
    customPrompts: []
  };

  browserAPI.storage.sync.get(defaults, (items) => {
    const elementIds = ['llmProvider', 'apiKey', 'llmModel', 'customEndpoint', 'showDiff'];

    elementIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        if (id === 'showDiff') {
          element.checked = items[id];
        } else {
          element.value = items[id];
        }
      } else {
        console.error(`Element with id '${id}' not found`);
      }
    });

    // Restore custom prompts
    items.customPrompts.forEach(prompt => {
      addPromptToUI(prompt.title, prompt.prompt, prompt.id);
    });

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

function addPromptToUI(title = '', prompt = '', id = '') {
  const promptsContainer = document.getElementById('prompts-container');
  const template = document.getElementById('prompt-template');
  const promptElement = template.content.cloneNode(true);

  promptElement.querySelector('.prompt-title').value = title;
  promptElement.querySelector('.prompt-text').value = prompt;
  
  // Add a hidden input for the ID
  const idInput = document.createElement('input');
  idInput.type = 'hidden';
  idInput.className = 'prompt-id';
  idInput.value = id || snakeCase(title);
  promptElement.querySelector('.prompt-container').appendChild(idInput);

  promptElement.querySelector('.delete-prompt').addEventListener('click', function() {
    this.closest('.prompt-container').remove();
  });

  promptsContainer.appendChild(promptElement);
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded event fired');
  restoreOptions();
});
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('llmProvider').addEventListener('change', (e) => updateUIForProvider(e.target.value));
document.getElementById('add-prompt').addEventListener('click', () => addPromptToUI());

function saveCustomPrompts(customPrompts) {
  browserAPI.storage.sync.set({ customPrompts }, () => {
    console.log('Custom prompts saved');
  });
}
