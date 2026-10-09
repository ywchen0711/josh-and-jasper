/*
 * Tiny chiptune-style sound effects with the Web Audio API (no audio files).
 */
(function () {
  'use strict';
  var ctx = null, muted = false;

  function ac() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  // a single note: frequency (Hz), length (s), wave, volume, slide-to frequency, delay
  function note(f, len, type, vol, to, at) {
    var a = ac();
    if (!a || muted) return;
    var t = a.currentTime + (at || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + len);
    g.gain.setValueAtTime(vol || 0.08, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + len + 0.02);
  }
  function noise(len, vol, at) {
    var a = ac();
    if (!a || muted) return;
    var n = Math.floor(a.sampleRate * len), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = a.createBufferSource(), g = a.createGain(), t = a.currentTime + (at || 0);
    s.buffer = buf; g.gain.value = vol || 0.15;
    s.connect(g); g.connect(a.destination); s.start(t);
  }
  function seq(notes, step, type, vol) {
    notes.forEach(function (f, i) { if (f) note(f, step * 1.1, type, vol, null, i * step); });
  }

  var SFX = {
    jump:    function () { note(330, 0.18, 'square', 0.06, 880); },
    bigjump: function () { note(260, 0.22, 'square', 0.06, 700); },
    coin:    function () { note(988, 0.07, 'square', 0.06); note(1319, 0.25, 'square', 0.06, null, 0.07); },
    stomp:   function () { note(500, 0.1, 'square', 0.08, 150); },
    bump:    function () { note(140, 0.08, 'triangle', 0.15, 90); },
    brk:     function () { noise(0.2, 0.2); note(200, 0.15, 'square', 0.05, 60); },
    sprout:  function () { seq([392, 494, 587, 784], 0.06, 'square', 0.05); },
    power:   function () { seq([523, 659, 784, 1047, 659, 784, 1047, 1319], 0.05, 'square', 0.05); },
    shrink:  function () { seq([784, 587, 440, 330], 0.07, 'square', 0.05); },
    die:     function () { seq([494, 466, 440, 0, 330, 262, 196], 0.11, 'square', 0.06); },
    oneup:   function () { seq([659, 784, 1319, 1047, 1175, 1568], 0.08, 'square', 0.05); },
    clear:   function () { seq([523, 659, 784, 1047, 0, 784, 1047, 1319, 1568], 0.11, 'square', 0.05); },
    gameover:function () { seq([392, 330, 262, 196, 165, 131], 0.18, 'triangle', 0.08); },
    select:  function () { note(880, 0.05, 'square', 0.04); },
    toss:    function () { note(700, 0.08, 'triangle', 0.08, 350); },
    stun:    function () { seq([1200, 900, 1200], 0.04, 'square', 0.04); },
    poof:    function () { noise(0.15, 0.12); seq([660, 990], 0.05, 'square', 0.04); },
    hurt:    function () { note(300, 0.2, 'sawtooth', 0.07, 120); },
    spring:  function () { note(220, 0.25, 'triangle', 0.15, 880); },
    dash:    function () { noise(0.12, 0.1); note(300, 0.12, 'square', 0.04, 600); },
    star:    function () { note(1568, 0.06, 'square', 0.04); note(2093, 0.1, 'square', 0.04, null, 0.05); },
    paw:     function () { seq([784, 988, 1175, 1568], 0.07, 'triangle', 0.08); },
    heal:    function () { seq([523, 784, 1047], 0.06, 'triangle', 0.08); },
    splash:  function () { noise(0.3, 0.15); note(400, 0.2, 'sine', 0.08, 150); },
    check:   function () { seq([659, 880, 1319], 0.08, 'square', 0.05); },
    revive:  function () { seq([392, 523, 659, 784, 1047], 0.06, 'triangle', 0.08); },
    howl:    function () { note(500, 0.5, 'sine', 0.1, 900); note(900, 0.9, 'sine', 0.08, 600, 0.45); note(1200, 0.5, 'sine', 0.03, 800, 0.5); },
    pause:   function () { seq([659, 523, 659, 523], 0.06, 'square', 0.04); }
  };

  window.Sound = {
    play: function (name) { try { if (SFX[name]) SFX[name](); } catch (e) { /* audio is optional */ } },
    unlock: function () { ac(); },
    toggle: function () { muted = !muted; return !muted; },
    get muted() { return muted; }
  };
})();
