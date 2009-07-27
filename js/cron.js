if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (elt /* , from */) {
    var len = this.length;
    var from = Number(arguments[1]) || 0;
    from = (from < 0) ? Math.ceil(from) : Math.floor(from);
    if (from < 0) from += len;
    for (;from < len; from++) {
      if (from in this && this[from] === elt) return from;
    }
    return -1;
  }
}

function Cron() {
  var self = arguments.callee;
  if (self.instance == null) {
    this.initialize.apply(this, arguments);
    self.instance = this;
  }
  return self.instance;
}

Cron.prototype.month_mapping = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
];
Cron.prototype.week_mapping = [
  'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'
];

Cron.prototype.REGEXP_NUMBER = '((?:\\d|\\*)(?:[\\d\\*\\,\\-\\/]*\\d)?)';
Cron.prototype.REGEXP_MONTH = '((?:\\d|\\*)(?:[\\d\\*\\,\\-\\/]*\\d)?|' 
    + Cron.prototype.month_mapping.join('|') +')';
Cron.prototype.REGEXP_WEEKDAY = '((?:\\d|\\*)(?:[\\d\\*\\,\\-\\/]*\\d)?|'
    + Cron.prototype.week_mapping.join('|') + ')';
Cron.prototype.REGEXP_CRON = new RegExp(
  '^' + [
    Cron.prototype.REGEXP_NUMBER,
    Cron.prototype.REGEXP_NUMBER,
    Cron.prototype.REGEXP_NUMBER,
    Cron.prototype.REGEXP_NUMBER,
    Cron.prototype.REGEXP_MONTH,
    Cron.prototype.REGEXP_WEEKDAY
  ].join(' ') + '$', 'i'
);

Cron.prototype.initialize = function() {
  this.tasks = {};
  this.counter = 0;
  return this;
}

Cron.prototype.wakeUp = function() {
  var self = this;
  this.pid = setInterval(function() {
    self.exec.apply(self);
  },1000);
}
Cron.prototype.shutdown = function() {
  clearInterval(this.pid);
}

Cron.prototype.parse = function(cronfield) {
  function expandAsterisk(max) {
    var expando = [];
    for(var i = 0; i < max; i++) expando.push(i);
    return expando;
  }

  function expandInterval(spec, max) {
    var expando = [];
    var sp = spec.split('/');
    if (sp.length != 2) throw "illigal spec: " + spec;

    var interval = parseInt(sp[1]);
    if (interval <= 0) throw "illigal spec: " + spec;
    var range;
    if (sp[0].charAt(0) == '*') {
      range = [0, max - 1];
    } else {
      range = sp[0].split('-');
      range = [parseInt(range[0]), parseInt(range[1])];
    }
    if (range.length != 2 || range[0] > range[1]) throw "illigal spec: " + spec; 

    for (var pos = range[0], max = range[1]; pos <= max; pos += interval) expando.push(pos);
    return expando;
  }

  function expandRange(spec, max) {
    var expando = [];
    var range = spec.split('-');
    range = [parseInt(range[0]), parseInt(range[1])];

    if (range[0] < 0 || range[1] > max) throw "illigal spec: " + spec;

    for (var i = range[0], rangeMax = range[1]; i <= rangeMax; i++) expando.push(i);
    return expando;
  }

  function expand(spec, max) {
    var expando = [];
    var intValue = parseInt(spec);
    if (typeof spec == 'number') {
      expando.push(spec);
    } else if (spec.indexOf(',') != -1) {
      var specs = spec.split(',');
      for (var i = 0, length = specs.length; i < length; i++)
        expando = expando.concat(expand(specs[i], max));
    } else if (spec.indexOf('/') != -1) {
      expando = expando.concat(expandInterval(spec, max));
    } else if (spec.indexOf('-') != -1) {
      expando = expando.concat(expandRange(spec, max));
    } else if (spec == '*') {
      expando = expando.concat(expandAsterisk(max));
    } else if (intValue >= 0 && intValue <= max) {
      expando.push(intValue);
    } else {
      throw "illigal spec: " + spec;
    }
    return expando;
  }

  var timespec = this.REGEXP_CRON.exec(cronfield);
  if (!timespec) throw 'illigal arguments: ' + cronfield;
  timespec.shift();
  var month = this.month_mapping.indexOf(timespec[4].toLowerCase());
  var weekday = this.week_mapping.indexOf(timespec[5].toLowerCase());
  if (month != -1) timespec[4] = month;
  if (weekday != -1) timespec[5] = weekday;
  if (timespec[5] == 7) timespec[5] = 0;
  return [
    expand(timespec[0], 60), // seconds
    expand(timespec[1], 60), // minutes
    expand(timespec[2], 24), // hours
    expand(timespec[3], 31), // day
    expand(timespec[4], 12), // month
    expand(timespec[5], 7) // weekday
  ];
}
Cron.prototype.register = function (fn, spec) {
  var id = this.counter;
  var awaked = false;
  for (var i in this.tasks) if (this.tasks.hasOwnProperty(i)) {
    awaked = true;
    break;
  }
  if (awaked) this.wakeUp();

  var sp = this.parse(spec);
  this.tasks['_' + id] = {
    callback: fn,
    timespec: sp
  };
  this.counter++;
  return id;
}
Cron.prototype.exec = function () {
  var now = new Date();
  var currents = [now.getSeconds(), now.getMinutes(), now.getHours(), now.getDate(), now.getMonth(), now.getDay()];
  for(var i in this.tasks) if (this.tasks.hasOwnProperty(i)) {
    var spec = this.tasks[i];
    var matched = true;
    for (var l = 0, len = currents.length; l < len; l++) {
      if (spec.timespec[l].indexOf(currents[l]) == -1) {
        matched = false;
        break;
      }
    }
    if (matched) spec.callback.apply();
  }
  return this;
}
Cron.prototype.cancel = function(id) {
  delete this.tasks['_' + id];
  for (var i in this.tasks) if (this.tasks.hasOwnProperty(i)) return this;
  this.shutdown();
  return this;
}

/**
console.log(new Date());
var timer = new Cron();
var pid = timer.register(function() {
  console.log(new Date());
}, "1,3,10-15,20-59/5 0-33/1,35-37,40-59 * * JUL mon");

setTimeout(function() {
  console.log('cancel: ' + pid);
  timer.cancel(pid);
},10000);
*/
