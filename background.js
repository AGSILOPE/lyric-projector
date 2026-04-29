// background.js
// Serve como ponte entre o content script e a página de projeção

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Encaminha todas as mensagens para os outros componentes da extensão
  chrome.runtime.sendMessage(message);
  
  if (message.type === 'lyric-update') {
    // Log opcional para debug
    // console.log('[Lyric Projector] Relé:', message.activeLine);
  }
});
