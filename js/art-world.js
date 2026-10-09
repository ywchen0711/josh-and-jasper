/*
 * Art for the Sage Canyon adventure: three themes (canyon, school, library), the Coach Coyote mascot,
 * enemies, collectibles, decorations and backgrounds. Everything is drawn in code.
 * Setting inspired by Sage Canyon School (San Diego, Carmel Valley): coastal sage canyon next door,
 * blue & grey school colors, the Coyotes.
 */
(function () {
  'use strict';
  var T = 16;

  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function fit(row, w) { return (row + '                ').slice(0, w).replace(/ /g, '.'); }
  function sprite(rows, pal) {
    var c = canvas(16, rows.length), g = c.getContext('2d');
    rows.forEach(function (row, y) {
      fit(row, 16).split('').forEach(function (ch, x) {
        if (ch === '.' || !pal[ch]) return;
        g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1);
      });
    });
    return c;
  }
  function pad(rows) { while (rows.length < 16) rows.unshift('................'); return rows; }
  function tile(draw) { var c = canvas(T, T); draw(c.getContext('2d')); return c; }
  function bevel(g, light, dark) {
    g.fillStyle = light; g.fillRect(0, 0, T, 1); g.fillRect(0, 0, 1, T);
    g.fillStyle = dark; g.fillRect(0, T - 1, T, 1); g.fillRect(T - 1, 0, 1, T);
  }
  function speckle(g, colors, n, seed) {
    var s = seed || 3;
    for (var i = 0; i < n; i++) {
      s = (s * 9301 + 49297) % 233280;
      g.fillStyle = colors[s % colors.length];
      g.fillRect(s % 15, (s >> 4) % 15, 1, 1);
    }
  }

  // ======================= sprites =======================
  // Coach Coyote — the school mascot, in a blue jersey
  var COYOTE = [
    '...o.......o....',
    '..oto.....oto...',
    '..otto...otto...',
    '..ottffffftto...',
    '...offffffffo...',
    '..offfffffffo...',
    '..ofKffffKffo...',
    '..offffffffffo..',
    '...offwwwwffNN..',
    '....ofwwwwwwo...',
    '.....owwwwwo....',
    '....JJJJJJJJ....',
    '...JJJJWJJJJJ...',
    '..fJJJWWWJJJJf..',
    '..fJJJJWJJJJJf..',
    '...JJJJJJJJJJ.ff',
    '...JJJJJJJJJJff.',
    '....ffff.ffff...',
    '....fff...fff...',
    '....fff...fff...',
    '...KKKK..KKKK...'
  ];
  var COYOTE_WAVE = COYOTE.slice(0, 11).concat([
    'f...JJJJJJJJ....',
    'f..JJJJWJJJJJ...',
    '.fJJJJWWWJJJJf..',
    '..JJJJJWJJJJJf..'
  ], COYOTE.slice(15));
  var COYOTE_PAL = { o: '#5a4028', t: '#e8a0a0', f: '#c8a070', K: '#000000', w: '#f4ead8', N: '#202020', J: '#2a64b8', W: '#ffffff' };

  var GULL_UP = pad(['.GG..........GG.', '..GGG......GGG..', '...GGGG..GGGG...', '....GWWWWWWG....', '.YKWWWWWWWWWGG..', 'YY..WWWWWWWW.G..', '......WWWW......', '', '', '', '', '']);
  var GULL_DOWN = pad(['', '', '', '....GWWWWWWG....', '.YKWWWWWWWWWGG..', 'YY.GWWWWWWWGG...', '..GGG.WWWW.GGG..', '.GG.........GG..', '', '', '', '']);
  var BALL = ['', '.....RRRRRR.....', '...RRRRRRRRRR...', '..RRLLRRRRRRRR..', '.RRLLRRRRRRRRRR.', '.RRRRRRRRRRRRRR.', 'RRRRRRRRRRRRRRRR',
    'RDDDDDDDDDDDDDDR', 'RRRRRRRRRRRRRRRR', '.RRRRRRRRRRRRRR.', '.RRRRRRRRRRRRDR.', '..RRRRRRRRRRDD..', '...RRRRRRRRRR...', '.....RRRRRR.....', '', ''];
  var LIZARD1 = pad(['..BBB...........', '.BKBBB.B..B.....', 'BBBBBBBBBBBBBTT.', '.BNNNNNNBBBB..TT', '..f..f...f..f...', '']);
  var LIZARD2 = pad(['..BBB...........', '.BKBBB.B..B.....', 'BBBBBBBBBBBBBTT.', '.BNNNNNNBBBB.TT.', '.f..f...f..f....', '']);
  var CACTUS = ['......F.........', '.....PPPPF......', '.....PPsPPP.....', '.....PPPPsP.....', '..PPP.PPPP......', '.PPsPPPPPP.PPP..',
    '.PPPPPPPPPPPsPP.', '..PPPPPPPPPPPP..', '....PPPPPPPP....', '....PPPPsPPP....', '.....PPPPPP.....', '.....PPPPPP.....',
    '......PPPP......', '......PPPP......', '......PPPP......', '......PPPP......'];
  var ROBOT1 = ['', '......aa........', '.......a........', '...MMMMMMMMMM...', '...MLLLLLLLLM...', '...MLKLLLLKLM...', '...MLLLLLLLLM...',
    '...MMMMMMMMMM...', '....MMMMMMMM....', '..GMMMMMMMMMMG..', '..GMMRMMMMRMMG..', '....MMMMMMMM....', '...WW......WW...',
    '..WWWW....WWWW..', '..WWWW....WWWW..', ''];
  var ROBOT2 = ROBOT1.slice(0, 12).concat(['....WW....WW....', '...WWWW..WWWW...', '...WWWW..WWWW...', '']);
  var SLIME1 = pad(['......GGGG......', '....GGGGGGGG....', '...GGLGGGGGGG...', '..GGLLGGGGGGGG..', '..GGGKGGGGKGGG..', '.GGGGKGGGGKGGGG.',
    '.GGGGGGGGGGGGGG.', 'GGGGGGGGGGGGGGGG', 'GGGGGGGGGGGGGGGG', '.GGGGGGGGGGGGGG.']);
  var SLIME2 = pad(['', '', '.....GGGGGG.....', '...GGLGGGGGGG...', '..GGLLGKGGKGGG..', '.GGGGGGKGGKGGGG.', 'GGGGGGGGGGGGGGGG',
    'GGGGGGGGGGGGGGGG', 'GGGGGGGGGGGGGGGG', '.GGGGGGGGGGGGGG.']);
  var ORANGE = ['', '.......ll.......', '......lll.......', '.....OOOOOO.....', '....OOOOOOOO....', '...OOLOOOOOOO...',
    '...OLLOOOOOOO...', '...OOOOOOOOOO...', '...OOOOOOOOOO...', '...OOOOOOOOOO...', '....OOOOOOOO....', '.....OOOOOO.....', '', '', '', ''];

  // ======================= tiles per theme =======================
  function ladder(rail, rung) {
    return tile(function (g) {
      g.fillStyle = rail; g.fillRect(2, 0, 2, T); g.fillRect(12, 0, 2, T);
      g.fillStyle = rung; g.fillRect(2, 3, 12, 2); g.fillRect(2, 11, 12, 2);
    });
  }
  function plank(top, edge, legs) {      // one-way platform: only the top few pixels are drawn
    return tile(function (g) {
      g.fillStyle = top; g.fillRect(0, 0, T, 4);
      g.fillStyle = edge; g.fillRect(0, 4, T, 2);
      if (legs) { g.fillStyle = legs; g.fillRect(3, 6, 2, 10); g.fillRect(11, 6, 2, 10); }
    });
  }
  function springPad(base, top, coil) {
    return tile(function (g) {
      g.fillStyle = coil; for (var y = 7; y < 15; y += 3) g.fillRect(3, y, 10, 1);
      g.fillStyle = base; g.fillRect(1, 14, 14, 2);
      g.fillStyle = top; g.fillRect(0, 3, T, 4);
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(2, 3, 6, 1);
    });
  }
  function crate(face, dark, light, label) {
    return tile(function (g) {
      g.fillStyle = face; g.fillRect(0, 0, T, T);
      bevel(g, light, dark);
      g.fillStyle = dark;
      if (label === 'x') { for (var i = 1; i < 15; i++) { g.fillRect(i, i, 1, 1); g.fillRect(15 - i, i, 1, 1); } }
      else { g.fillRect(0, 7, T, 1); g.fillStyle = light; g.fillRect(5, 4, 6, 2); }
    });
  }
  function water(deep, light) {
    return tile(function (g) {
      g.fillStyle = deep; g.fillRect(0, 2, T, 14);
      g.fillStyle = light; g.fillRect(0, 2, T, 2); g.fillRect(3, 7, 4, 1); g.fillRect(10, 11, 4, 1);
    });
  }

  function buildTiles(a) {
    a.themes = {
      canyon: {
        '#': tile(function (g) {
          g.fillStyle = '#d8b07a'; g.fillRect(0, 0, T, T);
          g.fillStyle = '#c09060'; g.fillRect(0, 5, T, 1); g.fillRect(0, 11, T, 1);
          speckle(g, ['#b8885a', '#ecc898', '#a87850'], 14, 7);
        }),
        'X': tile(function (g) { g.fillStyle = '#9a8a78'; g.fillRect(0, 0, T, T); bevel(g, '#c8b8a4', '#5a4a3a'); speckle(g, ['#857563', '#b0a090'], 10, 11); }),
        '=': plank('#a07a48', '#6a4a28'),
        'H': ladder('#8a6a3a', '#c8a060'),
        'S': springPad('#5a4028', '#5a9a4a', '#3a6a2a'),
        'C': crate('#b07a40', '#6a4420', '#d8a060', 'x'),
        '~': water('#3a7ab8', '#8ac8f0'),
        top: tile(function (g) {
          g.fillStyle = '#8aa070'; g.fillRect(0, 0, T, 3);
          g.fillStyle = '#6a8058'; g.fillRect(0, 3, T, 1);
          g.fillStyle = '#c8b070'; for (var x = 1; x < T; x += 4) g.fillRect(x, 0, 1, 2);
        }),
        shot: '#7a4a20'                                // pinecone
      },
      school: {
        '#': tile(function (g) { g.fillStyle = '#4a4a54'; g.fillRect(0, 0, T, T); speckle(g, ['#5a5a66', '#3a3a44', '#6a6a76'], 18, 5); }),
        'X': tile(function (g) {
          g.fillStyle = '#2a64b8'; g.fillRect(0, 0, T, T); bevel(g, '#6aa0e8', '#163a70');
          g.fillStyle = '#9aa4b0'; g.fillRect(3, 3, 10, 10); g.fillStyle = '#c0c8d0'; g.fillRect(3, 3, 10, 1);
        }),
        '=': plank('#2a64b8', '#163a70', '#9aa4b0'),   // lunch tables / play decks
        'H': ladder('#e04040', '#f0c030'),
        'S': springPad('#163a70', '#3a7ad8', '#c0c8d0'),
        'C': crate('#c89a60', '#8a6a3a', '#e8c088', 'tape'),
        '~': water('#4a6a8a', '#9ab8d0'),
        top: tile(function (g) { g.fillStyle = '#c8c8c0'; g.fillRect(0, 0, T, 2); g.fillStyle = '#8a8a88'; g.fillRect(0, 2, T, 1); }),
        shot: '#f4f4f4'                                // paper ball
      },
      library: {
        '#': tile(function (g) {
          g.fillStyle = '#2a7a7a'; g.fillRect(0, 0, T, T);
          g.fillStyle = '#348a8a'; for (var i = 0; i < T; i += 4) g.fillRect(i, (i * 3) % T, 2, 2);
        }),
        'X': tile(function (g) { g.fillStyle = '#8a5a30'; g.fillRect(0, 0, T, T); bevel(g, '#b07a48', '#4a2a10'); g.fillStyle = '#6a4020'; g.fillRect(3, 7, 10, 1); g.fillRect(7, 9, 2, 2); }),
        '=': tile(function (g) {                       // bookshelf: shelf board with a row of books under it
          var cols = ['#d84040', '#3a7ad8', '#3cbc5c', '#f0c030', '#9a50d0', '#f08a30'];
          g.fillStyle = '#8a5a30'; g.fillRect(0, 0, T, 3);
          for (var i = 0; i < 5; i++) { g.fillStyle = cols[i]; g.fillRect(1 + i * 3, 4 + (i % 2), 2, 9 - (i % 2)); }
          g.fillStyle = '#6a4020'; g.fillRect(0, 13, T, 2);
        }),
        'H': ladder('#a07040', '#d0a070'),
        'S': springPad('#801818', '#e04848', '#f08080'),   // beanbag
        'C': crate('#7a8a9a', '#4a5a6a', '#aab8c8', 'tape'),  // book cart box
        '~': water('#3aa040', '#9af080'),               // spilled science goo
        top: tile(function (g) { g.fillStyle = '#e8dcc0'; g.fillRect(0, 0, T, 2); }),
        shot: '#ff9ab0'                                // eraser
      }
    };
  }

  Art.buildWorld = function (a) {
    a.coyote = [sprite(COYOTE, COYOTE_PAL), sprite(COYOTE_WAVE, COYOTE_PAL)];
    a.gull = [sprite(GULL_UP, { G: '#9aa4b0', W: '#ffffff', Y: '#f0b020', K: '#000' }), sprite(GULL_DOWN, { G: '#9aa4b0', W: '#ffffff', Y: '#f0b020', K: '#000' })];
    a.ball = [sprite(BALL, { R: '#e03a3a', L: '#ff9a9a', D: '#a01818' })];
    var lz = { B: '#9a7a48', K: '#000', N: '#3a6ad0', T: '#7a5a30', f: '#5a4020' };
    a.lizard = [sprite(LIZARD1, lz), sprite(LIZARD2, lz)];
    a.cactus = [sprite(CACTUS, { P: '#4a9a4a', s: '#f0f0c0', F: '#e04aa0' })];
    var rb = { M: '#9aa4b0', L: '#80e0ff', K: '#000', a: '#f04040', G: '#5a6470', R: '#f0c030', W: '#3a3a44' };
    a.robot = [sprite(ROBOT1, rb), sprite(ROBOT2, rb)];
    var sl = { G: '#6ad050', L: '#c0ffb0', K: '#000' };
    a.slime = [sprite(SLIME1, sl), sprite(SLIME2, sl)];
    a.orange = sprite(ORANGE, { O: '#f89020', L: '#ffc070', l: '#3cbc3c' });
    buildTiles(a);
  };

  // ======================= small drawn things =======================
  Art.drawStar = function (g, x, y, t, color) {
    var cx = x + 8, cy = y + 8, r = 6, s = 1 - Math.abs(Math.sin(t / 25)) * 0.35;
    g.fillStyle = '#8a5a08';
    g.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      g.lineTo(cx + Math.cos(a) * rr * s + 0.5, cy + Math.sin(a) * rr + 0.5);
    }
    g.fill();
    g.fillStyle = color || '#f8d030';
    g.beginPath();
    for (i = 0; i < 10; i++) {
      a = -Math.PI / 2 + i * Math.PI / 5; rr = i % 2 ? r * 0.45 : r;
      g.lineTo(cx + Math.cos(a) * rr * s, cy + Math.sin(a) * rr);
    }
    g.fill();
  };
  Art.drawPaw = function (g, x, y, t, size) {
    var cx = x + 8, cy = y + 8 + (t == null ? 0 : Math.sin(t / 15) * 1.5), k = (size || 16) / 16;
    g.fillStyle = '#163a70'; g.beginPath(); g.arc(cx, cy, 7.5 * k, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3a7ad8'; g.beginPath(); g.arc(cx, cy, 6.5 * k, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.ellipse(cx, cy + 2 * k, 2.6 * k, 2.1 * k, 0, 0, Math.PI * 2); g.fill();
    [[-3, -1.5], [-1, -3.5], [1.2, -3.5], [3.2, -1.5]].forEach(function (p) { g.beginPath(); g.arc(cx + p[0] * k, cy + p[1] * k, 1.1 * k, 0, Math.PI * 2); g.fill(); });
  };
  Art.drawHeart = function (g, x, y, full, color) {
    g.fillStyle = full ? (color || '#ff4060') : 'rgba(0,0,0,0.45)';
    g.fillRect(x + 1, y, 2, 1); g.fillRect(x + 4, y, 2, 1);
    g.fillRect(x, y + 1, 7, 2); g.fillRect(x + 1, y + 3, 5, 1); g.fillRect(x + 2, y + 4, 3, 1); g.fillRect(x + 3, y + 5, 1, 1);
  };
  Art.drawCheckpoint = function (g, x, ground, reached, t) {
    g.fillStyle = '#c0c0c0'; g.fillRect(x + 7, ground - 40, 2, 40);
    var wave = Math.sin(t / 8) * 1.5;
    g.fillStyle = reached ? '#f0c030' : '#2a64b8';
    g.beginPath(); g.moveTo(x + 9, ground - 40); g.lineTo(x + 25, ground - 35 + wave); g.lineTo(x + 9, ground - 29); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x + 15, ground - 35, 2, 0, Math.PI * 2); g.fill();
  };
  Art.drawShot = function (g, x, y, color) {
    g.fillStyle = '#000'; g.fillRect(x - 3, y - 2, 6, 5); g.fillRect(x - 2, y - 3, 4, 7);
    g.fillStyle = color; g.fillRect(x - 2, y - 2, 4, 4);
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(x - 1, y - 2, 1, 1);
  };
  Art.drawDizzy = function (g, x, y, t) {
    for (var i = 0; i < 3; i++) {
      var a = t / 8 + i * 2.1;
      g.fillStyle = '#f8f060'; g.fillRect(Math.round(x + 8 + Math.cos(a) * 7), Math.round(y - 3 + Math.sin(a) * 2), 2, 2);
    }
  };

  // ======================= backgrounds =======================
  function hills(g, camX, speed, spacing, r, color, base, w) {
    var off = camX * speed;
    for (var i = Math.floor(off / spacing) - 1; i < (off + w) / spacing + 1; i++) {
      var x = i * spacing - off + ((i * 37) % 23), rr = r + ((i * 13 % 3) + 3) % 3 * 8;
      g.fillStyle = color; g.beginPath(); g.ellipse(x, base, rr * 1.6, rr, 0, Math.PI, 0); g.fill();
    }
  }
  function sageDots(g, camX, speed, base, w) {
    var off = camX * speed;
    for (var i = Math.floor(off / 23) - 1; i < (off + w) / 23 + 1; i++) {
      var x = i * 23 - off + ((i * 17 % 11) + 11) % 11;
      g.fillStyle = i % 3 ? '#7a9068' : '#9aac80';
      g.beginPath(); g.ellipse(x, base - (((i * 7) % 5) + 5) % 5, 7, 4, 0, 0, Math.PI * 2); g.fill();
    }
  }
  function building(g, x, base) {
    g.fillStyle = '#e8dcc0'; g.fillRect(x, base - 34, 120, 34);
    g.fillStyle = '#8a929c'; g.fillRect(x - 6, base - 40, 132, 7);
    g.fillStyle = '#2a64b8'; g.fillRect(x - 6, base - 34, 132, 2);
    for (var i = 0; i < 4; i++) {
      g.fillStyle = '#2a64b8'; g.fillRect(x + 8 + i * 30, base - 22, 10, 22);
      g.fillStyle = '#9ad0f0'; g.fillRect(x + 21 + i * 30, base - 26, 6, 8);
      g.fillStyle = '#4a4a54'; g.fillRect(x + i * 30 - 1, base - 32, 2, 32);
    }
  }
  Art.drawBackground = function (g, camX, w, h, theme) {
    if (theme === 'school') {
      g.fillStyle = '#7cc4f4'; g.fillRect(0, 0, w, h);
      hills(g, camX, 0.15, 170, 40, '#a8b49a', 165, w);
      var off = camX * 0.5;
      for (var i = Math.floor(off / 200) - 1; i < (off + w) / 200 + 1; i++) {
        var x = i * 200 - off;
        building(g, x + 20, 160);
        g.fillStyle = '#6a5a40'; g.fillRect(x + 168, 104, 3, 56);
        g.fillStyle = '#8aa890'; g.beginPath(); g.ellipse(x + 170, 100, 16, 24, 0, 0, Math.PI * 2); g.fill();
      }
      return;
    }
    if (theme === 'library') {
      g.fillStyle = '#f0e2c4'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#d8c4a0'; g.fillRect(0, 128, w, 32);                    // wainscot
      off = camX * 0.6;
      for (i = Math.floor(off / 160) - 1; i < (off + w) / 160 + 1; i++) {
        x = i * 160 - off;
        g.fillStyle = '#9ad0f0'; g.fillRect(x + 12, 34, 36, 44);              // window with the canyon outside
        g.fillStyle = '#a8b49a'; g.fillRect(x + 12, 62, 36, 16);
        g.fillStyle = '#ffffff'; g.fillRect(x + 29, 34, 2, 44); g.fillRect(x + 12, 55, 36, 2);
        g.fillStyle = '#b08050'; g.fillRect(x + 70, 40, 70, 88);              // background bookshelf
        for (var r = 0; r < 4; r++) {
          for (var b = 0; b < 11; b++) {
            g.fillStyle = ['#c86060', '#6080c0', '#60a070', '#d0b050', '#9070b0'][(b + r * 2 + i) % 5];
            g.fillRect(x + 73 + b * 6, 44 + r * 21, 5, 17);
          }
          g.fillStyle = '#7a5030'; g.fillRect(x + 70, 61 + r * 21, 70, 3);
        }
      }
      return;
    }
    // canyon (default)
    g.fillStyle = '#a8d8f0'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff4c0'; g.beginPath(); g.arc(60, 40, 14, 0, Math.PI * 2); g.fill();
    hills(g, camX, 0.15, 160, 46, '#b8c0a4', 170, w);
    hills(g, camX, 0.35, 120, 34, '#9aa88a', 172, w);
    sageDots(g, camX, 0.5, 150, w);
  };

  // ======================= decorations =======================
  function tinyText(g, str, x, y, color, size) {
    g.font = (size || 5) + 'px "Press Start 2P", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = color; g.fillText(str, x, y);
  }
  Art.drawDeco = function (g, d, x, ground, frame, art) {
    var i;
    switch (d.kind) {
      case 'sage':
        g.fillStyle = '#8aa070'; g.beginPath(); g.ellipse(x + 10, ground - 6, 12, 7, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#a8b890'; g.beginPath(); g.ellipse(x + 6, ground - 9, 6, 4, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#a070c8'; g.fillRect(x + 4, ground - 13, 2, 2); g.fillRect(x + 13, ground - 12, 2, 2); g.fillRect(x + 9, ground - 15, 2, 2);
        break;
      case 'oak':
        g.fillStyle = '#5a4028'; g.fillRect(x + 14, ground - 30, 5, 30);
        g.fillStyle = '#4a6a38'; g.beginPath(); g.ellipse(x + 16, ground - 38, 24, 14, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#5a7a44'; g.beginPath(); g.ellipse(x + 8, ground - 42, 12, 8, 0, 0, Math.PI * 2); g.fill();
        break;
      case 'sign':
        g.fillStyle = '#6a4a2a'; g.fillRect(x + 14, ground - 22, 3, 22);
        var sw = Math.max(40, (d.text || '').length * 5 + 8);
        g.fillStyle = d.blue ? '#2a64b8' : '#9a6a3a'; g.fillRect(x + 15 - sw / 2, ground - 34, sw, 13);
        g.strokeStyle = d.blue ? '#e8eef8' : '#5a3a1a'; g.strokeRect(x + 15.5 - sw / 2, ground - 33.5, sw - 1, 12);
        tinyText(g, d.text || '', x + 15, ground - 27, '#ffffff');
        break;
      case 'tether':
        g.fillStyle = '#c0c0c0'; g.fillRect(x + 8, ground - 44, 2, 44);
        var sw2 = Math.sin(frame / 20) * 10;
        g.strokeStyle = '#ffffff'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 9, ground - 44); g.lineTo(x + 9 + sw2, ground - 26); g.stroke();
        g.fillStyle = '#f0d020'; g.beginPath(); g.arc(x + 9 + sw2, ground - 23, 4, 0, Math.PI * 2); g.fill();
        break;
      case 'hopscotch':
        g.strokeStyle = '#f0e060'; g.lineWidth = 1;
        for (i = 0; i < 5; i++) g.strokeRect(x + i * 9 + 0.5, ground + 4.5, 8, 6);
        break;
      case 'shade':
        g.fillStyle = '#2a64b8'; g.fillRect(x + 4, ground - 52, 3, 52); g.fillRect(x + 70, ground - 52, 3, 52);
        g.fillStyle = '#c0c8d0'; g.beginPath(); g.moveTo(x - 6, ground - 50); g.lineTo(x + 38, ground - 62); g.lineTo(x + 82, ground - 50); g.fill();
        break;
      case 'flags':
        g.fillStyle = '#d0d0d0'; g.fillRect(x + 8, ground - 72, 2, 72);
        var fy = ground - 70;
        for (i = 0; i < 7; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#c8202a'; g.fillRect(x + 10, fy + i * 2, 22, 2); }
        g.fillStyle = '#20307a'; g.fillRect(x + 10, fy, 10, 8);
        g.fillStyle = '#ffffff'; g.fillRect(x + 10, fy + 20, 22, 12);
        g.fillStyle = '#c8202a'; g.fillRect(x + 10, fy + 30, 22, 2); g.fillRect(x + 12, fy + 21, 2, 2);
        g.fillStyle = '#6a4020'; g.fillRect(x + 17, fy + 25, 9, 3); g.fillRect(x + 25, fy + 24, 3, 2);
        break;
      case 'palm':
        g.fillStyle = '#8a6a44'; g.fillRect(x + 10, ground - 70, 4, 70);
        g.fillStyle = '#3a8a3a';
        [-1, 1].forEach(function (s) {
          g.beginPath(); g.ellipse(x + 12 + s * 12, ground - 70, 14, 4, s * 0.4, 0, Math.PI * 2); g.fill();
          g.beginPath(); g.ellipse(x + 12 + s * 8, ground - 76, 10, 3, -s * 0.6, 0, Math.PI * 2); g.fill();
        });
        break;
      case 'banner':                                 // string of blue & grey pennants
        for (i = 0; i < (d.n || 6); i++) {
          g.fillStyle = i % 2 ? '#9aa4b0' : '#2a64b8';
          var px = x + i * 12, py = (d.y != null ? d.y : ground - 90) + Math.abs(i - (d.n || 6) / 2) * 1.5;
          g.beginPath(); g.moveTo(px, py); g.lineTo(px + 10, py); g.lineTo(px + 5, py + 9); g.fill();
        }
        g.strokeStyle = '#ffffff'; g.beginPath(); g.moveTo(x, (d.y != null ? d.y : ground - 90)); g.lineTo(x + (d.n || 6) * 12, (d.y != null ? d.y : ground - 90)); g.stroke();
        break;
      case 'poster':
        g.fillStyle = d.color || '#2a64b8'; g.fillRect(x, ground - (d.h || 70), 40, 26);
        g.fillStyle = '#ffffff'; g.fillRect(x + 2, ground - (d.h || 70) + 2, 36, 22);
        tinyText(g, d.text || 'READ!', x + 20, ground - (d.h || 70) + 13, d.color || '#2a64b8');
        break;
      case 'coyotesign':                             // GO COYOTES sign with the mascot's head
        g.fillStyle = '#2a64b8'; g.fillRect(x, ground - 58, 72, 26);
        g.strokeStyle = '#ffffff'; g.strokeRect(x + 1.5, ground - 56.5, 69, 23);
        if (art && art.coyote) g.drawImage(art.coyote[0], 0, 0, 16, 11, x + 4, ground - 54, 16, 11);
        tinyText(g, 'GO', x + 44, ground - 51, '#ffffff');
        tinyText(g, 'COYOTES!', x + 44, ground - 42, '#f0c030');
        g.fillStyle = '#4a4a54'; g.fillRect(x + 10, ground - 32, 3, 32); g.fillRect(x + 59, ground - 32, 3, 32);
        break;
      case 'globe':
        g.fillStyle = '#6a4020'; g.fillRect(x + 6, ground - 6, 6, 6); g.fillRect(x + 8, ground - 12, 2, 6);
        g.fillStyle = '#3a8ad8'; g.beginPath(); g.arc(x + 9, ground - 18, 7, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#5ac05a'; g.fillRect(x + 5, ground - 21, 4, 3); g.fillRect(x + 10, ground - 17, 3, 4);
        break;
      case 'lab':                                    // STEAM lab table with beakers
        g.fillStyle = '#4a4a54'; g.fillRect(x, ground - 16, 48, 4); g.fillRect(x + 3, ground - 12, 3, 12); g.fillRect(x + 42, ground - 12, 3, 12);
        [['#ff6aa0', 6], ['#6ad050', 18], ['#60c8ff', 30]].forEach(function (b, k) {
          var bub = Math.sin(frame / 10 + k) * 1.5;
          g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(x + b[1], ground - 28, 8, 12);
          g.fillStyle = b[0]; g.fillRect(x + b[1] + 1, ground - 23, 6, 6);
          g.fillRect(x + b[1] + 3, ground - 31 + bub, 2, 2);
        });
        break;
      case 'readnook':                               // rug and lamp
        g.fillStyle = '#d0603a'; g.fillRect(x, ground - 2, 60, 2);
        g.fillStyle = '#4a4a54'; g.fillRect(x + 50, ground - 36, 2, 36);
        g.fillStyle = '#f0e080'; g.beginPath(); g.moveTo(x + 44, ground - 36); g.lineTo(x + 58, ground - 36); g.lineTo(x + 54, ground - 44); g.lineTo(x + 48, ground - 44); g.fill();
        break;
    }
  };

  // Coach Coyote at the end of every level
  Art.drawCoach = function (g, art, x, ground, frame, cheering) {
    var img = art.coyote[cheering ? Math.floor(frame / 8) % 2 : (Math.floor(frame / 40) % 4 === 0 ? 1 : 0)];
    var hop = cheering ? Math.abs(Math.sin(frame / 6)) * 6 : 0;
    g.drawImage(img, x, ground - img.height - hop);
    // a small stand with the school colors
    g.fillStyle = '#9aa4b0'; g.fillRect(x - 8, ground - 2, 32, 2);
    tinyText(g, 'COACH', x + 8, ground - img.height - 8 - hop, '#2a64b8');
  };
})();
