(function () {
  function initRedoc() {
    const container = document.getElementById('redoc-container');
    if (!container || typeof Redoc === 'undefined') {
      return;
    }

    Redoc.init('/api/docs.json', {}, container);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRedoc);
  } else {
    initRedoc();
  }
})();
