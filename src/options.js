const browserAPI = (typeof browser !== 'undefined' ? browser : chrome);

// Saves options to browserAPI.storage
async function saveOptions() {
  try {
    const options = {
      llmProvider: document.getElementById('llmProvider').value,
      apiKey: document.getElementById('apiKey').value,
      llmModel: document.getElementById('llmModel').value,
      customEndpoint: document.getElementById('customEndpoint').value,
      customPrompts: getCustomPrompts()
    };

    await new Promise((resolve, reject) => {
      browserAPI.storage.sync.set(options, () => {
        if (browserAPI.runtime.lastError) {
          reject(browserAPI.runtime.lastError);
        } else {
          resolve();
        }
      });
    });

    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    status.style.color = '#4CAF50';
    setTimeout(() => {
      status.textContent = '';
    }, 750);
  } catch (error) {
    console.error('Error saving options:', error);
    const status = document.getElementById('status');
    status.textContent = 'Error saving options.';
    status.style.color = '#f44336';
  }
}

function getCustomPrompts() {
  try {
    const promptContainers = document.querySelectorAll('.prompt-container');
    return Array.from(promptContainers).map(container => ({
      id: snakeCase(container.querySelector('.prompt-title').value || ''),
      title: container.querySelector('.prompt-title').value || '',
      prompt: container.querySelector('.prompt-text').value || ''
    })).filter(prompt => prompt.title && prompt.prompt); // Filter out empty prompts
  } catch (error) {
    console.error('Error getting custom prompts:', error);
    return [];
  }
}

function snakeCase(str) {
  return str.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

async function restoreOptions() {
  try {
    const defaults = {
      llmProvider: 'openai',
      apiKey: '',
      llmModel: 'gpt-3.5-turbo',
      customEndpoint: '',
      customPrompts: []
    };

    const items = await new Promise(resolve => {
      browserAPI.storage.sync.get(defaults, resolve);
    });

    const elementIds = ['llmProvider', 'apiKey', 'llmModel', 'customEndpoint'];

    elementIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.value = items[id] || defaults[id];
      } else {
        console.warn(`Element with id '${id}' not found`);
      }
    });

    // Clear existing prompts before restoring
    const promptsContainer = document.getElementById('prompts-container');
    while (promptsContainer.firstChild) {
      promptsContainer.removeChild(promptsContainer.firstChild);
    }

    // Restore custom prompts
    items.customPrompts.forEach(prompt => {
      addPromptToUI(prompt.title, prompt.prompt, prompt.id);
    });

    updateUIForProvider(items.llmProvider);
  } catch (error) {
    console.error('Error restoring options:', error);
    showErrorMessage('Error restoring options. Please try reloading the page.');
  }
}

function updateUIForProvider(provider) {
  try {
    const apiKeyLabel = document.querySelector('label[for="apiKey"]');
    const llmModelLabel = document.querySelector('label[for="llmModel"]');
    const customEndpointLabel = document.querySelector('label[for="customEndpoint"]');
    const customEndpointContainer = document.getElementById('customEndpoint').parentElement;

    if (!apiKeyLabel || !llmModelLabel || !customEndpointLabel) {
      // Fallback: find labels by their span text content
      const labels = document.querySelectorAll('label span');
      const apiKeySpan = Array.from(labels).find(span => span.textContent.includes('API Key'));
      const modelSpan = Array.from(labels).find(span => span.textContent.includes('Model'));
      const endpointSpan = Array.from(labels).find(span => span.textContent.includes('Endpoint'));
      
      if (!apiKeySpan || !modelSpan || !endpointSpan) {
        console.warn('Could not find required UI labels');
        return;
      }
    }

    // Show all containers by default
    customEndpointContainer.style.display = 'block';

    switch (provider) {
      case 'openai':
        apiKeyLabel.textContent = 'OpenAI API Key:';
        llmModelLabel.textContent = 'OpenAI Model:';
        customEndpointContainer.style.display = 'block';
        break;
      case 'anthropic':
        apiKeyLabel.textContent = 'Anthropic API Key:';
        llmModelLabel.textContent = 'Anthropic Model:';
        customEndpointContainer.style.display = 'block';
        break;
      case 'ollama':
        apiKeyLabel.textContent = 'Ollama API Key (if required):';
        llmModelLabel.textContent = 'Ollama Model:';
        customEndpointContainer.style.display = 'block';
        break;
      case 'lmstudio':
        apiKeyLabel.textContent = 'LM Studio API Key (if required):';
        llmModelLabel.textContent = 'LM Studio Model:';
        customEndpointContainer.style.display = 'block';
        break;
      case 'groq':
        apiKeyLabel.textContent = 'Groq API Key:';
        llmModelLabel.textContent = 'Groq Model:';
        customEndpointContainer.style.display = 'block';
        break;
      case 'openrouter':
        apiKeyLabel.textContent = 'OpenRouter API Key:';
        llmModelLabel.textContent = 'OpenRouter Model:';
        customEndpointContainer.style.display = 'block';
        break;
      default:
        console.warn(`Unknown provider: ${provider}`);
        break;
    }
  } catch (error) {
    console.error('Error updating UI for provider:', error);
    showErrorMessage('Error updating provider settings.');
  }
}

function addPromptToUI(title = '', prompt = '', id = '') {
  try {
    const promptsContainer = document.getElementById('prompts-container');
    const template = document.getElementById('prompt-template');
    
    if (!promptsContainer || !template) {
      throw new Error('Required elements not found');
    }

    const promptElement = template.content.cloneNode(true);

    const titleInput = promptElement.querySelector('.prompt-title');
    const textInput = promptElement.querySelector('.prompt-text');
    
    if (titleInput && textInput) {
      titleInput.value = title;
      textInput.value = prompt;
    }

    // Add a hidden input for the ID
    const idInput = document.createElement('input');
    idInput.type = 'hidden';
    idInput.className = 'prompt-id';
    idInput.value = id || snakeCase(title);
    
    const container = promptElement.querySelector('.prompt-container');
    if (container) {
      container.appendChild(idInput);
      
      const deleteButton = container.querySelector('.delete-prompt');
      if (deleteButton) {
        deleteButton.addEventListener('click', function() {
          container.remove();
          saveOptions(); // Auto-save when removing a prompt
        });
      }
    }

    promptsContainer.appendChild(promptElement);
  } catch (error) {
    console.error('Error adding prompt to UI:', error);
    showErrorMessage('Error adding new prompt.');
  }
}

function showErrorMessage(message) {
  const status = document.getElementById('status');
  if (status) {
    status.textContent = message;
    status.style.color = '#f44336';
    setTimeout(() => {
      status.textContent = '';
    }, 3000);
  }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded event fired');
  restoreOptions();

  const saveButton = document.getElementById('save');
  const providerSelect = document.getElementById('llmProvider');
  const addPromptButton = document.getElementById('add-prompt');

  if (saveButton) {
    saveButton.addEventListener('click', saveOptions);
  }

  if (providerSelect) {
    providerSelect.addEventListener('change', (e) => updateUIForProvider(e.target.value));
  }

  if (addPromptButton) {
    addPromptButton.addEventListener('click', () => addPromptToUI());
  }
});

// Autosave function for custom prompts
async function saveCustomPrompts(customPrompts) {
  try {
    await new Promise((resolve, reject) => {
      browserAPI.storage.sync.set({ customPrompts }, () => {
        if (browserAPI.runtime.lastError) {
          reject(browserAPI.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
    console.log('Custom prompts saved');
  } catch (error) {
    console.error('Error saving custom prompts:', error);
    showErrorMessage('Error saving custom prompts.');
  }
}