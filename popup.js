(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const formatSelect = document.getElementById('format');

  // Enviar el formato seleccionado dinámicamente
  formatSelect.addEventListener('change', async () => {
    const selectedFormat = formatSelect.value;
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (format) => { window.selectedFormat = format; },
      args: [selectedFormat]
    });
  });

  // Activar selección automáticamente con el formato inicial
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (format) => {
      if (!window.clickDownloadActivated) {
        window.clickDownloadActivated = true;
        window.selectedFormat = format;

        const highlight = document.createElement('div');
        highlight.style.position = 'absolute';
        highlight.style.backgroundColor = 'rgba(0, 128, 255, 0.3)';
        highlight.style.pointerEvents = 'none';
        highlight.style.zIndex = 9999;
        document.body.appendChild(highlight);

        const infoBox = document.createElement('div');
        infoBox.style.position = 'fixed';
        infoBox.style.bottom = '10px';
        infoBox.style.left = '10px';
        infoBox.style.padding = '5px 10px';
        infoBox.style.backgroundColor = 'rgba(0,0,0,0.7)';
        infoBox.style.color = 'white';
        infoBox.style.fontSize = '14px';
        infoBox.style.zIndex = 10000;
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

        document.addEventListener('mousemove', e => {
          const el = document.elementFromPoint(e.clientX, e.clientY);
          if (el) updateHighlight(el);
        });

        document.addEventListener('click', e => {
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
            } else if (format === 'png' || format === 'jpg') {
              html2canvas(el).then(canvas => {
                const dataURL = canvas.toDataURL(`image/${format}`);
                const a = document.createElement('a');
                a.href = dataURL;
                a.download = `${filename}.${format}`;
                a.click();
              });
              highlight.remove();
              infoBox.remove();
              return;
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
          highlight.remove();
          infoBox.remove();
        }, { once: true });
      }
    },
    args: [formatSelect.value]
  });
})();
