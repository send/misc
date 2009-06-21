// ==UserScript==
// @name           Sanguozhi_space_viewer
// @namespace      http://d.hatena.ne.jp/send/
// @description    Sanguozhi Space Viewer
// @include        http://s1.3gokushi.jp/map.php*
// @require        http://gist.github.com/3238.txt#$X
// ==/UserScript==

(function() {
  if (typeof JSON == 'undefined') {
    Components.util.import("resource://gre/modules/JSON.jsm");
    JSON.parse = JSON.fromString;
    JSON.stringify = JSON.toString;
  }
  const resourceXPath = 'id("production2")/div[@class="floatInner"]/ul/li';
  const soldierXPath = 'id("soldier")/div[@class="floatInner"]/ul/li';
  const targetXPath = 'id("mapOverlayMap")/area';

  var mapInfo = GM_getValue('mapInfo');
  if (!mapInfo) {
    mapInfo = {};
  } else {
    mapInfo = JSON.parse(mapInfo);
  }

  var map = $X(targetXPath, document);
  map.forEach(function(elem) {
    var coord = hrefToCoord(elem.href);
    if (!mapInfo[coord.hashCode]) {
      GM_xmlhttpRequest({
        method: 'GET',
        url: coord.url,
        onerror: function (xhr) {
          console.log("status: " + xhr.status);
          console.log("statusText: " + xhr.statusText);
        },
        onload: function(xhr) {
          var responseDom = createDocument(xhr.responseText);
  
          var soldiers = $X(soldierXPath, responseDom);
          soldiers && soldiers.forEach(function(el) {
            elem.title += ', ' + el.textContent;
          });
  
          var results = $X(resourceXPath, responseDom);
          results && results.forEach(function(el) {
            elem.title += ', ' + el.textContent;
          });
          mapInfo[coord.hashCode] = elem.title;
          GM_setValue('mapInfo', JSON.stringify(mapInfo));
        }
      });
    } else {
      elem.title = mapInfo[coord.hashCode];
    }
  }); 
  

  /** Utilities **/
  function hrefToCoord(href) {
    var query = href.split('?')[1].split('&');
    return new Coord(query[0].split('=')[1], query[1].split('=')[1]);
  }

  function Coord (x, y) {
    const linkTo = 'http://' +  location.host + '/land.php?';
    this.x = x;
    this.y = y;
    this.hashCode = 'x=' + x + '&y=' + y;
    this.url = linkTo + this.hashCode;
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
