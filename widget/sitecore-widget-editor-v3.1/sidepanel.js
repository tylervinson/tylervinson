// sidepanel.js - Sitecore Widget Editor v3.1.0
var REGISTRY_URL='https://www.tylervinson.com/widget/widget-registry.json';
var _registry=null,currentTab=null,foundWidgets=[],activeWidget=null;

function fetchRegistry(cb){fetch(REGISTRY_URL+'?cb='+Date.now()).then(function(r){return r.json();}).then(function(d){
  _registry=d;
  // Save this as the last seen version so the badge only shows on future changes
  if (d.version) {
    chrome.storage.local.set({ lastSeenRegistryVersion: d.version });
    chrome.action.setBadgeText({ text: '' });
  }
  cb(null);
}).catch(function(e){cb(e);});}

function getWidgetDef(cls){if(!_registry||!_registry.widgets)return null;for(var i=0;i<_registry.widgets.length;i++){if(_registry.widgets[i].class===cls)return _registry.widgets[i];}return null;}

document.addEventListener('DOMContentLoaded',function(){document.getElementById('widgetSelect').addEventListener('change', function() {
    // Remove the placeholder prompt once user picks something
    var prompt = this.querySelector('option[disabled]');
    if (prompt) prompt.remove();
    loadWidget(foundWidgets[parseInt(this.value, 10)]);
  });chrome.tabs.query({active:true,currentWindow:true},function(tabs){if(!tabs[0])return;currentTab=tabs[0];try{var u=new URL(tabs[0].url);document.getElementById('pageUrl').textContent=u.hostname+u.pathname.slice(0,50);}catch(e){}setStateMsg('Loading registry...');fetchRegistry(function(err){if(err||!_registry){setStateMsg('Could not load widget registry.');return;}scanPage();});

  document.getElementById('refreshBtn').addEventListener('click', function() {
    var btn = document.getElementById('refreshBtn');
    var prevWidget = activeWidget;
    btn.classList.add('spinning');
    setStatus('Refreshing registry...');
    activeWidget = null;
    fetchRegistry(function(err) {
      btn.classList.remove('spinning');
      if (err || !_registry) {
        activeWidget = prevWidget;
        setStatus('Registry fetch failed', 'err');
        return;
      }
      activeWidget = prevWidget;
      scanPage(!!prevWidget);
      setStatus(prevWidget ? 'Registry refreshed ✓' : 'Registry refreshed ✓', 'ok');
      setTimeout(function() {
        setStatus(prevWidget ? 'Editing: ' + prevWidget.name : 'Ready');
      }, 2000);
    });
  });});});
function scanPage(restoreActive, _attempt) {
  var attempt = _attempt || 1;
  chrome.runtime.sendMessage({ type: 'GET_WIDGETS_ALL_FRAMES', registry: _registry }, function(res) {
    if (chrome.runtime.lastError) { setStateMsg('No editable widgets found on this page.'); return; }
    var widgets = res ? res.widgets : [];
    if (widgets.length === 0 && attempt < 6) {
      // Retry — iframe may not be ready yet
      setTimeout(function() { scanPage(restoreActive, attempt + 1); }, 600);
      if (attempt === 1) setStateMsg('Scanning' + '...');
      return;
    }
    handleWidgets(widgets, restoreActive, res ? res.mode : null);
  });
}

function handleWidgets(widgets, restoreActive, mode) {
  var mb=document.getElementById('modeBadge');if(mb){var m=mode||'experience-editor';mb.textContent=m==='content-editor'?'Content Editor':'Experience Editor';mb.className='mode-badge '+(m==='content-editor'?'mode-ce':'mode-ee');}
  foundWidgets = widgets || [];
  var select = document.getElementById('widgetSelect');
  select.innerHTML = '';

  if (foundWidgets.length === 0) {
    document.getElementById('picker').style.display = 'none';
    setStateMsg('No registered widgets found on this page.');
    setStatus('No widgets detected');
    return;
  }

  // In Content Editor there's only ever one widget per component — skip the picker
  if (mode === 'content-editor' || foundWidgets.length === 1) {
    document.getElementById('picker').style.display = 'none';
    loadWidget(foundWidgets[0]);
    return;
  }

  // Experience Editor — multiple widgets possible, show picker
  var prompt = document.createElement('option');
  prompt.value = '';
  prompt.textContent = 'Select a widget…';
  prompt.disabled = true;
  select.appendChild(prompt);

  foundWidgets.forEach(function(w, i) {
    var dupes = foundWidgets.filter(function(x) { return x.widgetClass === w.widgetClass; }).length > 1;
    var opt = document.createElement('option');
    opt.value = i;
    opt.textContent = dupes ? (w.name + ' #' + (w.index + 1)) : w.name;
    select.appendChild(opt);
  });
  document.getElementById('picker').style.display = 'block';

  // Restore previously active widget (after add/delete/apply)
  if (restoreActive && activeWidget) {
    var match = -1;
    for (var i = 0; i < foundWidgets.length; i++) {
      if (foundWidgets[i].widgetClass === activeWidget.widgetClass && foundWidgets[i].index === activeWidget.index) {
        match = i; break;
      }
    }
    if (match !== -1) { select.value = match; loadWidget(foundWidgets[match]); return; }
  }

  prompt.selected = true;
  setStateMsg('Select a widget above to begin editing.');
  setStatus('Ready');
}

