// Add this at the beginning of your file
const browserAPI = chrome || browser;

// Define default prompts
const DEFAULT_PROMPTS = [
  { id: 'fix_grammar', title: 'Fix spelling and grammar', prompt: 'Please correct any spelling errors and grammatical mistakes in the following text:' },
  { id: 'improve_writing', title: 'Improve writing', prompt: 'Please enhance the following text to improve its clarity, flow, and overall quality:' },
  { id: 'make_professional', title: 'Make more professional', prompt: 'Please rewrite the following text to make it more formal and suitable for a professional context:' },
  { id: 'simplify', title: 'Simplify text', prompt: 'Please simplify the following text to make it easier to understand, using simpler words and shorter sentences:' },
  { id: 'summarize', title: 'Summarize text', prompt: 'Please provide a concise summary of the following text, capturing the main points:' },
  { id: 'expand', title: 'Expand text', prompt: 'Please elaborate on the following text, adding more details and examples to make it more comprehensive:' },
  { id: 'bullet_points', title: 'Convert to bullet points', prompt: 'Please convert the following text into a clear and concise bullet-point list:' },
];

// Use 'browserAPI' for cross-browser compatibility
browserAPI.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'update') {
    log(`Extension updated from version ${details.previousVersion} to ${browserAPI.runtime.getManifest().version}`);
  }

  await browserAPI.contextMenus.create({
    id: 'scramble',
    title: 'Scramble',
    contexts: ['selection'],
  });

  for (const prompt of DEFAULT_PROMPTS) {
    await browserAPI.contextMenus.create({
      id: prompt.id,
      parentId: 'scramble',
      title: prompt.title,
      contexts: ['selection'],
    });
  }
});

// Handle context menu clicks
browserAPI.contextMenus.onClicked.addListener((info, tab) => {
  if (DEFAULT_PROMPTS.some(prompt => prompt.id === info.menuItemId)) {
    // Check if the content script is loaded
    browserAPI.tabs.sendMessage(tab.id, {action: 'ping'}, response => {
      if (browserAPI.runtime.lastError) {
        // Content script is not loaded, inject it
        browserAPI.scripting.executeScript({
          target: {tabId: tab.id},
          files: ['content.js']
        }, () => {
          if (browserAPI.runtime.lastError) {
            console.error('Failed to inject content script:', browserAPI.runtime.lastError);
            return;
          }
          // Now send the actual message
          sendEnhanceTextMessage(tab.id, info.menuItemId, info.selectionText);
        });
      } else {
        // Content script is already loaded, send the message
        sendEnhanceTextMessage(tab.id, info.menuItemId, info.selectionText);
      }
    });
  }
});

async function sendEnhanceTextMessage(tabId, promptId, selectedText) {
  const config = await getConfig();
  const showDiff = config.showDiff;
  browserAPI.tabs.sendMessage(tabId, {
    action: 'enhanceText',
    promptId: promptId,
    selectedText: selectedText,
    showDiff: showDiff
  }, response => {
    if (browserAPI.runtime.lastError) {
      console.error('Error sending message:', browserAPI.runtime.lastError);
    }
  });
}

// Handle messages from content script
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'enhanceText') {
    enhanceTextWithRateLimit(request.promptId, request.selectedText)
      .then(enhancedText => {
        sendResponse({ success: true, enhancedText });
      })
      .catch(error => {
        log(`Error enhancing text: ${error.message}`, 'error');
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicates that the response is asynchronous
  }
  return false; // Handle unrecognized messages
});

// Function to interact with various LLM APIs
async function enhanceTextWithLLM(promptId, text) {
  const storage = await browserAPI.storage.sync.get(null);
  const llmProvider = storage.llmProvider;
  if (!llmProvider) {
    throw new Error('LLM provider not set. Please set it in the extension options.');
  }
  
  const prompt = DEFAULT_PROMPTS.find(p => p.id === promptId)?.prompt;
  if (!prompt) {
    throw new Error('Invalid prompt ID');
  }
  const fullPrompt = `${prompt}:\n\n${text}`;

  const enhanceFunctions = {
    openai: enhanceWithOpenAI,
    anthropic: enhanceWithAnthropic,
    ollama: enhanceWithOllama,
    groq: enhanceWithGroq,
  };

  const enhanceFunction = enhanceFunctions[llmProvider];
  if (!enhanceFunction) {
    throw new Error('Invalid LLM provider selected');
  }

  return await enhanceFunction(fullPrompt);
}

