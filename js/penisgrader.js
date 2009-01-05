// var sizes = [
//   [30, 0.04],
//   [20, 1.01],
//   [15, 4.92],
//   [14, 8.23],
//   [13, 21.9],
//   [12, 29.97],
//   [11, 23.01],
//   [10, 9.22],
//   [8,  1.61],
//   [5,  0.08],
//   [1,  0.009],
//   [0,  0.001]
// ];
// var population = 53430412;
// var average = 0;
// for (var i in sizes)
//   average += sizes[i][0] * sizes[i][1] * 0.01;
// // average: 12.13359
// 
// var variance = 0;
// for (var l in sizes)
//   variance += population * sizes[l][1] * 0.01 * Math.pow((average - sizes[l][0]), 2);
//
// variance = variance/(population -1); // n-1: 2.6571837616316727, n: 2.6571837119 


/**
 * PenisGrader: grade your penis in Japan.
 *
 * Examples:
 * <code>
 *    var hyde = new PenisGrader(15.6);
 *    hyde.deviation();
 *    hyde.ranking();
 *    hyde.percent();
 *  </code>
 */
var PenisGrader = function(size) {
  var population = 53430412;
  var average = 12.13359;
  var variance = 2.6571837616316727;
  var Z = (size - average)/Math.sqrt(variance);
  var fraction = 1 - qnorm(Z);

  this.getZ = function() { return Z }

  this.getFraction = function() { return fraction; }

  this.deviation = function() {
    return 50 + 10 * Z;
  }

  this.ranking = function() {
    return parseInt(fraction * population);
  }
  
  this.percent = function() {
    return fraction * 100;
  }

  //  Original Source: http://www5.airnet.ne.jp/tomy/cpro/sslib11.htm
  function qnorm(u) {
    var a = [
      1.24818987e-4, -1.075204047e-3, 5.198775019e-3, -0.019198292004, 0.059054035642,
      -0.151968751364, 0.319152932694, -0.5319230073, 0.797884560593
    ];
    var b = [
      -4.5255659e-5, 1.5252929e-4, -1.9538132e-5, -6.76904986e-4, 1.390604284e-3,
      -7.9462082e-4, -2.034254874e-3, 6.549791214e-3, -0.010557625006, 0.011630447319,
      -9.279453341e-3, 5.353579108e-3, -2.141268741e-3, 5.35310549e-4, 0.999936657524
    ];
    var w, y, z, i;
    if (u == 0.)  return 0.5;
    y = u / 2.;
  
    if (y < -6.)  return 0.;
    if (y > 6.)   return 1.;
    if (y < 0.)   y = - y;
    if (y < 1.) {
      w = y * y;
      z = a[0];
      for(i = 1; i < 9; i++) z = z * w + a[i];
      z *= (y * 2.);
    } else {
      y -= 2.;
      z = b[0];
      for(i = 1; i < 15; i++) z = z * y + b[i];
    }
  
    if(u < 0.)  return (1. - z) / 2.;
    return (1. + z) / 2.;
  }
};

