
// origUrl attempts to convert a twitter image url into its ":orig" form.
function origUrl(url) {
  if(url === null || url === "") {
    throw new Error("must pass a url");
  }
  var ndx = url.lastIndexOf(":");
  if(ndx >= 0) {
    return url.slice(0, ndx) + ":orig";
  }
  return url + ":orig";
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
});
