// ==UserScript==
// @name           Sanguozhi_space_viewer
// @namespace      http://d.hatena.ne.jp/send/
// @description    Sanguozhi Space Viewer
// @include        http://s1.3gokushi.jp/map.php*
// @require        http://gist.github.com/3238.txt#$X
// @require        http://www.json.org/json2.js
// ==/UserScript==

(function() {

  const resourceXPath = 'id("production2")/div[@class="floatInner"]/ul/li';
  const soldierXPath = 'id("soldier")/div[@class="floatInner"]/ul/li';
  const targetXPath = 'id("mapOverlayMap")/area';

  var viewer = document.createElement('div');
  viewer.id = 'space-viewer';
  var before = document.getElementById('mapScroll');
  before.parentNode.insertBefore(viewer,before);
  document.getElementById('datas').style.top = '20px';

  var mapInfo = GM_getValue('mapInfo');
  if (!mapInfo) {
    mapInfo = {};
  } else {
    mapInfo = JSON.parse(mapInfo);
  }

  var old_mapInfoView = unsafeWindow.mapInfoView;
  unsafeWindow.mapInfoView = function() {
    var c = arguments[3].replace(/\(|\)/g,'').split(',');
    var coord = new Coord(c[0],c[1]);
    viewer.innerHTML = mapInfo[coord.hashCode].data;
    return old_mapInfoView.apply(this,Array.prototype.slice.call(arguments));
  }

  var map = $X(targetXPath, document);
  var pos = 0;
  const overImage = 'http://img.3gokushi.jp/20090611-01/img/common/panel_rollover.png';
  var now = new Date().getTime();
  map.forEach(function(elem) {
    var coord = hrefToCoord(elem.href);
    var info = mapInfo[coord.hashCode];
    pos++;
    var currrent = pos;
    if (!info || !info.lastModified || now - info.lastModified > 86400000) {
      GM_xmlhttpRequest({
        method: 'GET',
        url: coord.url,
        onerror: function (xhr) {
          console.log("status: " + xhr.status);
          console.log("status Text: " + xhr.statusText);
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
          addStarStyle(elem, currrent);
          mapInfo[coord.hashCode] = {
            data: elem.title,
            lastModified: new Date().getTime()
          }
          GM_setValue('mapInfo', JSON.stringify(mapInfo));
        }
      });
    } else {
      elem.title = info.data;
      addStarStyle(elem, currrent);
    }
  }); 
  
  function addStarStyle(elem, position) {
    var star = elem.title.match(/\u2605/g);
    var count = (star) ? star.length : 0;
    switch(count) {
    case 0:
    case 1:
    case 2:
    case 3:
      break;
    default:
      var img = document.createElement('img');
      img.src = overImage;
      img.className = (position < 10) ? "mapAll0" + position : "mapAll" + position;
      document.getElementById('mapsAll').appendChild(img);
    }
  }
  

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