function loadWidget(widgetDef){activeWidget=widgetDef;var def=getWidgetDef(widgetDef.widgetClass);if(!def){setStateMsg('Widget definition not found in registry.');return;}setStateMsg('Loading...');var defWithIds=Object.assign({},def,{itemId:widgetDef.itemId,fieldId:widgetDef.fieldId});chrome.runtime.sendMessage({type:'FRAME_MSG',msg:{type:'GET_WIDGET_DATA',def:defWithIds,index:widgetDef.index,registry:_registry}},function(res){if(chrome.runtime.lastError||!res||!res.data){setStateMsg('Could not read widget data.');return;}if (defWithIds.type === 'image-grid') { renderImageGrid(defWithIds, res.data); } else { renderForm(defWithIds,res.data);setStatus('Editing: '+widgetDef.name); }});}

function renderImageGrid(def, data) {
  var c = document.getElementById('content');
  c.innerHTML = '';

  // Count visible (non-hidden) images
  var visibleCount = data.items.filter(function(i) { return !i.hidden; }).length;

  // Layout picker — only show layouts compatible with visible image count
  var section = document.createElement('div');
  section.className = 'section-header';
  section.textContent = 'Layout';
  c.appendChild(section);

  var compatibleLayouts = Object.keys(def.layouts).filter(function(key) {
    var counts = def.layouts[key].imageCounts;
    return counts === null || counts === undefined || counts.indexOf(visibleCount) !== -1;
  });

  if (compatibleLayouts.length === 0) {
    var msg = document.createElement('p');
    msg.style.cssText = 'font-size:13px;color:#999;margin-top:8px;';
    msg.textContent = 'No layouts available for ' + visibleCount + ' visible images. Show or hide images to unlock layouts.';
    c.appendChild(msg);
  }

  var sel = document.createElement('select');
  sel.id = 'ig_layout';
  sel.className = 'ig-layout-select';
  compatibleLayouts.forEach(function(key) {
    var opt = document.createElement('option');
    opt.value = key;
    opt.textContent = def.layouts[key].label;
    if (key === data.layout) opt.selected = true;
    sel.appendChild(opt);
  });
  if (compatibleLayouts.length > 0) c.appendChild(sel);

  // Image order + visibility
  var section2 = document.createElement('div');
  section2.className = 'section-header';
  section2.style.marginTop = '20px';
  section2.textContent = 'Images — drag to reorder';
  c.appendChild(section2);

  var list = document.createElement('div');
  list.id = 'ig-list';
  list.className = 'ig-list';
  c.appendChild(list);

  data.items.forEach(function(item, i) {
    var row = document.createElement('div');
    row.className = 'ig-row' + (item.hidden ? ' ig-hidden' : '');
    row.setAttribute('draggable', 'true');
    row.dataset.id = item.id;

    var handle = document.createElement('span');
    handle.className = 'ig-handle';
    handle.textContent = '⠿';

    var label = document.createElement('span');
    label.className = 'ig-label';
    label.textContent = item.alt || item.id;

    var toggle = document.createElement('button');
    toggle.className = 'ig-toggle';
    toggle.textContent = item.hidden ? 'Show' : 'Hide';
    toggle.onclick = function() {
      row.classList.toggle('ig-hidden');
      toggle.textContent = row.classList.contains('ig-hidden') ? 'Show' : 'Hide';
      // Recount visible images and update layout picker options
      var visible = Array.from(list.querySelectorAll('.ig-row')).filter(function(r) {
        return !r.classList.contains('ig-hidden');
      }).length;
      var layoutSel = document.getElementById('ig_layout');
      if (layoutSel) {
        var currentVal = layoutSel.value;
        layoutSel.innerHTML = '';
        Object.keys(def.layouts).forEach(function(key) {
          var counts = def.layouts[key].imageCounts;
          if (counts === null || counts === undefined || counts.indexOf(visible) !== -1) {
            var opt = document.createElement('option');
            opt.value = key;
            opt.textContent = def.layouts[key].label;
            if (key === currentVal) opt.selected = true;
            layoutSel.appendChild(opt);
          }
        });
      }
    };

    row.appendChild(handle);
    row.appendChild(label);
    row.appendChild(toggle);
    list.appendChild(row);
  });

  // Drag to reorder
  var dragSrc = null;
  list.querySelectorAll('.ig-row').forEach(function(row) {
    row.addEventListener('dragstart', function() { dragSrc = this; this.style.opacity = '0.4'; });
    row.addEventListener('dragend', function() { this.style.opacity = '1'; });
    row.addEventListener('dragover', function(e) { e.preventDefault(); });
    row.addEventListener('drop', function(e) {
      e.preventDefault();
      if (dragSrc !== this) {
        var rows = Array.from(list.querySelectorAll('.ig-row'));
        var srcIdx = rows.indexOf(dragSrc);
        var tgtIdx = rows.indexOf(this);
        if (srcIdx < tgtIdx) list.insertBefore(dragSrc, this.nextSibling);
        else list.insertBefore(dragSrc, this);
      }
    });
  });

  // Apply button
  var applyBtn = document.createElement('button');
  applyBtn.id = 'applyBtn';
  applyBtn.className = 'apply-btn';
  applyBtn.textContent = 'Apply Changes';
  applyBtn.onclick = function() { applyImageGrid(def); };
  c.appendChild(applyBtn);

  setStatus('Editing: ' + def.name);
}

