// sitecore-bridge.js — runs in page world, listens for events from content-script
window.SitecoreBridge = {
  notifyChange: function(element) {
    if (!element) return;
    ['input', 'change', 'blur'].forEach(function(evtType) {
      try { element.dispatchEvent(new Event(evtType, { bubbles: true, cancelable: true })); } catch(e) {}
    });
    try {
      var el = element;
      while (el && el !== document.body) {
        if (el.contentEditable === 'true') {
          el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
          break;
        }
        el = el.parentElement;
      }
    } catch(e) {}
    try {
      if (window.Sitecore && window.Sitecore.PageModes && window.Sitecore.PageModes.PageEditor) {
        window.Sitecore.PageModes.PageEditor.setModified(true);
      }
    } catch(e) {}
    try {
      if (window.Sitecore && window.Sitecore.PageModes && window.Sitecore.PageModes.ChromeManager) {
        window.Sitecore.PageModes.ChromeManager.resetChromes();
      }
    } catch(e) {}
  }
};

// Listen for notify events dispatched by the content-script (isolated world)
document.addEventListener('__sitecoreBridgeNotify', function(e) {
  try {
    var selector = e.detail && e.detail.selector;
    var el = selector ? document.querySelector(selector) : document.body;
    window.SitecoreBridge.notifyChange(el || document.body);
  } catch(err) {}
});
