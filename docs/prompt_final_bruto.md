# 🎯 Prompt Final: Fork Better Lyrics — Modo Projeção (Abordagem Bruta)

> **O que fazer**: Adicionar ao Better Lyrics um content script que captura a linha ativa do DOM (`div.blyrics--line.blyrics--animating`) e projeta em uma segunda aba/janela — só texto + fundo preto. Sem servidor, sem complicação.

---

## 🧠 O Conceito (Sua Imagem Explicou Tudo)

```
  TELA 1 (YouTube Music + Better Lyrics)         TELA 2 (Projeção)
  ┌────────────────────────────────────────┐      ┌─────────────────────────┐
  │ 🔵 Controle: YT Music, playlist,      │      │                         │
  │    busca, configurações               │      │                         │
  │                                        │      │                         │
  │ 🔴 Área de letras (Better Lyrics)     │      │  Through the hourglass  │
  │    - Take my breath away              │      │  I saw you, in time     │
  │    - Through the hourglass, I saw...  │ ───▶ │  you slipped away       │
  │    - When the mirror crashed...       │      │                         │
  │    - If only for today...             │      │  (fundo preto, só isso) │
  │                                        │      │                         │
  └────────────────────────────────────────┘      └─────────────────────────┘
  
  O script captura o texto do 🔴 e joga no 🟢 da tela 2
```

---

## 🔑 Seletores CSS do Better Lyrics (Confirmados via STYLING.md)

```
DOM Hierarchy:
.blyrics-container                          ← container geral
  └── div.blyrics--line                     ← cada linha da letra
        ├── .blyrics--animating             ← classe da LINHA ATIVA (a que está sendo cantada)
        ├── span.blyrics--word              ← cada palavra
        │     ├── .blyrics--animating       ← palavra ativa (richsync)
        │     ├── data-content="texto"      ← texto da palavra
        │     └── data-time="12.5"          ← timestamp em segundos
        └── .blyrics--break                 ← quebra de linha
```

### Como identificar a linha ativa:
```javascript
// A LINHA que está sendo cantada AGORA:
document.querySelector('.blyrics--line.blyrics--animating')

// O TEXTO da linha ativa:
document.querySelector('.blyrics--line.blyrics--animating')?.innerText

// A PRÓXIMA linha (irmã seguinte):
document.querySelector('.blyrics--line.blyrics--animating')?.nextElementSibling?.innerText

// Tradução (se existir, é um sub-elemento da linha):
document.querySelector('.blyrics--line.blyrics--animating .blyrics--translated')?.innerText
```

---

## 💻 O Código (Bruto, Direto, ~60 Linhas)

### Arquivo 1: `projection-observer.js` (content script injetado no YouTube Music)

```javascript
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
```

### Arquivo 2: `projection.html` (a segunda tela/aba — só legendas)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>♪ Lyric Projector</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      background: #000000;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      height: 100vh;
      overflow: hidden;
      cursor: none;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    
    /* Container da legenda - últimos 30% da tela */
    #subtitle-area {
      width: 100%;
      padding: 2vw 6vw 4vw;
      text-align: center;
    }
    
    /* Linha ativa */
    #active-line {
      color: #FFFFFF;
      font-size: clamp(2rem, 5vw, 5rem);
      font-weight: 700;
      line-height: 1.3;
      text-shadow: 0 0 30px rgba(255,255,255,0.15);
      transition: opacity 0.3s ease;
      margin-bottom: 0.5em;
    }
    
    /* Tradução */
    #active-translation {
      color: rgba(255, 255, 255, 0.6);
      font-size: clamp(1.2rem, 3vw, 3rem);
      font-weight: 400;
      font-style: italic;
      line-height: 1.3;
      transition: opacity 0.3s ease;
      margin-bottom: 0.8em;
    }
    
    /* Próxima linha */
    #next-line {
      color: rgba(255, 255, 255, 0.3);
      font-size: clamp(1.5rem, 3.5vw, 3.5rem);
      font-weight: 500;
      line-height: 1.3;
      transition: opacity 0.3s ease;
    }
    
    /* Esconde cursor após 3 seg */
    body.cursor-visible { cursor: default; }
    
    /* Modo espelhado (HUD parabrisa) */
    body.mirror-mode #subtitle-area {
      transform: scaleX(-1);
      justify-content: flex-start;
    }
    body.mirror-mode #active-line {
      font-weight: 900;
      font-size: clamp(3rem, 7vw, 7rem);
      text-shadow: 0 0 20px rgba(255,255,255,0.5);
    }
  </style>
