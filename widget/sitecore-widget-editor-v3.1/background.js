// background.js - Sitecore Widget Editor 2 v1.1.0
const REGISTRY_URL = 'https://www.tylervinson.com/widget/widget-registry.json';
const DOWNLOAD_URL = 'https://www.tylervinson.com/widget/';

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

async function checkForUpdates() {
  try {
    const res  = await fetch(REGISTRY_URL + '?cb=' + Date.now());
    if (!res.ok) return;
    const data = await res.json();
    await chrome.storage.local.set({ widgetRegistry: data });
    const remoteVersion = data.version || null;
    // Compare against the last seen registry version, not the extension build version
    chrome.storage.local.get('lastSeenRegistryVersion', function(stored) {
      const lastSeen = stored.lastSeenRegistryVersion || null;
      if (remoteVersion && lastSeen && remoteVersion !== lastSeen) {
        chrome.runtime.sendMessage({
          type: 'UPDATE_AVAILABLE',
          remoteVersion: remoteVersion,
          downloadUrl: DOWNLOAD_URL
        }).catch(() => {});
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#FFBE5F' });
      } else {
        chrome.action.setBadgeText({ text: '' });
      }
    });
  } catch(e) {}
}

chrome.runtime.onInstalled.addListener(async () => {
  try {
    const url  = chrome.runtime.getURL('widget-registry.json');
    const res  = await fetch(url);
    const data = await res.json();
    await chrome.storage.local.set({ widgetRegistry: data });
  } catch(e) {}
  checkForUpdates();
});

chrome.runtime.onStartup.addListener(checkForUpdates);
setInterval(checkForUpdates, 4 * 60 * 60 * 1000);

function getActiveTab(cb) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    cb(tabs && tabs[0] ? tabs[0] : null);
  });
}

// GET_WIDGETS — send to top frame (frame 0) first via SSC API
// If nothing found, fall back to all-frames scan for Experience Editor
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.type !== 'GET_WIDGETS_ALL_FRAMES') return;
  getActiveTab(function(tab) {
    if (!tab) { sendResponse({ widgets: [], mode: 'unknown' }); return; }
    // Try top frame first
    chrome.tabs.sendMessage(tab.id, { type: 'GET_WIDGETS', registry: msg.registry }, { frameId: 0 }, function(res) {
      if (!chrome.runtime.lastError && res && res.widgets && res.widgets.length > 0) {
        sendResponse(res);
        return;
      }
      // Fallback: Experience Editor — scan all frames, deduplicate
      chrome.webNavigation.getAllFrames({ tabId: tab.id }, function(frames) {
        if (!frames || !frames.length) { sendResponse({ widgets: [], mode: 'experience-editor' }); return; }
        var allWidgets = [];
        var mode = 'experience-editor';
        var pending = frames.length;
        frames.forEach(function(frame) {
          chrome.tabs.sendMessage(tab.id, { type: 'GET_WIDGETS', registry: msg.registry }, { frameId: frame.frameId }, function(r) {
            if (!chrome.runtime.lastError && r && r.widgets) {
              allWidgets = allWidgets.concat(r.widgets);
              if (r.mode === 'content-editor') mode = 'content-editor';
            }
            if (--pending === 0) {
              var seen = {};
              sendResponse({
                mode: mode,
                widgets: allWidgets.filter(function(w) {
                  var k = w.widgetClass + '_' + w.index;
                  return seen[k] ? false : (seen[k] = true);
                })
              });
            }
          });
        });
      });
    });
  });
  return true;
});

// FRAME_MSG — all content editor messages go directly to top frame (frame 0)
// Top frame handles everything via SSC API — no frame scanning needed
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.type !== 'FRAME_MSG') return;
  getActiveTab(function(tab) {
    if (!tab) { sendResponse(null); return; }
    chrome.tabs.sendMessage(tab.id, msg.msg, { frameId: 0 }, function(res) {
      if (!chrome.runtime.lastError && res !== undefined) {
        sendResponse(res);
      } else {
        // Fallback to default frame
        chrome.tabs.sendMessage(tab.id, msg.msg, function(r) {
          sendResponse(r || null);
        });
      }
    });
  });
  return true;
});

// Forward CONTENT_ITEM_CHANGED from content script to sidepanel
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.type === 'CONTENT_ITEM_CHANGED') {
    chrome.runtime.sendMessage(msg).catch(function() {});
  }
});