function applyImageGrid(def) {
  var layout = document.getElementById('ig_layout').value;
  var items = [];
  document.querySelectorAll('#ig-list .ig-row').forEach(function(row) {
    items.push({
      id: row.dataset.id,
      hidden: row.classList.contains('ig-hidden'),
      order: 0
    });
  });
  items.forEach(function(item, i) { item.order = i + 1; });

  var btn = document.getElementById('applyBtn');
  btn.textContent = 'Applying...';
  btn.disabled = true;

  chrome.runtime.sendMessage({
    type: 'FRAME_MSG',
    msg: {
      type: 'UPDATE_WIDGET_DATA',
      def: Object.assign({}, def, { itemId: activeWidget.itemId, fieldId: activeWidget.fieldId }),
      index: activeWidget.index || 0,
      data: { layout: layout, items: items },
      registry: _registry
    }
  }, function(res) {
    btn.textContent = 'Apply Changes';
    btn.disabled = false;
    if (res && res.success) {
      setStatus('Saved ✓', 'ok');
      setTimeout(function() { setStatus('Editing: ' + def.name); }, 2000);
    } else {
      setStatus('Apply failed', 'err');
    }
  });
}

function renderForm(def, data) {
  var c = document.getElementById('content');
  c.innerHTML = '';
  if (def.standaloneFields && def.standaloneFields.length > 0) {
    var h = document.createElement('div'); h.className = 'section-header'; h.textContent = 'General'; c.appendChild(h);
    def.standaloneFields.forEach(function(field) { c.appendChild(makeField(field.label, 'sa_' + field.key, data[field.key] || '', field.type)); });
  }
  if (def.repeat && data.items) {
    var sh = document.createElement('div'); sh.className = 'section-header'; sh.textContent = def.repeat.groupLabel + 's'; c.appendChild(sh);
    data.items.forEach(function(item, i) {
      var glf = def.repeat.groupLabelField;
      var title = (glf && item[glf]) ? (def.repeat.groupLabel + ' ' + (i+1) + ' — ' + item[glf]) : (def.repeat.groupLabel + ' ' + (i+1));
      var grp = document.createElement('div'); grp.className = 'card-group';
      var gh = document.createElement('div'); gh.className = 'card-group-header'; gh.textContent = title; gh.id = 'ghdr_' + i; grp.appendChild(gh);
      var body = document.createElement('div'); body.className = 'card-group-body';
      var btnF  = def.fields.filter(function(f) { return  f.selector; });
      var gridF = def.fields.filter(function(f) { return !f.selector && f.gridSelector; });
      btnF.forEach(function(f) {
        var fe = makeField(f.label, 'it_' + i + '_' + f.key, item[f.key] || '', f.type || 'text');
        if (glf && f.key === glf) {
          fe.querySelector('input,textarea').addEventListener('input', (function(idx) { return function(e) {
            var el = document.getElementById('ghdr_' + idx);
            if (el) el.textContent = e.target.value ? (def.repeat.groupLabel + ' ' + (idx+1) + ' — ' + e.target.value) : (def.repeat.groupLabel + ' ' + (idx+1));
          }; })(i));
        }
        body.appendChild(fe);
      });
      if (gridF.length > 0) {
        var sub = document.createElement('div'); sub.className = 'sub-header'; sub.textContent = 'Comparison Table'; body.appendChild(sub);
        gridF.forEach(function(f) { body.appendChild(makeField(f.label, 'it_' + i + '_' + f.key, item[f.key] || '', f.type || 'text')); });
      }
      // Delete button (won't show if only 1 item)
      var delBtn = document.createElement('button');
      delBtn.className = 'item-delete-btn';
      delBtn.textContent = 'Delete';
      delBtn.dataset.itemIndex = i;
      delBtn.addEventListener('click', (function(idx) { return function() { deleteItem(idx); }; })(i));
      body.appendChild(delBtn);

      grp.appendChild(body); c.appendChild(grp);
    });

    // Add item button
    var addBtn = document.createElement('button');
    addBtn.id = 'addItemBtn';
    addBtn.className = 'add-item-btn';
    addBtn.textContent = '+ Add ' + def.repeat.groupLabel;
    addBtn.addEventListener('click', addItem);
    c.appendChild(addBtn);
  }
  document.getElementById('apply-bar').style.display = 'block';
  document.getElementById('applyBtn').onclick = applyChanges;
}