</head>
<body>
  <div id="subtitle-area">
    <div id="active-line">Aguardando letra...</div>
    <div id="active-translation"></div>
    <div id="next-line"></div>
  </div>

  <script>
    const channel = new BroadcastChannel('lyric-projector');
    const activeLine = document.getElementById('active-line');
    const activeTranslation = document.getElementById('active-translation');
    const nextLine = document.getElementById('next-line');

    // Recebe letras da aba principal
    channel.onmessage = (event) => {
      if (event.data.type === 'lyric-update') {
        activeLine.textContent = event.data.activeLine || '';
        activeTranslation.textContent = event.data.activeTranslation || '';
        nextLine.textContent = event.data.nextLine || '';
      }
    };

    // Auto-hide cursor
    let cursorTimer;
    document.addEventListener('mousemove', () => {
      document.body.classList.add('cursor-visible');
      clearTimeout(cursorTimer);
      cursorTimer = setTimeout(() => document.body.classList.remove('cursor-visible'), 3000);
    });

    // Atalhos
    document.addEventListener('keydown', (e) => {
      if (e.key === 'f' || e.key === 'F11') {
        e.preventDefault();
        document.documentElement.requestFullscreen?.();
      }
      if (e.key === 'h') {
        document.body.classList.toggle('mirror-mode');
      }
      if (e.key === 'Escape') {
        document.exitFullscreen?.();
      }
    });

    // Fullscreen ao abrir (após interação)
    document.addEventListener('click', () => {
      document.documentElement.requestFullscreen?.();
    }, { once: true });
  </script>
</body>
</html>
```

### Arquivo 3: Entrada no `manifest.json` (adicionar ao fork)

```json
{
  "content_scripts": [
    {
      "matches": ["*://music.youtube.com/*"],
      "js": ["projection-observer.js"],
      "run_at": "document_idle"
    }
  ],
  "web_accessible_resources": [
    {
      "resources": ["projection.html"],
      "matches": ["*://music.youtube.com/*"]
    }
  ]
}
```

---

## 📺 COMO ENVIAR PARA OUTRA TELA (A Saída)

### 🖥️ Desktop: HDMI Direto (mais simples)
```
1. Conecta HDMI no notebook → projetor/TV
2. Win+P → "Estender"
3. YouTube Music + Better Lyrics na tela do notebook
4. Clica "🖥️ Projetar" → abre projection.html em nova janela
5. Arrasta essa janela para a tela do projetor
6. F11 = fullscreen → projetor mostra SÓ a legenda
```
✅ **Funciona agora, sem nada extra.**

---

### 📱 Android: Fullscreen + Espelhar Tela (SOLUÇÃO REAL)

Este é o caminho que funciona **hoje** no Android:

```
📱 CELULAR (Kiwi Browser)                    📺 TV / PROJETOR
┌──────────────────────────┐                  ┌────────────────────┐
│ Tab 1: music.youtube.com │                  │                    │
│  └─ Better Lyrics ativo  │  Screen Mirror   │  Through the       │
│  └─ Content script       │  (Miracast/Cast) │  hourglass, I saw  │
│     captura letras       │ ───────────────▶ │  you, in time you  │
│                          │                  │  slipped away      │
│ Tab 2: projection.html   │                  │                    │
│  └─ FULLSCREEN ◀── ativa │                  │  (fundo preto)     │
│  └─ Fundo preto + texto  │                  │                    │
└──────────────────────────┘                  └────────────────────┘
   A música toca em BACKGROUND
   (Tab 1 continua rodando)
