const isInDebugMode = () => {
  return eval('__DEV__');
}

if (isInDebugMode()) {
  console.log('KAGE Extension background service worker initialized');
}

// Storage API bridge for the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle storage operations
  if (message.type === 'STORAGE_GET') {
    chrome.storage.local.get(message.keys || null, (result) => {
      if (chrome.runtime.lastError) {
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message
        });
      } else {
        sendResponse({ success: true, data: result });
      }
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'STORAGE_SET') {
    chrome.storage.local.set(message.data, () => {
      if (chrome.runtime.lastError) {
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message
        });
      } else {
        sendResponse({ success: true });
      }
    });
    return true;
  }

  if (message.type === 'STORAGE_REMOVE') {
    chrome.storage.local.remove(message.keys, () => {
      if (chrome.runtime.lastError) {
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message
        });
      } else {
        sendResponse({ success: true });
      }
    });
    return true;
  }

  if (message.type === 'STORAGE_CLEAR') {
    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message
        });
      } else {
        sendResponse({ success: true });
      }
    });
    return true;
  }

  // Handle other extension-specific messages
  if (message.type === 'GET_EXTENSION_INFO') {
    sendResponse({
      success: true,
      data: {
        id: chrome.runtime.id,
        version: chrome.runtime.getManifest().version,
      }
    });
    return false;
  }

  // Unknown message type
  sendResponse({
    success: false,
    error: `Unknown message type: ${message.type}`
  });
  return false;
});

// Listen for extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
  if (isInDebugMode()) {
    console.log('KAGE Extension installed/updated:', details.reason);
  }
  
  if (details.reason === 'install') {
    if (isInDebugMode()) {  
      console.log('First time installation');
    }
  } else if (details.reason === 'update') {
    if (isInDebugMode()) {
      console.log('Extension updated to version:', chrome.runtime.getManifest().version);
    }
  }
});


