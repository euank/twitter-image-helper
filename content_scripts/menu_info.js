window.browser = (() => {
  if (typeof browser !== "undefined") {
    return browser;
  } else if (typeof chrome !== "undefined") {
    return chrome;
  } else {
    throw new Error("no webextension support in browser");
  }
})();

// origUrl attempts to convert a twitter image url into its ":orig" form.
function origUrl(url) {
  if(url === null || url === "") {
    throw new Error("must pass a url");
  }
  const u = new URL(url, window.location.href);
  if (u.searchParams.get("format") && u.searchParams.get("name")) {
    // mobile twitter uses urls like:
    // https://pbs.twimg.com/media/{id}?format=jpg&name=small
    // Replacing 'name=small' with 'name=orig' seems to be all that's needed
    if (u.searchParams.get("format") === "webp") {
      // Logged-out X uses WebP previews regardless of the original format.
      // The background script resolves the real format when the menu is used.
      u.searchParams.set("name", "4096x4096");
      return u.href;
    }
    u.searchParams.set("name", "orig");
    return u.href;
  }
  let ndx = u.pathname.lastIndexOf(":");
  if(ndx >= 0) {
    u.pathname = u.pathname.slice(0, ndx) + ":orig";
  } else {
    u.pathname += ":orig";
  }
  return u.href;
}

function getFileName(url) {
  if(url === null || url === "") {
    throw new Error("must pass a url");
  }
  const u = new URL(url, window.location.href);
  let filename = u.pathname;
  let ndx = filename.lastIndexOf("/");
  if (ndx >= 0) {
    filename = filename.slice(ndx + 1);
  }
  ndx = filename.lastIndexOf(":");
  if(ndx >= 0) {
    filename = filename.slice(0, ndx);
  }
  if (u.searchParams.get("format")) {
    // mobile twitter uses urls like:
    // https://pbs.twimg.com/media/{id}?format=jpg&name=small
    filename += "." + u.searchParams.get("format");
  }
  return filename;
}

function clearMenuInfo() {
  browser.runtime.sendMessage({twitterOrigUrl: "", fileName: ""});
}

function findContextImage(ev) {
  if(ev.target.tagName == "IMG") {
    return ev.target;
  }

  // Logged-out X places a full-size link over media images and disables pointer
  // events on the image itself. Find the largest rendered image beneath the
  // click using its layout bounds instead of hit testing.
  let contextImage = null;
  let contextImageArea = 0;
  for (const image of document.images) {
    const rect = image.getBoundingClientRect();
    const imageArea = rect.width * rect.height;
    if(imageArea > contextImageArea &&
        ev.clientX >= rect.left && ev.clientX <= rect.right &&
        ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
      contextImage = image;
      contextImageArea = imageArea;
    }
  }
  return contextImage;
}

document.addEventListener('contextmenu', function(ev) {
  let media = findContextImage(ev);
  if(media !== null && media.src !== "") {
    // TODO: maybe we should validate it's really a twitter url

    const originalUrl = origUrl(media.src);
    let fileName = getFileName(originalUrl);
    browser.runtime.sendMessage({twitterOrigUrl: originalUrl, fileName: fileName});
    return;
  }

  let el = ev.target;
  if(el.parentElement && el.parentElement.classList.contains("Gallery-content")) {
    media = el.parentElement.querySelector(".Gallery-media > .media-image");
    if(media === null) {
      clearMenuInfo();
      return;
    }
    let fileName = getFileName(media.src);
    browser.runtime.sendMessage({twitterOrigUrl: origUrl(media.src), fileName: fileName});
    return;
  }

  // Otherwise it wasn't a twitter url, clear the "open" url
  clearMenuInfo();
});
