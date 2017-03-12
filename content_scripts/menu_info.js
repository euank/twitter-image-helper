function origUrl(url) {
  var ndx = url.lastIndexOf(":");
  if(ndx >= 0) {
    return url.slice(0, ndx) + ":orig";
  }
  return url + ":orig";
}

document.addEventListener('contextmenu', function(ev) {
  var el = ev.target;
  if(el.tagName == "IMG") {
    console.log("doing it for " + el.src);
    browser.runtime.sendMessage({twitterOrigUrl: origUrl(el.src)});
    return;
  }
  if(el.parentElement.classList.contains("Gallery-content")) {
    var media = el.parentElement.querySelector(".Gallery-media > .media-image");
    browser.runtime.sendMessage({twitterOrigUrl: origUrl(media.src)});
    return;
  }
});
