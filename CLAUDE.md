# Carter's World — project guide

A single-file 3D Roblox-style game (Three.js r128) built for Carter, age 8. He drives to a
QuikTrip, buys real snacks with a pretend Amex, and his dad (Jesse) gets an email with Amazon
links to fulfill the order. Live at https://jjmzeus36.github.io/carters-world/ (GitHub Pages,
this repo, `index.html` at root). Custom domain carter.roothomeservices.com pending one CNAME
(carter → jjmzeus36.github.io, proxy off); when DNS exists, restore a `CNAME` file at repo root.

## Fullscreen / installable app (PWA, added 7/13/2026)
- `manifest.webmanifest` + `icon-180/192/512.png` at repo root; head.html links them
  (rel=manifest, apple-touch-icon). display:fullscreen, orientation:landscape,
  start_url/scope "." (relative — works on Pages AND localhost).
- Install = the fullscreen answer on phones: iPhone Safari → Share → Add to Home Screen
  (iOS has NO fullscreen API in-tab; the fsBtn toast says this). Android Chrome →
  ⋮ menu → "Add to Home screen"/"Install app". Launching from the icon = zero browser UI.
- GOTCHA: iOS home-screen apps get SEPARATE localStorage from the Safari/Chrome tab —
  a save made in the tab does not carry into the installed app (fresh save starts there,
  which now = 20 coins). Android installed PWAs share Chrome's storage.
- No service worker (deliberate — no offline caching to fight on deploys; modern Chrome
  installs fine without one).

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
- **Economy (amended by Jesse 7/13/2026):** coins start at 20 (new saves; existing saves get a
  ONE-TIME top-up to 20 via the save.grant20 flag — never re-applies after spending). Exactly 30
  on the map; beyond the one-time start, NO bonuses, grants, quest coins, or daily allowances —
  further coins come only from map pickups. Quest coin-counting is unaffected (it watches
  save.got.length, not the wallet).
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

## Town expansion + quest wave 2 (July 11, 2026 — src/game_town.js)
- **Oak Lane (z=-64) + Maple Drive (z=+64)**: baked road textures (bakeCrossStreet), 50 houseLite
  homes in 4 rows (numbers 301-354/501-546, fictional), driveways + 8 parked cars, 2 hoops,
  6 lamps, stop signs + street blades at both Hero intersections, +2 ambient traffic cars (5 total).
- Props/life: lemonade stand (NO purchases — scenery+chat only), hopscotch pads ×2 (jump-landing
  detector emits 'hopscotch'), chalk doodles, soccer field, balloon house (animated), sprinkler
  (10 pooled droplets, emits 'sprinkler'), Sam's kite (anim + string line), 17 new NPCs
  (kids playing tag/hopping + adults; Mr. Ortiz walks Peanut the chihuahua via attach).
- Collectibles: 10 feathers + 8 chalk stars, one-shot, persisted in save.townc (additive top-level
  key), pickups emit window.QUEST_EV('feather'/'chalk') — bridge exposed by game_quests.js.
- NPC life in game_logic npcUpdate: heads (with hair/cap parented to the head mesh!) track Carter
  within 7m; one-shot wave on approach. window.TOWN_ANIMS[] callbacks run inside birdsUpdate.
- Build order is now core → town → logic → quests (town needs core symbols at load; quests wraps logic).
- Quest wave 2 (appended INSIDE game_quests.js arrays): +41 quests (streets/meet-everyone/lemonade/
  feathers/chalk/sprinkler/hopscotch/kite/soccer/balloon/cookie-delivery/QT-regulars/tour/gnomes4/
  photo3/litter2/3 races/12 skill quests), +10 dailies, +12 badges, +2 titles (85/120⭐), +5 gnomes,
  +6 shinies, +4 photo spots, +4 litter, 3 new RACES. Total ≈ 79 quests + 26 dailies ≈ 40h of play.
  QT stays the spine: the whole wave gates on errand_run (the shop quest).
- **New step kind t:'count'** (in stepProg): progress = a persisted-total getter, added because
  ev-steps only count while a quest is ACTIVE — one-shot collectibles (feathers/chalk/gnomes)
  would soft-lock forever if picked up early. gnomes1-4 + feather/chalk quests all use it now.

## Carter Stadium (playable 3v3 soccer, July 11 2026 - in game_town.js)
- Pitch at (116,38) 26x16, right across from QT. Baked striped pitch, two netted goals,
  rails w/ colliders (gaps: side entrances + goal mouths), bleachers, benches, floodlights,
  corner flags, LIVE canvas scoreboard, "COME AND PLAY!" sign = match toggle (scanInteract
  candidate in game_logic, guarded on window.SOCCER_SIGN).
