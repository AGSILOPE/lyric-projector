// background.js
// Serve como ponte entre o content script e a página de projeção

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'lyric-update') {
    // Reenvia a mensagem para todos os componentes da extensão (incluindo projection.html)
    chrome.runtime.sendMessage(message);
  }
});
