/*
 * Josh & Jasper — a side-scrolling platformer for one or two players.
 * Fixed 60 Hz simulation, 320x192 logical screen, 16px tiles.
 */
(function () {
  'use strict';
  var TILE = 16, VW = 320, VH = 192;
  var canvas = document.getElementById('screen'), g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  var art = Art.build();
  if (Art.buildSchool) Art.buildSchool(art);
  // enemy kinds: speed, can be stomped, flies, bounces
  var ENEMY = {
    beetle:   { speed: 0.5, stomp: true },
    hedgehog: { speed: 0.5, stomp: false },
    lizard:   { speed: 1.0, stomp: true },
    ball:     { speed: 0.8, stomp: true, bounce: true },
    gull:     { speed: 0.7, stomp: true, fly: true },
    cactus:   { speed: 0, stomp: false }
  };
  // tiles / ? blocks / ground top / power-up for the current level's theme
  function tileset() {
    return (art.tilesets && art.tilesets[level.theme]) || { tiles: art.tiles, question: art.question, top: art.grassTop, item: 'acorn' };
  }
  var FONT = '8px "Press Start 2P", monospace';

  // ---- the two brothers: Josh runs faster, Jasper jumps higher ----
  var BROS = {
    josh:   { name: 'JOSH',   walk: 1.5, run: 2.75, jump: 5.7, acc: 0.09 },
    jasper: { name: 'JASPER', walk: 1.5, run: 2.45, jump: 6.2, acc: 0.1 }
  };
  var GRAV = 0.36, GRAV_HOLD = 0.19, MAX_FALL = 6, FRICTION = 0.11, SKID = 0.22, AIR_ACC = 0.06;
  var SOLID = '#BX?MU[]{}';

  // ======================= input =======================
  var keys = {}, pressed = {};
  var KEYMAP = {
    josh:   { left: ['KeyA'], right: ['KeyD'], jump: ['KeyW', 'Space'], run: ['ShiftLeft'] },
    jasper: { left: ['ArrowLeft'], right: ['ArrowRight'], jump: ['ArrowUp'], run: ['ShiftRight', 'Slash', 'Period'] },
    extra:  { left: [], right: [], jump: ['KeyZ', 'KeyK'], run: ['KeyX', 'KeyJ'] }   // also usable in 1-player mode
  };
  var touch = { left: false, right: false, jump: false, run: false };
  window.addEventListener('keydown', function (e) {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Slash'].indexOf(e.code) >= 0) e.preventDefault();
    if (!keys[e.code]) pressed[e.code] = true;
    keys[e.code] = true;
    Sound.unlock();
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });
  window.addEventListener('blur', function () { keys = {}; });
  function any(list) { return list.some(function (k) { return keys[k]; }); }
  function anyPressed(list) { return list.some(function (k) { return pressed[k]; }); }

  // which key sets drive a brother
  function controlsFor(id) {
    if (game.players.length === 1) return [KEYMAP.josh, KEYMAP.jasper, KEYMAP.extra];
    return id === 'josh' ? [KEYMAP.josh, KEYMAP.extra] : [KEYMAP.jasper];
  }
  function readInput(p) {
    var sets = controlsFor(p.id), useTouch = p === game.players[0];
    function act(name, edge) {
      if (sets.some(function (s) { return edge ? anyPressed(s[name]) : any(s[name]); })) return true;
      if (!useTouch) return false;
      return edge ? touch[name + 'Pressed'] : touch[name];
    }
    return { left: act('left'), right: act('right'), jump: act('jump'), jumpPressed: act('jump', true), run: act('run') };
  }

  // ---- touch buttons ----
  var touchEl = document.getElementById('touch');
  if ('ontouchstart' in window || (window.matchMedia && matchMedia('(pointer: coarse)').matches)) {
    touchEl.hidden = false;
    document.body.classList.add('touch');
  }
  Array.prototype.forEach.call(touchEl.querySelectorAll('button'), function (b) {
    var k = b.dataset.key;
    function down(e) { e.preventDefault(); if (!touch[k]) touch[k + 'Pressed'] = true; touch[k] = true; b.classList.add('on'); Sound.unlock(); }
    function up(e) { e.preventDefault(); touch[k] = false; b.classList.remove('on'); }
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('pointerleave', up);
  });

  // ======================= game state =======================
  var game = {
    state: 'title', menu: 0, mode: null,
    score: 0, coins: 0, lives: 5, levelIdx: 0,
    players: [], enemies: [], items: [], parts: [], texts: [],
    camX: 0, frame: 0, time: 300, timeT: 0, checkpointHit: false, paused: false
  };
  var MENU = [
    { label: '1 PLAYER - JOSH', players: ['josh'] },
    { label: '1 PLAYER - JASPER', players: ['jasper'] },
    { label: '2 PLAYERS', players: ['josh', 'jasper'] }
  ];
  var level, tiles, bumps;

  function newGame(idx) {
    game.mode = MENU[idx];
    game.score = 0; game.coins = 0; game.lives = 5; game.levelIdx = 0;
    game.checkpointHit = false;
    game.big = {};
    loadLevel();
  }

  function loadLevel() {
    level = Levels[game.levelIdx];
    tiles = level.tiles.map(function (r) { return r.split(''); });
    bumps = {};
    game.enemies = level.ents.map(function (e) {
      var def = ENEMY[e.type] || ENEMY.beetle;
      return { type: e.type, def: def, x: e.x * TILE, y: e.y * TILE, baseY: e.y * TILE, w: 14, h: 14, vx: -def.speed, vy: 0, t: 0,
               active: false, dead: false, deadT: 0, flipped: false };
    });
    game.items = []; game.parts = []; game.texts = [];
    var startX = game.checkpointHit ? level.checkpoint : level.start[0].x;
    game.players = game.mode.players.map(function (id, i) {
      var p = { id: id, x: (startX + i * 1.5) * TILE, y: 0, w: 12, h: 15, vx: 0, vy: 0, face: 1,
                onGround: false, big: !!(game.big && game.big[id]), inv: 0, dead: false, deadT: 0, coyote: 0, buffer: 0,
                anim: 0, ride: null, jumpHeld: false };
      if (p.big) p.h = 22;
      p.y = (level.start[0].y + 1) * TILE - p.h;
      return p;
    });
    game.camX = Math.max(0, startX * TILE - VW * 0.3);
    game.time = level.time; game.timeT = 0;
    game.state = 'intro'; game.introT = 0;
  }

  // ======================= tiles =======================
  function tileAt(tx, ty) {
    if (tx < 0 || tx >= level.w) return '#';         // level edges are walls
    if (ty < 0 || ty >= level.h) return '.';
    return tiles[ty][tx];
  }
  function solidAt(tx, ty) { return SOLID.indexOf(tileAt(tx, ty)) >= 0; }

  // move a box through the tile map, resolving one axis at a time
  function moveBox(e, onHitHead) {
    e.x += e.vx;
    var top = Math.floor(e.y / TILE), bottom = Math.floor((e.y + e.h - 0.01) / TILE);
    if (e.vx > 0) {
      var tx = Math.floor((e.x + e.w) / TILE);
      for (var ty = top; ty <= bottom; ty++) if (solidAt(tx, ty)) { e.x = tx * TILE - e.w; e.vx = 0; e.hitWall = 1; break; }
    } else if (e.vx < 0) {
      tx = Math.floor(e.x / TILE);
      for (ty = top; ty <= bottom; ty++) if (solidAt(tx, ty)) { e.x = (tx + 1) * TILE; e.vx = 0; e.hitWall = -1; break; }
    }
    e.y += e.vy;
    e.onGround = false;
    var left = Math.floor((e.x + 1) / TILE), right = Math.floor((e.x + e.w - 1) / TILE);
    if (e.vy > 0) {
      ty = Math.floor((e.y + e.h) / TILE);
      for (tx = left; tx <= right; tx++) if (solidAt(tx, ty)) { e.y = ty * TILE - e.h; e.vy = 0; e.onGround = true; break; }
    } else if (e.vy < 0) {
      ty = Math.floor(e.y / TILE);
      var hit = null, best = 99;
      for (tx = left; tx <= right; tx++) {
        if (!solidAt(tx, ty)) continue;
        var d = Math.abs((tx + 0.5) * TILE - (e.x + e.w / 2));   // bump the block closest to the head
        if (d < best) { best = d; hit = tx; }
      }
      if (hit !== null) { e.y = (ty + 1) * TILE; e.vy = 0; if (onHitHead) onHitHead(hit, ty); }
    }
  }

  function bumpBlock(p, tx, ty) {
    var c = tileAt(tx, ty);
    bumps[tx + ',' + ty] = 8;
    // enemies standing on the block get knocked out
    game.enemies.forEach(function (e) {
      if (!e.dead && e.active && Math.abs(e.y + e.h - ty * TILE) < 3 && e.x + e.w > tx * TILE && e.x < (tx + 1) * TILE) knockOut(e, 100);
    });
    if (c === '?') {
      tiles[ty][tx] = 'U';
      addCoin(tx * TILE, ty * TILE - TILE);
    } else if (c === 'M') {
      tiles[ty][tx] = 'U';
      game.items.push({ type: 'acorn', x: tx * TILE + 1, y: ty * TILE, w: 14, h: 14, vx: 0.9, vy: 0, rise: TILE });
      Sound.play('sprout');
    } else if (c === 'B' && p.big) {
      tiles[ty][tx] = '.';
      delete bumps[tx + ',' + ty];
      for (var i = 0; i < 4; i++) {
        game.parts.push({ kind: 'brick', x: tx * TILE + (i % 2) * 8, y: ty * TILE + (i < 2 ? 0 : 8),
                          vx: (i % 2 ? 1 : -1) * 1.2, vy: i < 2 ? -5 : -3.5, t: 0 });
      }
      addScore(50);
      Sound.play('brk');
    } else {
      Sound.play('bump');
    }
  }

  function addScore(n, x, y) {
    game.score += n;
    if (x != null) game.texts.push({ text: String(n), x: x, y: y, t: 0 });
  }
  function addCoin(x, y) {
    game.coins++;
    addScore(200);
    if (x != null) game.parts.push({ kind: 'coin', x: x, y: y, vy: -4, t: 0 });
    Sound.play('coin');
    if (game.coins >= 100) { game.coins -= 100; game.lives++; Sound.play('oneup'); }
  }

  // ======================= players =======================
  function setBig(p, big) {
    if (p.big === big) return;
    p.big = big;
    if (big) { p.y -= 7; p.h = 22; } else { p.y += 7; p.h = 15; }
    game.big[p.id] = big;
  }

  function hurt(p) {
    if (p.inv > 0 || p.dead) return;
    if (p.big) { setBig(p, false); p.inv = 110; Sound.play('shrink'); return; }
    killPlayer(p, true);
  }

  function killPlayer(p, hop) {
    if (p.dead) return;
    p.dead = true; p.deadT = 0; p.vx = 0; p.vy = hop ? -5 : 0; p.ride = null;
    setBig(p, false);
    game.lives--;
    Sound.play('die');
  }

  function updatePlayer(p) {
    var st = BROS[p.id];
    if (p.dead) {
      p.deadT++;
      if (p.deadT > 30) { p.vy = Math.min(MAX_FALL, p.vy + GRAV); p.y += p.vy; }
      if (p.deadT > 150) respawnOrRestart(p);
      return;
    }
    if (p.inv > 0) p.inv--;
    var inp = readInput(p);

    // horizontal: accelerate toward walk / run speed, skid when reversing
    var max = inp.run ? st.run : st.walk, dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    var acc = p.onGround ? st.acc : AIR_ACC;
    if (dir) {
      if (p.vx * dir < 0 && p.onGround) p.vx += dir * SKID;
      else if (Math.abs(p.vx) < max || p.vx * dir < 0) p.vx += dir * acc;
      else if (p.onGround) p.vx -= Math.sign(p.vx) * Math.min(FRICTION, Math.abs(p.vx) - max);
      if (p.onGround || Math.abs(p.vx) < 0.5) p.face = dir;
    } else if (p.onGround) {
      p.vx -= Math.sign(p.vx) * Math.min(FRICTION, Math.abs(p.vx));
    }

    // jumping: coyote time + jump buffer; a faster run gives a slightly higher jump
    p.coyote = p.onGround ? 6 : p.coyote - 1;
    p.buffer = inp.jumpPressed ? 6 : p.buffer - 1;
    if (p.buffer > 0 && p.coyote > 0) {
      p.vy = -(st.jump + Math.abs(p.vx) * 0.25);
      p.buffer = 0; p.coyote = 0; p.onGround = false; p.ride = null;
      Sound.play(p.big ? 'bigjump' : 'jump');
    }
    p.jumpHeld = inp.jump;
    p.vy = Math.min(MAX_FALL, p.vy + (inp.jump && p.vy < 0 ? GRAV_HOLD : GRAV));

    // ride on your brother's head
    if (p.ride && !p.ride.dead) p.x += p.ride.vx;
    p.ride = null;

    p.prevBottom = p.y + p.h;
    p.hitWall = 0;
    moveBox(p, function (tx, ty) { bumpBlock(p, tx, ty); });

    // stand on the other brother
    game.players.forEach(function (q) {
      if (q === p || q.dead || p.vy < 0) return;
      if (p.x + p.w > q.x + 2 && p.x < q.x + q.w - 2 && p.prevBottom <= q.y + 3 && p.y + p.h >= q.y) {
        p.y = q.y - p.h; p.vy = 0; p.onGround = true; p.ride = q;
      }
    });

    // screen edges: can't go back left of the camera; in 2P the front runner waits at the right edge
    if (p.x < game.camX) { p.x = game.camX; if (p.vx < 0) p.vx = 0; }
    if (game.players.length > 1 && p.x > game.camX + VW - p.w) { p.x = game.camX + VW - p.w; if (p.vx > 0) p.vx = 0; }

    // coins in the level
    for (var ty = Math.floor(p.y / TILE); ty <= Math.floor((p.y + p.h - 1) / TILE); ty++) {
      for (var tx = Math.floor(p.x / TILE); tx <= Math.floor((p.x + p.w - 1) / TILE); tx++) {
        if (tileAt(tx, ty) === 'c') { tiles[ty][tx] = '.'; addCoin(); }
      }
    }

    if (!game.checkpointHit && p.x > level.checkpoint * TILE) game.checkpointHit = true;
    if (p.y > VH + 32) killPlayer(p, false);          // fell into a pit

    // reached the flag pole
    if (p.x + p.w / 2 >= level.flagX * TILE + 6 && game.state === 'play') startClear(p);

    p.anim += Math.abs(p.vx) * 0.12;
  }

  function respawnOrRestart(p) {
    var mate = game.players.filter(function (q) { return q !== p && !q.dead; })[0];
    if (mate && game.lives > 0) {                     // drop back in above your brother
      p.dead = false; p.inv = 120; p.vx = 0; p.vy = 0;
      p.x = Math.max(game.camX + 8, mate.x - 4); p.y = Math.max(0, mate.y - 48);
      return;
    }
    if (game.players.some(function (q) { return !q.dead; })) return;   // the other is still alive (no lives left)
    if (game.lives <= 0) { game.state = 'gameover'; game.overT = 0; Sound.play('gameover'); return; }
    loadLevel();
  }

  // ======================= enemies & items =======================
  function knockOut(e, pts) {
    e.dead = true; e.flipped = true; e.vy = -3; e.vx = 0.6; e.deadT = 0;
    addScore(pts, e.x, e.y);
    Sound.play('stomp');
  }

  function updateEnemy(e) {
    if (!e.active) { if (e.x < game.camX + VW + 32) e.active = true; else return; }
    if (e.dead) {
      e.deadT++;
      if (e.flipped) { e.vy += GRAV; e.y += e.vy; e.x += e.vx; }
      if (e.deadT > (e.flipped ? 90 : 30)) e.gone = true;
      return;
    }
    var def = e.def;
    e.t++;
    if (def.fly) {                                    // seagulls glide in a wave, ignoring walls
      e.x += e.vx;
      e.y = e.baseY + Math.sin(e.t * 0.06) * 12;
      if (e.x < game.camX - 64) e.gone = true;
    } else {
      e.vy = Math.min(MAX_FALL, e.vy + GRAV);
      e.hitWall = 0;
      moveBox(e);
      if (e.hitWall) e.vx = e.hitWall > 0 ? -def.speed : def.speed;
      if (e.vx === 0 && def.speed) e.vx = -def.speed;
      if (def.bounce && e.onGround) e.vy = -4.2;     // playground ball keeps bouncing
      if (e.y > VH + 32) e.gone = true;
    }
    // enemies turn around when they bump into each other
    game.enemies.forEach(function (o) {
      if (o === e || o.dead || !o.active || def.fly || o.def.fly || !def.speed) return;
      if (overlap(e, o)) {
        if ((e.x < o.x && e.vx > 0) || (e.x > o.x && e.vx < 0)) e.vx = -e.vx;
      }
    });
    // touching a brother
    game.players.forEach(function (p) {
      if (p.dead || !overlap(p, e)) return;
      var stomp = p.vy > 0 && p.prevBottom <= e.y + 6;
      if (stomp && def.stomp) {
        if (def.fly || def.bounce) { e.dead = true; e.flipped = true; e.vy = def.bounce ? -2 : 0; e.vx = 1.5; e.deadT = 0; }   // kicked away
        else { e.dead = true; e.deadT = 0; }
        p.combo = (p.onGround ? 0 : p.combo || 0) + 1;
        addScore([100, 200, 400, 800, 1000][Math.min(4, p.combo - 1)], e.x, e.y - 8);
        p.vy = p.jumpHeld ? -6 : -3.8;
        Sound.play('stomp');
      } else if (p.inv <= 0) {
        hurt(p);
      }
    });
  }

  function updateItem(it) {
    if (it.rise > 0) { it.y -= 0.5; it.rise -= 0.5; return; }
    it.vy = Math.min(MAX_FALL, it.vy + GRAV);
    it.hitWall = 0;
    moveBox(it);
    if (it.hitWall) it.vx = -it.hitWall * 0.9;
    if (it.y > VH + 32) it.gone = true;
    game.players.forEach(function (p) {
      if (it.gone || p.dead || !overlap(p, it)) return;
      it.gone = true;
      setBig(p, true);
      addScore(1000, it.x, it.y);
      Sound.play('power');
    });
  }

  function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  // ======================= level clear =======================
  function startClear(p) {
    game.state = 'clear';
    game.clearT = 0;
    game.flagger = p;
    var height = Math.max(0, (level.h - 2) * TILE - (p.y + p.h));
    var pts = height > 100 ? 5000 : height > 70 ? 2000 : height > 40 ? 800 : height > 20 ? 400 : 100;
    addScore(pts, p.x, p.y);
    game.flagY = Math.min(p.y, (level.h - 3) * TILE);
    p.x = level.flagX * TILE + 2; p.vx = 0; p.vy = 0;
    Sound.play('clear');
  }

  function updateClear() {
    game.clearT++;
    var p = game.flagger, ground = (level.h - 2) * TILE;
    var poleBottom = ground - TILE;                      // the block under the pole
    if (p.y + p.h < poleBottom) { p.y = Math.min(poleBottom - p.h, p.y + 2); game.flagY = Math.min(poleBottom - 12, game.flagY + 2); return; }
    // the flag grabber walks into the castle; the other brother is already celebrating inside
    game.players.forEach(function (q) { if (q !== p) q.inCastle = true; });
    if (p.x < level.castleX * TILE + 32) {
      p.face = 1; p.anim += 0.15; p.vx = 1.2;
      p.vy = Math.min(MAX_FALL, p.vy + GRAV);
      p.hitWall = 0;
      moveBox(p);
      p.vx = 0;
      if (p.hitWall && p.onGround) p.vy = -5;
    } else p.inCastle = true;
    if (game.time > 0 && game.clearT > 60) {          // time bonus
      var n = Math.min(game.time, 3);
      game.time -= n; game.score += n * 50;
      if (game.clearT % 4 === 0) Sound.play('select');
      return;
    }
    if (game.clearT > 60 && game.players.every(function (q) { return q.dead || q.inCastle; })) {
      game.clearWait = (game.clearWait || 0) + 1;
      if (game.clearWait > 90) {
        game.clearWait = 0;
        game.levelIdx++;
        game.checkpointHit = false;
        if (game.levelIdx >= Levels.length) { game.state = 'win'; game.overT = 0; return; }
        loadLevel();
      }
    }
  }

  // ======================= main update =======================
  function update() {
    game.frame++;
    if (pressed.KeyM) Sound.toggle();
    if (game.state === 'title') {
      if (pressed.ArrowDown || pressed.KeyS) { game.menu = (game.menu + 1) % MENU.length; Sound.play('select'); }
      if (pressed.ArrowUp || pressed.KeyW) { game.menu = (game.menu + MENU.length - 1) % MENU.length; Sound.play('select'); }
      if (pressed.Enter || pressed.Space || touch.jumpPressed) newGame(game.menu);
    } else if (game.state === 'intro') {
      if (++game.introT > 110) game.state = 'play';
    } else if (game.state === 'play') {
      if (pressed.KeyP || pressed.Escape) { game.paused = !game.paused; Sound.play('pause'); }
      if (!game.paused) step();
    } else if (game.state === 'clear') {
      updateClear();
      updateCamera();
    } else if (game.state === 'gameover' || game.state === 'win') {
      game.overT++;
      if (game.overT > 120 && (pressed.Enter || pressed.Space || touch.jumpPressed)) game.state = 'title';
    }
    pressed = {};
    touch.leftPressed = touch.rightPressed = touch.jumpPressed = touch.runPressed = false;
  }

  function step() {
    game.players.forEach(updatePlayer);
    game.enemies.forEach(updateEnemy);
    game.items.forEach(updateItem);
    game.enemies = game.enemies.filter(function (e) { return !e.gone; });
    game.items = game.items.filter(function (it) { return !it.gone; });
    game.parts.forEach(function (pt) {
      pt.t++;
      if (pt.kind === 'brick') { pt.vy += GRAV; pt.x += pt.vx; pt.y += pt.vy; }
      else { pt.vy += 0.3; pt.y += pt.vy; }
    });
    game.parts = game.parts.filter(function (pt) { return pt.kind === 'coin' ? pt.t < 28 : pt.y < VH + 16; });
    game.texts.forEach(function (t) { t.t++; t.y -= 0.5; });
    game.texts = game.texts.filter(function (t) { return t.t < 50; });
    Object.keys(bumps).forEach(function (k) { if (--bumps[k] <= 0) delete bumps[k]; });
    // timer: one tick every 24 frames (like a classic 400-count clock)
    if (++game.timeT >= 24) {
      game.timeT = 0;
      game.time--;
      if (game.time <= 0) game.players.forEach(function (p) { killPlayer(p, true); });
    }
    updateCamera();
  }

  function updateCamera() {
    var alive = game.players.filter(function (p) { return !p.dead; });
    if (!alive.length) return;
    var avg = alive.reduce(function (s, p) { return s + p.x; }, 0) / alive.length;
    var target = avg - VW * 0.42;
    game.camX = Math.max(0, Math.min(level.w * TILE - VW, Math.max(game.camX, target)));
  }

  // ======================= drawing =======================
  function text(str, x, y, color, align) {
    g.font = FONT;
    g.textAlign = align || 'left';
    g.textBaseline = 'top';
    g.fillStyle = '#000'; g.fillText(str, x + 1, y + 1);
    g.fillStyle = color || '#fff'; g.fillText(str, x, y);
  }

  function drawTiles() {
    var x0 = Math.floor(game.camX / TILE), x1 = Math.min(level.w - 1, x0 + VW / TILE + 1);
    var qFrame = [0, 0, 1, 2, 1][Math.floor(game.frame / 10) % 5], set = tileset();
    for (var ty = 0; ty < level.h; ty++) {
      for (var tx = x0; tx <= x1; tx++) {
        var c = tiles[ty][tx];
        if (c === '.') continue;
        var x = Math.round(tx * TILE - game.camX), y = ty * TILE;
        var b = bumps[tx + ',' + ty];
        if (b) y -= Math.round(Math.sin((8 - b) / 8 * Math.PI) * 5);
        if (c === 'c') { Art.drawCoin(g, x, y, game.frame + tx * 3); continue; }
        if (c === '?' || c === 'M') { g.drawImage(set.question[qFrame], x, y); continue; }
        var img = set.tiles[c];
        if (img) g.drawImage(img, x, y);
        if (c === '#' && tileAt(tx, ty - 1) !== '#') g.drawImage(set.top, x, y);
      }
    }
  }

  function drawPlayer(p) {
    if (p.inCastle) return;
    if (p.inv > 0 && Math.floor(p.inv / 4) % 2 && !p.dead) return;   // blink while invulnerable
    var frames = art[p.id], pose;
    if (p.dead) pose = 'jump';
    else if (!p.onGround) pose = 'jump';
    else if (Math.abs(p.vx) > 0.2 || (game.state === 'clear' && p === game.flagger)) pose = ['walk1', 'stand', 'walk2', 'stand'][Math.floor(p.anim) % 4];
    else pose = 'stand';
    var img = frames[pose][p.big ? 'big' : 'small'][p.face < 0 ? 1 : 0];
    var x = Math.round(p.x - 2 - game.camX), y = Math.round(p.y + p.h - img.height + 1);
    g.drawImage(img, x, y);
    if (game.players.length > 1 && !p.dead) {            // name tag in 2-player mode
      g.font = '5px "Press Start 2P", monospace'; g.textAlign = 'center'; g.textBaseline = 'bottom';
      g.fillStyle = '#000'; g.fillText(BROS[p.id].name, x + 9, y - 1);
      g.fillStyle = art.colors[p.id]; g.fillText(BROS[p.id].name, x + 8, y - 2);
    }
  }

  function flipped(img) { return img._flipped || (img._flipped = Art.flip(img)); }
  function drawEnemy(e) {
    if (!e.active) return;
    var x = Math.round(e.x - 1 - game.camX), y = Math.round(e.y - 2);
    var f = Math.floor(game.frame / 12) % 2;
    var img;
    if (e.type === 'beetle') img = art.beetle[f];
    else if (e.type === 'hedgehog') img = art.hedgehog[f][e.vx > 0 ? 1 : 0];
    else if (e.type === 'lizard') img = e.vx > 0 ? flipped(art.lizard[f]) : art.lizard[f];
    else if (e.type === 'gull') img = e.vx > 0 ? flipped(art.gull[f]) : art.gull[f];
    else if (e.type === 'ball') img = art.ball;
    else img = art.cactus;
    if (e.dead && !e.flipped) {                       // squashed
      g.drawImage(img, 0, 4, 16, 10, x, y + 11, 16, 5);
      return;
    }
    if (e.flipped) { g.save(); g.translate(x, y + 16); g.scale(1, -1); g.drawImage(img, 0, 0); g.restore(); return; }
    if (e.type === 'ball') {                          // squash a little on landing
      var sq = e.onGround ? 3 : 0;
      g.drawImage(img, x - sq / 2, y + sq, 16 + sq, 16 - sq);
      return;
    }
    g.drawImage(img, x, y);
  }

  function drawHud() {
    var names = game.mode ? game.mode.players.map(function (id) { return BROS[id].name; }).join(' & ') : '';
    text(names, 8, 6, '#fff');
    text(String(game.score).padStart(6, '0'), 8, 16);
    text('¢x' + String(game.coins).padStart(2, '0'), 100, 16, '#f8d030');
    text('WORLD', 168, 6); text(level ? level.name : '', 176, 16);
    text('TIME', 240, 6); text(String(Math.max(0, game.time)).padStart(3, '0'), 248, 16);
    text('♥' + Math.max(0, game.lives), 290, 16, '#ff6070');
  }

  function drawWorld() {
    Art.drawBackground(g, game.camX, VW, VH, level.theme);
    // decorations, the goal building and the flag (behind the brothers)
    var ground = (level.h - 2) * TILE;
    (level.decos || []).forEach(function (d) {
      var dx = d.x * TILE - game.camX;
      if (dx > -120 && dx < VW + 40) Art.drawDeco(g, d, Math.round(dx), ground, game.frame);
    });
    if (!level.goal || level.goal === 'castle') Art.drawCastle(g, level.castleX * TILE - game.camX, ground);
    else Art.drawGoalBuilding(g, level.goal, level.castleX * TILE - game.camX, ground);
    var fy = game.state === 'clear' ? game.flagY : 2 * TILE + 8;
    Art.drawFlag(g, level.flagX * TILE - game.camX, 1 * TILE, ground - TILE, fy);
    drawTiles();
    game.items.forEach(function (it) {
      var x = Math.round(it.x - 1 - game.camX), y = Math.round(it.y - 2);
      if (it.rise > 0) {                              // only the part above the block shows while sprouting
        var vis = Math.round(TILE - it.rise);
        g.drawImage(art[tileset().item] || art.acorn, 0, 0, 16, vis, x, y, 16, vis);
      } else g.drawImage(art[tileset().item] || art.acorn, x, y);
    });
    game.enemies.forEach(drawEnemy);
    game.players.forEach(drawPlayer);
    game.parts.forEach(function (pt) {
      var x = Math.round(pt.x - game.camX);
      if (pt.kind === 'coin') Art.drawCoin(g, x, Math.round(pt.y), pt.t * 2);
      else { g.fillStyle = '#d0602a'; g.fillRect(x, Math.round(pt.y), 7, 7); g.fillStyle = '#2a1008'; g.fillRect(x, Math.round(pt.y) + 6, 7, 1); }
    });
    g.font = '6px "Press Start 2P", monospace';
    game.texts.forEach(function (t) {
      g.textAlign = 'center'; g.fillStyle = '#000'; g.fillText(t.text, t.x - game.camX + 9, t.y + 1);
      g.fillStyle = '#fff'; g.fillText(t.text, t.x - game.camX + 8, t.y);
    });
    drawHud();
  }

  function drawTitle() {
    Art.drawBackground(g, game.frame * 0.5, VW, VH, 'day');
    for (var x = 0; x < VW; x += TILE) { g.drawImage(art.tiles['#'], x, VH - 32); g.drawImage(art.tiles['#'], x, VH - 16); g.drawImage(art.grassTop, x, VH - 32); }
    // logo
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(36, 18, 248, 58);
    g.strokeStyle = '#f8d030'; g.lineWidth = 2; g.strokeRect(36, 18, 248, 58);
    g.font = '16px "Press Start 2P", monospace'; g.textAlign = 'center'; g.textBaseline = 'top';
    g.fillStyle = '#000'; g.fillText('JOSH & JASPER', 162, 30);
    g.fillStyle = '#f8d030'; g.fillText('JOSH & JASPER', 160, 28);
    text('SUPER BROTHERS ADVENTURE', 160, 54, '#fff', 'center');
    // the brothers on the title screen
    var bob = Math.floor(game.frame / 20) % 2;
    g.drawImage(art.josh.stand.big[0], 120, VH - 32 - 24 - bob);
    g.drawImage(art.jasper.stand.big[1], 184, VH - 32 - 24 - (1 - bob));
    MENU.forEach(function (m, i) {
      var y = 90 + i * 14;
      text((i === game.menu ? '▶ ' : '  ') + m.label, 160, y, i === game.menu ? '#f8d030' : '#fff', 'center');
    });
    text('ENTER / SPACE TO START', 160, 126, '#c0e0ff', 'center');
  }

  function drawIntro() {
    g.fillStyle = '#000'; g.fillRect(0, 0, VW, VH);
    text('WORLD ' + level.name, 160, 56, '#fff', 'center');
    if (level.title) text(level.title, 160, 70, '#f8d030', 'center');
    game.players.forEach(function (p, i) {
      var img = art[p.id].stand[p.big ? 'big' : 'small'][0];
      g.drawImage(img, 140 + i * 24 - (game.players.length - 1) * 12, 100 - img.height + 16);
    });
    text('x ' + game.lives, 186, 96, '#fff');
    if (game.checkpointHit) text('CHECKPOINT', 160, 130, '#80ff80', 'center');
  }

  function draw() {
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (game.state === 'title') { drawTitle(); return; }
    if (game.state === 'intro') { drawIntro(); drawHud(); return; }
    drawWorld();
    if (game.paused) { g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, 0, VW, VH); text('PAUSED', 160, 88, '#fff', 'center'); }
    if (game.state === 'gameover') {
      g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillRect(0, 0, VW, VH);
      text('GAME OVER', 160, 80, '#ff6070', 'center');
      if (game.overT > 120) text('PRESS ENTER', 160, 104, '#fff', 'center');
    }
    if (game.state === 'win') {
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, VW, VH);
      text('RING! SCHOOL TIME!', 160, 64, '#f8d030', 'center');
      text('JOSH & JASPER MADE IT', 160, 84, '#fff', 'center');
      text('SCORE ' + game.score, 160, 104, '#fff', 'center');
      if (game.overT > 120) text('PRESS ENTER', 160, 128, '#c0e0ff', 'center');
    }
  }

  // tap the title menu on touch screens
  canvas.addEventListener('pointerdown', function (e) {
    Sound.unlock();
    if (game.state === 'title') {
      var r = canvas.getBoundingClientRect(), y = (e.clientY - r.top) / r.height * VH;
      var i = Math.floor((y - 86) / 14);
      if (i >= 0 && i < MENU.length) { if (i === game.menu) newGame(i); else { game.menu = i; Sound.play('select'); } }
    } else if (game.state === 'gameover' || game.state === 'win') {
      if (game.overT > 120) game.state = 'title';
    }
  });

  // ======================= scaling & loop =======================
  function resize() {
    var help = document.querySelector('.help'), hh = help && getComputedStyle(help).display !== 'none' ? help.offsetHeight + 20 : 0;
    var s = Math.min(window.innerWidth / VW, (window.innerHeight - hh) / VH);
    s = s >= 2 ? Math.floor(s) : Math.max(1, s);
    canvas.style.width = Math.floor(VW * s) + 'px';
    canvas.style.height = Math.floor(VH * s) + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  var last = performance.now(), acc = 0;
  function loop(now) {
    acc += Math.min(100, now - last);
    last = now;
    while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // for automated tests
  window.JJ = { game: game, newGame: newGame, step: function (n) { for (var i = 0; i < (n || 1); i++) update(); }, keys: keys, touch: touch,
                press: function (code) { pressed[code] = true; }, loadLevel: function (i) { game.levelIdx = i; game.checkpointHit = false; loadLevel(); },
                level: function () { return level; }, tiles: function () { return tiles; } };
})();
