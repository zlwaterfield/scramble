const browserAPI = chrome || browser;

// Listen for messages from the background script
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[SCRAMBLE] Received message:', request);
  if (request.action === 'enhanceText') {
    enhanceSelectedText(request.promptId, request.selectedText, request.showDiff)
      .then(enhancedText => {
        // if (request.showDiff) {
        //   showDiffModal(request.selectedText, enhancedText);
        // } else {
          replaceSelectedText(enhancedText);
        // }
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
async function enhanceSelectedText(promptId, selectedText, showDiff) {
  console.log('[SCRAMBLE] Selected text:', promptId, selectedText);
  try {
    const response = await browserAPI.runtime.sendMessage({
      action: 'enhanceText',
      promptId: promptId,
      selectedText: selectedText,
      // showDiff: showDiff
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

// Function to show diff modal and prompt user
// function showDiffModal(originalText, enhancedText) {
//   // Create modal elements
//   const modal = document.createElement('div');
//   modal.id = 'scramble-modal';
//   modal.style.cssText = `
//     position: fixed;
//     top: 10%;
//     left: 50%;
//     transform: translate(-50%, 0);
//     width: 80%;
//     max-width: 600px;
//     background-color: #fff;
//     border: 2px solid #2DD4BF;
//     border-radius: 8px;
//     z-index: 10000;
//     padding: 20px;
//     box-shadow: 0 5px 15px rgba(0,0,0,0.3);
//   `;

//   const title = document.createElement('h2');
//   title.textContent = 'Review Changes';
//   modal.appendChild(title);

//   const diffContainer = document.createElement('div');
//   diffContainer.style.cssText = 'max-height: 400px; overflow-y: auto; margin-bottom: 20px;';
//   diffContainer.innerHTML = generateDiffHTML(originalText, enhancedText);
//   modal.appendChild(diffContainer);

//   const buttonContainer = document.createElement('div');
//   buttonContainer.style.textAlign = 'right';

//   const acceptButton = document.createElement('button');
//   acceptButton.textContent = 'Accept';
//   acceptButton.style.cssText = `
//     background-color: #2DD4BF;
//     color: white;
//     padding: 10px 20px;
//     margin-right: 10px;
//     border: none;
//     border-radius: 8px;
//     cursor: pointer;
//   `;
//   acceptButton.onclick = () => {
//     replaceSelectedText(enhancedText);
//     closeModal();
//   };

//   const cancelButton = document.createElement('button');
//   cancelButton.textContent = 'Cancel';
//   cancelButton.style.cssText = `
//     background-color: #ccc;
//     color: #333;
//     padding: 10px 20px;
//     border: none;
//     border-radius: 8px;
//     cursor: pointer;
//   `;
//   cancelButton.onclick = closeModal;

//   buttonContainer.appendChild(acceptButton);
//   buttonContainer.appendChild(cancelButton);
//   modal.appendChild(buttonContainer);

//   document.body.appendChild(modal);

//   // Add overlay
//   const overlay = document.createElement('div');
//   overlay.id = 'scramble-overlay';
//   overlay.style.cssText = `
//     position: fixed;
//     top: 0;
//     left: 0;
//     width: 100%;
//     height: 100%;
//     background-color: rgba(0,0,0,0.5);
//     z-index: 9999;
//   `;
//   document.body.appendChild(overlay);

//   function closeModal() {
//     modal.remove();
//     overlay.remove();
//   }
// }

// Function to generate diff HTML
function generateDiffHTML(originalText, enhancedText) {
  if (typeof Diff === 'undefined') {
    console.error('jsdiff library is not loaded.');
    return '<p>Error: jsdiff library not loaded.</p>';
  }

  const diff = Diff.createPatch('Content', originalText, enhancedText);
  const diffLines = diff.split('\n');
  let html = '<pre style="white-space: pre-wrap;">';
  diffLines.forEach(line => {
    let color = '#333';
    if (line.startsWith('+') && !line.startsWith('+++')) color = '#2ecc71'; // Green for additions
    else if (line.startsWith('-') && !line.startsWith('---')) color = '#e74c3c'; // Red for deletions
    else if (line.startsWith('@')) color = '#3498db'; // Blue for hunk headers
    else if (line.startsWith('Index') || line.startsWith('diff') || line.startsWith('---') || line.startsWith('+++')) color = '#999'; // Gray for diff index
    html += `<span style="color: ${color};">${line}</span>\n`;
  });
  html += '</pre>';
  return html;
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
  `;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.remove();
  }, 5000);
}