- 3v3 match: Carter+Khoa+Michael (blue) vs Chippy+Amelia+Holly (Chippy's crew) - names are
  Jesse-requested real first names (public repo: first names ONLY, nothing else). AI: nearest
  teammate chases, others hold formation; Holly=keeper on the east goal line, Amelia=sweeper
  (Jesse asked for better girls' defense). First to 3; a win emits QUEST_EV('match_win')
  (quests match1/match2 + champs badge). East-goal scores emit 'goal'. Players are
  type:'idle' NPCs (npcUpdate ignores them; the match AI drives positions directly).
- Both soccer balls (home + stadium) share soccerBallMat (pentagon canvas texture).
- Every NPC has a floating name-tag sprite (added at END of game_town.js after all addNPC
  calls - new NPCs must be registered before that block or tagged manually).
- JS string emoji: NEVER write python-style \U0001FXXXX escapes into JS source - JS renders
  them as literal text (Jesse read 'U0001F631...' as 'UFC'). Use real emoji characters.

## Gotchas learned the hard way
- **Stray lone commas in big array literals create sparse-array HOLES that node --check passes**
  (elisions are legal JS): a hole in BADGES made checkBadges() throw every second and killed the
  quest save-flush; a hole in DAILIES bricked ~1 in 9 daily rolls. When appending to the catalog
  arrays, never leave a bare ',' line; verify with `ARR.includes(undefined)` in the console.
- Quest ev-steps are SEQUENTIAL (only the current step counts events) — order greet lists the way
  the kid will naturally walk them. Races' names MUST contain '→' (raceStart splits on it).
- Sticker album is keyed by EMOJI, not quest id — every quest's stick emoji must be unique.
- New quest-giver NPCs must be added to initMarks() list or they never get the ❗ marker.
- index.html MUST keep `<meta charset="utf-8">` first in head.html — GitHub Pages sends a charset
  header but plain `python -m http.server` doesn't, and every emoji/star mojibakes without it.
- rAF stops in hidden/background tabs AND in occluded windows (another app covering Chrome
  throttles it to zero — check window.__diag.frames advancing before trusting any live test) —
  for headless/automation testing use the deterministic
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

## Quests layer (v1, July 11 2026) — src/game_quests.js
- **38 quests + 16 rotating dailies (3/day, date-seeded) + ~40 badges + sticker album +
  6 rank titles** — story chains (Neighborhood Hero, Gnome Hunt, Duck Detective, races,
  photo safari, Tiny arc), NPC side-quests with an offer dialog (❗ over givers), a Job
  Board at (94,-10), 10 hidden gnomes, 8 photo spots, a daily Shiny Pebble, fetch items,
  and 3 timed vehicle races. Sized for ~20 hours of play.
- **HARD RULE HONORED: quests award NO coins ever** — stars ⭐/stickers/badges/titles only.
  One early quest uses the normal shop loop once ("buy a snack"); dailies never require purchases.
- **Additive-only install:** the file wraps `objUpdate` / `scanInteract` / `doInteract` /
  `anyModal` / `closeModals` at load (it must stay LAST in build.sh's concat order). It
  never edits game_core/game_logic. Interaction classify is emoji-prefix-based (👋🐶📬🚪⛽⚡) —
  if those prompt labels change, quest counting degrades silently (no crash).
- Save lives in `save.quests` (additive; NO SAVE_KEY bump needed — old saves upgrade in place).
- Uses its own `new THREE.Clock()` so the deterministic test stepper drives it too.
- Kill switch: `localStorage.setItem('cw_quests_off','1')` + reload disables the layer.
- Base scanInteract wins the prompt unless it found nothing or the player is basically
  standing on a quest object (<1.8m) — placed quest objects away from base interactables.
- Smoke-tested end-to-end on localhost via the stepper: quest accept/complete/chain-auto-accept,
  NPC offer dialog, gnome/photo/fetch/daily/mail flows, book modal (pauses sim), persistence.

## Asset credits
- Cybertruck GLB by Mobolaji via poly.pizza (CC-BY 3.0, credited in Parent Zone).
- Tesla Model 3 chassis from kelvinkoko/autonomous-driving-playground (GitHub LFS).
- "Tahoe" is a 2021 Escalade GLB from Sultan-Sovetov/Draxler, white baked offline, gold bowtie added.
- Backup full-address private build: claude.ai artifact c2535e00-ab2a-4118-8b87-3884bcb3917d.