```

**Passo a passo:**
```
1. Instala Kiwi Browser no Android (suporta extensões Chrome)
2. Instala Better Lyrics no Kiwi (via Chrome Web Store)
3. Instala o fork/extensão complementar (projection-observer.js)
4. Abre music.youtube.com no Kiwi → Tab 1
5. Toca uma música → Better Lyrics exibe letras
6. Clica "🖥️ Projetar" → abre projection.html na Tab 2
7. Tab 2 entra em FULLSCREEN (tela inteira = preto + legenda)
   → Neste momento a tela do celular é SÓ a legenda
   → A música continua tocando em background na Tab 1
8. Android → Configurações → Tela → "Transmitir" / "Smart View" / "Espelhar tela"
   → Seleciona a TV / Chromecast / Miracast / projetor WiFi
9. A TV recebe EXATAMENTE o que está na tela: fundo preto + 2 linhas de texto
   → A música sai pelo celular (ou Bluetooth → caixa de som)
```

> [!TIP]
> **Por que funciona**: Quando `projection.html` está em fullscreen, 100% da tela do celular é a legenda. O espelhamento de tela (Miracast/Cast/Smart View) envia exatamente isso para a TV. A música continua tocando na Tab 1 em background.

> [!IMPORTANT]
> **Áudio**: A música sai pelo celular ou por Bluetooth (caixa de som). O Cast de tela NÃO envia áudio junto — e isso é BOM, porque o áudio do carro/caixa de som fica independente.

---

### 📡 Android Alternativa: Cast de Tab (Chromecast)

Se tiver Chromecast na TV:
```
1. Chrome/Kiwi no Android → Tab 2 (projection.html)
2. Menu ⋮ → "Transmitir" → Seleciona Chromecast
3. Escolhe "Transmitir aba" (não "Transmitir tela")
4. Chromecast renderiza APENAS o conteúdo da aba = legenda preta
```
⚠️ Requer Chromecast na mesma rede WiFi.

---

### 🖥️ Desktop Alternativa: Monitor Virtual (OBS)

Se quiser criar uma "saída virtual" sem HDMI físico:
```
1. Instala OBS Studio
2. Cria uma "Fonte" → "Navegador" → URL: projection.html
3. OBS captura APENAS a legenda
4. Saída:
   - Virtual Camera → para apps de videoconferência
   - NDI → para outro computador na rede
   - Fullscreen Projector → arrasta para qualquer tela
   - Streaming → Twitch/YouTube com overlay de legenda
```

---

## 🔄 Resumo: Qual Saída Usar?

| Situação | Método | Dificuldade |
|----------|--------|:-----------:|
| **Notebook + Projetor HDMI** | Janela arrastada + F11 | 🟢 Fácil |
| **Celular + TV (Miracast)** | Fullscreen + espelhar tela | 🟢 Fácil |
| **Celular + Chromecast** | Cast de aba | 🟢 Fácil |
| **Celular + Parabrisa (HUD)** | Fullscreen + modo espelhado (H) | 🟢 Fácil |
| **Desktop + OBS (virtual)** | Browser Source no OBS | 🟡 Médio |
| **Desktop + Streaming** | OBS + output stream | 🟡 Médio |

---

## 📋 Próximo Passo

> [!NOTE]
> **O código do `projection-observer.js` + `projection.html` já está pronto acima.**
> Podemos:
> 1. **Testar agora no desktop** — colar o JS no DevTools do YouTube Music com Better Lyrics rodando
> 2. **Empacotar como extensão** — criar manifest.json completo para instalar no Brave/Chrome/Kiwi
> 3. **Criar o fork** — clonar o Better Lyrics e adicionar os arquivos
>
> Qual quer fazer primeiro?
