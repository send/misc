// ==UserScript==
// @name           SanguozhiExpandDeck
// @namespace      http://d.hatena.ne.jp/send/
// @description    Expand deck pages at Browser Sanguozhi
// @include        http://s*.3gokushi.jp/*
// @require        http://gist.github.com/3238.txt#$X
// ==/UserScript==
(function() {
  const QUERY = '//a[contains(@href, "deck.php") and substring-after(@href,"deck.php")=""]';
  const EXPANDO = '?t=all';
  var anchors;
  try {
    anchors = $X(QUERY, document);
  } catch (e) {
    console.log(e);
  }
  anchors && anchors.forEach(function(elem) {
    var href = elem.getAttribute('href');
    elem.setAttribute('href', href + EXPANDO);
  });
  
})();
