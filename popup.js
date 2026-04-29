// popup.js
// Salva e carrega as configurações da extensão

document.addEventListener('DOMContentLoaded', () => {
  const showNextLineCheck = document.getElementById('show-next-line');
  const customCssArea = document.getElementById('custom-css');
  const saveBtn = document.getElementById('save-btn');

  // Carrega configurações salvas
  chrome.storage.local.get(['showNextLine', 'customCss'], (result) => {
    if (result.showNextLine !== undefined) {
      showNextLineCheck.checked = result.showNextLine;
    }
    if (result.customCss !== undefined) {
      customCssArea.value = result.customCss;
    }
  });

  // Salva configurações
  saveBtn.addEventListener('click', () => {
    const settings = {
      showNextLine: showNextLineCheck.checked,
      customCss: customCssArea.value
    };

    chrome.storage.local.set(settings, () => {
      saveBtn.textContent = '✅ Salvo!';
      saveBtn.style.background = '#10b981';
      
      // Notifica as abas abertas sobre a mudança
      chrome.runtime.sendMessage({ type: 'settings-updated', settings });

      setTimeout(() => {
        saveBtn.textContent = 'Salvar Alterações';
        saveBtn.style.background = '#6366f1';
      }, 2000);
    });
  });
});
