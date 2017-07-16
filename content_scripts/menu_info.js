
// origUrl attempts to convert a twitter image url into its ":orig" form.
function origUrl(url) {
  if(url === null || url === "") {
    throw new Error("must pass a url");
  }
  var anchor = document.createElement("a");
  anchor.href = url;
  var ndx = anchor.pathname.lastIndexOf(":");
  if(ndx >= 0) {
    anchor.pathname = anchor.pathname.slice(0, ndx) + ":orig";
  } else {
    anchor.pathname += ":orig";
  }
  return anchor.href;
}

document.addEventListener('contextmenu', function(ev) {
  var el = ev.target;
  if(el.tagName == "IMG") {
    if(el.src === "") {
      return;
    }
    // TODO: maybe we should validate it's really a twitter url
    browser.runtime.sendMessage({twitterOrigUrl: origUrl(el.src)});
    return;
  }
  if(el.parentElement && el.parentElement.classList.contains("Gallery-content")) {
    var media = el.parentElement.querySelector(".Gallery-media > .media-image");
    if(media === null) {
      return;
    }
    browser.runtime.sendMessage({twitterOrigUrl: origUrl(media.src)});
    return;
  }

  if(el.parentElement && el.parentElement.classList.contains('player-container')) {
    let media = el.parentElement.querySelector('.player-wrapper > .video-display > video');
    if(media === null) {
      console.log('unexpected null media from element: ', el);
      return;
    }
    browser.runtime.sendMessage({twitterOrigUrl: media.src});
    return;
  }

  // Otherwise it wasn't a twitter url, clear the "open" url
  browser.runtime.sendMessage({twitterOrigUrl: ""});
});
