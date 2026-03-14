// Sitecore SSC API key — stored in extension bundle, not in public registry
var SSC_API_KEY = "{90524103-7799-489C-9E53-C0D995207FB4}";

// content-script.js - Sitecore Widget Editor 2 v1.1.0

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function isContentEditorTop() {
  // Top-level Content Editor page (not an iframe)
  return /Content%20Editor|ContentEditor/i.test(window.location.href) &&
         window === window.top;
}

function isContentEditorFrame() {
  // The scContentIframeId0 frame that holds the textarea
  return !!document.getElementById('ctl00_ctl00_ctl05_Html');
}

function getTextarea() {
  return document.getElementById('ctl00_ctl00_ctl05_Html');
}

// ─── SSC API READ (top-level frame only) ─────────────────────────────────────

function fetchFieldHtml(itemId, fieldId, apiKey, cb) {
  if (!itemId || itemId === 'undefined' || !fieldId || fieldId === 'undefined') {
    cb(new Error('Missing itemId or fieldId'), null); return;
  }
  var url = 'https://' + window.location.host +
    '/sitecore/api/ssc/aggregate/content/Items(\'' + itemId + '\')/Fields' +
    '?sc_apikey=' + encodeURIComponent(apiKey);
  fetch(url, { credentials: 'include' })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      var field = (d.value || []).find(function(f) {
        return f.Id.toLowerCase() === fieldId.toLowerCase() ||
               f.Name.toLowerCase() === 'richtext';
      });
      cb(null, field ? field.Value : null);
    })
    .catch(function(e) { cb(e, null); });
}

// ─── HTML PARSING ────────────────────────────────────────────────────────────

function parseWidgetsFromHtml(registry, html) {
  var parser = new DOMParser();
  var doc = parser.parseFromString('<div id="_root">' + html + '</div>', 'text/html');
  var found = [];
  if (!registry || !registry.widgets) return found;
  registry.widgets.forEach(function(def) {
    doc.querySelectorAll('.' + def.class).forEach(function(el, idx) {
      found.push({ widgetClass: def.class, name: def.name, index: idx, mode: 'content-editor' });
    });
  });
  return found;
}

function getWidgetDataFromHtml(def, html, index) {
  var parser = new DOMParser();
  var doc = parser.parseFromString('<div id="_root">' + html + '</div>', 'text/html');
  var roots = doc.querySelectorAll('.' + def.class);
  var root = roots[index];
  if (!root) return null;
  var data = {};
  (def.standaloneFields || []).forEach(function(f) {
    var el = root.querySelector(f.selector);
    data[f.key] = el ? (f.attr ? el.getAttribute(f.attr) : el.textContent.trim()) : '';
  });
  if (def.repeat) {
    var items = root.querySelectorAll(def.repeat.selector);
    data.items = [];
    items.forEach(function(item, i) {
      var planNum = i + 1;
      var row = {};
      def.fields.forEach(function(f) {
        if (f.selector) {
          var el = item.querySelector(f.selector);
          row[f.key] = el ? (f.attr ? el.getAttribute(f.attr) : el.textContent.trim()) : '';
        } else if (f.gridSelector) {
          var cs = f.gridCellSelector.replace('{planNum}', planNum);
          var gr = root.querySelector(f.gridSelector);
          var cel = gr ? gr.querySelector(cs) : null;
          row[f.key] = cel ? cel.textContent.trim() : '';
        }
      });
      data.items.push(row);
    });
  }
  return data;
}

