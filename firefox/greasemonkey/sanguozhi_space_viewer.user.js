// ==UserScript==
// @name           Sanguozhi_space_viewer
// @namespace      http://d.hatena.ne.jp/send/
// @description    Sanguozhi Space Viewer
// @include        http://s1.3gokushi.jp/map.php?*
// @require        http://gist.github.com/3238.txt#$X
// ==/UserScript==

(function() {
  const resourceXPath = 'id("production2")/div[@class="floatInner"]/ul/li';
  const targetXPath = 'id("mapOverlayMap")/area';
  var map = $X(targetXPath, document);

  map.forEach(function(elem) {
    var coord = hrefToCoord(elem.href);
    GM_xmlhttpRequest({
      method: 'GET',
      url: coord.url,
      onerror: function (xhr) {
        console.log("status: " + xhr.status);
        console.log("statusText: " + xhr.statusText);
      },
      onload: function(xhr) {
        var responseDom = createDocument(xhr.responseText);
        var results = $X(resourceXPath, responseDom);
        console.log(results);
        results && results.forEach(function(el) {
          elem.title += ', ' + el.textContent;
        });
      }
    });
  }); 
  function hrefToCoord(href) {
    var query = href.split('?')[1].split('&');
    return new Coord(query[0].split('=')[1], query[1].split('=')[1]);
  }

  function Coord (x, y) {
    const linkTo = 'http://' +  location.host + '/land.php?';
    this.x = x;
    this.y = y;
    this.url = linkTo + 'x=' + x + '&y=' + y;
  }

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
