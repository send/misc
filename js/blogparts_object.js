(function () {
/**
 *
 * Copyright (C) 2009 SAKAI, Kazuaki <kaz.july.7 at gmail.com>
 * Licensed under the MIT Licenses.
 *
 */
var __version__ = 0.1;

if (typeof BlogpartsObject != 'undefined') {
  if (__version__ <= BlogpartsObject.version) return;
} else {
  var BlogpartsObject = window.BlogpartsObject = function() {};
}

/**
 * Original Source; jQuery(jquery.com)
 */
var ua = navigator.userAgent.toLowerCase();
BlogpartsObject.browser = {
	version: (ua.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [0,'0'])[1],
	safari: /webkit/.test( ua ),
	opera: /opera/.test( ua ),
	msie: /msie/.test( ua ) && !/opera/.test( ua ),
	mozilla: /mozilla/.test( ua ) && !/(compatible|webkit)/.test( ua )
};
(function(){
  this.version = __version__;
  this.prefix = 'bluestadium-';
  this.isReady = false;
  this.__ready__ = [];
  this.__widget__ = {};
  this.__elem__ = null;

  /************** Utilities *****************/
  this.escape = function(source,type) {
    if (typeof source != 'string') return source;
    switch (type) {
      case 'js' :
        return source.replace(/\\/g,'\\\\').replace(/"/g,'\\"')
          .replace(/'/g,"\\'").replace(/\//g,'\\/');
      case 'url' :
        return encodeURIComponent(source);
      case 'html' :
      default :
        return source.replace(
            /(?:&)(?!(?:[a-z0-9]{2,7}|#[0-9]{2,5}|#x[0-9a-f]{2,5});)/gi,
            '&amp;'
          ).replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&#34;')
          .replace(/'/g,'&#39;').replace(/`/,'&#96');
    }
  }

  this.each = function(args, callback, obj) {
    if (args.length == undefined || args.length == 0) return callback.call(obj,args);
    var result = [];
    for (var i in args) result.push(callback.call(obj,args[i]));
    return result;
  }

  // getElementById
  this.$ = function(elem) {
    return document.getElementById(elem);
  }

  // getElementsByClassName
  this.$c = function(name, node, tag) {
    if (node == null) node = document;
    if (node.getElementsByClassName) {
      return node.getElementsByClassName(name);
    } else {
      if (tag == null) tag = '*';
      var elems = node.getElementsByTagName(tag);
      var pattern = new RegExp('(?:^|\\s)' + name + '(?:\\s|$)');
      var found = [];
      BlogpartsObject.each(elems, function(elem) {
        if(typeof elem == 'object' && pattern.test(elem.className)) found.push(elem);
      });
      return found;
    }
  }


  /************** Core *****************/
  this.init = function() {
    if (!BlogpartsObject.isReady) {
      BlogpartsObject.isReady = true;
      BlogpartsObject.each(BlogpartsObject.__ready__,function(fn) {
        if (fn['fn'])
          fn['fn'].call(document,fn['args']);
        delete fn;
      });
      BlogpartsObject.__ready__ = null;
    }

    return this;
  }

  this.ready = function(callback,callback_args) {
    bindReady();
    if(BlogpartsObject.isReady)
      callback.call(document,callback_args);
    else
      BlogpartsObject.__ready__.push({fn : callback, args: callback_args});

    return this;
  }

  this.register = function(args) {
    if(!this.__widget__[args.name]) this.__widget__[args.name] = [];
    var count  = this.__widget__[args.name].length;
    if(args.singleton && count != 0) return this;
    args.id = BlogpartsObject.prefix + args.name + '-' + count;
    var widget = new BlogpartsObject.widget(args);
    this.__widget__[args.name].push(widget);
    return this;
  }

  this.load = function() {
    for(var label in BlogpartsObject.__widget__) {
      var targets = BlogpartsObject.$c(BlogpartsObject.prefix + label, document.body, 'div');
      if (targets == '') continue;
      for(var i = 0, length = BlogpartsObject.__widget__[label].length; i < length; i++) {
        var widget = BlogpartsObject.__widget__[label][i];
        var cloneTarget = targets[i].cloneNode(false);
        cloneTarget.innerHTML = widget.tag();
        targets[i].parentNode.replaceChild(cloneTarget, targets[i]);
      }
    }
    return this;
  }

}).apply(BlogpartsObject);

BlogpartsObject.event = {
  add : function(target, type, fn,  useCapture) {
    if (typeof target != 'object') return false;
    // this を イベント発生元に切り替える。
    // (IE でこれやらないと、event 時にイベント発生元の情報を上手くとれない)
    var __fn = function(event) { return fn.call(target,event); };
    if (target.addEventListener) {
      target.addEventListener(type,__fn,useCapture);
      return true;
    } else if (target.attachEvent) {
      return target.attachEvent('on' + type, __fn);
    } else {
      target['on' + type] = __fn;
    }
  },

  cancel : function (event) {
    if(event.preventDefault)
      event.preventDefault();
    else
      event.retunValue = false;
  },
  special: {
    ready : {
      setup : bindReady,
      teardown: function(){}
    }
  }
}

BlogpartsObject.widget = function(args) {
  for(var label in args)
    if (args.hasOwnProperty(label)) {
      if (label == 'vars') {
        switch (typeof args[label]) {
          case 'string':
            this[label] = BlogpartsObject.escape(args[label], 'html');
            break;
          case 'object':
            var vars = [];
            for (var i in args[label]) vars.push(i + '=' + args[label][i]);
            this[label] = BlogpartsObject.escape(vars.join('&'), 'html');
            break;
          case 'array':
            this[label] = BlogpartsObject.escape(args[label].join('&'));
            break;
          default:
            throw 'unsupported arguments';
        }
      } else {
        this[label] = BlogpartsObject.escape(args[label], 'html');
      }
    }
  return this;
}

BlogpartsObject.widget.prototype = {
  objectId : function() {
    return this.id + '-object';
  },
  embedId : function() {
    return this.id + '-embed';
  },
  tag : function() {
    return (this.type == 'flash') ? this.flash() : this.image();
  },
  image : function() {
    return [
      '<image src="' +  this.path + '"',
      'stype="width: ' + this.width + ';',
      'height: ' + this.height + ';"',
      '/>'
    ].join(' ');
  },
  flash : function() {
    var trans_obj = (this.transparent) ? '<param name="wmode" value="transparent" />' : '';
    var trans_emb = (this.transparent) ?  'wmode="transparent" ' : '';
    return [
      '<object id="' + this.objectId()  + '" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" ',
      'name="' + this.objectId() + '" width="' + this.width +'" height="' + this.height + '" ',
      'codebase="<?php echo $proto ?>://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0" >',
      '<param name="allowScriptAccess" value="' + this.scriptAccess + '" />'  + trans_obj,
      '<param name="movie" value="' + this.path + '" />',
      '<param name="play" value="true"/><param name="loop" value="' + this.loop + '"/>',
      '<param name="menu" value="false"/><param name="quality" value="high"/>',
      '<param name="FlashVars" value="' + this.vars + '"/>',
      '<embed id="' + this.embedId() + '" name="' + this.embedId() + '" ',
      'src="' + this.path + '" loop="' + this.loop + '" menu="false" quality="high" ',
      'swLiveConnect="true" width="' + this.width + '" height="' + this.height + '" ',
      'FlashVars="' + this.vars + '" ' + trans_emb,
      'allowScriptAccess="' + this.scriptAccess + '" type="application/x-shockwave-flash" ',
      'pluginspage="<?php echo $proto ?>://www.macromedia.com/go/getflashplayer" />',
      '</object>'
    ].join('');
  }
}

/**
 * Original Source: jQuery
 */
var readyBound = false;
function bindReady() {
  if (readyBound) return;
  readyBound = true;

  if (document.addEventListener && !BlogpartsObject.browser.opera)
    document.addEventListener('DOMContentLoaded', BlogpartsObject.init, false);

  if(BlogpartsObject.browser.msie && window == top){(function() {
    if (BlogpartsObject.isReady) return;
    try {
      document.documentElement.doScroll('left');
    } catch (e){
      setTimeout(arguments.callee, 0);
      return;
    }
    BlogpartsObject.init();
  })();}
  
  if (BlogpartsObject.browser.opera) {
    document.addEventListener('DOMContentLoaded', function() {
      if (BlogpartsObject.isReady) return;

      for (var i = 0; i < document.styleSheets.length; i++)
        if(document.styleSheets[i].disabled) {
          setTimeout(arguments.callee, 0);
          return;
        }

      BlogpartsObject.init()
    }, false);
  }

  if (BlogpartsObject.browser.safari) {
    var numStyles;
    (function() {
      if (BlogpartsObject.isReady) return;
      if ( document.readyState != "loaded" && document.readyState != "complete" ) {
        setTimeout( arguments.callee, 0);
        return;
      }
      if (numStyles === undefined) {
        numStyles = 0;
        elems = document.getElementsByTagName('link');
        for (var i = 0; i < elems.length; i++) 
          if (elems[i].getAttribute('rel').toLowerCase() == 'stylesheet') numStyles++;
        if (document.styleSheets.length != numStyles) {
          setTimeout(arguments.callee, 0);
          return;
        }
        BlogpartsObject.init();
      }

    })();
  }

  // fail back
  BlogpartsObject.event.add(window, 'load', BlogpartsObject.init);
}

})();

/** widget **/
// BlogpartsObject.ready(function(args){ 
//   BlogpartsObject.register({
//     name: 'widget',
//     type: 'flash',
//     singleton: true,
//     width: '0px',
//     height: '0px',
//     scriptAccess: 'always',
//     transparent: true,
//     loop: false,
//     vars: '',
//     path: '/path/to/swf'
//   }).load();
// }, []);


/* vim: set ft=javascript: */