function buildUpdatedHtml(def, index, data, html) {
  var parser = new DOMParser();
  var doc = parser.parseFromString('<div id="_root">' + html + '</div>', 'text/html');
  var roots = doc.querySelectorAll('.' + def.class);
  var root = roots[index];
  if (!root) return null;
  (def.standaloneFields || []).forEach(function(f) {
    if (data[f.key] === undefined) return;
    var el = root.querySelector(f.selector);
    if (!el) return;
    if (f.attr) { el.setAttribute(f.attr, data[f.key]); } else { el.textContent = data[f.key]; }
    if (f.syncDataAttr) {
      var sv = f.syncNumeric ? String(data[f.key]).replace(/[^0-9.]/g, '') : data[f.key];
      el.setAttribute(f.syncDataAttr, sv);
    }
  });
  if (def.repeat && data.items) {
    var items = root.querySelectorAll(def.repeat.selector);
    data.items.forEach(function(row, i) {
      var item = items[i];
      if (!item) return;
      var planNum = i + 1;
      def.fields.forEach(function(f) {
        if (row[f.key] === undefined) return;
        var val = row[f.key];
        if (f.selector) {
          var el = item.querySelector(f.selector);
          if (el) {
            if (f.attr) { el.setAttribute(f.attr, val); } else { el.textContent = val; }
            if (f.syncDataAttr) {
              var sv = f.syncNumeric ? String(val).replace(/[^0-9.]/g, '') : val;
              el.setAttribute(f.syncDataAttr, sv);
            }
          }
        } else if (f.gridSelector) {
          var cs = f.gridCellSelector.replace('{planNum}', planNum);
          var gr = root.querySelector(f.gridSelector);
          var cel = gr ? gr.querySelector(cs) : null;
          if (cel) cel.textContent = val;
        }
      });
    });
  }
  return doc.getElementById('_root').innerHTML;
}

// ─── WYSIWYG AUTOMATION (top-level Content Editor frame) ─────────────────────

function openHtmlEditorAndUpdate(updatedHtml, cb) {
  // Find and click the "Edit HTML" button specifically (not "Show editor" / TinyMCE)
  var editHtmlBtn = null;
  var links = document.querySelectorAll('a, span, div, input, button');
  for (var i = 0; i < links.length; i++) {
    var t = (links[i].textContent || links[i].value || '').trim();
    // Must match "Edit HTML" exactly — exclude "Show editor" and anything with "editor" only
    if (/^edit\s+html$/i.test(t)) {
      editHtmlBtn = links[i]; break;
    }
  }
  if (!editHtmlBtn) { cb(false, 'Edit HTML button not found'); return; }

  editHtmlBtn.click();

  // Wait for the textarea to appear in any frame
  var attempts = 0;
  var interval = setInterval(function() {
    attempts++;
    var ta = findTextareaInFrames();
    if (ta) {
      clearInterval(interval);
      ta.value = updatedHtml;
      ta.dispatchEvent(new Event('change', { bubbles: true }));
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      // Click Accept
      var acceptBtn = findAcceptButton(ta.ownerDocument);
      if (acceptBtn) {
        setTimeout(function() { acceptBtn.click(); cb(true); }, 150);
      } else {
        cb(false, 'Accept button not found');
      }
    } else if (attempts > 20) {
      clearInterval(interval);
      cb(false, 'Textarea did not appear');
    }
  }, 200);
}

function findTextareaInFrames() {
  // Check all iframes recursively
  var frames = document.querySelectorAll('iframe');
  for (var i = 0; i < frames.length; i++) {
    try {
      var ta = frames[i].contentDocument &&
               frames[i].contentDocument.getElementById('ctl00_ctl00_ctl05_Html');
      if (ta) return ta;
      // One level deeper
      var inner = frames[i].contentDocument.querySelectorAll('iframe');
      for (var j = 0; j < inner.length; j++) {
        try {
          var ta2 = inner[j].contentDocument &&
                    inner[j].contentDocument.getElementById('ctl00_ctl00_ctl05_Html');
          if (ta2) return ta2;
        } catch(e) {}
      }
    } catch(e) {}
  }
  return null;
}

function findAcceptButton(doc) {
  var btns = doc.querySelectorAll('input[type=button], button, a');
  for (var i = 0; i < btns.length; i++) {
    if (/accept/i.test(btns[i].value || btns[i].textContent || btns[i].title || '')) {
      return btns[i];
    }
  }
  return null;
}

// ─── ITEM ID DETECTION ───────────────────────────────────────────────────────

function detectCurrentItemId() {
  // Read from Quick Info section — first scEditorHeaderQuickInfoInput is always Item ID
  var el = document.querySelector('input.scEditorHeaderQuickInfoInput');
  if (el && el.value) {
    var m = el.value.match(/[{(]([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})[})]/);
    if (m) return m[1].toLowerCase();
  }
  return null;
}

