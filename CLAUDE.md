# Carter's World — project guide

A single-file 3D Roblox-style game (Three.js r128) built for Carter, age 8. He drives to a
QuikTrip, buys real snacks with a pretend Amex, and his dad (Jesse) gets an email with Amazon
links to fulfill the order. Live at https://jjmzeus36.github.io/carters-world/ (GitHub Pages,
this repo, `index.html` at root). Custom domain carter.roothomeservices.com pending one CNAME
(carter → jjmzeus36.github.io, proxy off); when DNS exists, restore a `CNAME` file at repo root.

## Build & deploy
- Source lives in `src/` (head.html = CSS+DOM, game_core.js = world/builders/catalog,
  game_logic.js = input/sim/UI, plus vendored three.min.js, GLTFLoader.js, and base64 asset
  chunks glb_chunk.html / qr_chunk.html).
- `bash build.sh` → concatenates into `index.html` and syntax-checks. NEVER edit index.html directly.
- Deploy = `git push` (Pages serves main branch root, ~1 min; browsers cache hard — test with `?v=N`).
- Local test: `python3 -m http.server 8123` then open http://localhost:8123 — test on localhost,
  never file:// (fetch/audio behave differently).

## Hard rules (Jesse's explicit decisions — do not undo)
- **PRIVACY: this repo is public.** The build is scrubbed: "Carter Street · Texas", house sign ★,
  CARTER TOWN. NEVER commit Carter's real street name, house number, or city. (The street is
  spelled K-E-E-N when it comes up in private contexts — voice transcripts often add a wrong 'e'.)
- **Economy:** coins start at 0; exactly 30 on the map; NO bonuses, grants, quest coins, or daily
  allowances — coins come only from map pickups.
- **Checkout ritual:** snack picker opens only at the shelves; payment happens only at the cashier
  counter ("Check out with the cashier!"). Card reads CARTER "THE BOSS" / ROOT HOME SERVICES LLC.
- **No "Dad" text anywhere kid-visible.** Parent Zone is the 🔒 gate; its answer is 12
  (∫₀³(x²+1)dx · lim sinx/x — integral 12 × limit 1).
- **Order emails:** tryAutoEmail() POSTs to FormSubmit → hello@pebblevending.com. Activation is
  per-origin (one "Activate Form" click per new domain). Parent Zone rows show "✉️ emailed" on success.

## v3 "quantum leap" upgrade (July 11, 2026, same day as v2)
- **Filmic pipeline:** renderer.outputEncoding=sRGB + ACESFilmicToneMapping, exposure 1.28.
  ALL hex colors are authored sRGB: mat() converts+flags at creation; a boot-time scene sweep
  in game_logic converts every other material's color/emissive once (userData._lin guard).
  Canvas textures get encoding=sRGBEncoding inside texCanvas. GLB materials are already
  linear (glTF spec) and load after the sweep — never convert them. New lazily-created
  colored materials MUST convertSRGBToLinear() themselves.
- **Baked roads:** all markings (dashes, edge lines, zebras, stop bars, tire wear, manholes,
  patches) live INSIDE carterTex/heroTex (world→pixel math in the bake fns) — killed ~140
  paint quads. QT stalls = one overlay plane + oil-stain decals.
- Shingle/siding grayscale detail maps tinted per house (roofMat/sideMat caches);
  gable roofs (ExtrudeGeometry) on (num>>1)%2===0 houses, pyramid cones otherwise.
- Power lines (merged one-draw LineSegments wires), pond + paddling ducks + scrolling water
  (pondTex offset in birdsUpdate), gravel path, picnic table, backyard privacy fences
  (WITH colliders at z=-30.5 and z=34 — coins/trampoline are inside them, by design),
  trampoline at (24,-26) auto-boings the on-foot player (playerUpdate), butterflies on wing
  pivots near flower beds, cloud ground-shadows tied to the cloud drift, brick wainscot +
  reflective glass on QT, curbside bins/mailboxes/AC units per house.
- **Dog is Tiny the chihuahua** (fawn + cream, giant ears, curled tail, yip bark). No Grandma
  references anywhere (owner request 7/11).
- Sky-dome horizon band == scene.fog color (0xcfe9f7 bright haze) or a seam shows.

## v2 "realistic town" upgrade (July 11, 2026)
- Sky dome (gradient sphere + sun glow sprite, both fog:false, follow the player via skyGroup),
  textured grass/asphalt/sidewalks (canvas textures, RepeatWrapping), gutters + white edge lines,
  crosswalks + stop bars at the intersection, QT parking stalls + ♿ spot, street lamps ×10,
  stop sign, fire hydrant, upgraded houses (window frames/sills/shutters, chimneys on #%3==1,
  foundation strip + bushes + flowers, door frame/knob/step, fascia trim), 3-blob trees with
  color jitter, flat-bottom clouds, QT ceiling light strips.
- Living streets: TRAFFIC (3 ambient cars, lane loops, yield-to-Carter, back up politely when
  blocked >2.2s, soft-bumper push with touch-entry-only speed damping — NEVER damp every frame,
  that gridlocks the player); BIRDS (3, circling); dust puffs off-road + brake smoke (pooled,
  20 meshes); speed-FOV kick (60→67); 'skid' sfx.
- Interactions are now NEAREST-WINS (scanInteract builds candidates, sorts by distance) — the old
  fixed priority let a parked bike shadow the mailbox/door prompts.

## Gotchas learned the hard way
- index.html MUST keep `<meta charset="utf-8">` first in head.html — GitHub Pages sends a charset
  header but plain `python -m http.server` doesn't, and every emoji/star mojibakes without it.
- rAF stops in hidden/background tabs — for headless/automation testing use the deterministic
  stepper: stub `window.requestAnimationFrame=()=>0`, stub `THREE.Clock.prototype.getDelta=()=>1/60`,
  call `tick()` in a loop, then restore both (window.__step pattern in the 7/11 test transcript).
  `keys.KeyX=true` + `doInteract()` from page-context eval drive the game fully.
- GLB vehicle orientation: never trust bounding-box heuristics. The ONLY valid check is a settled
  chase-cam screenshot while driving forward — you must see the vehicle's REAR. VEH_CFG per-model
  {len, flip, rot, noAuto, lift} handles alignment; re-optimizing an asset changes its bbox and can
  silently flip it (caused the "up arrow reverses / car slides sideways" bug twice).
- Apostrophes break the sed-based scrubs inside single-quoted JS strings — syntax-check every
  script block after any string replacement.
- Lambert + hemi+sun over ~1.6 total intensity blows pale grays to pure white.
- The QT canopy fades to 0.18 opacity when the player is under it (do NOT hide it — hiding kills
  its shadow and the pump pads glare white). Store roof hides via IN_STORE instead.
- iOS: no fullscreen API on iPhone (fsBtn shows Add-to-Home-Screen tip); AudioContext needs resume
  on visibility/gesture (audioKick); joystick coords must be joyZone-local (getBoundingClientRect).
- Save key `cw_save_v3` in localStorage (per-origin). Bump the version to force fresh saves after
  economy/coin-layout changes (stale save.got indices corrupt new coin layouts).

## Asset credits
- Cybertruck GLB by Mobolaji via poly.pizza (CC-BY 3.0, credited in Parent Zone).
- Tesla Model 3 chassis from kelvinkoko/autonomous-driving-playground (GitHub LFS).
- "Tahoe" is a 2021 Escalade GLB from Sultan-Sovetov/Draxler, white baked offline, gold bowtie added.
- Backup full-address private build: claude.ai artifact c2535e00-ab2a-4118-8b87-3884bcb3917d.
