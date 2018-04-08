
// origUrl attempts to convert a twitter image url into its ":orig" form.
function origUrl(url) {
  if(url === null || url === "") {
    throw new Error("must pass a url");
  }
  let anchor = document.createElement("a");
  anchor.href = url;
  let ndx = anchor.pathname.lastIndexOf(":");
  if(ndx >= 0) {
    anchor.pathname = anchor.pathname.slice(0, ndx) + ":orig";
  } else {
    anchor.pathname += ":orig";
  }
  return anchor.href;
}

document.addEventListener('contextmenu', function(ev) {
  let el = ev.target;
  if(el.tagName == "IMG") {
    if(el.src === "") {
      return;
    }
    // TODO: maybe we should validate it's really a twitter url
    browser.runtime.sendMessage({twitterOrigUrl: origUrl(el.src)});
    return;
  }
  if(el.parentElement && el.parentElement.classList.contains("Gallery-content")) {
    let media = el.parentElement.querySelector(".Gallery-media > .media-image");
    if(media === null) {
      return;
    }
    browser.runtime.sendMessage({twitterOrigUrl: origUrl(media.src)});
    return;
  }

  // Allow right clicks on tweet-body for videos; you can't right click on
  // videos in current twitter.
  let tweetParent = el.closest('.permalink-tweet-container');
  if(tweetParent) {
    let vid = findTwitterVideo(tweetParent);
    if(vid) {
      browser.runtime.sendMessage({twitterOrigUrl: vid});
      return;
    }
  }

  // Otherwise it wasn't a twitter url, clear the "open" url
  browser.runtime.sendMessage({twitterOrigUrl: ""});
});


function findTwitterVideo(el) {
  let vidSource = el.querySelectorAll('.PlayableMedia video source');
  for (let i = 0; i < vidSource.length; i++) {
    if(vidSource[i] && /mp4$/.test(vidSource[i].src)) {
      return vidSource[i].src;
    }
  }
  // twitter used to have <video src= instead of <video><source> ...; try this
  // too in case it still shows up somewhere.
  let vid = el.querySelector('.PlayableMedia video');
  if(vid && /mp4$/.test(vid.src)) {
    return vid.src;
  }
  return null;
}
