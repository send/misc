// ==UserScript==
// @name           ExpandOwlyURL
// @namespace      http://d.hatena.ne.jp/send/
// @description    expand ow.ly URL
// @include        *
// @require        http://gist.github.com/3238.txt#$X
// ==/UserScript==

(function() {
  setTimeout(function() {
    $X("//a[starts-with(@href, 'http://ow.ly/')]", document).forEach(function(anchor) {
      var timer = setTimeout(function() {
        if (timer) clearTimeout(timer);
        GM_xmlhttpRequest({
          method: 'GET',
          url: anchor.getAttribute('href'),
          onload: function(xhr) {
            var dom = createDocument(xhr.responseText);
            var iframe = dom.getElementById('hootFrame');
            if (!iframe) return;
            anchor.setAttribute('href', iframe.getAttribute('src'));
          }
        });
      },0);
    });
  },100);
  // this function from AutoPagerize
  function createDocument(str) {
    if (document.documentElement.nodeName != 'HTML') 
      return new DOMParser().parseFromString(str, 'application/xhtml+xml');
    var html = str.replace(/^[\s\S]*?<html(?:[ \t\r\n][^>]*)?>|<\/html[ \t\r\n]*>[\w\W]*$/ig, '');
    var doc = document.implementation.createDocument(null, 'html', null);
    var range = document.createRange();
    range.setStartAfter(document.body);
    var fragment = range.createContextualFragment(html);
    try {
      fragment = doc.adoptNode(fragment);
    } catch (e) {
      fragment = doc.importNode(fragment, true);
    }
    doc.documentElement.appendChild(fragment);
    return doc;
  }
  
})();
