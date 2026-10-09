/*
 * Pixel art — every sprite and tile is drawn in code (original art, no external assets).
 * Sprites are 16x16 character maps; '.' is transparent, every other letter is looked up in a palette.
 */
(function () {
  'use strict';
  var Art = window.Art = {};
  var T = 16;

  function canvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  function fit(row, w) { return (row + '                ').slice(0, w).replace(/ /g, '.'); }

  // character map + palette → canvas
  function sprite(rows, pal, w) {
    w = w || 16;
    var c = canvas(w, rows.length), g = c.getContext('2d');
    rows.forEach(function (row, y) {
      fit(row, w).split('').forEach(function (ch, x) {
        if (ch === '.' || !pal[ch]) return;
        g.fillStyle = pal[ch];
        g.fillRect(x, y, 1, 1);
      });
    });
    return c;
  }
  function flip(src) {
    var c = canvas(src.width, src.height), g = c.getContext('2d');
    g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
    return c;
  }
  Art.flip = flip;

  // ======================= the brothers =======================
  // C cap, c cap brim, H hair, S skin, K eye, M mouth, T shirt, P shorts, B shoes
  var HEAD = [
    '....CCCCCC......',
    '...CCCCCCCC.....',
    '...CCCCCCCcccc..',
    '...HHSSSSKS.....',
    '..HHSSSSSKSS....',
    '..HHSSSSSSSSS...',
    '...HSSSSMMS.....',
    '....SSSSSS......'
  ];
  var BODY = [
    '...TTTTTTTT.....',
    '..TTTTTTTTTT....',
    '.STTTTTTTTTTS...',
    '.SSPPPPPPPPSS...',
    '...PPPPPPPP.....'
  ];
  var LEGS = {
    stand: ['...PPP..PPP.....', '...SS....SS.....', '..BBB....BBB....'],
    walk1: ['...PPP..PPP.....', '..SS......SS....', '.BBB......BBB...'],
    walk2: ['....PPPPPP......', '.....SSSS.......', '....BBBBBB......'],
    jump:  ['..PPP....PPP....', '.SS........SS...', 'BBB.........BB..']
  };
  var JUMP_BODY = [
    'S..TTTTTTTT..S..',
    'S.TTTTTTTTTT.S..',
    '.TTTTTTTTTTTT...',
    '..SPPPPPPPPS....',
    '...PPPPPPPP.....'
  ];
  var BROTHERS = {
    josh:   { C: '#2e9e44', c: '#1d6e2e', H: '#5a3418', S: '#f6c79a', K: '#202020', M: '#b04030', T: '#46c460', P: '#2a4fa8', B: '#4a2a14' },
    jasper: { C: '#f08a24', c: '#b05a10', H: '#8a4a1c', S: '#f6c79a', K: '#202020', M: '#b04030', T: '#ffb347', P: '#24407a', B: '#3a2010' }
  };
  // the big form is the same kid, taller: torso and legs are stretched
  function tall(rows) {
    var map = [0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15];
    return map.map(function (i) { return rows[i]; });
  }
  function brother(pal) {
    var frames = {};
    Object.keys(LEGS).forEach(function (k) {
      var rows = HEAD.concat(k === 'jump' ? JUMP_BODY : BODY, LEGS[k]);
      var small = sprite(rows, pal), big = sprite(tall(rows), pal);
      frames[k] = { small: [small, flip(small)], big: [big, flip(big)] };
    });
    return frames;
  }

  // ======================= enemies & items =======================
  var BEETLE = [
    '................',
    '................',
    '................',
    '......DDDD......',
    '....DDPPPPDD....',
    '...DPPPLPPPPD...',
    '..DPPLLPPPPPPD..',
    '..DPPPPPPPPPPD..',
    '.DPPPPPPPPPPPPD.',
    '.DWWKDPPPPDWWKD.',
    '.DWWKDDDDDDWWKD.',
    '..DDDDDDDDDDDD..',
    '...dd.dd..dd.dd.',
    '..dd..dd..dd..dd',
    '................',
    '................'
  ];
  var BEETLE2 = BEETLE.slice(0, 12).concat(['..dd.dd..dd.dd..', '...dd..dd..dd...', '................', '................']);
  var HEDGEHOG = [
    '................',
    '................',
    '................',
    '................',
    '...s.s.s.s......',
    '..ssssssssss....',
    '.sGGGGGGGGGGs...',
    'sGGGGGGGGGGGGs..',
    '.GGGGGGGGGGGFFF.',
    'GGGGGGGGGGGFFKF.',
    'GGGGGGGGGGFFFFFn',
    '.GGGGGGGGGFFFF..',
    '..ff.ff..ff.ff..',
    '................',
    '................',
    '................'
  ];
  var HEDGEHOG2 = HEDGEHOG.slice(0, 12).concat(['.ff.ff..ff.ff...', '................', '................', '................']);
  var ACORN = [
    '................',
    '.......t........',
    '......tt........',
    '...cccccccccc...',
    '..cCcCcCcCcCcc..',
    '..cccccccccccc..',
    '...nnnnnnnnnn...',
    '...nNnnnnnnnnn..',
    '...nNnnnnnnnnn..',
    '....nnnnnnnnn...',
    '.....nnnnnnn....',
    '......nnnnn.....',
    '.......nnn......',
    '................',
    '................',
    '................'
  ];

  // ======================= tiles =======================
  function tile(draw) { var c = canvas(T, T); draw(c.getContext('2d')); return c; }
  function bricks(g, base, dark, mortar) {
    g.fillStyle = mortar; g.fillRect(0, 0, T, T);
    for (var y = 0; y < T; y += 4) {
      var off = (y / 4) % 2 ? 4 : 0;
      for (var x = -off; x < T; x += 8) {
        g.fillStyle = base; g.fillRect(Math.max(0, x), y, Math.min(7, x + 7) - Math.max(0, x), 3);
        g.fillStyle = dark; g.fillRect(Math.max(0, x), y + 2, Math.min(7, x + 7) - Math.max(0, x), 1);
      }
    }
  }
  function bevel(g, light, dark) {
    g.fillStyle = light; g.fillRect(0, 0, T, 1); g.fillRect(0, 0, 1, T);
    g.fillStyle = dark; g.fillRect(0, T - 1, T, 1); g.fillRect(T - 1, 0, 1, T);
  }
  function question(shade) {
    return tile(function (g) {
      g.fillStyle = shade; g.fillRect(0, 0, T, T);
      bevel(g, '#fff3b0', '#8a5a10');
      g.fillStyle = '#8a5a10';
      [[1, 1], [14, 1], [1, 14], [14, 14]].forEach(function (p) { g.fillRect(p[0], p[1], 1, 1); });
      g.fillStyle = '#7a3a08';   // "?"
      g.fillRect(6, 3, 4, 2); g.fillRect(10, 4, 2, 4); g.fillRect(8, 7, 2, 2); g.fillRect(7, 9, 2, 2); g.fillRect(7, 12, 2, 2);
      g.fillStyle = '#fff';
      g.fillRect(5, 3, 1, 2);
    });
  }
  function pipe(part) {
    return tile(function (g) {
      var top = part === 'tl' || part === 'tr', left = part === 'tl' || part === 'bl';
      var x0 = top ? 0 : (left ? 2 : 0), w = top ? T : T - 2;
      g.fillStyle = '#1e7a2a'; g.fillRect(x0, 0, w, T);
      g.fillStyle = '#4ccf4c'; g.fillRect(x0 + (left ? 2 : 0), 0, left ? 4 : 0, T);
      g.fillStyle = '#8af08a'; if (left) g.fillRect(x0 + 3, 0, 1, T);
      g.fillStyle = '#0e4a16';
      if (left) g.fillRect(x0, 0, 1, T); else g.fillRect(x0 + w - 1, 0, 1, T);
      if (top) { g.fillRect(0, 0, T, 1); g.fillRect(0, T - 1, T, 1); }
    });
  }

  Art.build = function () {
    var a = {};
    a.josh = brother(BROTHERS.josh);
    a.jasper = brother(BROTHERS.jasper);
    a.colors = { josh: BROTHERS.josh.T, jasper: BROTHERS.jasper.T };
    var bp = { D: '#3a1450', P: '#8a3ac8', L: '#c890f0', W: '#ffffff', K: '#000000', d: '#201020' };
    a.beetle = [sprite(BEETLE, bp), sprite(BEETLE2, bp)];
    var hp = { s: '#606070', G: '#3a3a48', F: '#d8a070', K: '#000', n: '#000', f: '#5a3418' };
    a.hedgehog = [sprite(HEDGEHOG, hp), sprite(HEDGEHOG2, hp)].map(function (c) { return [flip(c), c]; });   // [facing left, right]
    a.acorn = sprite(ACORN, { t: '#4a2a10', c: '#7a4a1c', C: '#a06a30', n: '#d08a3a', N: '#f0c080' });

    a.tiles = {
      '#': tile(function (g) {
        g.fillStyle = '#c0703a'; g.fillRect(0, 0, T, T);
        g.fillStyle = '#8a4a20';
        g.fillRect(0, 7, T, 1); g.fillRect(7, 0, 1, 7); g.fillRect(3, 8, 1, 8); g.fillRect(12, 8, 1, 8);
        g.fillStyle = '#e09a5a'; g.fillRect(1, 1, 5, 1); g.fillRect(9, 1, 5, 1); g.fillRect(5, 9, 6, 1);
      }),
      'B': tile(function (g) { bricks(g, '#d0602a', '#9a3a14', '#2a1008'); }),
      'X': tile(function (g) {
        g.fillStyle = '#a06030'; g.fillRect(0, 0, T, T);
        bevel(g, '#e0a070', '#4a2010');
        g.fillStyle = '#c08048'; g.fillRect(3, 3, 10, 10);
        g.fillStyle = '#7a4018'; g.fillRect(3, 12, 10, 1); g.fillRect(12, 3, 1, 10);
      }),
      'U': tile(function (g) {
        g.fillStyle = '#8a5a30'; g.fillRect(0, 0, T, T); bevel(g, '#b07a48', '#4a2a10');
        g.fillStyle = '#4a2a10'; [[2, 2], [13, 2], [2, 13], [13, 13]].forEach(function (p) { g.fillRect(p[0], p[1], 1, 1); });
      }),
      '[': pipe('tl'), ']': pipe('tr'), '{': pipe('bl'), '}': pipe('br')
    };
    a.question = [question('#f0b020'), question('#e09a18'), question('#c8820e')];
    a.grassTop = tile(function (g) {
      g.fillStyle = '#3cbc3c'; g.fillRect(0, 0, T, 3);
      g.fillStyle = '#2a8a2a'; g.fillRect(0, 3, T, 1);
      g.fillStyle = '#6ae06a'; for (var x = 0; x < T; x += 3) g.fillRect(x, 0, 1, 1);
    });
    return a;
  };

  // ======================= background (drawn every frame, parallax) =======================
  var THEMES = {
    day:  { sky: '#6ab4f8', hill: '#48b048', hillDark: '#2f8a34', cloud: '#ffffff', far: '#9ad0ff' },
    dusk: { sky: '#f09060', hill: '#6a5a8a', hillDark: '#4a3a6a', cloud: '#ffd0b0', far: '#f8b080' }
  };
  Art.theme = function (name) { return THEMES[name] || THEMES.day; };

  Art.drawBackground = function (g, camX, w, h, theme) {
    var th = Art.theme(theme);
    g.fillStyle = th.sky; g.fillRect(0, 0, w, h);
    if (theme === 'dusk') {            // setting sun
      g.fillStyle = '#ffe080'; g.beginPath(); g.arc(250 - camX * 0.05 % 400, 70, 22, 0, Math.PI * 2); g.fill();
    }
    // far hills (0.25x), near hills (0.5x), clouds (0.3x)
    function hills(speed, spacing, r, color, base) {
      var off = camX * speed;
      for (var i = Math.floor(off / spacing) - 1; i < (off + w) / spacing + 1; i++) {
        var x = i * spacing - off + ((i * 37) % 23);
        var rr = r + ((i * 13) % 3) * 8;
        g.fillStyle = color; g.beginPath(); g.ellipse(x, base, rr * 1.4, rr, 0, Math.PI, 0); g.fill();
      }
    }
    hills(0.25, 140, 30, th.far, 162);
    hills(0.5, 110, 22, th.hill, 162);
    var off = camX * 0.3;
    for (var i = Math.floor(off / 90) - 1; i < (off + w) / 90 + 1; i++) {
      var cx = i * 90 - off + ((i * 53) % 40), cy = 24 + ((i * 29) % 40);
      g.fillStyle = th.cloud;
      g.beginPath(); g.ellipse(cx, cy, 14, 7, 0, 0, Math.PI * 2); g.ellipse(cx + 12, cy - 4, 12, 8, 0, 0, Math.PI * 2);
      g.ellipse(cx + 24, cy, 13, 7, 0, 0, Math.PI * 2); g.fill();
    }
  };

  Art.drawCoin = function (g, x, y, t) {
    var w = [6, 4, 2, 4][Math.floor(t / 8) % 4];
    g.fillStyle = '#8a5a08'; g.fillRect(x + 8 - w / 2 - 1, y + 2, w + 2, 12);
    g.fillStyle = '#f8d030'; g.fillRect(x + 8 - w / 2, y + 3, w, 10);
    g.fillStyle = '#fff6c0'; if (w > 2) g.fillRect(x + 8 - w / 2 + 1, y + 4, 1, 6);
  };

  Art.drawFlag = function (g, x, topY, groundY, flagY) {
    g.fillStyle = '#d0d0d0'; g.fillRect(x + 7, topY + 6, 2, groundY - topY - 6);
    g.fillStyle = '#3cbc3c'; g.beginPath(); g.arc(x + 8, topY + 4, 4, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(x + 7, flagY); g.lineTo(x - 9, flagY + 6); g.lineTo(x + 7, flagY + 12); g.fill();
    g.fillStyle = '#f08a24'; g.font = '6px "Press Start 2P", monospace'; g.fillText('J', x - 2, flagY + 9);
  };

  Art.drawCastle = function (g, x, groundY) {
    var y = groundY - 80;
    g.fillStyle = '#9a4a20';
    g.fillRect(x, y + 32, 80, 48);
    g.fillRect(x + 16, y, 48, 32);
    for (var i = 0; i < 5; i++) g.fillRect(x + i * 16 + 2, y + 24, 10, 8);
    for (i = 0; i < 3; i++) g.fillRect(x + 16 + i * 16 + 2, y - 8, 10, 8);
    g.fillStyle = '#5a2810';
    for (var by = y; by < groundY; by += 8) g.fillRect(x, by, 80, 1);
    g.fillStyle = '#000'; g.fillRect(x + 32, groundY - 24, 16, 24);
    g.beginPath(); g.arc(x + 40, groundY - 24, 8, Math.PI, 0); g.fill();
    g.fillRect(x + 26, y + 8, 6, 12); g.fillRect(x + 48, y + 8, 6, 12);
  };
})();
