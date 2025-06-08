(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const formatSelect = document.getElementById('format');
  const infoDiv = document.getElementById('info');
  const cancelButton = document.getElementById('cancelButton');

  // Enviar el formato seleccionado dinámicamente
  formatSelect.addEventListener('change', async () => {
    const selectedFormat = formatSelect.value;
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (format) => { window.selectedFormat = format; },
      args: [selectedFormat]
    });
  });

  // Función para activar la selección
  function activateSelection() {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (format) => {
        // Limpieza previa
        function cleanup() {
          const existingHighlight = document.querySelector('.element-highlight');
          const existingInfoBox = document.querySelector('.element-info-box');
          const existingOverlay = document.querySelector('.selection-overlay');
          if (existingHighlight) existingHighlight.remove();
          if (existingInfoBox) existingInfoBox.remove();
          if (existingOverlay) existingOverlay.remove();
          document.removeEventListener('mousemove', window._elementHighlightMoveHandler);
          document.removeEventListener('click', window._elementHighlightClickHandler, true);
          document.removeEventListener('keydown', window._elementHighlightKeyHandler, true);
        }

        cleanup();
        window.selectedFormat = format;

        // Overlay visual
        const overlay = document.createElement('div');
        overlay.className = 'selection-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        overlay.style.zIndex = '9998';
        overlay.style.pointerEvents = 'none';
        document.body.appendChild(overlay);

        const highlight = document.createElement('div');
        highlight.className = 'element-highlight';
        highlight.style.position = 'absolute';
        highlight.style.backgroundColor = 'rgba(0, 128, 255, 0.3)';
        highlight.style.pointerEvents = 'none';
        highlight.style.zIndex = '9999';
        document.body.appendChild(highlight);

        const infoBox = document.createElement('div');
        infoBox.className = 'element-info-box';
        infoBox.style.position = 'fixed';
        infoBox.style.bottom = '10px';
        infoBox.style.left = '10px';
        infoBox.style.padding = '5px 10px';
        infoBox.style.backgroundColor = 'rgba(0,0,0,0.7)';
        infoBox.style.color = 'white';
        infoBox.style.fontSize = '14px';
        infoBox.style.zIndex = '10000';
        infoBox.innerText = 'Selecciona un elemento...';
        document.body.appendChild(infoBox);

        function updateHighlight(el) {
          const rect = el.getBoundingClientRect();
          highlight.style.width = rect.width + 'px';
          highlight.style.height = rect.height + 'px';
          highlight.style.top = rect.top + window.scrollY + 'px';
          highlight.style.left = rect.left + window.scrollX + 'px';

          const tagName = el.tagName.toLowerCase();
          const classes = el.className ? ` class="${el.className}"` : '';
          const dims = ` (${Math.round(rect.width)} x ${Math.round(rect.height)})`;
          infoBox.innerText = `Elemento: <${tagName}${classes}>${dims}`;
        }

        // Handlers
        window._elementHighlightMoveHandler = e => {
          const el = document.elementFromPoint(e.clientX, e.clientY);
          if (el) updateHighlight(el);
        };

        window._elementHighlightClickHandler = e => {
          e.preventDefault();
          const el = document.elementFromPoint(e.clientX, e.clientY);
          if (el) {
            const format = window.selectedFormat || 'html';
            let content = '';
            let filename = `element-${Date.now()}`;
            if (format === 'html') {
              content = el.outerHTML;
              filename += '.html';
            } else if (format === 'svg' && el.tagName.toLowerCase() === 'svg') {
              content = el.outerHTML;
              filename += '.svg';
            } else {
              alert('El formato seleccionado no es compatible con este elemento.');
              return;
            }
            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
          }
          cleanup();
        };

        window._elementHighlightKeyHandler = e => {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            cleanup();
          }
        };

        document.addEventListener('mousemove', window._elementHighlightMoveHandler);
        document.addEventListener('click', window._elementHighlightClickHandler, true);
        document.addEventListener('keydown', window._elementHighlightKeyHandler, true);
      },
      args: [formatSelect.value]
    });
    infoDiv.textContent = 'Selección activa - Usa ESC para cancelar o haz clic en Cancelar';
  }

  // Botón de cancelar: inyecta limpieza directa
  cancelButton.addEventListener('click', () => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const existingHighlight = document.querySelector('.element-highlight');
        const existingInfoBox = document.querySelector('.element-info-box');
        const existingOverlay = document.querySelector('.selection-overlay');
        if (existingHighlight) existingHighlight.remove();
        if (existingInfoBox) existingInfoBox.remove();
        if (existingOverlay) existingOverlay.remove();
        document.removeEventListener('mousemove', window._elementHighlightMoveHandler);
        document.removeEventListener('click', window._elementHighlightClickHandler, true);
        document.removeEventListener('keydown', window._elementHighlightKeyHandler, true);
      }
    });
    infoDiv.textContent = 'Selección inactiva - Usa Ctrl+Shift+Q para activar';
  });

  // Activar la selección inicialmente
  activateSelection();
})();