// ─── CONTENT EDITOR FRAME — direct textarea operations ───────────────────────

function getWidgetDataFromTextarea(def, index) {
  var ta = getTextarea();
  if (!ta) return null;
  return getWidgetDataFromHtml(def, ta.value, index);
}

function updateViaTextarea(def, index, data) {
  var ta = getTextarea();
  if (!ta) return false;
  var updated = buildUpdatedHtml(def, index, data, ta.value);
  if (!updated) return false;
  ta.value = updated;
  ta.dispatchEvent(new Event('change', { bubbles: true }));
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  var acceptBtn = findAcceptButton(document);
  if (acceptBtn) setTimeout(function() { acceptBtn.click(); }, 150);
  return true;
}

// ─── CONTENT CHANGE DETECTION (top frame) ────────────────────────────────────

var _lastItemId = null;
if (isContentEditorTop()) {
  // Watch Quick Info input for changes (fires when tree selection changes)
  var _ciEl = document.querySelector('input.scEditorHeaderQuickInfoInput');
  if (_ciEl) {
    new MutationObserver(function() {
      var id = detectCurrentItemId();
      if (id && id !== _lastItemId) {
        _lastItemId = id;
        try { chrome.runtime.sendMessage({ type: 'CONTENT_ITEM_CHANGED', itemId: id }); } catch(e) {}
      }
    }).observe(_ciEl, { attributes: true, attributeFilter: ['value'] });
  }
  // Also poll as fallback since hidden input changes may not fire MutationObserver
  setInterval(function() {
    var id = detectCurrentItemId();
    if (id && id !== _lastItemId) {
      _lastItemId = id;
      try { chrome.runtime.sendMessage({ type: 'CONTENT_ITEM_CHANGED', itemId: id }); } catch(e) {}
    }
  }, 800);
}