async function enhanceWithOpenAI(prompt) {
  const config = await getConfig();
  if (!config.apiKey) {
    throw new Error('OpenAI API key not set. Please set it in the extension options.');
  }

  if (!config.llmModel) {
    throw new Error('LLM model not set for OpenAI. Please set it in the extension options.');
  }

  const endpoint = config.customEndpoint || 'https://api.openai.com/v1/chat/completions';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${encodeURIComponent(config.apiKey)}`,
      },
      body: JSON.stringify({
        model: config.llmModel || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API request failed: ${errorData.error.message}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    throw new Error(`Failed to enhance text with OpenAI. Error: ${error.message}`);
  }
}

async function enhanceWithAnthropic(prompt) {
  const { apiKey, llmModel, customEndpoint } = await browserAPI.storage.sync.get(['apiKey', 'llmModel', 'customEndpoint']);

  if (!apiKey) {
    throw new Error('Anthropic API key not set. Please set it in the extension options.');
  }

  if (!llmModel) {
    throw new Error('LLM model not set for Anthropic. Please set it in the extension options.');
  }

  const endpoint = customEndpoint || 'https://api.anthropic.com/v1/complete';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        prompt: `Human: ${prompt}\n\nAssistant:`,
        model: llmModel,
        max_tokens_to_sample: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Anthropic API request failed: ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.completion.trim();
  } catch (error) {
    throw new Error(`Failed to enhance text with Anthropic. Error: ${error.message}`);
  }
}

async function enhanceWithOllama(prompt) {
  const { llmModel, customEndpoint } = await browserAPI.storage.sync.get(['llmModel', 'customEndpoint']);

  if (!llmModel) {
    throw new Error('LLM model not set for Ollama. Please set it in the extension options.');
  }

  const endpoint = customEndpoint || 'http://localhost:11434/api/generate';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: llmModel || 'llama2',
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error('Ollama API request failed');
    }

    const data = await response.json();
    return data.response.trim();
  } catch (error) {
    throw new Error(`Failed to enhance text with Ollama. Error: ${error.message}`);
  }
}

async function enhanceWithGroq(prompt) {
  const config = await getConfig();

  if (!config.apiKey) {
    throw new Error('Groq API key not set. Please set it in the extension options.');
  }

  if (!config.llmModel) {
    throw new Error('LLM model not set for Groq. Please set it in the extension options.');
  }

  const endpoint = config.customEndpoint || 'https://api.groq.com/v1/chat/completions';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${encodeURIComponent(config.apiKey)}`,
      },
      body: JSON.stringify({
        model: config.llmModel || 'llama3-8b-8192',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq API request failed: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error(`Failed to enhance text with Groq. Error: ${error.message}`);
  }
}

// Implement rate limiting
const MAX_REQUESTS_PER_MINUTE = 10;
const RATE_LIMIT_RESET_INTERVAL = 60000; // 1 minute in milliseconds

const rateLimiter = (() => {
  let requestCount = 0;
  let lastResetTime = Date.now();
  const queue = [];

  const resetRateLimit = () => {
    const now = Date.now();
    if (now - lastResetTime > RATE_LIMIT_RESET_INTERVAL) {
      requestCount = 0;
      lastResetTime = now;
    }
  };

  const executeNext = () => {
    if (queue.length > 0) {
      resetRateLimit();
      if (requestCount < MAX_REQUESTS_PER_MINUTE) {
        const next = queue.shift();
        requestCount++;
        next.resolve(next.fn());
        if (queue.length > 0) {
          setTimeout(executeNext, RATE_LIMIT_RESET_INTERVAL / MAX_REQUESTS_PER_MINUTE);
        }
      } else {
        setTimeout(executeNext, RATE_LIMIT_RESET_INTERVAL - (Date.now() - lastResetTime));
      }
    }
  };

  return (fn) => {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      if (queue.length === 1) {
        executeNext();
      }
    });
  };
})();

// Wrap the enhanceTextWithLLM function with improved rate limiting
const enhanceTextWithRateLimit = (promptId, text) => {
  return rateLimiter(() => enhanceTextWithLLM(promptId, text));
};

// Add a function to get configuration
async function getConfig() {
  const defaults = {
    apiKey: '',
    llmProvider: 'openai',
    llmModel: 'gpt-3.5-turbo',
    customEndpoint: '',
    showDiff: false
  };
  const config = await browserAPI.storage.sync.get(defaults);
  return {
    apiKey: config.apiKey,
    llmModel: config.llmModel,
    customEndpoint: config.customEndpoint,
    llmProvider: config.llmProvider,
    showDiff: config.showDiff
  };
}

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  console[level](`[${timestamp}] ${message}`);
}
