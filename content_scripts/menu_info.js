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

document.addEventListener('contextmenu', function(ev) {
  let el = ev.target;
  if(el.tagName == "IMG") {
    if(el.src === "") {
      return;
    }
    // TODO: maybe we should validate it's really a twitter url
   
    let fileName = getFileName(el.src);
    browser.runtime.sendMessage({twitterOrigUrl: origUrl(el.src), fileName: fileName});
    return;
  }
  if(el.parentElement && el.parentElement.classList.contains("Gallery-content")) {
    let media = el.parentElement.querySelector(".Gallery-media > .media-image");
    if(media === null) {
      return;
    }
    let fileName = getFileName(media.src);
    browser.runtime.sendMessage({twitterOrigUrl: origUrl(media.src), fileName: fileName});
    return;
  }

  // Twitter has reworked their web UI to be really bad for the purpose of
  // finding media. Oh well, let's do an icky hack.
  // Assume the user did right clock on a tweet with a valid video, so just
  // find the nearest video and use it.
  let vid = findClosestVideo(el);
  if(vid) {
    browser.runtime.sendMessage({twitterOrigUrl: vid, fileName: vid});
    return;
  }

  // Otherwise it wasn't a twitter url, clear the "open" url
  browser.runtime.sendMessage({twitterOrigUrl: "", fileName: ""});
});

// Just walk up the dom tree looking for all videos
function findClosestVideo(el) {
  while (el) {
    let vid = findClosestVideoHelper(el);
    if (vid) {
      return vid;
    }
    el = el.parentElement;
  }
  return null;
}

function findClosestVideoHelper(el) {
  let vid = el.querySelector('video');
  if (vid && vid.src && /mp4$/.test(vid.src)) {
    return vid.src;
  }
  return null;
}
