// ==UserScript==
// @name           ExpandOwlyURL
// @namespace      http://d.hatena.ne.jp/send/
// @description    expand ow.ly URL
// @include        *
// @require        http://gist.github.com/3238.txt#$X
// ==/UserScript==

(function() {
  $X("//a[starts-with(@href, 'http://ow.ly/')]", document).forEach(function(anchor) {
    expand(anchor);
  });
  document.addEventListener('DOMNodeInserted', function(event) {
    switch(event.target.nodeType) {
    case 1:
    case 11:
      $X("//a[starts-with(@href, 'http://ow.ly/')]", event.target).forEach(function(anchor) {
        var anc = anchor;
        var timer = window.setTimeout(function () {
          if (timer) window.clearTimeout(timer);
          expand(anc);
        }, 0);
      });
      break;
    default:
      // do nothing
    }
  }, false, false);
  function expand(anchor) {
    var urlCache = GM_getValue('urlCache');
    urlCache = (urlCache)? JSON.parse(urlCache): {};
    var url = anchor.getAttribute('href');
    if (!/^http:\/\/ow.ly\/[^\/]+$/.test(url)) {
      return;
    }
    if (urlCache[url]) {
      anchor.setAttribute('href', urlCache[url] );
      return;
    }
    var anc = anchor;
    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onerror: function(xhr) {
        console.log(xhr.status);
        console.log(xhr.statusText);
      },
      onload: function(xhr) {
        if (!xhr.responseText && typeof xhr.responseText == 'string') return;
        urlCache = GM_getValue('urlCache');
        urlCache = (urlCache)? JSON.parse(urlCache): {};
        if (!urlCache[url]) {
          var dom;
          try {
            dom = createDocument(xhr.responseText);
          } catch (e) {
            console.log('error occured createDocument');
            console.log(e);
            return;
          }
          var iframe = dom.getElementById('hootFrame');
          if (!iframe) return;
          urlCache[url] = iframe.getAttribute('src');
          GM_setValue('urlCache', JSON.stringify(urlCache));
        }
        anc.setAttribute('href', urlCache[url]);
      }
    });
  }

  function createDocument(str) {
    if (document.documentElement.nodeName != 'HTML') 
      return new DOMParser().parseFromString(str, 'application/xhtml+xml');
    //return createHTMLDocument(str);;
    var docType = document.implementation.createDocumentType('html','//W3C//DTD XHTML 1.0 Transitional//EN', 
      'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd');
    var doc = document.implementation.createDocument(null, 'html', docType);
    var range = document.createRange();
    range.selectNodeContents(document.documentElement);
    var text = '';
    try {
      // remove error handler. because these handler runs on create fragment.
      text = str.replace(/onerror=\"[^\"]+\"/g, '');
    } catch (e) {
      // without try-catch some error occured.
      console.log(e);
    }
    var fragment = range.createContextualFragment(text);
    var content = doc.adoptNode(fragment);
    doc.documentElement.appendChild(content);
    return doc;
  }
  
})();
