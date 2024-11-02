const browserAPI = (typeof browser !== 'undefined' ? browser : chrome);

// Listen for messages from the background script
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[SCRAMBLE] Received message:', request);
  
  // Add support for ping message
  if (request.action === 'ping') {
    sendResponse({ success: true });
    return;
  }
  
  if (request.action === 'enhanceText') {
    enhanceSelectedText(request.promptId, request.selectedText)
      .then(enhancedText => {
        replaceSelectedText(enhancedText);
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('Error enhancing text:', error);
        showErrorNotification(error.message);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicates that the response is asynchronous
  }
});

// Function to enhance selected text
async function enhanceSelectedText(promptId, selectedText) {
  console.log('[SCRAMBLE] Selected text:', promptId, selectedText);
  try {
    const response = await browserAPI.runtime.sendMessage({
      action: 'enhanceText',
      promptId: promptId,
      selectedText: selectedText,
    });
    console.log('[SCRAMBLE] Response:', response);

    if (response.success) {
      return response.enhancedText;
    } else {
      throw new Error(response.error || 'Unknown error occurred');
    }
  } catch (error) {
    console.error('Error in enhanceSelectedText:', error);
    throw error;
  }
}

// Function to replace the selected text with enhanced text
function replaceSelectedText(enhancedText) {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);

    // Handle text inputs and textareas
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'TEXTAREA' || (activeElement.tagName === 'INPUT' && activeElement.type === 'text'))) {
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      const text = activeElement.value;
      activeElement.value = text.substring(0, start) + enhancedText + text.substring(end);
      
      // Trigger input event for compatibility with reactive frameworks
      const inputEvent = new Event('input', { bubbles: true });
      activeElement.dispatchEvent(inputEvent);
      
      // Trigger change event
      const changeEvent = new Event('change', { bubbles: true });
      activeElement.dispatchEvent(changeEvent);
    } else {
      range.deleteContents();
      range.insertNode(document.createTextNode(enhancedText));
    }

    selection.removeAllRanges();
  }
}

// Function to show error notification
function showErrorNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = `Error: ${message}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #ff4444;
    color: white;
    padding: 10px;
    border-radius: 5px;
    z-index: 9999;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Add these constants at the top
const TYPING_DELAY = 3000; // Wait 3 seconds after typing stops
const MIN_TEXT_LENGTH = 50; // Minimum text length to trigger suggestions

// Add new function to handle typing monitoring
function setupTypingMonitor(element) {
  console.log('setupTypingMonitor')
  let typingTimer;
  const suggestionMarkers = new Map(); // Store markers and their positions

  element.addEventListener('input', () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(async () => {
      const text = element.value;
      if (text.length < MIN_TEXT_LENGTH) return;

      try {
        const response = await browserAPI.runtime.sendMessage({
          action: 'getSuggestions',
          text: text
        });

        if (response.success) {
          highlightSuggestions(element, response.suggestions);
        }
      } catch (error) {
        console.error('Error getting suggestions:', error);
      }
    }, TYPING_DELAY);
  });
}

// Function to highlight suggestions
function highlightSuggestions(element, suggestions) {
  // Remove existing markers
  const existingMarkers = element.parentElement.querySelectorAll('.suggestion-marker');
  existingMarkers.forEach(marker => marker.remove());

  suggestions.forEach(suggestion => {
    const range = findTextRange(element, suggestion.text);
    if (range) {
      createSuggestionMarker(element, range, suggestion);
    }
  });
}

// Function to find text range
function findTextRange(element, searchText) {
  const text = element.value;
  const startIndex = text.indexOf(searchText);
  if (startIndex === -1) return null;

  return {
    start: startIndex,
    end: startIndex + searchText.length
  };
}

// Function to create suggestion marker
function createSuggestionMarker(element, range, suggestion) {
  const marker = document.createElement('div');
  marker.className = 'suggestion-marker';
  
  // Position marker under the text
  const coordinates = getTextCoordinates(element, range);
  Object.assign(marker.style, {
    position: 'absolute',
    left: `${coordinates.left}px`,
    top: `${coordinates.bottom}px`,
    width: `${coordinates.width}px`,
    borderBottom: '2px wavy #4a90e2',
    pointerEvents: 'all',
    zIndex: 1000
  });

  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'suggestion-tooltip';
  tooltip.innerHTML = `
    <div class="suggestion-explanation">${suggestion.explanation}</div>
    <div class="suggestion-improvement">Suggestion: ${suggestion.suggestion}</div>
  `;
  Object.assign(tooltip.style, {
    display: 'none',
    position: 'absolute',
    background: 'white',
    border: '1px solid #ccc',
    padding: '8px',
    borderRadius: '4px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    maxWidth: '300px',
    zIndex: 1001
  });

  marker.appendChild(tooltip);
  
  // Show/hide tooltip on hover
  marker.addEventListener('mouseenter', () => tooltip.style.display = 'block');
  marker.addEventListener('mouseleave', () => tooltip.style.display = 'none');

  // Add marker to the page
  const wrapper = element.parentElement;
  wrapper.style.position = 'relative';
  wrapper.appendChild(marker);
}

// Function to get text coordinates
function getTextCoordinates(element, range) {
  // This is a simplified version - you might need more complex calculations
  // depending on your specific needs
  const text = element.value.substring(0, range.start);
  const textWidth = getTextWidth(text, element);
  
  const rect = element.getBoundingClientRect();
  return {
    left: textWidth,
    bottom: rect.height,
    width: getTextWidth(element.value.substring(range.start, range.end), element)
  };
}

// Helper function to calculate text width
function getTextWidth(text, element) {
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'));
  const context = canvas.getContext('2d');
  const computedStyle = window.getComputedStyle(element);
  context.font = `${computedStyle.fontSize} ${computedStyle.fontFamily}`;
  return context.measureText(text).width;
}

// Add to the existing code that handles inputs and textareas
document.addEventListener('focusin', (event) => {
  console.log('focusin')
  const element = event.target;
  if (element.tagName === 'TEXTAREA' || (element.tagName === 'INPUT' && element.type === 'text')) {
    setupTypingMonitor(element);
  }
});