// ─── MESSAGE HANDLER ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {

  if (msg.type === 'IS_CONTENT_EDITOR') {
    sendResponse({ isCE: isContentEditorFrame(), isTop: isContentEditorTop() });
    return true;
  }

  // ── Top-level Content Editor frame ──
  if (isContentEditorTop()) {

    if (msg.type === 'GET_WIDGETS') {
      // Read item ID directly from Quick Info on the page — no registry lookup needed
      var currentItemId = detectCurrentItemId();
      if (!currentItemId) { sendResponse({ widgets: [], mode: 'content-editor' }); return true; }
      var apiKey = SSC_API_KEY;
      var host = window.location.host;
      fetch('https://' + host + '/sitecore/api/ssc/aggregate/content/Items(' +
            encodeURIComponent("'" + currentItemId + "'") + ')/Fields?sc_apikey=' +
            encodeURIComponent(apiKey), { credentials: 'include' })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          var found = [];
          (d.value || []).forEach(function(field) {
            if (!field.Value || field.Type !== 'Rich Text') return;
            parseWidgetsFromHtml(msg.registry, field.Value).forEach(function(w) {
              w.itemId = currentItemId;
              w.fieldId = field.Id;
              found.push(w);
            });
          });
          sendResponse({ widgets: found, mode: 'content-editor' });
        })
        .catch(function() { sendResponse({ widgets: [], mode: 'content-editor' }); });
      return true;
    }

    if (msg.type === 'GET_WIDGET_DATA') {
      // itemId and fieldId are now stored on the widget itself from GET_WIDGETS
      var itemId = (msg.def && msg.def.itemId) || detectCurrentItemId();
      var fieldId = msg.def && msg.def.fieldId;
      var apiKey = SSC_API_KEY;
      if (!itemId) { sendResponse({ data: null }); return true; }
      fetchFieldHtml(itemId, fieldId, apiKey, function(err, html) {
        if (err || !html) { sendResponse({ data: null }); return; }
        sendResponse({ data: getWidgetDataFromHtml(msg.def, html, msg.index || 0) });
      });
      return true;
    }

    if (msg.type === 'UPDATE_WIDGET_DATA') {
      // Use itemId/fieldId stored on def from GET_WIDGETS, fallback to page detection
      var itemId = (msg.def && msg.def.itemId) || detectCurrentItemId();
      var fieldId = msg.def && msg.def.fieldId;
      var apiKey = SSC_API_KEY;
      fetchFieldHtml(itemId, fieldId, apiKey, function(err, html) {
        if (err || !html) { sendResponse({ success: false }); return; }
        var updated = buildUpdatedHtml(msg.def, msg.index || 0, msg.data, html);
        if (!updated) { sendResponse({ success: false }); return; }
        openHtmlEditorAndUpdate(updated, function(ok, errMsg) {
          sendResponse({ success: ok });
        });
      });
      return true;
    }
  }

  // ── scContentIframeId0 frame (has the textarea) ──
  if (isContentEditorFrame()) {

    if (msg.type === 'GET_WIDGETS') {
      var ta = getTextarea();
      if (!ta) { sendResponse({ widgets: [], mode: 'content-editor' }); return true; }
      sendResponse({ widgets: parseWidgetsFromHtml(msg.registry, ta.value), mode: 'content-editor' });
      return true;
    }

    if (msg.type === 'GET_WIDGET_DATA') {
      sendResponse({ data: getWidgetDataFromTextarea(msg.def, msg.index || 0) });
      return true;
    }

    if (msg.type === 'UPDATE_WIDGET_DATA') {
      sendResponse({ success: updateViaTextarea(msg.def, msg.index || 0, msg.data) });
      return true;
    }
  }

  // ── Experience Editor mode ──
  if (msg.type === 'GET_WIDGETS') {
    if (!msg.registry || !msg.registry.widgets) { sendResponse({ widgets: [] }); return true; }
    var found = [];
    msg.registry.widgets.forEach(function(def) {
      document.querySelectorAll('.' + def.class).forEach(function(el, idx) {
        found.push({ widgetClass: def.class, name: def.name, index: idx, mode: 'experience-editor' });
      });
    });
    sendResponse({ widgets: found, mode: 'experience-editor' });
    return true;
  }

  if (msg.type === 'GET_WIDGET_DATA') {
    var root = document.querySelectorAll('.' + msg.def.class)[msg.index || 0];
    if (!root) { sendResponse({ data: null }); return true; }
    var data = {};
    (msg.def.standaloneFields || []).forEach(function(f) {
      var el = root.querySelector(f.selector);
      data[f.key] = el ? (f.attr ? el.getAttribute(f.attr) : el.textContent.trim()) : '';
    });
    if (msg.def.repeat) {
      data.items = [];
      root.querySelectorAll(msg.def.repeat.selector).forEach(function(item, i) {
        var row = { _index: i };
        msg.def.fields.forEach(function(f) {
          if (f.selector) {
            var el = item.querySelector(f.selector);
            row[f.key] = el ? (f.attr ? el.getAttribute(f.attr) : el.textContent.trim()) : '';
          }
        });
        data.items.push(row);
      });
    }
    sendResponse({ data: data });
    return true;
  }

  if (msg.type === 'UPDATE_WIDGET_DATA') {
    var root = document.querySelectorAll('.' + msg.def.class)[msg.index || 0];
    if (!root) { sendResponse({ success: false }); return true; }
    (msg.def.standaloneFields || []).forEach(function(f) {
      if (msg.data[f.key] === undefined) return;
      var el = root.querySelector(f.selector);
      if (!el) return;
      if (f.attr) { el.setAttribute(f.attr, msg.data[f.key]); } else { el.textContent = msg.data[f.key]; }
    });
    if (msg.def.repeat && msg.data.items) {
      var items = root.querySelectorAll(msg.def.repeat.selector);
      msg.data.items.forEach(function(row, i) {
        var item = items[i];
        if (!item) return;
        msg.def.fields.forEach(function(f) {
          if (!f.selector || row[f.key] === undefined) return;
          var el = item.querySelector(f.selector);
          if (el) {
            if (f.attr) { el.setAttribute(f.attr, row[f.key]); } else { el.textContent = row[f.key]; }
            if (f.syncDataAttr) {
              var sv = f.syncNumeric ? String(row[f.key]).replace(/[^0-9.]/g, '') : row[f.key];
              el.setAttribute(f.syncDataAttr, sv);
            }
          }
        });
      });
    }
    document.dispatchEvent(new CustomEvent('__sitecoreBridgeNotify', { detail: { selector: null } }));
    sendResponse({ success: true });
    return true;
  }

  if (msg.type === 'CLONE_ITEM') {
    var root = document.querySelectorAll('.' + msg.def.class)[msg.index || 0];
    if (!root || !msg.def.repeat) { sendResponse({ success: false }); return true; }
    var items = root.querySelectorAll(msg.def.repeat.selector);
    if (!items.length) { sendResponse({ success: false }); return true; }
    var last = items[items.length - 1];
    var clone = last.cloneNode(true);
    msg.def.fields.forEach(function(f) {
      if (f.selector) {
        var el = clone.querySelector(f.selector);
        if (el) { if (f.attr) { el.setAttribute(f.attr, ''); } else { el.textContent = ''; } }
      }
    });
    last.parentNode.insertBefore(clone, last.nextSibling);
    document.dispatchEvent(new CustomEvent('__sitecoreBridgeNotify', { detail: { selector: null } }));
    sendResponse({ success: true });
    return true;
  }

  if (msg.type === 'DELETE_ITEM') {
    var root = document.querySelectorAll('.' + msg.def.class)[msg.widgetIndex || 0];
    if (!root || !msg.def.repeat) { sendResponse({ success: false }); return true; }
    var items = root.querySelectorAll(msg.def.repeat.selector);
    if (items.length <= 1) { sendResponse({ success: false }); return true; }
    var item = items[msg.itemIndex];
    if (!item) { sendResponse({ success: false }); return true; }
    item.parentNode.removeChild(item);
    document.dispatchEvent(new CustomEvent('__sitecoreBridgeNotify', { detail: { selector: null } }));
    sendResponse({ success: true });
    return true;
  }
});

