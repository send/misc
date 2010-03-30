// ==UserScript==
// @name           RemovePreOnDashboard
// @namespace      http://d.hatena.ne.jp/send/
// @description    Remove pre tags on Tumblr dashboard
// @include        http://www.tumblr.com/dashboard
// @include        http://otsune.tumblr.com/
// ==/UserScript==

(function() {

  removePre(document);

  document.addEventListener('DOMNodeInserted', function(event) {
    switch(event.target.nodeType) {
    case 1:
    case 11:
      var timer = window.setTimeout(function() {
        if (timer) window.clearTimeout(timer);
        removePre(event.target);
      }, 0)
      break;
    default:
      // do nothing
    }
  }, false);

  function removePre(target) {
    var nodes = target.getElementsByTagName('pre');
    var range = document.createRange();
    var subs = [];
    Array.prototype.forEach.call(nodes, function(oldNode) {
      var parent = oldNode.parentNode;
      range.selectNodeContents(oldNode);
      var newNode = range.createContextualFragment(range.toString().replace('&lt;', '<', 'g').replace('&gt;', '>', 'g'));
      subs.push([newNode, oldNode]);
    });
    range.detach();

    subs.forEach(function(sub) {
      sub[1].parentNode.replaceChild(sub[0], sub[1]);
    });
  }
})();
