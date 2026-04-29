// background.js
// Serve como ponte entre o content script e a página de projeção

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'lyric-update') {
    console.log('[Lyric Projector] Ponte recebeu e está repassando:', message.activeLine);
    chrome.runtime.sendMessage(message);
  }
});
