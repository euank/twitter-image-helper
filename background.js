var lastOrigUrl = null;

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
  title: "Twitter: open original",
  documentUrlPatterns: ["*://*.twitter.com/*"],
}, onCreated);

browser.contextMenus.onClicked.addListener(function(info, tab) {
  switch (info.menuItemId) {
    case "twitter-img":
      browser.tabs.create({
        "url": lastOrigUrl,
      });
      break;
  }
});
