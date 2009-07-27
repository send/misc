function Cron(interval) {
  var self = arguments.callee;
  if (self.instance == null) {
    self.instance = this;
    self.items = [];
    self.prototype.init.apply(null,interval);
  }
  return self.instance;
}

Cron.prototype.month_mapping = [
  'jun', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
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
    Cron.prototype.REGEXP_MONTH,
    Cron.prototype.REGEXP_WEEKDAY
  ].join(' ') + '$', 'i'
);

Cron.prototype.init = function() {
  var self = this;
//  this.pid = setInterval(function() {
//    self.action.apply(null, self.envs);
//  }, interval || 1000);
  return this;
}

Cron.prototype.parse = function(cronfield) {
  var timespec = this.REGEXP_CRON.exec(cronfield);
  if (!timespec) throw 'illigal arguments: ' + cronfield;
  timespec.shift();
  var month = this.month_mapping.indexOf(timespec[3].toLowerCase());
  var weekday = this.week_mapping.indexOf(timespec[4].toLowerCase());
  if (month != -1) timespec[3] = month;
  if (weekday != -1) timespec[4] = weekday;
  if (timespec[4] == 7) timespec[4] = 0;
  return [
    { figure: 60, code: timespec[0] },  // seconds
    { figure: 60, code: timespec[1] },  // minutes
    { figure: 24, code: timespec[2] },  // hours
    { figure: 12, code: timespec[3] },  // month
    { figure:  7, code: timespec[4] }   // weekday
  ];
}
Cron.prototype.register = function (timespec, callback) {
}
Cron.prototype.nextTime = function (timespec) {
  function isList(field) {
    return field.indexOf(',') != -1;
  }
  function fieldToList(field) {
    return field.split(',');
  }
  function isRange(field) {
    return field.indexOf('-') != -1;
  }
  function inRange(field, value) {
    var range = field.split('-');
    return (range[0] <= value && range[1] >= value);
  }

  var now = new Date();
  var currents = [ now.getMinutes(), now.getHour(), now.getDate(), now.getMonth(), now.getDay(), now.getYear() ];
  var carry = false;
  var specs = this.parse(timespec);

  var __next = function(spec, current) {
    var old = current;
    if (spec.code = '*') {
      current++;
      if (current >= spec.figure) {
        current %= spec.figure;
        carry = true;
      }
    } else if (isRange(spec.code)) {
      current++;
      if (!inRange(spec.code, current)) {
        var range = spec.code.split('-');
        if (range[1] < current) carry = true;
        current = range[0];
      }
    } else if (isList(spec.code)) {
      var list = fieldToList(spec.code);
      for (var i = 0, length = list.length; i < length; i++) {
        current = __next(spec, current);
        if (!carry) break;
      }
    } else { //numaric
      current = spec.code;
      carry = true;
    }
    return current;
  }

  // FIXME: last field: weekday, so must fix carry over year
  WEEKDAY: for (var digit = 0, length = 5; digit < length; digit++) {
    carry = false;
    currents[digit] = __next(specs[digit], currents[digit]);
    if (digit == 4 && carry) break WEEKDAY;
    if (!carry) break;
  }

  if (carry) // carry year
    currents[5] = currents[5] + 1;
  return new Date(currents[5], currents[3], currents[2], currents[1], currents[0]);
}

print(new Cron().parse('* * * * *'));
print(new Cron().parse('*/2 * * * 7'));
print(new Cron().parse('* * * * sun'));
print(new Cron().parse('* * * JUL sun'));
