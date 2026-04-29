// projection.js
// Lógica da tela de projeção (recebe mensagens e atualiza o DOM)

(function() {
  const activeLineEl = document.getElementById('active-line');
  const activeTranslationEl = document.getElementById('active-translation');
  const nextLineEl = document.getElementById('next-line');

  console.log('[Lyric Projector] Tela de projeção carregada e ouvindo...');

  // Recebe letras via sistema de mensagens da extensão
  chrome.runtime.onMessage.addListener((message) => {
    console.log('[Lyric Projector] Recebido na tela:', message);
    if (message.type === 'lyric-update') {
      if (activeLineEl) activeLineEl.textContent = message.activeLine || '';
      if (activeTranslationEl) activeTranslationEl.textContent = message.activeTranslation || '';
      if (nextLineEl) nextLineEl.textContent = message.nextLine || '';
    }
  });

  // Auto-hide cursor após 3 segundos
  let cursorTimer;
  document.addEventListener('mousemove', () => {
    document.body.classList.add('cursor-visible');
    clearTimeout(cursorTimer);
    cursorTimer = setTimeout(() => document.body.classList.remove('cursor-visible'), 3000);
  });

  // Atalhos de teclado
  document.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F11') {
      e.preventDefault();
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      } else {
        document.documentElement.requestFullscreen?.();
      }
    }
    if (e.key === 'h' || e.key === 'H') {
      document.body.classList.toggle('mirror-mode');
    }
    if (e.key === 'Escape') {
      document.exitFullscreen?.();
    }
  });

  // Clique na tela = fullscreen
  document.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    }
  });

  // Wake Lock
  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        await navigator.wakeLock.request('screen');
      }
    } catch (e) {}
  }
  requestWakeLock();
})();
