// ==UserScript==
// @name           ExpandOwlyURL
// @namespace      http://d.hatena.ne.jp/send/
// @description    expand ow.ly URL
// @include        *
// @require        http://gist.github.com/3238.txt#$X
// ==/UserScript==

(function() {
  console.log('start');
  $X("//a[starts-with(@href, 'http://ow.ly/')]", document).forEach(function(anchor) {
    var timer = setTimeout(function() {
      console.log('XXXX:' + anchor.getAttribute('href'));
      if (timer) clearTimeout(timer);
      GM_xmlhttpRequest({
        method: 'GET',
        url: anchor.getAttribute('href'),
        onload: function(xhr) {
          var iframe = xhr.responseXML.getElementById('hootFrame');
          console.log(iframe.getAttribute('src'));
          anchor.setAttribute('href', iframe.getAttribute('src'));
        }
      });
    },0);
  });
})();
