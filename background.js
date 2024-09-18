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

// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'scramble',
    title: 'Scramble',
    contexts: ['selection'],
  });

  DEFAULT_PROMPTS.forEach(prompt => {
    chrome.contextMenus.create({
      id: prompt.id,
      parentId: 'scramble',
      title: prompt.title,
      contexts: ['selection'],
    });
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (DEFAULT_PROMPTS.some(prompt => prompt.id === info.menuItemId)) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'enhanceText',
      promptId: info.menuItemId,
      selectedText: info.selectionText,
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'enhanceText') {
    enhanceTextWithRateLimit(request.promptId, request.selectedText)
      .then(enhancedText => {
        sendResponse({ success: true, enhancedText });
      })
      .catch(error => {
        console.error('Error enhancing text:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicates that the response is asynchronous
  }
});

// Function to interact with OpenAI API
async function enhanceTextWithLLM(promptId, text) {
  // Retrieve API key from storage
  const { openaiApiKey } = await chrome.storage.sync.get(['openaiApiKey']);
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not set. Please set it in the extension options.');
  }

  const prompt = DEFAULT_PROMPTS.find(p => p.id === promptId).prompt;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${encodeURIComponent(openaiApiKey)}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: `${prompt}:\n\n${text}` }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    throw new Error(`Failed to enhance text. Please check your API key and try again. Error: ${error.message}`);
  }
}

// Implement rate limiting
const MAX_REQUESTS_PER_MINUTE = 10;
let requestCount = 0;
let lastResetTime = Date.now();

function checkRateLimit() {
  const now = Date.now();
  if (now - lastResetTime > 60000) {
    requestCount = 0;
    lastResetTime = now;
  }

  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  requestCount++;
}

// Wrap the enhanceTextWithLLM function with rate limiting
const enhanceTextWithRateLimit = async (promptId, text) => {
  checkRateLimit();
  return enhanceTextWithLLM(promptId, text);
};