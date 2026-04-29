// projection.js
// Lógica avançada da tela de projeção

(function() {
  const activeLineEl = document.getElementById('active-line');
  const activeTranslationEl = document.getElementById('active-translation');
  const nextLineEl = document.getElementById('next-line');
  const subtitleArea = document.getElementById('subtitle-area');
  const progressBar = document.getElementById('progress-bar');
  const standbyLogo = document.getElementById('standby-logo');
  const userCustomCss = document.getElementById('user-custom-css');

  // Controles do Overlay
  const sizeSlider = document.getElementById('size-slider');
  const brightnessSlider = document.getElementById('brightness-slider');
  const colorPicker = document.getElementById('color-picker');
  const castBtn = document.getElementById('cast-btn');

  let showNextLine = true;

  // Carrega configurações iniciais
  chrome.storage.local.get(['showNextLine', 'customCss', 'fontSize', 'brightness', 'accentColor'], (res) => {
    if (res.showNextLine !== undefined) showNextLine = res.showNextLine;
    if (res.customCss) userCustomCss.textContent = res.customCss;
    if (res.fontSize) {
      document.documentElement.style.setProperty('--font-size', res.fontSize + 'rem');
      sizeSlider.value = res.fontSize;
    }
    if (res.brightness) {
      document.documentElement.style.setProperty('--brightness', res.brightness + '%');
      brightnessSlider.value = res.brightness;
    }
    if (res.accentColor) {
      document.documentElement.style.setProperty('--accent-color', res.accentColor);
      colorPicker.value = res.accentColor;
    }
  });

  // Escuta atualizações de configurações do popup
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'settings-updated') {
      showNextLine = message.settings.showNextLine;
      userCustomCss.textContent = message.settings.customCss;
      if (!showNextLine) nextLineEl.textContent = '';
    }

    if (message.type === 'lyric-update') {
      updateLyrics(message);
    }

    if (message.type === 'progress-update') {
      if (progressBar) progressBar.style.width = message.progress + '%';
    }
  });

  function updateLyrics(data) {
    // Se não tem letra, mostra standby
    if (!data.activeLine && !data.activeTranslation) {
      subtitleArea.classList.remove('visible');
      setTimeout(() => {
        if (!activeLineEl.textContent) standbyLogo.classList.remove('hidden');
      }, 500);
      return;
    }

    // Oculta standby
    standbyLogo.classList.add('hidden');

    // Transição suave: sai -> troca -> volta
    subtitleArea.classList.remove('visible');
    
    setTimeout(() => {
      activeLineEl.textContent = data.activeLine || '';
      activeTranslationEl.textContent = data.activeTranslation || '';
      nextLineEl.textContent = showNextLine ? (data.nextLine || '') : '';
      
      if (progressBar) progressBar.style.width = data.progress + '%';
      
      subtitleArea.classList.add('visible');
    }, 300);
  }

  // Eventos dos Sliders
  sizeSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    document.documentElement.style.setProperty('--font-size', val + 'rem');
    chrome.storage.local.set({ fontSize: val });
  });

  brightnessSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    document.documentElement.style.setProperty('--brightness', val + '%');
    chrome.storage.local.set({ brightness: val });
  });

  colorPicker.addEventListener('input', (e) => {
    const val = e.target.value;
    document.documentElement.style.setProperty('--accent-color', val);
    chrome.storage.local.set({ accentColor: val });
  });

  // Botão Cast (Simulado)
  castBtn.addEventListener('click', () => {
    alert('Dica: Use "Botão Direito na página > Transmitir" no Chrome para enviar para o Chromecast ou Smart TV.');
  });

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
      if (document.fullscreenElement) document.exitFullscreen?.();
      else document.documentElement.requestFullscreen?.();
    }
    if (e.key === 'h' || e.key === 'H') document.body.classList.toggle('mirror-mode');
  });

  // Wake Lock
  async function requestWakeLock() {
    try { if ('wakeLock' in navigator) await navigator.wakeLock.request('screen'); } catch (e) {}
  }
  requestWakeLock();
})();

