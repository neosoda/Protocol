(function() {
  function applyStyle(style) {
    const btn = document.getElementById('style-toggle-btn');
    const label = document.getElementById('style-label');
    if (style === 'modern') {
      document.documentElement.setAttribute('data-style', 'modern');
      if (label) label.textContent = 'Style: Cyber-Glass';
      if (btn) btn.style.background = 'rgba(0, 245, 255, 0.25)';
    } else {
      document.documentElement.removeAttribute('data-style');
      if (label) label.textContent = 'Style: Classique';
      if (btn) btn.style.background = 'rgba(56, 189, 248, 0.1)';
    }
  }

  window.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('style-toggle-btn');
    const params = new URLSearchParams(window.location.search);
    const saved = localStorage.getItem('protocol-explorer:style');
    const initial = params.get('style') || saved || 'classic';
    applyStyle(initial);

    if (btn) {
      btn.addEventListener('click', function() {
        const isModern = document.documentElement.getAttribute('data-style') === 'modern';
        const next = isModern ? 'classic' : 'modern';
        localStorage.setItem('protocol-explorer:style', next);
        applyStyle(next);
      });
    }
  });
})();
