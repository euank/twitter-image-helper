var lastOrigUrl = null;

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
  if(ev.twitterOrigUrl) {
    lastOrigUrl = ev.twitterOrigUrl;
  }
});

function onCreated(n) {
  if (browser.runtime.lastError) {
    console.log(`twitter-image-helper: error: ${browser.runtime.lastError}`);
  }
}

function onError(err) {
  console.log(`twitter-image-helper: error: ${error}`);
}

browser.contextMenus.create({
  id: "twitter-img",
  title: "twitter image helper",
  documentUrlPatterns: ["*://*.twitter.com/*"],
}, onCreated);

browser.contextMenus.create({
  id: "twitter-img-open",
  title: "Open original",
  parentId: "twitter-img",
}, onCreated);

browser.contextMenus.create({
  id: "twitter-img-copy",
  title: "Copy original url",
  parentId: "twitter-img",
}, onCreated);

var newTabChecked = true;
browser.contextMenus.create({
  type: "checkbox",
  id: "twitter-img-newtab",
  title: "Open in newtab?",
  parentId: "twitter-img",
  checked: newTabChecked,
}, onCreated);

browser.contextMenus.onClicked.addListener(function(info, tab) {
  if(lastOrigUrl === null) {
    console.log(`twitter-image-helper: unexpected context menu event with null url: ${info}`);
    return;
  }
  switch (info.menuItemId) {
    case "twitter-img-open":
      if(newTabChecked) {
        browser.tabs.create({
          "url": lastOrigUrl,
        });
      } else {
        browser.tabs.executeScript({
          code: `document.location = "${lastOrigUrl}";`,
        });
      }
      break;
    case "twitter-img-newtab":
      newTabChecked = !newTabChecked;
      break;
  }
});
