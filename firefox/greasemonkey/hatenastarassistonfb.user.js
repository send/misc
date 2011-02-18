// ==UserScript==
// @name           HatenaStarAssistOnFB
// @namespace      http://send.sh
// @description    load Hatena Star on DOMNodeInserted Event 
// @include        http://www.facebook.com/*
// ==/UserScript==
(function() {
  var win = (typeof unsafeWindow != 'undefined') ? unsafeWindow : window;
  var Hatena, Ten;
  var timer = setTimeout(function() {
    if (timer) clearTimeout(timer);
    if (typeof win.Hatena == 'undefined') return;
    Hatena = win.Hatena;
    Ten = win.Ten;
    document.addEventListener("DOMNodeInserted", assistStar, false);
  }, 100);
  function assistStar(event) {
    var node = event.target;
    if (node.nodeType != 1 || node.tagName != 'LI') return;
    Hatena.Star.EntryLoader.loadNewEntries(node.wrappedJSObject);
  }
})();
