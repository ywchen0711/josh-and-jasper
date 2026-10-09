/*
 * Levels are built with small helpers instead of hand-typed strings.
 * Grid is 12 rows tall (16px tiles); the ground surface is row 10.
 * Tiles: '#' ground  'B' brick  '?' coin block  'M' acorn block  'X' solid block
 *        '[' ']' pipe top  '{' '}' pipe body  'c' coin
 * Entities: { type: 'beetle' | 'hedgehog', x, y } in tiles
 */
(function () {
  'use strict';
  var H = 12, GROUND = 10;

  function Builder(w, opts) {
    this.w = w;
    this.rows = [];
    for (var y = 0; y < H; y++) { var r = []; for (var x = 0; x < w; x++) r.push('.'); this.rows.push(r); }
    this.ents = [];
    this.decos = [];
    this.name = opts.name;
    this.title = opts.title || '';
    this.goal = opts.goal || 'castle';
    this.theme = opts.theme || 'day';
    this.time = opts.time || 300;
  }
  Builder.prototype.set = function (x, y, c) { if (x >= 0 && x < this.w && y >= 0 && y < H) this.rows[y][x] = c; return this; };
  Builder.prototype.ground = function (x0, x1) {
    for (var x = x0; x <= x1; x++) for (var y = GROUND; y < H; y++) this.set(x, y, '#');
    return this;
  };
  Builder.prototype.row = function (x, y, str) {
    for (var i = 0; i < str.length; i++) if (str[i] !== ' ') this.set(x + i, y, str[i]);
    return this;
  };
  Builder.prototype.pipe = function (x, h) {
    var top = GROUND - h;
    this.set(x, top, '[').set(x + 1, top, ']');
    for (var y = top + 1; y < GROUND; y++) this.set(x, y, '{').set(x + 1, y, '}');
    return this;
  };
  // staircase of solid blocks; dir 1 = going up to the right, -1 = going down
  Builder.prototype.stairs = function (x, n, dir) {
    for (var i = 0; i < n; i++) {
      var hgt = dir > 0 ? i + 1 : n - i;
      for (var k = 0; k < hgt; k++) this.set(x + i, GROUND - 1 - k, 'X');
    }
    return this;
  };
  Builder.prototype.coins = function (x0, x1, y) { for (var x = x0; x <= x1; x++) this.set(x, y, 'c'); return this; };
  Builder.prototype.enemy = function (type, xs, y) {
    var self = this;
    xs.forEach(function (x) { self.ents.push({ type: type, x: x, y: y == null ? GROUND - 1 : y }); });
    return this;
  };
  // background decorations (drawn behind the tiles, standing on the ground line)
  Builder.prototype.deco = function (kind, xs, opts) {
    var self = this;
    (Array.isArray(xs) ? xs : [xs]).forEach(function (x) { self.decos.push(Object.assign({ kind: kind, x: x }, opts || {})); });
    return this;
  };
  Builder.prototype.finish = function (flagX, castleX, checkpoint) {
    this.flagX = flagX;
    this.castleX = castleX;
    this.checkpoint = checkpoint;
    // a block under the flag pole
    this.set(flagX, GROUND - 1, 'X');
    return {
      name: this.name, title: this.title, goal: this.goal, decos: this.decos, theme: this.theme, time: this.time, w: this.w, h: H,
      tiles: this.rows.map(function (r) { return r.join(''); }),
      ents: this.ents, flagX: flagX, castleX: castleX, checkpoint: checkpoint,
      start: [{ x: 3, y: GROUND - 1 }, { x: 4.5, y: GROUND - 1 }]
    };
  };

  // ---- 1-1: sunny meadow ----
  function level1() {
    var b = new Builder(212, { name: '1-1', theme: 'day', time: 300 });
    b.ground(0, 68).ground(71, 86).ground(90, 152).ground(155, 211);
    b.row(16, 6, '?').row(20, 6, 'BMB?B').row(22, 2, '?');
    b.pipe(28, 2).pipe(38, 3).pipe(46, 4).pipe(57, 4);
    b.enemy('beetle', [22, 40, 51, 53]);
    b.row(64, 6, 'B?B').coins(64, 66, 4);
    b.row(77, 6, 'BMB').row(80, 2, 'BBBBBBBB').coins(81, 86, 5);
    b.row(91, 2, 'BBB?').row(94, 6, 'B');
    b.row(100, 6, 'BB').row(106, 6, '?').row(109, 6, '?').row(109, 2, 'M').row(112, 6, '?');
    b.row(118, 6, 'B').row(121, 2, 'BBB').row(128, 2, 'B??B').row(129, 6, 'BB');
    b.enemy('beetle', [80, 97, 99, 110, 114, 125, 127, 131, 133]);
    b.enemy('hedgehog', [117]);
    b.stairs(134, 4, 1).stairs(140, 4, -1).stairs(148, 4, 1).set(152, GROUND - 1, 'X').set(152, GROUND - 2, 'X').set(152, GROUND - 3, 'X').set(152, GROUND - 4, 'X');
    b.stairs(155, 4, -1);
    b.coins(136, 139, 4);
    b.pipe(163, 2).row(168, 6, 'BB?B').pipe(179, 2);
    b.enemy('beetle', [170, 172]);
    b.stairs(181, 8, 1);
    for (var k = 0; k < 8; k++) b.set(189, GROUND - 1 - k, 'X');
    return b.finish(198, 202, 92);
  }

  // ---- 1-2: dusk — floating platforms over gaps, more hedgehogs ----
  function level2() {
    var b = new Builder(206, { name: '1-2', theme: 'dusk', time: 300 });
    b.ground(0, 30).ground(35, 50).ground(56, 60).ground(66, 90).ground(96, 98).ground(104, 130).ground(136, 205);
    b.row(31, 7, 'XXXX').coins(31, 34, 5);
    b.row(51, 6, 'XXXX').coins(51, 54, 4);
    b.row(61, 5, 'XXXXX').coins(61, 65, 3);
    b.row(91, 6, 'XXXXX').row(99, 5, 'XXXXX').coins(99, 103, 3);
    b.row(131, 7, 'XXXXX').coins(131, 135, 5);
    b.row(12, 6, '?M?').row(40, 3, 'BBBBB').coins(40, 44, 2).row(70, 6, 'B?B?B').row(72, 2, 'M');
    b.row(110, 6, 'MBB').row(145, 6, '????').row(147, 2, 'BB');
    b.pipe(22, 3).pipe(80, 4).pipe(120, 2).pipe(160, 3);
    b.enemy('beetle', [18, 25, 44, 48, 72, 75, 85, 108, 112, 140, 142, 150, 170]);
    b.enemy('hedgehog', [28, 68, 115, 152, 166]);
    b.stairs(176, 6, 1);
    for (var k = 0; k < 6; k++) b.set(182, GROUND - 1 - k, 'X');
    return b.finish(192, 196, 104);
  }

  // ======================= World 2: Sage Canyon =======================
  // The brothers walk to school through the canyon (coastal sage scrub, oaks, prickly pear),
  // then cross a California elementary school campus: blacktop, lunch tables, playground, library books.

  // ---- 2-1: the canyon trail to school ----
  function level3() {
    var b = new Builder(200, { name: '2-1', title: 'CANYON TRAIL', theme: 'canyon', goal: 'gate', time: 300 });
    b.ground(0, 34).ground(38, 62).ground(66, 67).ground(71, 100).ground(105, 140).ground(144, 199);
    b.deco('sign', 6, { text: 'TRAIL TO SCHOOL' });
    b.deco('sage', [2, 14, 25, 44, 58, 77, 92, 112, 127, 150, 165, 178]);
    b.deco('oak', [18, 52, 86, 122, 158]);
    b.deco('fence', [30, 96, 140]);
    b.row(10, 6, '?B?').row(11, 2, 'M').coins(20, 23, 6);
    b.row(35, 7, 'XXX').coins(35, 37, 5);                  // ledge over the dry creek
    b.pipe(46, 2).pipe(56, 3);                              // hollow logs
    b.row(63, 6, 'XXX').row(68, 6, 'XXX').coins(63, 70, 4);
    b.row(78, 6, 'BBMBB').row(80, 2, '?');
    b.stairs(92, 4, 1).row(101, 5, 'XXXX').coins(101, 104, 3);
    b.row(112, 6, 'B?B').row(118, 3, 'XXXX').coins(118, 121, 2).row(124, 6, '?');
    b.row(141, 7, 'XXX');
    b.row(150, 6, 'BBB?BBB').row(153, 2, 'M');
    b.stairs(170, 5, 1);
    for (var k = 0; k < 5; k++) b.set(175, GROUND - 1 - k, 'X');
    b.enemy('lizard', [24, 44, 50, 74, 84, 88, 115, 130, 134, 160, 164]);
    b.enemy('beetle', [60, 108, 148]);
    b.enemy('cactus', [29, 58, 98, 126, 155]);
    b.enemy('gull', [70, 120, 166], 4);
    return b.finish(184, 189, 105);
  }

  // ---- 2-2: Sage Canyon School ----
  function level4() {
    var b = new Builder(210, { name: '2-2', title: 'SAGE CANYON SCHOOL', theme: 'school', goal: 'school', time: 300 });
    b.ground(0, 70).ground(73, 118).ground(122, 209);
    b.deco('sign', 4, { text: 'SAGE CANYON SCHOOL', blue: true });
    b.deco('bikes', 12).deco('flags', 24).deco('palm', [34, 108, 176]);
    b.deco('hopscotch', [40, 128]).deco('tether', [48, 55, 134]);
    b.deco('shade', [74, 88]).deco('playground', 140).deco('garden', [60, 160]);
    // drop-off and the blacktop
    b.row(14, 6, '?M?').row(20, 6, 'BBBB').coins(20, 23, 5);
    b.pipe(30, 2).pipe(44, 3);                              // recycling bins
    b.enemy('ball', [26, 38, 52, 58]);
    // lunch area: tables to hop across, hungry seagulls
    b.row(66, 7, 'XXX').row(76, 7, 'XXX').row(82, 5, 'XXX').row(90, 7, 'XXXX').coins(76, 78, 6).coins(90, 93, 6);
    b.enemy('gull', [70, 84, 96, 104], 5);
    b.enemy('beetle', [80, 86, 100]);
    // library: walls of books
    b.row(100, 6, 'BBMBB').row(102, 2, 'BBB?BBB').row(110, 6, '??');
    b.stairs(112, 4, 1).row(119, 6, 'XX');
    // playground and the field
    b.enemy('ball', [126, 136, 146, 152]);
    b.row(144, 6, 'B?B').row(150, 3, 'XXXX').coins(150, 153, 2).pipe(156, 2).pipe(166, 3);
    b.enemy('gull', [158, 172], 4);
    b.enemy('beetle', [170, 174]);
    b.stairs(180, 6, 1);
    for (var k = 0; k < 6; k++) b.set(186, GROUND - 1 - k, 'X');
    return b.finish(194, 199, 118);
  }

  window.Levels = [level1(), level2(), level3(), level4()];
})();
