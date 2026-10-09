# Josh & Jasper: Coyote Trail

A side-scrolling adventure for one or two players. Brothers **Josh** and **Jasper** walk the canyon trail to
**Sage Canyon School**, cross the playground and the library, and meet **Coach Coyote** — the school mascot —
at the end of every level. Go Coyotes!

Plain HTML + JavaScript, no build step, no external assets: all pixel art and sound effects are generated in code.

Play online: https://ywchen0711.github.io/josh-and-jasper/

## Controls

| | Josh | Jasper |
|---|---|---|
| Move | A / D | ← / → |
| Jump, climb up | W | ↑ (press again in the air to **double jump**) |
| Climb down / drop through a platform | S | ↓ |
| Throw | F | / or Right Shift |
| Special | Left Shift: **dash** | — |

- **1 player**: either key set, plus Space / Z jump · X throw · C dash
- **Enter** start · **P** pause · **M** sound · phones get on-screen buttons

## How it plays

- **Throw** pinecones, paper balls or erasers to make critters **dizzy**. A dizzy critter is safe — you can even
  **stand on it** to reach higher. Hit it again while it's dizzy and it's gone.
- Jumping on a critter just bounces you off. Don't touch the **cactus**.
- **Josh** dashes through **crates** (two throws break one too). **Jasper** double-jumps.
- In 2-player mode the brothers can stand on each other's head. If one runs out of hearts,
  the other gives him a **high five** to get him back up.
- Climb **ladders**, drop through **platforms**, bounce on **pads**. Water and science goo cost a heart.
- Every brother has 3 hearts; **oranges** heal. Blue **paw flags** are checkpoints. No timer, no lives — just retry.
- Collect **star stickers** and find the **3 Coyote paw badges** hidden in each level.

## Levels

1. **Canyon Trail** — the walk to school through the coastal sage canyon: log bridges, rope ladders, a rock cliff,
   lizards, seagulls and prickly pear.
2. **Playground & Lunch** — the blue & grey campus: blacktop, lunch tables under the shade (watch the
   lunch-stealing gulls), a two-level play structure and the field.
3. **Library & STEAM Lab** — bookshelf platforms, rolling ladders, patrolling robots, hopping slime and spilled goo,
   ending at the Go Coyotes assembly.

## Files

```
index.html        page + touch buttons
style.css
js/art.js         the brothers' sprites
js/art-world.js   themes, Coach Coyote, critters, items, decorations, backgrounds
js/levels.js      level builder and the three levels
js/sound.js       Web Audio sound effects
js/game.js        movement, critters, camera, game flow
```
