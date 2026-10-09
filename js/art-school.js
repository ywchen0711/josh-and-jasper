/*
 * World 2 art: the walk to school through the canyon, and a California elementary school campus
 * (inspired by Sage Canyon School in Carmel Valley, San Diego: coastal sage scrub canyon next door,
 *  single-story stucco buildings with outdoor walkways, blacktop, lunch tables, blue & grey school colors).
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
  var GULL_UP = pad([
    '.GG..........GG.',
    '..GGG......GGG..',
    '...GGGG..GGGG...',
    '....GWWWWWWG....',
    '.YKWWWWWWWWWGG..',
    'YY..WWWWWWWW.G..',
    '......WWWW......',
    '................', '................', '................', '................', '................'
  ]);
  var GULL_DOWN = pad([
    '................',
    '................',
    '................',
    '....GWWWWWWG....',
    '.YKWWWWWWWWWGG..',
    'YY.GWWWWWWWGG...',
    '..GGG.WWWW.GGG..',
    '.GG.........GG..',
    '................', '................', '................', '................'
  ]);
  var BALL = [
    '................',
    '.....RRRRRR.....',
    '...RRRRRRRRRR...',
    '..RRLLRRRRRRRR..',
    '.RRLLRRRRRRRRRR.',
    '.RRRRRRRRRRRRRR.',
    'RRRRRRRRRRRRRRRR',
    'RDDDDDDDDDDDDDDR',
    'RRRRRRRRRRRRRRRR',
    '.RRRRRRRRRRRRRR.',
    '.RRRRRRRRRRRRDR.',
    '..RRRRRRRRRRDD..',
    '...RRRRRRRRRR...',
    '.....RRRRRR.....',
    '................',
    '................'
  ];
  var LIZARD1 = pad(['..BBB...........', '.BKBBB.B..B.....', 'BBBBBBBBBBBBBTT.', '.BNNNNNNBBBB..TT', '..f..f...f..f...', '................']);
  var LIZARD2 = pad(['..BBB...........', '.BKBBB.B..B.....', 'BBBBBBBBBBBBBTT.', '.BNNNNNNBBBB.TT.', '.f..f...f..f....', '................']);
  var CACTUS = [
    '......F.........',
    '.....PPPPF......',
    '.....PPsPPP.....',
    '.....PPPPsP.....',
    '..PPP.PPPP......',
    '.PPsPPPPPP.PPP..',
    '.PPPPPPPPPPPsPP.',
    '..PPPPPPPPPPPP..',
    '....PPPPPPPP....',
    '....PPPPsPPP....',
    '.....PPPPPP.....',
    '.....PPPPPP.....',
    '......PPPP......',
    '......PPPP......',
    '......PPPP......',
    '......PPPP......'
  ];
  var APPLE = [
    '................',
    '.......t.ll.....',
    '.......tlll.....',
    '....RRRtRRR.....',
    '...RRRRRRRRRR...',
    '..RRLRRRRRRRRR..',
    '..RLLRRRRRRRRR..',
    '..RRRRRRRRRRRR..',
    '..RRRRRRRRRRRR..',
    '..RRRRRRRRRRRR..',
    '...RRRRRRRRRR...',
    '...RRRRRRRRRR...',
    '....RRRRRRRR....',
    '.....RR..RR.....',
    '................',
    '................'
  ];

  // ======================= tile sets =======================
  function pipeTiles(body, light, dark, lid) {
    function part(top, left) {
      return tile(function (g) {
        var x0 = top ? 0 : (left ? 2 : 0), w = top ? T : T - 2;
        g.fillStyle = top ? lid : body; g.fillRect(x0, 0, w, T);
        g.fillStyle = light; if (left) g.fillRect(x0 + 2, 0, 3, T);
        g.fillStyle = dark;
        if (left) g.fillRect(x0, 0, 1, T); else g.fillRect(x0 + w - 1, 0, 1, T);
        if (top) { g.fillRect(0, 0, T, 1); g.fillRect(0, T - 1, T, 1); }
        if (!top && !left) {                   // recycling arrows on the bin
          g.fillStyle = '#ffffff'; g.fillRect(2, 6, 4, 1); g.fillRect(5, 6, 1, 4); g.fillRect(2, 9, 4, 1);
        }
      });
    }
    return { '[': part(true, true), ']': part(true, false), '{': part(false, true), '}': part(false, false) };
  }
  function question(face, light, dark, mark) {
    return tile(function (g) {
      g.fillStyle = face; g.fillRect(0, 0, T, T);
      bevel(g, light, dark);
      g.fillStyle = mark;
      g.fillRect(6, 3, 4, 2); g.fillRect(10, 4, 2, 4); g.fillRect(8, 7, 2, 2); g.fillRect(7, 9, 2, 2); g.fillRect(7, 12, 2, 2);
    });
  }

  Art.buildSchool = function (a) {
    a.gull = [sprite(GULL_UP, { G: '#9aa4b0', W: '#ffffff', Y: '#f0b020', K: '#000' }), sprite(GULL_DOWN, { G: '#9aa4b0', W: '#ffffff', Y: '#f0b020', K: '#000' })];
    a.ball = sprite(BALL, { R: '#e03a3a', L: '#ff9a9a', D: '#a01818' });
    var lz = { B: '#9a7a48', K: '#000', N: '#3a6ad0', T: '#7a5a30', f: '#5a4020' };
    a.lizard = [sprite(LIZARD1, lz), sprite(LIZARD2, lz)];
    a.cactus = sprite(CACTUS, { P: '#4a9a4a', s: '#f0f0c0', F: '#e04aa0' });
    a.apple = sprite(APPLE, { t: '#5a3418', l: '#3cbc3c', R: '#d82828', L: '#ff8a8a' });

    a.tilesets = a.tilesets || {};
    // ---- the canyon trail: sandstone, crumbly rock, sage on top ----
    a.tilesets.canyon = {
      tiles: Object.assign({}, a.tiles, {
        '#': tile(function (g) {
          g.fillStyle = '#d8b07a'; g.fillRect(0, 0, T, T);
          g.fillStyle = '#c09060'; g.fillRect(0, 5, T, 1); g.fillRect(0, 11, T, 1);
          speckle(g, ['#b8885a', '#ecc898', '#a87850'], 14, 7);
        }),
        'B': tile(function (g) {
          g.fillStyle = '#7a5a3a'; g.fillRect(0, 0, T, T);
          [[0, 0, 7, 7], [8, 0, 8, 7], [0, 8, 4, 8], [5, 8, 7, 8], [13, 8, 3, 8]].forEach(function (r) {
            g.fillStyle = '#c8945a'; g.fillRect(r[0], r[1], r[2] - 1, r[3] - 1);
            g.fillStyle = '#e8b880'; g.fillRect(r[0], r[1], r[2] - 1, 1);
          });
        }),
        'X': tile(function (g) {
          g.fillStyle = '#9a8a78'; g.fillRect(0, 0, T, T); bevel(g, '#c8b8a4', '#5a4a3a');
          speckle(g, ['#857563', '#b0a090'], 10, 11);
        })
      }, pipeTiles('#7a5a30', '#a07a48', '#3a2810', '#8a6a3a')),   // hollow logs
      question: [question('#f0b020', '#fff3b0', '#8a5a10', '#7a3a08'), question('#e09a18', '#fff3b0', '#8a5a10', '#7a3a08'), question('#c8820e', '#fff3b0', '#8a5a10', '#7a3a08')],
      top: tile(function (g) {                      // sage scrub and dry grass on the trail
        g.fillStyle = '#8aa070'; g.fillRect(0, 0, T, 3);
        g.fillStyle = '#6a8058'; g.fillRect(0, 3, T, 1);
        g.fillStyle = '#c8b070'; for (var x = 1; x < T; x += 4) g.fillRect(x, 0, 1, 2);
      }),
      item: 'acorn'
    };
    // ---- the school: blacktop, books, blue & grey ----
    a.tilesets.school = {
      tiles: Object.assign({}, a.tiles, {
        '#': tile(function (g) {
          g.fillStyle = '#4a4a54'; g.fillRect(0, 0, T, T);
          speckle(g, ['#5a5a66', '#3a3a44', '#6a6a76'], 18, 5);
        }),
        'B': tile(function (g) {                    // a stack of library books
          var cols = ['#d84040', '#3a7ad8', '#3cbc5c', '#f0c030', '#9a50d0', '#f08a30'];
          g.fillStyle = '#6a4020'; g.fillRect(0, 0, T, T);
          for (var i = 0; i < 4; i++) {
            g.fillStyle = cols[i % cols.length]; g.fillRect(1, 1 + i * 4, 14 - (i % 2) * 2, 3);
            g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(3, 2 + i * 4, 4, 1);
          }
        }),
        'X': tile(function (g) {                    // blue lunch-table block (school colors)
          g.fillStyle = '#2a64b8'; g.fillRect(0, 0, T, T); bevel(g, '#6aa0e8', '#163a70');
          g.fillStyle = '#9aa4b0'; g.fillRect(3, 3, 10, 10);
          g.fillStyle = '#c0c8d0'; g.fillRect(3, 3, 10, 1);
        }),
        'U': tile(function (g) { g.fillStyle = '#6a7480'; g.fillRect(0, 0, T, T); bevel(g, '#9aa4b0', '#3a4450'); })
      }, pipeTiles('#2a64b8', '#6aa0e8', '#163a70', '#9aa4b0')),   // blue recycling bins
      question: [question('#3a7ad8', '#a8ccff', '#163a70', '#ffffff'), question('#2f6cc8', '#a8ccff', '#163a70', '#ffffff'), question('#2660b0', '#a8ccff', '#163a70', '#e0e8ff')],
      top: tile(function (g) {                      // concrete edge of the blacktop
        g.fillStyle = '#c8c8c0'; g.fillRect(0, 0, T, 2);
        g.fillStyle = '#8a8a88'; g.fillRect(0, 2, T, 1);
      }),
      item: 'apple'
    };
  };

  // ======================= backgrounds =======================
  var baseBackground = Art.drawBackground;
  function hills(g, camX, speed, spacing, r, color, base, w) {
    var off = camX * speed;
    for (var i = Math.floor(off / spacing) - 1; i < (off + w) / spacing + 1; i++) {
      var x = i * spacing - off + ((i * 37) % 23), rr = r + ((i * 13) % 3) * 8;
      g.fillStyle = color; g.beginPath(); g.ellipse(x, base, rr * 1.6, rr, 0, Math.PI, 0); g.fill();
    }
  }
  function sageDots(g, camX, speed, base, w) {
    var off = camX * speed;
    for (var i = Math.floor(off / 23) - 1; i < (off + w) / 23 + 1; i++) {
      var x = i * 23 - off + ((i * 17) % 11);
      g.fillStyle = i % 3 ? '#7a9068' : '#9aac80';
      g.beginPath(); g.ellipse(x, base - ((i * 7) % 5), 7, 4, 0, 0, Math.PI * 2); g.fill();
    }
  }
  function building(g, x, base) {
    // a single-story stucco classroom wing with a covered walkway (blue trim)
    g.fillStyle = '#e8dcc0'; g.fillRect(x, base - 34, 120, 34);
    g.fillStyle = '#8a929c'; g.fillRect(x - 6, base - 40, 132, 7);        // roof edge
    g.fillStyle = '#2a64b8'; g.fillRect(x - 6, base - 34, 132, 2);        // blue fascia
    for (var i = 0; i < 4; i++) {
      g.fillStyle = '#2a64b8'; g.fillRect(x + 8 + i * 30, base - 22, 10, 22);   // blue doors
      g.fillStyle = '#9ad0f0'; g.fillRect(x + 21 + i * 30, base - 26, 6, 8);    // windows
      g.fillStyle = '#4a4a54'; g.fillRect(x + i * 30 - 1, base - 32, 2, 32);    // walkway posts
    }
  }
  Art.drawBackground = function (g, camX, w, h, theme) {
    if (theme === 'canyon') {
      g.fillStyle = '#a8d8f0'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#fff4c0'; g.beginPath(); g.arc(60 - camX * 0.02 % 400, 40, 14, 0, Math.PI * 2); g.fill();   // morning sun
      hills(g, camX, 0.15, 160, 46, '#b8c0a4', 170, w);    // far canyon walls
      hills(g, camX, 0.35, 120, 34, '#9aa88a', 172, w);
      sageDots(g, camX, 0.5, 150, w);
      return;
    }
    if (theme === 'school') {
      g.fillStyle = '#7cc4f4'; g.fillRect(0, 0, w, h);
      hills(g, camX, 0.15, 170, 40, '#a8b49a', 165, w);    // the canyon behind the campus
      var off = camX * 0.5;
      for (var i = Math.floor(off / 200) - 1; i < (off + w) / 200 + 1; i++) {
        var x = i * 200 - off;
        building(g, x + 20, 160);
        g.fillStyle = '#6a5a40'; g.fillRect(x + 168, 104, 3, 56);                // eucalyptus
        g.fillStyle = '#8aa890'; g.beginPath(); g.ellipse(x + 170, 100, 16, 24, 0, 0, Math.PI * 2); g.fill();
      }
      return;
    }
    baseBackground(g, camX, w, h, theme);
  };

  // ======================= decorations (world space, behind tiles) =======================
  function tinyText(g, str, x, y, color) {
    g.font = '5px "Press Start 2P", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = color; g.fillText(str, x, y);
  }
  Art.drawDeco = function (g, d, x, ground, frame) {
    switch (d.kind) {
      case 'sage':                                   // coastal sage bush with purple flowers
        g.fillStyle = '#8aa070'; g.beginPath(); g.ellipse(x + 10, ground - 6, 12, 7, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#a8b890'; g.beginPath(); g.ellipse(x + 6, ground - 9, 6, 4, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#a070c8'; g.fillRect(x + 4, ground - 13, 2, 2); g.fillRect(x + 13, ground - 12, 2, 2); g.fillRect(x + 9, ground - 15, 2, 2);
        break;
      case 'oak':
        g.fillStyle = '#5a4028'; g.fillRect(x + 14, ground - 30, 5, 30);
        g.fillStyle = '#4a6a38'; g.beginPath(); g.ellipse(x + 16, ground - 38, 24, 14, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#5a7a44'; g.beginPath(); g.ellipse(x + 8, ground - 42, 12, 8, 0, 0, Math.PI * 2); g.fill();
        break;
      case 'fence':
        g.fillStyle = '#8a6a44';
        for (var i = 0; i < 4; i++) g.fillRect(x + i * 14, ground - 16, 3, 16);
        g.fillRect(x, ground - 14, 46, 2); g.fillRect(x, ground - 8, 46, 2);
        break;
      case 'sign':                                   // trail / school sign
        g.fillStyle = '#6a4a2a'; g.fillRect(x + 14, ground - 22, 3, 22);
        var sw = Math.max(40, (d.text || '').length * 5 + 8);
        g.fillStyle = d.blue ? '#2a64b8' : '#9a6a3a'; g.fillRect(x + 15 - sw / 2, ground - 34, sw, 13);
        g.strokeStyle = d.blue ? '#e8eef8' : '#5a3a1a'; g.strokeRect(x + 15.5 - sw / 2, ground - 33.5, sw - 1, 12);
        tinyText(g, d.text || '', x + 15, ground - 27, '#ffffff');
        break;
      case 'tether':                                 // tetherball
        g.fillStyle = '#c0c0c0'; g.fillRect(x + 8, ground - 44, 2, 44);
        var sw2 = Math.sin(frame / 20) * 10;
        g.strokeStyle = '#ffffff'; g.beginPath(); g.moveTo(x + 9, ground - 44); g.lineTo(x + 9 + sw2, ground - 26); g.stroke();
        g.fillStyle = '#f0d020'; g.beginPath(); g.arc(x + 9 + sw2, ground - 23, 4, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#f0f0f0'; g.beginPath(); g.arc(x + 9, ground, 18, Math.PI, 0); g.stroke();
        break;
      case 'hopscotch':                              // painted on the blacktop
        g.strokeStyle = '#f0e060'; g.lineWidth = 1;
        for (i = 0; i < 5; i++) g.strokeRect(x + i * 9 + 0.5, ground + 4.5, 8, 6);
        tinyText(g, '1 2 3 4 5', x + 22, ground + 13, '#f0e060');
        break;
      case 'shade':                                  // lunch shade structure
        g.fillStyle = '#2a64b8'; g.fillRect(x + 4, ground - 44, 3, 44); g.fillRect(x + 70, ground - 44, 3, 44);
        g.fillStyle = '#c0c8d0'; g.beginPath(); g.moveTo(x - 6, ground - 42); g.lineTo(x + 38, ground - 56); g.lineTo(x + 82, ground - 42); g.fill();
        g.fillStyle = '#2a64b8'; g.fillRect(x + 14, ground - 12, 48, 3); g.fillRect(x + 20, ground - 9, 2, 9); g.fillRect(x + 54, ground - 9, 2, 9);
        g.fillRect(x + 14, ground - 6, 48, 2);
        break;
      case 'playground':                             // play structure with a slide
        g.fillStyle = '#e04040'; g.fillRect(x, ground - 48, 3, 48); g.fillRect(x + 30, ground - 48, 3, 48);
        g.fillStyle = '#3a7ad8'; g.beginPath(); g.moveTo(x - 4, ground - 46); g.lineTo(x + 16, ground - 60); g.lineTo(x + 37, ground - 46); g.fill();
        g.fillStyle = '#f0c030'; g.fillRect(x, ground - 26, 33, 4);
        g.fillStyle = '#3cbc5c'; g.beginPath(); g.moveTo(x + 33, ground - 26); g.lineTo(x + 60, ground - 2); g.lineTo(x + 60, ground); g.lineTo(x + 52, ground); g.lineTo(x + 33, ground - 20); g.fill();
        g.fillStyle = '#ffffff'; for (i = 0; i < 5; i++) g.fillRect(x + 4, ground - 22 + i * 5, 6, 1);
        break;
      case 'flags':                                  // US flag and California flag
        g.fillStyle = '#d0d0d0'; g.fillRect(x + 8, ground - 72, 2, 72);
        var fy = ground - 70;
        for (i = 0; i < 7; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#c8202a'; g.fillRect(x + 10, fy + i * 2, 22, 2); }
        g.fillStyle = '#20307a'; g.fillRect(x + 10, fy, 10, 8);
        g.fillStyle = '#ffffff'; g.fillRect(x + 10, fy + 20, 22, 12);   // California: white, red stripe, bear, star
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
      case 'bikes':                                  // bike rack
        g.fillStyle = '#9aa4b0'; g.fillRect(x, ground - 8, 40, 2);
        for (i = 0; i < 3; i++) {
          g.strokeStyle = ['#e04040', '#3a7ad8', '#3cbc5c'][i]; g.beginPath();
          g.arc(x + 6 + i * 13, ground - 5, 4, 0, Math.PI * 2); g.arc(x + 14 + i * 13, ground - 5, 4, 0, Math.PI * 2); g.stroke();
        }
        break;
      case 'garden':                                 // STEAM garden boxes
        g.fillStyle = '#8a5a30'; g.fillRect(x, ground - 8, 40, 8);
        for (i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#3cbc3c' : '#f05a5a'; g.fillRect(x + 3 + i * 6, ground - 13 + (i % 2) * 2, 4, 5); }
        tinyText(g, 'STEAM', x + 20, ground - 4, '#fff6d0');
        break;
    }
  };

  // ======================= goals =======================
  Art.drawGoalBuilding = function (g, kind, x, ground) {
    if (kind === 'gate') {                           // back gate of the school at the end of the trail
      g.fillStyle = '#4a4a54';
      for (var i = 0; i < 6; i++) g.fillRect(x + i * 12, ground - 40, 2, 40);
      g.fillRect(x, ground - 40, 62, 3); g.fillRect(x, ground - 20, 62, 2);
      g.fillStyle = '#2a64b8'; g.fillRect(x + 6, ground - 58, 52, 14);
      tinyText(g, 'SCHOOL', x + 32, ground - 51, '#ffffff');
      return;
    }
    // the school front: building, sign and bell
    var y = ground - 64;
    g.fillStyle = '#e8dcc0'; g.fillRect(x, y + 12, 96, 52);
    g.fillStyle = '#8a929c'; g.fillRect(x - 8, y + 4, 112, 10);
    g.fillStyle = '#2a64b8'; g.fillRect(x - 8, y + 12, 112, 3);
    g.fillStyle = '#2a64b8'; g.fillRect(x + 36, ground - 30, 24, 30);
    g.fillStyle = '#9ad0f0'; g.fillRect(x + 10, y + 26, 16, 12); g.fillRect(x + 70, y + 26, 16, 12);
    g.fillStyle = '#2a64b8'; g.fillRect(x + 6, y - 14, 84, 16);
    g.fillStyle = '#ffffff'; g.font = '6px "Press Start 2P", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('SAGE CANYON', x + 48, y - 6);
    g.fillStyle = '#c8a030'; g.beginPath(); g.arc(x + 48, y + 22, 5, Math.PI, 0); g.fill(); g.fillRect(x + 43, y + 22, 10, 2);   // bell
  };
})();
