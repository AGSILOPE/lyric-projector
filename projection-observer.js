// projection-observer.js
// Observa o DOM do Better Lyrics e envia a linha ativa para a janela de projeção

(function() {
  'use strict';
  
  const CHANNEL = new BroadcastChannel('lyric-projector');
  let lastSentText = '';
  let projectionWindow = null;

  // Captura a linha ativa e envia
  function captureAndSend() {
    const activeLine = document.querySelector('.blyrics--line.blyrics--animating');
    if (!activeLine) return;

    // Pega texto da linha ativa (sem tradução)
    const words = activeLine.querySelectorAll('.blyrics--word');
    const activeText = Array.from(words).map(w => w.textContent).join('');
    
    // Pega tradução se existir
    const translated = activeLine.querySelector('[class*="translated"]');
    const translatedText = translated ? translated.innerText : '';

    // Pega próxima linha
    let nextLine = activeLine.nextElementSibling;
    while (nextLine && !nextLine.classList.contains('blyrics--line')) {
      nextLine = nextLine.nextElementSibling;
    }
    const nextText = nextLine ? 
      Array.from(nextLine.querySelectorAll('.blyrics--word')).map(w => w.textContent).join('') : '';

    // Só envia se mudou
    const payload = activeText + translatedText;
    if (payload === lastSentText) return;
    lastSentText = payload;

    CHANNEL.postMessage({
      type: 'lyric-update',
      activeLine: activeText.trim(),
      activeTranslation: translatedText.trim(),
      nextLine: nextText.trim()
    });
  }

  // Observa mudanças no container de letras
  function startObserver() {
    const container = document.querySelector('.blyrics-container');
    if (!container) {
      // Better Lyrics ainda não carregou, tenta de novo
      setTimeout(startObserver, 1000);
      return;
    }

    const observer = new MutationObserver(() => captureAndSend());
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'] // Detecta quando .blyrics--animating muda
    });

    // Também checa a cada 200ms como fallback
    setInterval(captureAndSend, 200);
    console.log('[Lyric Projector] Observer ativo no Better Lyrics');
  }

  // Abre janela de projeção
  function openProjection() {
    const url = chrome.runtime.getURL('projection.html');
    projectionWindow = window.open(url, 'LyricProjector',
      'width=1920,height=400,menubar=no,toolbar=no,location=no,status=no'
    );
  }

  // Injeta botão de projeção na interface
  function injectButton() {
    // Evita duplicar o botão
    if (document.getElementById('lyric-projector-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'lyric-projector-btn';
    btn.innerHTML = '🖥️ Projetar';
    btn.style.cssText = `
      position: fixed; bottom: 80px; right: 20px; z-index: 99999;
      background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3);
      padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 14px;
      backdrop-filter: blur(10px); transition: all 0.2s;
    `;
    btn.addEventListener('mouseenter', () => btn.style.background = 'rgba(255,255,255,0.3)');
    btn.addEventListener('mouseleave', () => btn.style.background = 'rgba(255,255,255,0.15)');
    btn.addEventListener('click', openProjection);
    document.body.appendChild(btn);
  }

  // Atalho: Ctrl+Shift+P para abrir projeção
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      e.preventDefault();
      openProjection();
    }
  });

  // Inicia quando a página carrega
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { injectButton(); startObserver(); });
  } else {
    injectButton();
    startObserver();
  }
})();