// ─── IMAGE GRID WIDGET ───────────────────────────────────────────────────────

function getImageGridData(def, html) {
  var parser = new DOMParser();
  var doc = parser.parseFromString('<div id="_root">' + html + '</div>', 'text/html');
  var root = doc.querySelector('.' + def.class);
  if (!root) return null;

  // Read current layout from style block
  var styleEl = root.querySelector(def.styleSelector);
  var currentLayout = 'unknown';
  if (styleEl) {
    var styleText = styleEl.textContent;
    Object.keys(def.layouts).forEach(function(key) {
      // Match by checking if the layout's unique CSS is present
      if (styleText.indexOf(def.layouts[key].css.split('{')[1].split('}')[0].trim()) !== -1) {
        currentLayout = key;
      }
    });
  }

  // Read each image item — id, order, hidden
  var items = [];
  root.querySelectorAll(def.itemSelector).forEach(function(el) {
    items.push({
      id:     el.getAttribute(def.itemIdAttr),
      order:  parseInt(el.getAttribute('data-order') || '0', 10),
      hidden: el.getAttribute('data-hidden') === 'true',
      alt:    (el.querySelector('img') || {}).alt || ''
    });
  });

  // Sort by current order
  items.sort(function(a, b) { return a.order - b.order; });

  return { layout: currentLayout, items: items };
}

function buildImageGridHtml(def, data, html) {
  var parser = new DOMParser();
  var doc = parser.parseFromString('<div id="_root">' + html + '</div>', 'text/html');
  var root = doc.querySelector('.' + def.class);
  if (!root) return null;

  // Rewrite the style block
  var styleEl = root.querySelector(def.styleSelector);
  if (styleEl) {
    var visibleCount = data.items.filter(function(i) { return !i.hidden; }).length;
    var css = buildLayoutCss(def, data, visibleCount);
    if (css) styleEl.textContent = css;
  }

  // Update data-order, data-hidden, and CSS order on each item
  data.items.forEach(function(item, i) {
    var el = root.querySelector('[' + def.itemIdAttr + '="' + item.id + '"]');
    if (!el) return;
    el.setAttribute('data-order', i + 1);
    el.setAttribute('data-hidden', item.hidden ? 'true' : 'false');
    el.style.order = i + 1;
  });

  return root.outerHTML;
}
