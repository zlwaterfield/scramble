// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
    const response = await chrome.runtime.sendMessage({
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
    range.deleteContents();
    range.insertNode(document.createTextNode(enhancedText));
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
  `;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.remove();
  }, 5000);
}