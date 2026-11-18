# Sunspur: The Cooler Caper

[![Competition](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![Rank](https://make.fun/badge/gta6-01/arizkis/gta6-01-r5/rank.svg)](https://make.fun/bounty/gta6-01)
[![Reward](https://make.fun/badge/gta6-01/arizkis/gta6-01-r5/reward.svg)](https://make.fun/bounty/gta6-01)

Juno Reed is a getaway driver with $140, three contacts and a suspiciously important cooler. Sunspur Bay is an original low-poly coastal city in pink, orange, teal and cream. Explore five districts on foot or behind the wheel, with a third-person chase camera, moving traffic, strolling neighbors and a waterfront pier. All game art is geometry or canvas lettering generated locally. The only vendored runtime dependency is Three.js r160.

The six favors now run as a sequential job chain. Patrols pursue witnessed crimes, try PITs and rams, form roadblocks at three stars and box in cars with helicopter support at four. Break their sight behind buildings; shade also hides you from the helicopter. Heat drains, followed by stars. Staying within arrest range for four seconds brings a fine and a return to Juno’s apartment. The HUD reports the nearest three units, their tactics, sight status and heat; the map draws their vision cones and search area.

Coolers warm in sunlight, cool in shade and after sunset, and lose integrity in hard impacts. Integrity scales the payout; pristine cargo earns the full amount and a COLD BONUS acknowledgement. Juno automatically carries the visible cooler when leaving a vehicle and walks more slowly. Re-entering secures it again. Vapour follows both the box and the van. The final job carries a glowing lantern instead.

Tavi’s Workshop sells armour plating ($120), cooler insulation ($90) and a three-charge spike rack ($80); repairs cost $0.60 per missing condition point, rounded up. Plating reduces condition damage by 55% and increases acceleration weight by 20%. Insulation cuts sunlight warming to a third. A pursuing unit crossing a strip slows for six seconds; replacement strips cost $25. Cars smoke below 40% condition and steer poorly below 25%. Collisions also hurt Juno, with armour taking damage first. Market stalls sell food, work vests and five shirt colors. Fists scatter people, the wrench damages nearby cars, and the festival water pistol has a refillable tank. Speeding cars, close patrols and water send neighbors running or crouching.

While driving, cycle three WebAudio stations with different original note patterns, waveforms and tempos, plus a silent off/static dial position. Browser interaction enables audio. Skids, tyre smoke and collision sparks accompany driving. Save at the apartment; purchases and completed favors also save. The localStorage key is `sunspur.cooler-caper.v1`. Saves include cash, job progress, faction respect, clothing, upgrades, spike charges and checkpoint records. START restores the saved day; staging routes neither read nor write saves.

## Around the bay

Citrus Commons holds Juno’s apartment and Citrus Green. Find Sunspur Impound and the Coldfin freezer van in Old Salt Quarter, food and clothes in Marigold Market, and Tavi’s Workshop in Tideworks. Sunspur Strand leads to the sand, a coastal causeway and Tin Cup Pier. Tavi starts at Lantern Fest and moves to the pier for the first hand-in. Niko waits at the market, and Paz works by the pier. The impound gate admits a careful driver; the buoy favor permits a short swim beyond the beach.

## Six favors

| Order | Job | Contact / faction | Full pay | Errand |
| --- | --- | --- | --- | --- |
| 1 | The Cooler Caper | Tavi Moss / MECHANIC | $280 | Meet Tavi, reclaim the freezer van at Sunspur Impound, deliver the cooler to Tavi at Tin Cup Pier. |
| 2 | A Market of Minutes | Niko Vale / FIXER | $220 | Deliver fruit crates from Marigold Market across town against a timer. |
| 3 | Buoy Business | Paz Sol / FENCE | $240 | Reach the marked swimmer buoy off Sunspur Strand and return. |
| 4 | Last Cold Light | Tavi Moss / MECHANIC | $380 | Carry a second cooler across the causeway at dusk. |
| 5 | Five District Flyer | Niko Vale / FIXER | $420 | Clear checkpoints in all five districts before time expires. |
| 6 | The Lantern Mile | Paz Sol / FENCE | $500 | Deliver night lanterns from Lantern Fest to Tin Cup Pier. |

Take the first favor from the board, then press E near the named contact to hear the opening and advance the objective. Later favors unlock in order. E also accepts an available favor directly from its contact. Gold world markers and the plotted map route lead to each objective. Fruit gets five minutes, and the five-district course gets eight. Deliveries require stopping within 25 meters. Favor completion pays cash and raises the contact’s faction meter; the board acknowledges all six when finished. The buoy errand opens a short swimming corridor from the Strand to the orange marker.

## Run locally

Use Node.js 22 or later. No install or build step is needed.

```sh
node serve.ts
```

Open <http://localhost:8080> in desktop Chrome. The server serves `game/index.html`; all scripts, styles and the Three.js module load locally. After the static assets load, gameplay makes no network requests. `?seed=17` fixes city, vehicle and pedestrian placement; 17 is also the default.

## Controls

| Input | Action |
| --- | --- |
| Enter or START | Start the day |
| WASD / arrow keys | Walk or accelerate, steer, brake and reverse while driving |
| Shift | Sprint on foot |
| E | Enter or exit a slow car, talk, advance dialogue, or open a nearby shop/apartment |
| Space | Vehicle handbrake |
| Escape / P | Pause or resume; return from the job board |
| 1 / 2 / 3 or Q | Select or cycle fists, wrench and water pistol |
| R or click the world | Use the equipped item on foot |
| F | Cycle SUNSPUR FM, MARLIN TALK, TIDEWAVE and off/static |
| X | Drop a fitted spike strip while driving |
| B | Open the job board during play |
| Mouse click | Activate menu buttons |

Exit requires a nearly stopped car and clear space beside or behind it. Walking uses camera-relative directions. Steering weakens at high speed. Collisions stop or slide cars and reduce their condition; condition limits top speed.

## Modules and extension points

Each feature is a plain ES module under `game/src/`. `config.js` defines dimensions and tuning; `random.js` supplies repeatable placement. `city.js` builds geometry, blockers and shade and exposes district and time-of-day queries. `vehicles.js`, `traffic.js` and `pedestrians.js` keep live actor records. `player.js` and `driving.js` handle movement and the camera. `minimap.js` and `hud.js` draw the instruments. `mission-director.js` executes the six jobs and tracks unlocks; `main.js` connects systems, menus, input and the simulation loop.

`window.sunspur` exposes the shared state and the live police, cargo, services, weapons, effects and radio systems for browser inspection. `police-tactics.js` owns patrol decisions, air support, witness reports and arrests. `cooler-cargo.js` owns cargo and carrying. `garage-upgrades.js` owns services and save restoration. `navigation.js` plots street waypoints. `effects.js`, `weapons.js`, `radio.js` and `shots.js` handle their respective systems. The existing `registerSystem` hook and `contact`, `jobrequested` and `key` events remain available. Game simulation uses a fixed 60 Hz step; the HUD refreshes from live records.

## Staging and screenshot procedure

The four routes in `shots.json` arrange repeatable scenes with the normal actors and instruments. Cover uses golden light, a carried cooler, smoking van, converging patrols and a searchlight. Market uses midday light and Niko’s dialogue. Garage uses warm light and the repair/progression panel. Causeway uses dusk, a fast freezer van, four units and air support. Each exposes `window.__shotReady` only after two rendered frames and visible HUD elements. Scene positions remain fixed so the final capture is repeatable; lights, vapour, smoke and the instrument updates continue.

| File under screenshots/ | Local route |
| --- | --- |
| 01-bailout-cover.jpg | /?shot=cover&seed=17 |
| 02-market-mission.jpg | /?shot=market&seed=17 |
| 03-garage-upgrades.jpg | /?shot=garage&seed=17 |
| 04-causeway-chase.jpg | /?shot=causeway&seed=17 |

The final screenshot and kit-check pass remains a separate turn. Open each route in Chrome and wait for `window.__shotReady === true`. Use a viewport with a 1280-pixel long side. Save JPEGs into `screenshots/` using the mapped names, keep each within 256 KiB and remove the starter images in that pass. Gameplay work does not replace or submit those images.

## Package

From the repository root:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies the local game and current screenshots, and writes `out/dossier.json` using the unchanged kit packager. To verify reproducibility, hash every output file, run the command again, and compare all hashes. Packaging creates local files; it does not submit an entry.

`node tests/gameplay.mjs` exercises the six mission state paths, cargo ownership, payout scaling, police escape/arrest, shop purchases, upgrades, a spike hit, saves and scene initialization with a small DOM stand-in. It uses the real simulation modules and requires no installed packages. It complements the browser play-test; it cannot verify rendering, sound, HUD visibility or actual keyboard play.

Referral code: **8kbmacyg**
