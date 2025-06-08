// Estado global para controlar si la selección está activa
let isSelectionActive = false;

// Manejar los atajos de teclado
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-selection") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { 
        type: "toggleSelection",
        isActive: !isSelectionActive 
      });
      isSelectionActive = !isSelectionActive;
    });
  } else if (command === "cancel-selection" && isSelectionActive) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { 
        type: "toggleSelection",
        isActive: false 
      });
      isSelectionActive = false;
    });
  }
});

// Manejar mensajes de la página
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "downloadElement") {
    chrome.downloads.download({
      url: message.url,
      filename: message.filename || "element"
    });
  } else if (message.type === "toggleSelection") {
    isSelectionActive = message.isActive;
  }
});
