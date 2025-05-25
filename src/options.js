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
    const labels = document.querySelectorAll('label span');
    const apiKeySpan = Array.from(labels).find(span => span.textContent.includes('API Key'));
    const modelSpan = Array.from(labels).find(span => span.textContent.includes('Model'));
    const endpointSpan = Array.from(labels).find(span => span.textContent.includes('Endpoint'));
    
    const apiKeyInput = document.getElementById('apiKey');
    const apiKeyHelp = document.getElementById('apiKeyHelp');
    const llmModelInput = document.getElementById('llmModel');
    const modelHelp = document.getElementById('modelHelp');
    const customEndpointInput = document.getElementById('customEndpoint');
    const customEndpointContainer = customEndpointInput.parentElement;
    const endpointHelp = document.getElementById('endpointHelp');
    const fetchModelsButton = document.getElementById('fetchModels');
    const availableModelsSelect = document.getElementById('availableModels');

    if (!apiKeySpan || !modelSpan || !endpointSpan) {
      console.warn('Could not find required UI labels');
      return;
    }

    // Reset visibility
    customEndpointContainer.style.display = 'block';
    apiKeyInput.parentElement.style.display = 'block';
    if (availableModelsSelect) {
      availableModelsSelect.classList.add('hidden');
      availableModelsSelect.innerHTML = '<option value="">Select a model...</option>';
    }

    // Show/hide fetch models button based on provider capability
    const canFetchModels = ['openai', 'lmstudio', 'ollama', 'openrouter', 'groq'].includes(provider);
    if (fetchModelsButton) {
      fetchModelsButton.style.display = canFetchModels ? 'block' : 'none';
    }

    switch (provider) {
      case 'openai':
        apiKeySpan.textContent = 'OpenAI API Key:';
        apiKeyInput.placeholder = 'sk-...';
        if (apiKeyHelp) apiKeyHelp.textContent = 'Get your API key from https://platform.openai.com/api-keys';
        llmModelInput.placeholder = 'gpt-3.5-turbo, gpt-4, gpt-4-turbo, etc.';
        if (modelHelp) modelHelp.textContent = 'Common models: gpt-3.5-turbo, gpt-4, gpt-4-turbo';
        customEndpointInput.placeholder = 'https://api.openai.com/v1/chat/completions (default)';
        if (endpointHelp) endpointHelp.textContent = 'Leave empty to use default OpenAI endpoint';
        break;

      case 'anthropic':
        apiKeySpan.textContent = 'Anthropic API Key:';
        apiKeyInput.placeholder = 'sk-ant-...';
        if (apiKeyHelp) apiKeyHelp.textContent = 'Get your API key from https://console.anthropic.com/';
        llmModelInput.placeholder = 'claude-3-haiku-20240307, claude-3-sonnet-20240229, etc.';
        if (modelHelp) modelHelp.textContent = 'Common models: claude-3-haiku-20240307, claude-3-sonnet-20240229';
        customEndpointInput.placeholder = 'https://api.anthropic.com/v1/complete (default)';
        if (endpointHelp) endpointHelp.textContent = 'Leave empty to use default Anthropic endpoint';
        break;

      case 'ollama':
        apiKeySpan.textContent = 'API Key (Optional):';
        apiKeyInput.placeholder = 'Leave empty for local Ollama';
        if (apiKeyHelp) apiKeyHelp.textContent = 'Ollama typically runs without API keys. Only needed for remote instances.';
        llmModelInput.placeholder = 'llama2, llama3, mistral, codellama, etc.';
        if (modelHelp) modelHelp.textContent = 'Use "ollama list" to see available models on your system';
        customEndpointInput.placeholder = 'http://localhost:11434/api/generate (default)';
        if (endpointHelp) endpointHelp.textContent = 'Default: http://localhost:11434/api/generate. Make sure Ollama is running.';
        break;

      case 'lmstudio':
        apiKeySpan.textContent = 'API Key (Optional):';
        apiKeyInput.placeholder = 'Leave empty for local LM Studio';
        if (apiKeyHelp) apiKeyHelp.textContent = 'LM Studio typically runs without API keys for local use.';
        llmModelInput.placeholder = 'Model name as shown in LM Studio';
        if (modelHelp) modelHelp.textContent = 'Use the exact model name from your LM Studio models list';
        customEndpointInput.placeholder = 'http://localhost:1234/v1/chat/completions (default)';
        if (endpointHelp) endpointHelp.textContent = 'Default: http://localhost:1234/v1/chat/completions. Ensure LM Studio server is running.';
        break;

      case 'groq':
        apiKeySpan.textContent = 'Groq API Key:';
        apiKeyInput.placeholder = 'gsk_...';
        if (apiKeyHelp) apiKeyHelp.textContent = 'Get your API key from https://console.groq.com/keys';
        llmModelInput.placeholder = 'llama3-8b-8192, llama3-70b-8192, mixtral-8x7b-32768, etc.';
        if (modelHelp) modelHelp.textContent = 'Common models: llama3-8b-8192, llama3-70b-8192, mixtral-8x7b-32768';
        customEndpointInput.placeholder = 'https://api.groq.com/v1/chat/completions (default)';
        if (endpointHelp) endpointHelp.textContent = 'Leave empty to use default Groq endpoint';
        break;

      case 'openrouter':
        apiKeySpan.textContent = 'OpenRouter API Key:';
        apiKeyInput.placeholder = 'sk-or-...';
        if (apiKeyHelp) apiKeyHelp.textContent = 'Get your API key from https://openrouter.ai/keys';
        llmModelInput.placeholder = 'openai/gpt-3.5-turbo, anthropic/claude-3-haiku, etc.';
        if (modelHelp) modelHelp.textContent = 'Format: provider/model-name (e.g., openai/gpt-4, anthropic/claude-3-sonnet)';
        customEndpointInput.placeholder = 'https://openrouter.ai/api/v1/chat/completions (default)';
        if (endpointHelp) endpointHelp.textContent = 'Leave empty to use default OpenRouter endpoint';
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

async function fetchAvailableModels() {
  const provider = document.getElementById('llmProvider').value;
  const apiKey = document.getElementById('apiKey').value;
  const customEndpoint = document.getElementById('customEndpoint').value;
  const fetchButton = document.getElementById('fetchModels');
  const fetchText = document.getElementById('fetchModelsText');
  const fetchSpinner = document.getElementById('fetchModelsSpinner');
  const availableModelsSelect = document.getElementById('availableModels');

  // Show loading state
  fetchButton.disabled = true;
  if (fetchText) fetchText.classList.add('hidden');
  if (fetchSpinner) fetchSpinner.classList.remove('hidden');

  try {
    let endpoint, headers = {};
    
    switch (provider) {
      case 'openai':
        endpoint = customEndpoint ? customEndpoint.replace('/chat/completions', '/models') : 'https://api.openai.com/v1/models';
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        break;
        
      case 'lmstudio':
        const baseUrl = customEndpoint ? customEndpoint.split('/v1')[0] : 'http://localhost:1234';
        endpoint = `${baseUrl}/v1/models`;
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        break;
        
      case 'ollama':
        const ollamaBaseUrl = customEndpoint ? customEndpoint.split('/api')[0] : 'http://localhost:11434';
        endpoint = `${ollamaBaseUrl}/api/tags`;
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        break;
        
      case 'openrouter':
        endpoint = 'https://openrouter.ai/api/v1/models';
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        break;
        
      case 'groq':
        endpoint = customEndpoint ? customEndpoint.replace('/chat/completions', '/models') : 'https://api.groq.com/openai/v1/models';
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        break;
        
      default:
        throw new Error(`Model fetching not supported for ${provider}`);
    }

    const response = await fetch(endpoint, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    let models = [];

    // Parse models based on provider format
    switch (provider) {
      case 'ollama':
        models = data.models ? data.models.map(m => ({ id: m.name, name: m.name })) : [];
        break;
      case 'openrouter':
        models = data.data ? data.data.map(m => ({ id: m.id, name: m.name || m.id })) : [];
        break;
      default: // OpenAI, LM Studio, Groq
        models = data.data ? data.data.map(m => ({ id: m.id, name: m.id })) : [];
        break;
    }

    // Populate dropdown
    availableModelsSelect.innerHTML = '<option value="">Select a model...</option>';
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name;
      availableModelsSelect.appendChild(option);
    });

    availableModelsSelect.classList.remove('hidden');
    showSuccessMessage(`Found ${models.length} models`);

  } catch (error) {
    console.error('Error fetching models:', error);
    showErrorMessage(`Failed to fetch models: ${error.message}`);
  } finally {
    // Reset loading state
    fetchButton.disabled = false;
    if (fetchText) fetchText.classList.remove('hidden');
    if (fetchSpinner) fetchSpinner.classList.add('hidden');
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

function showSuccessMessage(message) {
  const status = document.getElementById('status');
  if (status) {
    status.textContent = message;
    status.style.color = '#4CAF50';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded event fired');
  restoreOptions();

  const saveButton = document.getElementById('save');
  const providerSelect = document.getElementById('llmProvider');
  const addPromptButton = document.getElementById('add-prompt');
  const fetchModelsButton = document.getElementById('fetchModels');
  const availableModelsSelect = document.getElementById('availableModels');

  if (saveButton) {
    saveButton.addEventListener('click', saveOptions);
  }

  if (providerSelect) {
    providerSelect.addEventListener('change', (e) => updateUIForProvider(e.target.value));
  }

  if (addPromptButton) {
    addPromptButton.addEventListener('click', () => addPromptToUI());
  }

  if (fetchModelsButton) {
    fetchModelsButton.addEventListener('click', fetchAvailableModels);
  }

  if (availableModelsSelect) {
    availableModelsSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        document.getElementById('llmModel').value = e.target.value;
      }
    });
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