chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "downloadElement") {
    chrome.downloads.download({
      url: message.url,
      filename: message.filename || "element"
    });
  }
});