function applyChanges() {
  if (!activeWidget) return;
  var def = getWidgetDef(activeWidget.widgetClass);
  if (!def) return;
  setStatus('Applying...');
  var data = collectFormData(def);
  chrome.runtime.sendMessage({ type: 'FRAME_MSG', msg: { type: 'UPDATE_WIDGET_DATA', def: def, index: activeWidget.index, data: data, registry: _registry } }, function(res) {
    if (chrome.runtime.lastError || !res || !res.success) { setStatus('Error applying changes', 'err'); return; }
    var isCE = activeWidget && activeWidget.mode === 'content-editor';
    setStatus(isCE ? 'Saved to Sitecore ✓' : 'Changes applied ✓', 'ok');
    setTimeout(function() { setStatus('Editing: ' + activeWidget.name); }, 2500);
  });
}

function collectFormData(def) {
  var data = {};
  (def.standaloneFields || []).forEach(function(f) { data[f.key] = val('sa_' + f.key); });
  if (def.repeat) {
    data.items = [];
    var i = 0;
    while (document.getElementById('ghdr_' + i) !== null) {
      var row = {};
      def.fields.forEach(function(f) { row[f.key] = val('it_' + i + '_' + f.key); });
      data.items.push(row);
      i++;
    }
  }
  return data;
}

function addItem() {
  if (!activeWidget) return;
  var def = getWidgetDef(activeWidget.widgetClass);
  if (!def || !def.repeat) return;
  chrome.runtime.sendMessage({ type: 'FRAME_MSG', msg: {
    type: 'CLONE_ITEM',
    def: def,
    index: activeWidget.index
  }}, function(res) {
    if (chrome.runtime.lastError || !res || !res.success) { setStatus('Could not add item', 'err'); return; }
    scanPage(true);
  });
}

function deleteItem(itemIndex) {
  if (!activeWidget) return;
  var def = getWidgetDef(activeWidget.widgetClass);
  if (!def || !def.repeat) return;
  chrome.runtime.sendMessage({ type: 'FRAME_MSG', msg: {
    type: 'DELETE_ITEM',
    def: def,
    widgetIndex: activeWidget.index,
    itemIndex: itemIndex
  }}, function(res) {
    if (chrome.runtime.lastError || !res || !res.success) { setStatus('Could not delete item', 'err'); return; }
    scanPage(true);
  });
}


function makeField(label, id, value, type) {
  var row = document.createElement('div'); row.className = 'field-row';
  var lbl = document.createElement('label'); lbl.setAttribute('for', id); lbl.textContent = label; row.appendChild(lbl);
  var inp = (type === 'textarea') ? document.createElement('textarea') : document.createElement('input');
  if (inp.tagName === 'INPUT') inp.type = 'text';
  inp.id = id; inp.value = value || ''; row.appendChild(inp);
  return row;
}

function val(id) { var el = document.getElementById(id); return el ? el.value : ''; }
function setStateMsg(msg) { document.getElementById('content').innerHTML = '<div class="state-msg">' + msg + '</div>'; document.getElementById('apply-bar').style.display = 'none'; }
function setStatus(msg, cls) { var el = document.getElementById('status'); el.textContent = msg; el.className = cls || ''; }

chrome.runtime.onMessage.addListener(function(message) {
  if (message.type === 'CONTENT_ITEM_CHANGED') {
    // User navigated to a different item in the tree — reset and rescan
    activeWidget = null;
    setStateMsg('Item changed — rescanning...');
    setTimeout(function() { scanPage(false); }, 800);
  }
  if (message.type === 'UPDATE_AVAILABLE') {
    var b = document.getElementById('updateBanner');
    b.style.display = 'block';
    b.innerHTML = '&#9888; New version available (v' + message.remoteVersion + '). <a href="' + message.downloadUrl + '" target="_blank">Download update &rarr;</a>';
  }
  if (message.type === 'DOM_CHANGED' && currentTab && activeWidget) { scanPage(true); }
});
