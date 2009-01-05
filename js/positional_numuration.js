/**
 * Positional Numeration
 * radix supported 1-9
 */
var PositionalNumeration = function(decimal,radix,fixedDigit){
  if (Math.ceil(decimal) != decimal || Math.ceil(radix) != radix) throw "Not Integer !";
  if (radix > 9 || radix < 1) throw "radix support between 1 and 9";

  this.decimal = decimal;
  this.radix = radix;

  this.to_a = function(fixed) {
    if(typeof fixed != 'number') fixed = 0;
    var carry = this.decimal;
    var figure = []
    var current = 0;
    var radix = this.radix;
    do {
      var single_figure = carry % radix;
      carry = (carry - single_figure) / radix;
      figure[current++] = single_figure ;
    } while (carry > 0 || (current < fixed));

    return figure;
  }
  this.figure = this.to_a(fixedDigit);
}
PositionalNumeration.prototype = {
  calc : function(num, calcurator) {
    if (!num) return this;
    var decimal = this.decimal;
    if (typeof num == 'number') {
      if (Math.ceil(num) != num) throw "Not Integer!";
      decimal = calcurator.call(this, num);
    } else if (typeof num == 'object' && num.hasOwnProperty('decimal')) {
      decimal = calcurator.call(this, num.decimal);
    } else {
      throw NaN;
    }
    return new PositionalNumeration(decimal,this.radix);
  },
  sum : function(num) {
    return this.calc(num, function(decimal) { return this.decimal + decimal;});
  },
  minus : function(num) {
    return this.calc(num, function(decimal) { return this.decimal - decimal;});
  },
  times : function(num) {
    return this.calc(num, function(decimal) { return this.decimal * decimal;});
  },
  div : function(num) {
    return this.calc(num, function(decimal) { return this.decimal / decimal;});
  },
  residue : function(num) {
    return this.calc(num, function(decimal) { return this.decimal % decimal;});
  },
  decimalValue : function() {
    return this.decimal;
  },
  getFigure : function() {
    return this.figure;
  },
  increment : function() {
    this.decimal++;
    var digit = 0;
    var figure = this.figure;
    var radix = this.radix;
    figure[digit]++;
    // carry 
    while (figure[digit] == radix) {
      figure[digit] = 0;
      figure[++digit]++;
    }
    return this;
  }
}
