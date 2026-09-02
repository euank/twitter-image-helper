const isFirefox = chrome.runtime.getURL("").startsWith("moz-extension://");
const browserApi = isFirefox ? browser : chrome;
const contextMenuStateKey = "contextMenuState";
let currentContextMenuState = null;

// The content-script -> background communication is used because it's
// inconvenient to access the page dom here and, furthermore, the 'contextMenu
// -> onClicked' event has no information about the element the right click
// menu is for.
//
// We listen for the click that probably opened this context menu from the
// browser-side of things and then send the message over.
//
// I haven't found a reason why this might end up being stale yet, though it's
// possible there are cases where it will be.
browserApi.runtime.onMessage.addListener(function(ev) {
  if(ev.hasOwnProperty('twitterOrigUrl') && ev.hasOwnProperty('fileName')) {
    currentContextMenuState = {
      lastOrigUrl: ev.twitterOrigUrl,
      fileName: ev.fileName,
    };
    return setContextMenuState(currentContextMenuState).catch(onError);
  }
});

function onCreated(n) {
  if (browserApi.runtime.lastError) {
    console.log('twitter-image-helper: error:', browserApi.runtime.lastError);
  }
}

function onError(err) {
  console.log('twitter-image-helper: error:', err);
}

browserApi.runtime.onInstalled.addListener(function() {
  browserApi.contextMenus.create({
    id: "twitter-img",
    title: "Twitter Image Helper",
    documentUrlPatterns: [
      "*://*.twitter.com/*",
      "*://*.x.com/*",
    ],
    contexts: ["all"],
  }, onCreated);

  browserApi.contextMenus.create({
    id: "twitter-img-open",
    title: "Open Original (tab)",
    parentId: "twitter-img",
    contexts: ["all"],
  }, onCreated);

  browserApi.contextMenus.create({
    id: "twitter-img-open-inplace",
    title: "Open Original",
    parentId: "twitter-img",
    contexts: ["all"],
  }, onCreated);

  browserApi.contextMenus.create({
    id: "twitter-img-download",
    title: "Download Original",
    parentId: "twitter-img",
    contexts: ["all"],
  }, onCreated);
});


browserApi.contextMenus.onClicked.addListener(function(info, tab) {
  if (currentContextMenuState !== null) {
    return Promise.resolve(handleContextMenuClick(info, tab, currentContextMenuState)).catch(onError);
  }
  return getContextMenuState().then(function(state) {
    return handleContextMenuClick(info, tab, state);
  }).catch(onError);
});

function handleContextMenuClick(info, tab, state) {
  const lastOrigUrl = state.lastOrigUrl;
  const fileName = state.fileName;
  if(lastOrigUrl === "" || fileName === "") {
    // Indicates the right click menu has been 'cleared' by clicking on a non-recognized thing
    return;
  }
  if(lastOrigUrl === null || fileName === null) {
    console.log(`twitter-image-helper: unexpected context menu event with null url: ${info}`);
    return;
  }
  switch (info.menuItemId) {
    case "twitter-img-open":
      return browserApi.tabs.create({
        url: lastOrigUrl,
        active: false,
        openerTabId: tab.id,
      });
    case "twitter-img-open-inplace":
      return executeNavigateScript(tab.id, lastOrigUrl);
    case "twitter-img-download":
      return startDownload(lastOrigUrl, fileName);
  }
}

// startDownload encodes the difference between the chrome and firefox download
// apis; it does the minimal amount of work to start a download since that's
// the only bit that differs between the two apis.
// Note: the mozilla/webextension-polyfill module could also be used, but it's rather heavy.
function startDownload(url, fileName) {
  const cleanedFilename = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const downloadObj = {
    url: url,
    filename: cleanedFilename,
  };
  if (!isFirefox) {
    return new Promise(function(resolve, reject) {
      chrome.downloads.download(downloadObj, function(id) {
        if (id) {
          resolve(id);
        } else {
          reject(chrome.runtime.lastError);
        }
      });
    });
  }
  return browserApi.downloads.download(downloadObj);
}

function executeNavigateScript(tabId, url) {
  function navigate(targetUrl) {
    document.location = targetUrl;
  }

  const details = {
    target: {tabId: tabId},
    func: navigate,
    args: [url],
  };
  if (isFirefox) {
    return browserApi.scripting.executeScript(details);
  }
  return new Promise(function(resolve, reject) {
    chrome.scripting.executeScript(details, function(result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(result);
    });
  });
}

function setContextMenuState(state) {
  const value = {};
  value[contextMenuStateKey] = state;
  if (isFirefox) {
    return browserApi.storage.session.set(value);
  }
  return new Promise(function(resolve, reject) {
    chrome.storage.session.set(value, function() {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve();
    });
  });
}

function getContextMenuState() {
  const emptyState = {lastOrigUrl: null, fileName: null};
  if (isFirefox) {
    return browserApi.storage.session.get(contextMenuStateKey).then(function(value) {
      return value[contextMenuStateKey] || emptyState;
    });
  }
  return new Promise(function(resolve, reject) {
    chrome.storage.session.get(contextMenuStateKey, function(value) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(value[contextMenuStateKey] || emptyState);
    });
  });
}
