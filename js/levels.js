/*
 * Levels for "Josh & Jasper: Coyote Trail".
 * 12 rows of 16px tiles; the ground surface is row 10. Rows 0-1 sit under the HUD, so nothing goes there.
 *
 * Tiles:  '#' ground   'X' solid block   '=' one-way platform (jump up through, ↓ to drop)
 *         'H' ladder   'S' bounce pad    'C' crate (Josh's dash or 2 throws break it)   '~' water / goo (hurts)
 * Items:  star (score), paw (3 hidden Coyote paw badges per level), orange (heals a heart)
 * Goal:   Coach Coyote, the school mascot, waits at the end of each level
 */
(function () {
  'use strict';
  var H = 12, GROUND = 10;

  function Builder(w, opts) {
    this.w = w;
    this.rows = [];
    for (var y = 0; y < H; y++) { var r = []; for (var x = 0; x < w; x++) r.push('.'); this.rows.push(r); }
    this.ents = []; this.items = []; this.decos = []; this.checkpoints = [];
    this.opts = opts;
  }
  var B = Builder.prototype;
  B.set = function (x, y, c) { if (x >= 0 && x < this.w && y >= 0 && y < H) this.rows[y][x] = c; return this; };
  B.fill = function (x0, y0, x1, y1, c) { for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) this.set(x, y, c); return this; };
  B.ground = function (x0, x1) { return this.fill(x0, GROUND, x1, H - 1, '#'); };
  B.water = function (x0, x1) { return this.fill(x0, GROUND, x1, H - 1, '~'); };
  B.block = function (x0, y0, x1, y1) { return this.fill(x0, y0, x1, y1, 'X'); };
  B.shelf = function (x0, x1, y) { return this.fill(x0, y, x1, y, '='); };
  B.ladder = function (x, yTop, yBottom) { return this.fill(x, yTop, x, yBottom, 'H'); };
  B.spring = function (x) { return this.set(x, GROUND - 1, 'S'); };
  B.crates = function (x0, y0, x1, y1) { return this.fill(x0, y0, x1, y1, 'C'); };
  // a little room closed by crates: only breaking in reveals what's inside
  B.nook = function (x, item) {
    this.block(x, 6, x + 4, 6).block(x + 4, 7, x + 4, 9).crates(x, 7, x, 9);
    this.item(item || 'paw', x + 2, 8);
    return this;
  };
  B.item = function (kind, x, y) { this.items.push({ kind: kind, x: x, y: y }); return this; };
  B.stars = function (x0, x1, y) { for (var x = x0; x <= x1; x++) this.item('star', x, y); return this; };
  B.starCol = function (x, y0, y1) { for (var y = y0; y <= y1; y++) this.item('star', x, y); return this; };
  B.enemy = function (type, xs, y) {
    var self = this;
    xs.forEach(function (x) { self.ents.push({ type: type, x: x, y: y == null ? GROUND - 1 : y }); });
    return this;
  };
  B.deco = function (kind, xs, o) {
    var self = this;
    (Array.isArray(xs) ? xs : [xs]).forEach(function (x) { self.decos.push(Object.assign({ kind: kind, x: x }, o || {})); });
    return this;
  };
  B.checkpoint = function (x) { this.checkpoints.push(x); return this; };
  B.finish = function (goalX) {
    var o = this.opts;
    return {
      name: o.name, title: o.title, hint: o.hint, theme: o.theme, w: this.w, h: H,
      tiles: this.rows.map(function (r) { return r.join(''); }),
      ents: this.ents, items: this.items, decos: this.decos, checkpoints: this.checkpoints, goalX: goalX,
      start: { x: 3, y: GROUND }
    };
  };

  // ---- 1: Canyon Trail — the walk to school through the sage canyon ----
  function canyon() {
    var b = new Builder(176, { name: '1', title: 'CANYON TRAIL', theme: 'canyon', hint: 'FOLLOW THE TRAIL TO SCHOOL' });
    b.deco('sign', 5, { text: 'TRAIL TO SCHOOL' }).deco('sage', [1, 14, 33, 52, 67, 92, 108, 126, 148, 160]).deco('oak', [20, 62, 98, 140]);
    b.ground(0, 24).water(25, 29).shelf(25, 26, GROUND).shelf(28, 29, GROUND);     // log bridge with a gap
    b.stars(8, 12, 8).stars(26, 28, 8);
    b.ground(30, 58).block(34, 8, 35, 9).stars(31, 33, 7);
    b.shelf(38, 47, 5).ladder(40, 5, 9).stars(39, 46, 4).item('paw', 47, 4);         // up the rope ladder to a rock shelf
    b.enemy('lizard', [44, 55]).enemy('cactus', [51]).stars(49, 53, 6);
    b.water(59, 63).block(61, GROUND, 61, H - 1).stars(59, 63, 8);                   // stepping stone over the creek
    b.ground(64, 100).spring(70).starCol(70, 3, 6).shelf(73, 80, 3).stars(73, 79, 2).item('paw', 80, 2);
    b.enemy('lizard', [76, 82]).item('orange', 66, 8);
    b.nook(86);                                                                      // crates hide paw #3
    b.checkpoint(93).enemy('gull', [97], 5);
    b.water(101, 104).shelf(101, 104, 8).stars(101, 104, 7);                         // a floating log
    b.ground(105, 175).ladder(111, 6, 9).block(112, 6, 120, 9).stars(113, 119, 5);    // up onto the cliff
    b.enemy('lizard', [114, 118], 5).enemy('cactus', [124]).enemy('gull', [130], 4).enemy('gull', [144], 5);
    b.spring(135).shelf(138, 146, 3).stars(138, 145, 2).item('orange', 146, 2);
    b.enemy('lizard', [150, 157]).block(160, 8, 161, 9).stars(152, 158, 8);
    return b.finish(169);
  }

  // ---- 2: Playground & Lunch — blacktop, lunch tables, the play structure, the field ----
  function playground() {
    var b = new Builder(170, { name: '2', title: 'PLAYGROUND & LUNCH', theme: 'school', hint: 'WATCH OUT FOR LUNCH-STEALING GULLS' });
    b.ground(0, 169);
    b.deco('sign', 4, { text: 'SAGE CANYON SCHOOL', blue: true }).deco('coyotesign', 14).deco('flags', 30).deco('palm', [40, 96, 150]);
    b.deco('hopscotch', 44).deco('tether', [52, 57, 128]).deco('shade', [60, 78]).deco('banner', 100, { n: 8, y: 34 });
    // blacktop
    b.stars(8, 12, 8).crates(22, 8, 22, 9).stars(21, 23, 6).enemy('ball', [27, 37, 49]).block(34, 9, 35, 9).stars(38, 44, 8);
    // lunch area: hop the tables, bounce up to the shade roof
    [62, 68, 74, 80, 86].forEach(function (x) { b.shelf(x, x + 2, 8).stars(x, x + 2, 7); });
    b.item('orange', 75, 6).spring(72).shelf(78, 88, 4).stars(78, 87, 3).item('paw', 88, 3);
    b.enemy('gull', [66, 90], 5).enemy('gull', [79], 6);
    b.checkpoint(97);
    // play structure: ladders and decks
    b.shelf(100, 110, 6).ladder(100, 6, 9).stars(101, 107, 5).shelf(104, 112, 3).ladder(108, 3, 5).stars(104, 111, 2).item('paw', 112, 2);
    b.enemy('ball', [104, 115]).block(118, 7, 118, 9);
    // the field
    b.stars(122, 126, 8).enemy('ball', [126, 140, 152]).spring(132).starCol(132, 3, 6);
    b.nook(140).enemy('gull', [148], 4).stars(146, 156, 8);
    return b.finish(163);
  }

  // ---- 3: Library & STEAM Lab — bookshelves, rolling ladders, robots and slime ----
  function library() {
    var b = new Builder(176, { name: '3', title: 'LIBRARY & STEAM LAB', theme: 'library', hint: 'COACH COYOTE IS WAITING AT THE ASSEMBLY' });
    b.ground(0, 175);
    b.deco('poster', 6, { text: 'READ!' }).deco('readnook', 30).deco('globe', 48).deco('poster', 98, { text: 'STEAM', color: '#d84040' });
    b.deco('lab', [104, 124]).deco('poster', 140, { text: 'GO COYOTES', color: '#2a64b8' }).deco('banner', 150, { n: 8, y: 34 }).deco('coyotesign', 158);
    // library stacks
    b.shelf(10, 22, 4).ladder(12, 4, 9).stars(10, 21, 3);
    b.block(24, 3, 24, 7).stars(23, 25, 9);                                          // a shelf to duck under
    b.enemy('robot', [20, 34]).spring(40).shelf(43, 52, 3).stars(43, 51, 2).item('paw', 52, 2);
    b.shelf(56, 62, 7).shelf(64, 70, 5).stars(56, 62, 6).stars(64, 70, 4).enemy('robot', [60, 73]);
    b.nook(78).item('orange', 70, 4);
    b.checkpoint(86);
    // STEAM lab: spilled goo, lab benches, hopping slime
    b.water(94, 96).stars(93, 97, 7).block(100, 8, 101, 9).enemy('slime', [104, 112, 127]);
    b.shelf(106, 116, 4).ladder(108, 4, 9).stars(106, 115, 3);
    b.water(118, 121).shelf(117, 122, 7).stars(117, 122, 6).item('orange', 129, 8);
    b.enemy('robot', [131, 139]).spring(134).shelf(136, 142, 3).stars(136, 141, 2).item('paw', 142, 2);
    b.shelf(148, 151, 7).shelf(154, 157, 5).stars(148, 151, 6).stars(154, 157, 4).enemy('slime', [152]);
    return b.finish(167);
  }

  window.Levels = [canyon(), playground(), library()];
})();
