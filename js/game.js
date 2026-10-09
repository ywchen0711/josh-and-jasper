/*
 * Josh & Jasper: Coyote Trail — a side-scrolling adventure for one or two players.
 * The brothers walk the canyon trail to Sage Canyon School, cross the playground and the library,
 * and meet Coach Coyote, the school mascot, at the end of every level.
 *
 * Their moves: throw (stuns critters; a stunned critter can be stood on), Josh's dash (breaks crates),
 * Jasper's double jump, climbing ladders, dropping through platforms, standing on each other's head.
 * Fixed 60 Hz simulation, 320x192 logical screen, 16px tiles.
 */
(function () {
  'use strict';
  var TILE = 16, VW = 320, VH = 192;
  var canvas = document.getElementById('screen'), g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  var art = Art.build();
  Art.buildWorld(art);
  var FONT = '8px "Press Start 2P", monospace';

  var BROS = {
    josh:   { name: 'JOSH',   speed: 1.9, jump: 5.5, dash: true,  color: '#46c460' },
    jasper: { name: 'JASPER', speed: 1.8, jump: 5.8, double: true, color: '#ffb347' }
  };
  var GRAV = 0.36, GRAV_HOLD = 0.2, MAX_FALL = 6, ACC = 0.14, AIR_ACC = 0.1, FRICTION = 0.16;
  var HEARTS = 3;
  // critters: speed, how they move, whether a throw stuns them
  var ENEMY = {
    lizard: { speed: 0.9, walk: true, stun: true },
    robot:  { speed: 0.6, walk: true, stun: true },
    ball:   { speed: 0.8, bounce: true, stun: true },
    gull:   { speed: 0.7, fly: true, stun: true },
    slime:  { speed: 1.2, hop: true, stun: true },
    cactus: { speed: 0, stun: false }
  };

  // ======================= input =======================
  var keys = {}, pressed = {};
  var KEYMAP = {
    josh:   { left: ['KeyA'], right: ['KeyD'], jump: ['KeyW'], down: ['KeyS'], toss: ['KeyF'], dash: ['ShiftLeft'] },
    jasper: { left: ['ArrowLeft'], right: ['ArrowRight'], jump: ['ArrowUp'], down: ['ArrowDown'], toss: ['Slash', 'ShiftRight'], dash: [] },
    solo:   { left: [], right: [], jump: ['Space', 'KeyZ'], down: [], toss: ['KeyX'], dash: ['KeyC'] }
  };
  var touch = {};
  window.addEventListener('keydown', function (e) {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Slash'].indexOf(e.code) >= 0) e.preventDefault();
    if (!keys[e.code]) pressed[e.code] = true;
    keys[e.code] = true;
    Sound.unlock();
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });
  window.addEventListener('blur', function () { Object.keys(keys).forEach(function (k) { keys[k] = false; }); });

  function readInput(p) {
    var sets = game.players.length === 1 ? [KEYMAP.josh, KEYMAP.jasper, KEYMAP.solo] : (p.id === 'josh' ? [KEYMAP.josh, KEYMAP.solo] : [KEYMAP.jasper]);
    var useTouch = p === game.players[0];
    function held(n) { return sets.some(function (s) { return s[n].some(function (k) { return keys[k]; }); }) || (useTouch && !!touch[n]); }
    function tapped(n) { return sets.some(function (s) { return s[n].some(function (k) { return pressed[k]; }); }) || (useTouch && !!touch[n + 'Tap']); }
    return { left: held('left'), right: held('right'), jump: held('jump'), jumpTap: tapped('jump'), down: held('down'), downTap: tapped('down'),
             toss: tapped('toss'), dash: tapped('dash') };
  }

  // ---- touch buttons ----
  var touchEl = document.getElementById('touch');
  if ('ontouchstart' in window || (window.matchMedia && matchMedia('(pointer: coarse)').matches)) {
    touchEl.hidden = false;
    document.body.classList.add('touch');
  }
  Array.prototype.forEach.call(touchEl.querySelectorAll('button'), function (b) {
    var k = b.dataset.key;
    function down(e) { e.preventDefault(); if (!touch[k]) touch[k + 'Tap'] = true; touch[k] = true; b.classList.add('on'); Sound.unlock(); }
    function up(e) { e.preventDefault(); touch[k] = false; b.classList.remove('on'); }
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('pointerleave', up);
  });

  // ======================= game state =======================
  var game = {
    state: 'title', menu: 0, mode: null, levelIdx: 0, score: 0,
    players: [], enemies: [], items: [], shots: [], parts: [], texts: [],
    camX: 0, frame: 0, paused: false
  };
  var MENU = [
    { label: '1 PLAYER - JOSH', players: ['josh'] },
    { label: '1 PLAYER - JASPER', players: ['jasper'] },
    { label: '2 PLAYERS', players: ['josh', 'jasper'] }
  ];
  var level, tiles, crateHits;

  function newGame(idx) {
    game.mode = MENU[idx];
    game.score = 0; game.levelIdx = 0;
    game.totals = { stars: 0, paws: 0 };
    startLevel();
  }

  // a fresh level (collected things stay collected when you retry from a paw flag)
  function startLevel() {
    level = Levels[game.levelIdx];
    tiles = level.tiles.map(function (r) { return r.split(''); });
    crateHits = {};
    game.items = level.items.map(function (it) { return { kind: it.kind, x: it.x * TILE, y: it.y * TILE, got: false }; });
    game.starTotal = game.items.filter(function (it) { return it.kind === 'star'; }).length;
    game.got = { stars: 0, paws: 0 };
    game.checkpoint = null;
    game.levelT = 0; game.retries = 0;
    spawn();
    game.state = 'intro'; game.introT = 0;
  }

  // (re)spawn the brothers and critters at the start or the last checkpoint
  function spawn() {
    game.enemies = level.ents.map(function (e) {
      var def = ENEMY[e.type];
      return { type: e.type, def: def, x: e.x * TILE + 1, y: e.y * TILE + 2, baseY: e.y * TILE, w: 14, h: 14, vx: -def.speed, vy: 0, t: 0,
               stun: 0, dead: false, deadT: 0, hopT: 40 + Math.random() * 40 };
    });
    game.shots = []; game.parts = []; game.texts = [];
    var sx = game.checkpoint != null ? game.checkpoint : level.start.x;
    game.players = game.mode.players.map(function (id, i) {
      var p = { id: id, x: (sx + i * 1.5) * TILE, y: level.start.y * TILE - 22, w: 12, h: 22, vx: 0, vy: 0, face: 1,
                hearts: HEARTS, inv: 0, onGround: false, coyote: 0, buffer: 0, airJump: false, climb: false, dropT: 0,
                dashT: 0, dashCd: 0, tossCd: 0, anim: 0, ride: null, fainted: false, faintT: 0, safeX: 0, safeY: 0 };
      p.safeX = p.x; p.safeY = p.y;
      return p;
    });
    game.camX = Math.max(0, Math.min(level.w * TILE - VW, sx * TILE - VW * 0.3));
  }

  // ======================= tiles =======================
  function tileAt(tx, ty) {
    if (tx < 0 || tx >= level.w) return 'X';
    if (ty < 0 || ty >= level.h) return '.';
    return tiles[ty][tx];
  }
  function isSolid(c) { return c === '#' || c === 'X' || c === 'C' || c === 'S'; }
  // one-way tops: platforms, and the top rung of a ladder
  function isOneWay(tx, ty) {
    var c = tileAt(tx, ty);
    return c === '=' || (c === 'H' && tileAt(tx, ty - 1) !== 'H');
  }

  // move a box through the tiles; e.oneWay lets it land on platforms
  function moveBox(e, onSide) {
    e.x += e.vx;
    var top = Math.floor(e.y / TILE), bottom = Math.floor((e.y + e.h - 0.01) / TILE), ty, tx;
    e.hitWall = 0;
    if (e.vx > 0) {
      tx = Math.floor((e.x + e.w) / TILE);
      for (ty = top; ty <= bottom; ty++) if (isSolid(tileAt(tx, ty))) { if (onSide) onSide(tx, ty); e.x = tx * TILE - e.w; e.vx = 0; e.hitWall = 1; break; }
    } else if (e.vx < 0) {
      tx = Math.floor(e.x / TILE);
      for (ty = top; ty <= bottom; ty++) if (isSolid(tileAt(tx, ty))) { if (onSide) onSide(tx, ty); e.x = (tx + 1) * TILE; e.vx = 0; e.hitWall = -1; break; }
    }
    var prevBottom = e.y + e.h;
    e.y += e.vy;
    e.onGround = false; e.landedOn = null;
    var left = Math.floor((e.x + 1) / TILE), right = Math.floor((e.x + e.w - 1) / TILE);
    if (e.vy > 0) {
      ty = Math.floor((e.y + e.h) / TILE);
      for (tx = left; tx <= right; tx++) {
        var c = tileAt(tx, ty);
        var oneWay = e.oneWay && !e.climb && !(e.dropT > 0) && isOneWay(tx, ty) && prevBottom <= ty * TILE + 0.5;
        if (isSolid(c) || oneWay) { e.y = ty * TILE - e.h; e.vy = 0; e.onGround = true; e.landedOn = c; e.landTile = [tx, ty]; break; }
      }
    } else if (e.vy < 0) {
      ty = Math.floor(e.y / TILE);
      for (tx = left; tx <= right; tx++) if (isSolid(tileAt(tx, ty))) { e.y = (ty + 1) * TILE; e.vy = 0; break; }
    }
  }

  function breakCrate(tx, ty) {
    tiles[ty][tx] = '.';
    for (var i = 0; i < 4; i++) {
      game.parts.push({ kind: 'chip', x: tx * TILE + (i % 2) * 8, y: ty * TILE + (i < 2 ? 0 : 8), vx: (i % 2 ? 1 : -1) * 1.3, vy: i < 2 ? -4 : -2.5, t: 0 });
    }
    addScore(20);
    Sound.play('poof');
  }

  function addScore(n, x, y, color) {
    game.score += n;
    if (x != null) game.texts.push({ text: String(n), x: x, y: y, t: 0, color: color });
  }
  function say(text, x, y, color) { game.texts.push({ text: text, x: x, y: y, t: 0, color: color || '#fff' }); }

  // ======================= the brothers =======================
  function hurt(p, fromX) {
    if (p.inv > 0 || p.fainted || p.dashT > 0) return;
    p.hearts--;
    p.inv = 100;
    p.climb = false;
    p.vx = (p.x + p.w / 2 < fromX ? -1 : 1) * 2.4;
    p.vy = -3.2;
    Sound.play('hurt');
    if (p.hearts <= 0) faint(p);
  }
  function faint(p) {
    p.fainted = true; p.faintT = 0; p.hearts = 0; p.vx = 0;
    say('OOF!', p.x, p.y - 8, '#ff8080');
  }
  // fell in the water / goo or off the screen: lose a heart and go back to the last safe spot
  function splash(p) {
    Sound.play('splash');
    p.hearts--;
    p.x = p.safeX; p.y = p.safeY; p.vx = 0; p.vy = 0; p.inv = 90; p.climb = false;
    if (p.hearts <= 0) faint(p);
  }

  function ladderAt(p) {
    var tx = Math.floor((p.x + p.w / 2) / TILE);
    for (var ty = Math.floor(p.y / TILE); ty <= Math.floor((p.y + p.h - 1) / TILE); ty++) if (tileAt(tx, ty) === 'H') return tx;
    // standing on the top rung counts too (so ↓ climbs down)
    if (tileAt(tx, Math.floor((p.y + p.h + 1) / TILE)) === 'H') return tx;
    return -1;
  }

  function updatePlayer(p) {
    var st = BROS[p.id];
    if (p.fainted) {                                 // sits dazed until the other brother comes to help
      p.faintT++;
      p.vy = Math.min(MAX_FALL, p.vy + GRAV); p.oneWay = true; moveBox(p);
      if (p.y > VH + 16) { p.x = p.safeX; p.y = p.safeY; }
      return;
    }
    if (p.inv > 0) p.inv--;
    if (p.tossCd > 0) p.tossCd--;
    if (p.dashCd > 0) p.dashCd--;
    if (p.dropT > 0) p.dropT--;
    var inp = readInput(p), dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (dir) p.face = dir;

    // ---- ladders: hold jump (up) to climb, down to climb down ----
    var lad = ladderAt(p);
    if (!p.climb && lad >= 0 && ((inp.jump && p.vy > -3 && !p.onGround) || (inp.jump && p.onGround && tileAt(lad, Math.floor((p.y - 1) / TILE)) === 'H') || (inp.down && p.onGround))) {
      p.climb = true; p.airJump = false;
      p.x = lad * TILE + (TILE - p.w) / 2;
      if (inp.down && p.onGround) p.y += 3;
    }
    if (p.climb) {
      var inLadder = false, ctx = Math.floor((p.x + p.w / 2) / TILE);
      for (var ty = Math.floor(p.y / TILE); ty <= Math.floor((p.y + p.h - 1) / TILE); ty++) if (tileAt(ctx, ty) === 'H') inLadder = true;
      if (!inLadder || (dir && !inp.jump && !inp.down)) {   // stepped off the side or climbed over the top
        p.climb = false;
        if (!inLadder && inp.jump) p.vy = -2.4;
      } else {
        p.vx = 0;
        p.vy = inp.jump ? -1.6 : inp.down ? 1.8 : 0;
        p.y += p.vy;
        p.anim += Math.abs(p.vy) * 0.15;
        if (inp.down && isSolid(tileAt(ctx, Math.floor((p.y + p.h) / TILE)))) { p.y = Math.floor((p.y + p.h) / TILE) * TILE - p.h; p.climb = false; }
        p.onGround = false;
        afterMove(p);
        return;
      }
    }

    // ---- Josh's dash: a quick burst that breaks crates and knocks critters dizzy ----
    if (st.dash && inp.dash && p.dashCd <= 0) {
      p.dashT = 14; p.dashCd = 45; p.vx = p.face * 4.6; p.vy = Math.min(p.vy, 0);
      Sound.play('dash');
    }
    if (p.dashT > 0) {
      p.dashT--;
      p.vx = p.face * 4.6;
      p.vy = 0;
    } else {
      var acc = p.onGround ? ACC : AIR_ACC;
      if (dir) p.vx = Math.max(-st.speed, Math.min(st.speed, p.vx + dir * acc));
      else if (p.onGround) p.vx -= Math.sign(p.vx) * Math.min(FRICTION, Math.abs(p.vx));
      else p.vx *= 0.97;
    }

    // ---- jumping: coyote time, jump buffer, Jasper's double jump ----
    p.coyote = p.onGround ? 6 : p.coyote - 1;
    p.buffer = inp.jumpTap ? 6 : p.buffer - 1;
    if (p.onGround) p.airJump = false;
    if (p.buffer > 0 && p.coyote > 0) {
      p.vy = -st.jump; p.buffer = 0; p.coyote = 0; p.onGround = false; p.ride = null;
      Sound.play('jump');
    } else if (inp.jumpTap && st.double && !p.onGround && !p.airJump && p.coyote <= 0) {
      p.vy = -st.jump * 0.85; p.airJump = true; p.buffer = 0;
      for (var k = 0; k < 4; k++) game.parts.push({ kind: 'puff', x: p.x + 2 + k * 3, y: p.y + p.h, vx: (k - 1.5) * 0.5, vy: 0.5, t: 0 });
      Sound.play('jump');
    }
    // ↓ on a platform drops through it
    if (inp.downTap && p.onGround && p.landTile && tileAt(p.landTile[0], p.landTile[1]) === '=') { p.dropT = 12; p.onGround = false; }

    if (p.dashT <= 0) p.vy = Math.min(MAX_FALL, p.vy + (inp.jump && p.vy < 0 ? GRAV_HOLD : GRAV));

    // ---- throw ----
    if (inp.toss && p.tossCd <= 0) {
      p.tossCd = 22;
      game.shots.push({ x: p.x + p.w / 2 + p.face * 6, y: p.y + 12, vx: p.face * 3.6 + p.vx * 0.3, vy: -0.8, t: 0 });
      Sound.play('toss');
    }

    if (p.ride && !p.ride.fainted) p.x += p.ride.vx;
    p.ride = null;
    p.prevBottom = p.y + p.h;
    p.oneWay = true;
    moveBox(p, function (tx, ty) { if (p.dashT > 0 && tileAt(tx, ty) === 'C') breakCrate(tx, ty); });

    // bounce pads
    if (p.onGround && p.landedOn === 'S') {
      p.vy = inp.jump ? -7.4 : -6.6; p.onGround = false;
      Sound.play('spring');
    }
    // stand on your brother, or on a dizzy critter
    if (p.vy >= 0) {
      var tops = game.players.filter(function (q) { return q !== p; }).concat(game.enemies.filter(function (e) { return e.stun > 0 && !e.dead; }));
      tops.forEach(function (q) {
        if (p.x + p.w > q.x + 2 && p.x < q.x + q.w - 2 && p.prevBottom <= q.y + 3 && p.y + p.h >= q.y) {
          p.y = q.y - p.h; p.vy = 0; p.onGround = true; p.ride = q.id ? q : null; p.landTile = null;
        }
      });
    }
    p.anim += Math.abs(p.vx) * 0.12;
    afterMove(p);
  }

  function afterMove(p) {
    // keep both brothers on screen
    if (p.x < game.camX) { p.x = game.camX; if (p.vx < 0) p.vx = 0; }
    if (p.x > game.camX + VW - p.w) { p.x = game.camX + VW - p.w; if (p.vx > 0) p.vx = 0; }
    // remember a safe place to come back to
    if (p.onGround && !p.climb) {
      var below = Math.floor((p.y + p.h + 1) / TILE);
      var l = tileAt(Math.floor(p.x / TILE), below), r = tileAt(Math.floor((p.x + p.w - 1) / TILE), below);
      if ((isSolid(l) || l === '=') && (isSolid(r) || r === '=') && l !== 'S' && r !== 'S') { p.safeX = p.x; p.safeY = p.y; }
    }
    // water, goo, falling off
    var feet = tileAt(Math.floor((p.x + p.w / 2) / TILE), Math.floor((p.y + p.h - 2) / TILE));
    if (feet === '~' || p.y > VH + 16) splash(p);
    // pick things up
    game.items.forEach(function (it) {
      if (it.got || !overlap(p, { x: it.x + 3, y: it.y + 3, w: 10, h: 10 })) return;
      if (it.kind === 'orange' && p.hearts >= HEARTS) return;
      it.got = true;
      if (it.kind === 'star') { game.got.stars++; addScore(10); Sound.play('star'); }
      else if (it.kind === 'paw') { game.got.paws++; addScore(500, it.x, it.y, '#80c0ff'); say('PAW BADGE!', it.x - 8, it.y - 10, '#80c0ff'); Sound.play('paw'); }
      else { p.hearts = Math.min(HEARTS, p.hearts + 1); say('+1 HEART', it.x, it.y, '#ff8080'); Sound.play('heal'); }
    });
    // help a fainted brother back up
    game.players.forEach(function (q) {
      if (q !== p && q.fainted && q.faintT > 30 && overlap(p, q)) {
        q.fainted = false; q.hearts = 1; q.inv = 120;
        say('HIGH FIVE!', q.x - 12, q.y - 10, '#f8d030');
        Sound.play('revive');
      }
    });
    // checkpoints (Coyote paw flags)
    level.checkpoints.forEach(function (cx) {
      if (p.x > cx * TILE && (game.checkpoint == null || game.checkpoint < cx)) {
        game.checkpoint = cx;
        say('CHECKPOINT', cx * TILE - 16, 100, '#80ff80');
        Sound.play('check');
      }
    });
    // Coach Coyote at the end
    if (game.state === 'play' && p.x + p.w > level.goalX * TILE + 2) startClear();
  }

  // ======================= critters =======================
  function defeat(e) {
    e.dead = true; e.deadT = 0;
    addScore(100, e.x, e.y - 6);
    for (var i = 0; i < 6; i++) game.parts.push({ kind: 'spark', x: e.x + 7, y: e.y + 7, vx: Math.cos(i) * 1.6, vy: Math.sin(i) * 1.6 - 1, t: 0 });
    Sound.play('poof');
  }
  function stunEnemy(e) {
    if (!e.def.stun) return false;
    if (e.stun > 0) { defeat(e); return true; }
    e.stun = 240; e.vx = 0;
    Sound.play('stun');
    return true;
  }
  function nearestPlayerX(e) {
    var best = null, d = 1e9;
    game.players.forEach(function (p) { if (!p.fainted && Math.abs(p.x - e.x) < d) { d = Math.abs(p.x - e.x); best = p.x; } });
    return best == null ? e.x : best;
  }

  function updateEnemy(e) {
    if (e.x < game.camX - 64 || e.x > game.camX + VW + 64) return;
    if (e.dead) { e.deadT++; if (e.deadT > 20) e.gone = true; return; }
    var def = e.def;
    e.t++;
    if (e.stun > 0) {                                 // dizzy: a safe stepping stone for a while
      e.stun--;
      if (!def.fly) { e.vy = Math.min(MAX_FALL, e.vy + GRAV); e.oneWay = true; moveBox(e); }
      if (e.stun === 0) e.vx = def.speed * (nearestPlayerX(e) > e.x ? 1 : -1);
      return;
    }
    if (def.fly) {
      if (e.homeX == null) e.homeX = e.x;
      e.x += e.vx;
      e.y = e.baseY + Math.sin(e.t * 0.05) * 14;
      if (Math.abs(e.x - e.homeX) > 96) e.vx = -e.vx;   // gulls circle around their spot
    } else if (def.hop) {
      e.vy = Math.min(MAX_FALL, e.vy + GRAV); e.oneWay = true; moveBox(e);
      if (e.onGround) {
        e.vx = 0;
        if (--e.hopT <= 0) { e.hopT = 70 + Math.random() * 40; e.vy = -5; e.vx = (nearestPlayerX(e) > e.x ? 1 : -1) * def.speed; }
      }
    } else if (def.speed) {
      e.vy = Math.min(MAX_FALL, e.vy + GRAV); e.oneWay = true;
      var vx = e.vx;
      moveBox(e);
      if (e.hitWall) e.vx = -vx;
      if (def.bounce && e.onGround) e.vy = -4.2;
      if (def.walk && e.onGround) {                   // walkers turn around at ledges and water
        var ahead = Math.floor((e.vx > 0 ? e.x + e.w + 1 : e.x - 1) / TILE), below = Math.floor((e.y + e.h + 2) / TILE);
        if (!(isSolid(tileAt(ahead, below)) || isOneWay(ahead, below))) e.vx = -e.vx;
      }
      if (e.vx === 0) e.vx = -def.speed;
    } else {
      e.vy = Math.min(MAX_FALL, e.vy + GRAV); moveBox(e);
    }
    if (e.y > VH + 32) e.gone = true;

    game.players.forEach(function (p) {
      if (p.fainted || e.stun > 0 || !overlap(p, e)) return;
      if (p.dashT > 0 && def.stun) { stunEnemy(e); return; }
      // landing on top just bounces you off — except on a cactus
      if (e.type !== 'cactus' && p.vy > 0 && p.prevBottom <= e.y + 6) { p.vy = -4.6; Sound.play('spring'); return; }
      hurt(p, e.x + e.w / 2);
    });
  }

  function updateShot(s) {
    s.t++;
    s.vy += 0.12;
    s.x += s.vx; s.y += s.vy;
    var tx = Math.floor(s.x / TILE), ty = Math.floor(s.y / TILE), c = tileAt(tx, ty);
    if (isSolid(c)) {
      if (c === 'C') { var key = tx + ',' + ty; crateHits[key] = (crateHits[key] || 0) + 1; if (crateHits[key] >= 2) breakCrate(tx, ty); else Sound.play('stun'); }
      s.gone = true;
      game.parts.push({ kind: 'puff', x: s.x, y: s.y, vx: 0, vy: -0.3, t: 0 });
      return;
    }
    if (s.t > 70 || s.y > VH) { s.gone = true; return; }
    game.enemies.forEach(function (e) {
      if (s.gone || e.dead || !overlap({ x: s.x - 3, y: s.y - 3, w: 6, h: 6 }, e)) return;
      s.gone = true;
      if (!stunEnemy(e)) game.parts.push({ kind: 'puff', x: s.x, y: s.y, vx: 0, vy: -0.3, t: 0 });
    });
  }

  function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  // ======================= level flow =======================
  function startClear() {
    game.state = 'clear'; game.clearT = 0;
    game.totals.stars += game.got.stars; game.totals.paws += game.got.paws;
    addScore(1000 + game.got.paws * 500);
    Sound.play('howl');
  }

  function step() {
    game.levelT++;
    game.players.forEach(updatePlayer);
    game.enemies.forEach(updateEnemy);
    game.shots.forEach(updateShot);
    game.enemies = game.enemies.filter(function (e) { return !e.gone; });
    game.shots = game.shots.filter(function (s) { return !s.gone; });
    game.parts.forEach(function (pt) { pt.t++; pt.x += pt.vx; pt.y += pt.vy; if (pt.kind === 'chip') pt.vy += GRAV; });
    game.parts = game.parts.filter(function (pt) { return pt.t < (pt.kind === 'chip' ? 60 : 20); });
    game.texts.forEach(function (t) { t.t++; t.y -= 0.4; });
    game.texts = game.texts.filter(function (t) { return t.t < 60; });
    // everyone fainted: try again from the last paw flag
    if (game.players.every(function (p) { return p.fainted && p.faintT > 90; })) {
      game.retries++;
      spawn();
    }
    updateCamera(0.15);
  }

  function updateCamera(ease) {
    var alive = game.players.filter(function (p) { return !p.fainted; });
    if (!alive.length) alive = game.players;
    var avg = alive.reduce(function (s, p) { return s + p.x; }, 0) / alive.length;
    var target = Math.max(0, Math.min(level.w * TILE - VW, avg + 6 - VW / 2));
    game.camX += (target - game.camX) * ease;
    if (Math.abs(target - game.camX) < 0.3) game.camX = target;
  }

  function update() {
    game.frame++;
    if (pressed.KeyM) Sound.toggle();
    if (game.state === 'title') {
      if (pressed.ArrowDown || pressed.KeyS) { game.menu = (game.menu + 1) % MENU.length; Sound.play('select'); }
      if (pressed.ArrowUp || pressed.KeyW) { game.menu = (game.menu + MENU.length - 1) % MENU.length; Sound.play('select'); }
      if (pressed.Enter || pressed.Space || touch.jumpTap) newGame(game.menu);
    } else if (game.state === 'intro') {
      if (++game.introT > 150 || (game.introT > 30 && (pressed.Enter || pressed.Space || touch.jumpTap))) game.state = 'play';
    } else if (game.state === 'play') {
      if (pressed.KeyP || pressed.Escape) { game.paused = !game.paused; Sound.play('select'); }
      if (!game.paused) step();
    } else if (game.state === 'clear') {
      game.clearT++;
      if (game.clearT > 90 && (pressed.Enter || pressed.Space || touch.jumpTap || game.clearT > 600)) {
        game.levelIdx++;
        if (game.levelIdx >= Levels.length) { game.state = 'win'; game.overT = 0; }
        else startLevel();
      }
    } else if (game.state === 'win') {
      game.overT++;
      if (game.overT > 120 && (pressed.Enter || pressed.Space || touch.jumpTap)) game.state = 'title';
    }
    pressed = {};
    Object.keys(touch).forEach(function (k) { if (/Tap$/.test(k)) touch[k] = false; });
  }

  // ======================= drawing =======================
  function text(str, x, y, color, align, size) {
    g.font = size ? size + 'px "Press Start 2P", monospace' : FONT;
    g.textAlign = align || 'left';
    g.textBaseline = 'top';
    g.fillStyle = '#000'; g.fillText(str, x + 1, y + 1);
    g.fillStyle = color || '#fff'; g.fillText(str, x, y);
  }
  function theme() { return art.themes[level.theme] || art.themes.canyon; }

  function drawTiles() {
    var th = theme(), x0 = Math.floor(game.camX / TILE), x1 = Math.min(level.w - 1, x0 + VW / TILE + 1);
    for (var ty = 0; ty < level.h; ty++) {
      for (var tx = x0; tx <= x1; tx++) {
        var c = tiles[ty][tx];
        if (c === '.') continue;
        var x = Math.round(tx * TILE - game.camX), y = ty * TILE;
        if (c === '~') { g.drawImage(th['~'], x, y + (tileAt(tx, ty - 1) === '~' ? 0 : Math.round(Math.sin(game.frame / 20 + tx)))); continue; }
        if (th[c]) g.drawImage(th[c], x, y);
        if (c === '#' && !isSolid(tileAt(tx, ty - 1))) g.drawImage(th.top, x, y);
      }
    }
  }

  function drawPlayer(p) {
    if (p.inv > 0 && Math.floor(p.inv / 4) % 2 && !p.fainted) return;
    var fr = art[p.id], pose = 'stand';
    if (p.climb) pose = Math.floor(p.anim) % 2 ? 'walk1' : 'walk2';
    else if (!p.onGround) pose = 'jump';
    else if (Math.abs(p.vx) > 0.2) pose = ['walk1', 'stand', 'walk2', 'stand'][Math.floor(p.anim) % 4];
    var img = fr[pose].big[p.face < 0 ? 1 : 0];
    var x = Math.round(p.x - 2 - game.camX), y = Math.round(p.y + p.h - img.height + 1);
    if (p.fainted) {                                  // sitting down, dazed
      g.save(); g.translate(x + 8, y + 24); g.rotate(-Math.PI / 2 * p.face); g.drawImage(img, -8, -16); g.restore();
      Art.drawDizzy(g, x - 4, y + 12, game.frame);
      if (game.players.length > 1 && Math.floor(game.frame / 20) % 2) text('HELP!', x + 8, y + 2, '#ff8080', 'center', 5);
      return;
    }
    if (p.dashT > 0) { g.globalAlpha = 0.35; g.drawImage(img, x - p.face * 8, y); g.globalAlpha = 1; }
    g.drawImage(img, x, y);
    if (game.players.length > 1) text(BROS[p.id].name, x + 8, y - 7, BROS[p.id].color, 'center', 5);
  }

  function enemyImage(e) {
    var set = art[e.type], img = set[Math.floor(game.frame / 12) % set.length];
    if ((e.type === 'lizard' || e.type === 'gull' || e.type === 'robot') && e.vx > 0) img = img._flip || (img._flip = Art.flip(img));
    return img;
  }
  function drawEnemy(e) {
    var x = Math.round(e.x - 1 - game.camX), y = Math.round(e.y - 2);
    if (x < -20 || x > VW + 20) return;
    var img = enemyImage(e);
    if (e.dead) { g.globalAlpha = Math.max(0, 1 - e.deadT / 20); g.drawImage(img, x, y - e.deadT); g.globalAlpha = 1; return; }
    if (e.stun > 0) {
      if (e.stun < 60 && Math.floor(e.stun / 5) % 2) g.globalAlpha = 0.6;
      g.drawImage(img, x, y); g.globalAlpha = 1;
      Art.drawDizzy(g, x, y, game.frame);
      return;
    }
    if (e.type === 'ball' && e.onGround) { g.drawImage(img, x - 1, y + 3, 18, 13); return; }
    g.drawImage(img, x, y);
  }

  function drawItems() {
    game.items.forEach(function (it) {
      if (it.got) return;
      var x = Math.round(it.x - game.camX);
      if (x < -16 || x > VW) return;
      if (it.kind === 'star') Art.drawStar(g, x, it.y, game.frame + it.x / 8);
      else if (it.kind === 'paw') Art.drawPaw(g, x, it.y, game.frame);
      else g.drawImage(art.orange, x, it.y + Math.round(Math.sin(game.frame / 15) * 1.5));
    });
  }

  function drawHud() {
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, VW, 26);
    game.players.forEach(function (p, i) {
      var x = 6 + i * 70;
      text(BROS[p.id].name, x, 4, BROS[p.id].color, 'left', 6);
      for (var h = 0; h < HEARTS; h++) Art.drawHeart(g, x + h * 9, 14, h < p.hearts);
    });
    var sx = 150;
    Art.drawStar(g, sx - 6, 2, 0); text(game.got.stars + '/' + game.starTotal, sx + 10, 7, '#f8d030', 'left', 6);
    for (var k = 0; k < 3; k++) {
      if (k < game.got.paws) Art.drawPaw(g, sx + 46 + k * 13, 3, null, 12);
      else { g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1; g.beginPath(); g.arc(sx + 54 + k * 13, 11, 5, 0, Math.PI * 2); g.stroke(); }
    }
    text(String(game.score).padStart(6, '0'), VW - 6, 5, '#ffffff', 'right', 6);
    text(level.title, VW - 6, 16, '#c0e0ff', 'right', 5);
  }

  function drawWorld() {
    var ground = (level.h - 2) * TILE;
    Art.drawBackground(g, game.camX, VW, VH, level.theme);
    level.decos.forEach(function (d) {
      var dx = d.x * TILE - game.camX;
      if (dx > -120 && dx < VW + 40) Art.drawDeco(g, d, Math.round(dx), ground, game.frame, art);
    });
    level.checkpoints.forEach(function (cx) {
      Art.drawCheckpoint(g, Math.round(cx * TILE - game.camX), ground, game.checkpoint != null && game.checkpoint >= cx, game.frame);
    });
    Art.drawCoach(g, art, Math.round(level.goalX * TILE - game.camX + 6), ground, game.frame, game.state === 'clear');
    drawTiles();
    drawItems();
    game.enemies.forEach(drawEnemy);
    game.players.forEach(drawPlayer);
    var shotColor = theme().shot;
    game.shots.forEach(function (s) { Art.drawShot(g, Math.round(s.x - game.camX), Math.round(s.y), shotColor); });
    game.parts.forEach(function (pt) {
      var x = Math.round(pt.x - game.camX), y = Math.round(pt.y);
      if (pt.kind === 'chip') { g.fillStyle = '#b07a40'; g.fillRect(x, y, 6, 6); }
      else if (pt.kind === 'spark') { g.fillStyle = '#f8f060'; g.fillRect(x, y, 2, 2); }
      else { g.fillStyle = 'rgba(255,255,255,' + Math.max(0, 1 - pt.t / 20) + ')'; g.fillRect(x - 2, y - 2, 4, 4); }
    });
    game.texts.forEach(function (t) { text(t.text, Math.round(t.x - game.camX + 8), Math.round(t.y), t.color || '#fff', 'center', 6); });
    drawHud();
  }

  function panel(x, y, w, h) {
    g.fillStyle = 'rgba(10,20,40,0.85)'; g.fillRect(x, y, w, h);
    g.strokeStyle = '#3a7ad8'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }

  function drawTitle() {
    Art.drawBackground(g, game.frame * 0.4, VW, VH, 'canyon');
    var th = art.themes.canyon;
    for (var x = 0; x < VW; x += TILE) { g.drawImage(th['#'], x, VH - 32); g.drawImage(th['#'], x, VH - 16); g.drawImage(th.top, x, VH - 32); }
    panel(30, 10, 260, 60);
    g.font = '16px "Press Start 2P", monospace'; g.textAlign = 'center'; g.textBaseline = 'top';
    g.fillStyle = '#000'; g.fillText('JOSH & JASPER', 162, 20);
    g.fillStyle = '#f8d030'; g.fillText('JOSH & JASPER', 160, 18);
    text('COYOTE TRAIL', 160, 42, '#9ad0ff', 'center');
    text('A SAGE CANYON ADVENTURE', 160, 56, '#ffffff', 'center', 5);
    var bob = Math.floor(game.frame / 20) % 2;
    g.drawImage(art.josh.stand.big[0], 112, VH - 56 - bob);
    Art.drawCoach(g, art, 152, VH - 32, game.frame, false);
    g.drawImage(art.jasper.stand.big[1], 192, VH - 56 - (1 - bob));
    MENU.forEach(function (m, i) {
      text((i === game.menu ? '> ' : '  ') + m.label, 160, 80 + i * 12, i === game.menu ? '#f8d030' : '#fff', 'center');
    });
    text('ENTER / SPACE TO START', 160, 118, '#c0e0ff', 'center', 6);
  }

  function drawIntro() {
    g.fillStyle = '#0c1830'; g.fillRect(0, 0, VW, VH);
    text('LEVEL ' + level.name, 160, 34, '#9ad0ff', 'center');
    text(level.title, 160, 50, '#f8d030', 'center');
    text(level.hint || '', 160, 68, '#ffffff', 'center', 5);
    game.players.forEach(function (p, i) { g.drawImage(art[p.id].stand.big[0], 152 + i * 22 - (game.players.length - 1) * 11, 84); });
    var hasJosh = game.mode.players.indexOf('josh') >= 0, hasJasper = game.mode.players.indexOf('jasper') >= 0;
    var tips = ['FIND THE 3 COYOTE PAW BADGES'];
    if (hasJosh) tips.push('JOSH: SHIFT (OR C) DASHES AND BREAKS CRATES');
    if (hasJasper) tips.push('JASPER: JUMP AGAIN IN THE AIR TO DOUBLE JUMP');
    tips.push('THROW TO MAKE CRITTERS DIZZY - THEN STAND ON THEM');
    tips.forEach(function (t, i) { text(t, 160, 120 + i * 11, '#c0c0d0', 'center', 5); });
  }

  function drawClear() {
    panel(40, 38, 240, 116);
    Art.drawCoach(g, art, 58, 136, game.frame, true);
    text('GO COYOTES!', 172, 48, '#f8d030', 'center');
    text(level.title + ' CLEAR', 172, 64, '#ffffff', 'center', 5);
    Art.drawStar(g, 104, 78, 0); text(game.got.stars + ' / ' + game.starTotal, 124, 83, '#f8d030', 'left', 6);
    for (var k = 0; k < 3; k++) {
      if (k < game.got.paws) Art.drawPaw(g, 104 + k * 18, 96, null, 14);
      else { g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1; g.beginPath(); g.arc(112 + k * 18, 104, 6, 0, Math.PI * 2); g.stroke(); }
    }
    var secs = Math.floor(game.levelT / 60);
    text('TIME ' + Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0') + (game.retries ? '  RETRIES ' + game.retries : ''), 104, 120, '#c0e0ff', 'left', 5);
    if (game.clearT > 90) text('PRESS ENTER', 172, 138, '#ffffff', 'center', 6);
  }

  function drawWin() {
    Art.drawBackground(g, 0, VW, VH, 'school');
    panel(24, 20, 272, 152);
    text('RING RING! SCHOOL TIME!', 160, 32, '#f8d030', 'center');
    text('JOSH & JASPER MADE IT TO CLASS', 160, 50, '#ffffff', 'center', 5);
    g.drawImage(art.josh.stand.big[0], 116, 76);
    Art.drawCoach(g, art, 152, 100, game.frame, true);
    g.drawImage(art.jasper.stand.big[1], 188, 76);
    Art.drawStar(g, 92, 112, 0); text(String(game.totals.stars), 112, 117, '#f8d030', 'left', 6);
    Art.drawPaw(g, 168, 112, null, 14); text(game.totals.paws + ' / ' + Levels.length * 3, 186, 117, '#9ad0ff', 'left', 6);
    text('SCORE ' + game.score, 160, 136, '#ffffff', 'center', 6);
    if (game.overT > 120) text('PRESS ENTER', 160, 154, '#c0e0ff', 'center', 6);
  }

  function draw() {
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (game.state === 'title') return drawTitle();
    if (game.state === 'win') return drawWin();
    if (game.state === 'intro') return drawIntro();
    drawWorld();
    if (game.state === 'clear') drawClear();
    if (game.paused) { g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, 0, VW, VH); text('PAUSED', 160, 88, '#fff', 'center'); }
  }

  // tap the title menu / screens on touch devices
  canvas.addEventListener('pointerdown', function (e) {
    Sound.unlock();
    if (game.state === 'title') {
      var r = canvas.getBoundingClientRect(), y = (e.clientY - r.top) / r.height * VH;
      var i = Math.floor((y - 77) / 12);
      if (i >= 0 && i < MENU.length) { if (i === game.menu) newGame(i); else { game.menu = i; Sound.play('select'); } }
    } else if (game.state === 'intro' && game.introT > 30) game.state = 'play';
    else if (game.state === 'clear' && game.clearT > 90) touch.jumpTap = true;
    else if (game.state === 'win' && game.overT > 120) game.state = 'title';
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

  // hooks for automated tests
  window.JJ = { game: game, newGame: newGame, keys: keys, touch: touch,
                step: function (n) { for (var i = 0; i < (n || 1); i++) update(); },
                press: function (code) { pressed[code] = true; },
                loadLevel: function (i) { game.levelIdx = i; startLevel(); },
                level: function () { return level; }, tiles: function () { return tiles; } };
})();
