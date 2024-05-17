const targetBrowser = (() => {
  if (typeof chrome !== "undefined" && typeof browser !== "undefined") {
    return 'firefox';
  } else if (typeof chrome !== "undefined") {
    return 'chrome';
  } else {
    return 'unknown';
  }
})()

window.browser = (() => {
  if (typeof browser !== "undefined") {
    return browser;
  } else if (typeof chrome !== "undefined") {
    return chrome;
  } else {
    throw new Error("no webextension support in browser");
  }
})();

var lastOrigUrl = null;
var fileName = null;

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
browser.runtime.onMessage.addListener(function(ev) {
  if(ev.hasOwnProperty('twitterOrigUrl')) {
    lastOrigUrl = ev.twitterOrigUrl;
  }

  if(ev.hasOwnProperty('fileName')) {
    fileName = ev.fileName;
  }
});

function onCreated(n) {
  if (browser.runtime.lastError) {
    console.log('twitter-image-helper: error:', browser.runtime.lastError);
  }
}

function onError(err) {
  console.log('twitter-image-helper: error:', err);
}

browser.contextMenus.create({
  id: "twitter-img",
  title: "Twitter Image Helper",
  documentUrlPatterns: [
    "*://*.twitter.com/*",
    "*://*.x.com/*",
  ],
  contexts: ["all"],
}, onCreated);

browser.contextMenus.create({
  id: "twitter-img-open",
  title: "Open Original (tab)",
  parentId: "twitter-img",
  contexts: ["all"],
}, onCreated);

browser.contextMenus.create({
  id: "twitter-img-open-inplace",
  title: "Open Original",
  parentId: "twitter-img",
  contexts: ["all"],
}, onCreated);

browser.contextMenus.create({
  id: "twitter-img-download",
  title: "Download Original",
  parentId: "twitter-img",
  contexts: ["all"],
}, onCreated);


browser.contextMenus.onClicked.addListener(function(info, tab) {
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
      browser.tabs.create({
        url: lastOrigUrl,
        active: false,
        openerTabId: tab.id,
      });
      break;
    case "twitter-img-open-inplace":
      browser.tabs.executeScript({
        code: `document.location = "${lastOrigUrl}";`,
      });
      break;
    case "twitter-img-download":
      var downloading = startDownload({
        url: lastOrigUrl,
        filename: fileName,
      });
      downloading.then(() => {}, onError);
      break;
  }
});

// startDownload encodes the difference between the chrome and firefox download
// apis; it does the minimal amount of work to start a download since that's
// the only bit that differs between the two apis.
// Note: the mozilla/webextension-polyfill module could also be used, but it's rather heavy.
function startDownload(url) {
  const cleanedFilename = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const downloadObj = {
    url: lastOrigUrl,
    filename: cleanedFilename,
  };
  switch (targetBrowser) {
    case "chrome":
      return new Promise(function(resolve, reject) {
        chrome.downloads.download(downloadObj, function(id) {
          if (id) {
            resolve(id);
          } else {
            reject(browser.runtime.lastError);
          }
        });
      });
    default:
      const downloading = browser.downloads.download(downloadObj);
      return downloading;
  }
}
