// projection-observer.js
// Observa o DOM do Better Lyrics E das letras nativas do YT Music

(function() {
  'use strict';
  
  // const CHANNEL = new BroadcastChannel('lyric-projector'); // Removido por limitação de origin
  let lastSentText = '';
  
  // Seletores
  const SELECTORS = {
    BL_ACTIVE: '.blyrics--line.blyrics--animating',
    BL_WORDS: '.blyrics--word',
    BL_TRANSLATED: '[class*="translated"]',
    
    // Seletores nativos do YT Music (vários possíveis)
    YT_ACTIVE: 'ytmusic-player-lyrics-line-renderer[active], .ytmusic-player-lyrics-line-renderer.active, .description.ytmusic-player-lyrics-line-renderer[active]',
    YT_LINES: 'ytmusic-player-lyrics-line-renderer, .ytmusic-player-lyrics-line-renderer'
  };

  function captureAndSend() {
    let activeText = '';
    let translatedText = '';
    let nextText = '';

    // 1. Tenta Better Lyrics (Prioridade)
    const blActive = document.querySelector(SELECTORS.BL_ACTIVE);
    if (blActive) {
      const words = blActive.querySelectorAll(SELECTORS.BL_WORDS);
      activeText = Array.from(words).map(w => w.textContent).join('');
      
      const translated = blActive.querySelector(SELECTORS.BL_TRANSLATED);
      translatedText = translated ? translated.innerText : '';

      let nextLine = blActive.nextElementSibling;
      while (nextLine && !nextLine.classList.contains('blyrics--line')) {
        nextLine = nextLine.nextElementSibling;
      }
      nextText = nextLine ? 
        Array.from(nextLine.querySelectorAll(SELECTORS.BL_WORDS)).map(w => w.textContent).join('') : '';
    } 
    // 2. Tenta Letras Nativas do YT Music (Fallback)
    else {
      const ytActive = document.querySelector(SELECTORS.YT_ACTIVE);
      if (ytActive) {
        activeText = ytActive.innerText;
        const nextLine = ytActive.nextElementSibling;
        nextText = nextLine ? nextLine.innerText : '';
      }
    }

    if (!activeText) return; // Se não tem texto, não manda nada

    // Só envia se mudou
    const payload = activeText + translatedText + nextText;
    if (payload === lastSentText) return;
    lastSentText = payload;

    console.log('[Lyric Projector] Detectado:', activeText);
    
    try {
      chrome.runtime.sendMessage({
        type: 'lyric-update',
        activeLine: activeText.trim(),
        activeTranslation: translatedText.trim(),
        nextLine: nextText.trim()
      });
    } catch (e) {
      console.log('[Lyric Projector] Erro ao enviar (extensão recarregada?):', e);
    }
  }

  function startObserver() {
    // Observa o body inteiro para mudanças leves (SPA navigation)
    const observer = new MutationObserver((mutations) => {
      // Re-injeta botão se sumir
      injectButton();
      
      // Captura se houver mudança de classe ou estrutura
      captureAndSend();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'active']
    });

    // Check periódico de segurança
    setInterval(captureAndSend, 300);
    console.log('[Lyric Projector] Observer robusto iniciado (BL + YT Native)');
  }

  function openProjection() {
    const url = chrome.runtime.getURL('projection.html');
    window.open(url, 'LyricProjector', 
      'width=1200,height=400,menubar=no,toolbar=no,location=no,status=no'
    );
  }

  function injectButton() {
    if (document.getElementById('lyric-projector-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'lyric-projector-btn';
    btn.innerHTML = '🖥️ Projetar';
    btn.style.cssText = `
      position: fixed; bottom: 85px; right: 25px; z-index: 9999;
      background: rgba(0,0,0,0.7); color: white; border: 1px solid rgba(255,255,255,0.2);
      padding: 10px 20px; border-radius: 30px; cursor: pointer; font-size: 14px;
      backdrop-filter: blur(10px); font-weight: bold; transition: all 0.2s;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(255,255,255,0.2)';
      btn.style.transform = 'scale(1.05)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(0,0,0,0.7)';
      btn.style.transform = 'scale(1)';
    });
    btn.addEventListener('click', openProjection);
    document.body.appendChild(btn);
  }

  // Atalho
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
      e.preventDefault();
      openProjection();
    }
  });

  // Início
  setTimeout(() => {
    injectButton();
    startObserver();
  }, 2000);
})();

