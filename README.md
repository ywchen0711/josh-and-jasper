# Josh & Jasper — Super Brothers Adventure

A small side-scrolling platformer starring two brothers, **Josh** and **Jasper**.
Play alone as either brother, or together on one keyboard.

Plain HTML + JavaScript, no build step, no external assets: all pixel art and sound effects are generated in code.

## Play

Open `index.html` in a browser, or play online on GitHub Pages:
https://ywchen0711.github.io/josh-and-jasper/

To run locally with a web server (recommended):

```
python -m http.server 8000
```

then open http://localhost:8000

## Controls

| | Josh | Jasper |
|---|---|---|
| Move | A / D | ← / → |
| Jump (hold for higher) | W or Space | ↑ |
| Run | Left Shift | Right Shift or / |

- **1 player**: either key set works (also Z = jump, X = run)
- **Enter** start · **P** pause · **M** sound on/off
- Phones and tablets get on-screen buttons

## The brothers

- **Josh** runs a little faster
- **Jasper** jumps a little higher
- In 2-player mode they can **stand on each other's head** to reach high places,
  and a fallen brother drops back in next to the other one (lives are shared)

## How to play

- Stomp the purple **beetles**; don't touch the spiky **hedgehogs** (bump the block under them instead)
- Hit **? blocks** from below for coins; some hold an **acorn** that makes you big
- Big brothers can **break bricks**, and survive one extra hit
- 100 coins = extra life · grab the flag pole as high as you can · reach the checkpoint so a restart begins halfway
- **World 1**: 1-1 sunny meadow, 1-2 dusk platforms
- **World 2 — Sage Canyon** (inspired by Sage Canyon School in Carmel Valley, San Diego):
  - **2-1 Canyon Trail**: walk to school through the coastal sage scrub canyon — oaks, sage bushes,
    prickly pear cactus (don't touch!), fast lizards and seagulls; ends at the school's back gate
  - **2-2 Sage Canyon School**: a California elementary campus in the school's blue & grey —
    blacktop with hopscotch and tetherball, lunch tables under the shade (watch the lunch-stealing seagulls),
    library book blocks, playground, STEAM garden, US & California flags; bouncing playground balls;
    grab an **apple** to grow big; ring the bell at the front of the school

## Files

```
index.html      page + touch buttons
style.css
js/art.js       pixel art (sprites, tiles, background)
js/levels.js    level builder and the levels
js/sound.js     Web Audio sound effects
js/game.js      physics, enemies, camera, game flow
```

Add a level by writing a new builder function in `js/levels.js` and pushing it to `window.Levels`.
