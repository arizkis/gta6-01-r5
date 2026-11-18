# Sunspur: The Cooler Caper

[![Competition](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![Rank](https://make.fun/badge/gta6-01/arizkis/gta6-01-r5/rank.svg)](https://make.fun/bounty/gta6-01)
[![Reward](https://make.fun/badge/gta6-01/arizkis/gta6-01-r5/reward.svg)](https://make.fun/bounty/gta6-01)

Juno Reed is a getaway driver with $140, three contacts and a suspiciously important cooler. Sunspur Bay is an original low-poly coastal city in pink, orange, teal and cream. Explore five districts on foot or behind the wheel, with a third-person chase camera, moving traffic, strolling neighbors and a waterfront pier. All game art is geometry or canvas lettering generated locally. The only vendored runtime dependency is Three.js r160.

The full game design adds police patrol tactics and five wanted levels, cooler temperature and cargo integrity affecting payout, a six-job contact chain, Tavi's Workshop repairs and upgrades, selectable weapons and local radio. These gameplay systems are scheduled for the second implementation turn. This foundation already provides the city, driving, collisions, traffic, pedestrians, contact labels and prompts, menus, job definitions and all HUD state interfaces. Job execution and dialogue are not active yet. There are no saves, weapon effects or radio audio in this foundation.

## Around the bay

Citrus Commons is Juno's home and the location of Citrus Green. Old Salt Quarter holds Sunspur Impound and the cream Sunspur Coldfin freezer van. Marigold Market has food and clothes stalls. Sunspur Strand meets the sand and sea. Tideworks holds Tavi's Workshop. Tavi Moss waits near Lantern Fest, Niko Vale near the market and Paz Sol near Tin Cup Pier. The impound has a driveable gate gap; the pier is the only place the player can leave the mainland boundary.

## Six favors

| Order | Job | Contact / faction | Full pay | Errand |
| --- | --- | --- | --- | --- |
| 1 | The Cooler Caper | Tavi Moss / MECHANIC | $280 | Meet Tavi, reclaim the freezer van at Sunspur Impound, deliver the cooler to Tavi at Tin Cup Pier. |
| 2 | A Market of Minutes | Niko Vale / FIXER | $220 | Deliver fruit crates from Marigold Market across town against a timer. |
| 3 | Buoy Business | Paz Sol / FENCE | $240 | Reach the marked swimmer buoy off Sunspur Strand and return. |
| 4 | Last Cold Light | Tavi Moss / MECHANIC | $380 | Carry a second cooler across the causeway at dusk. |
| 5 | Five District Flyer | Niko Vale / FIXER | $420 | Clear checkpoints in all five districts before time expires. |
| 6 | The Lantern Mile | Paz Sol / FENCE | $500 | Deliver night lanterns from Lantern Fest to Tin Cup Pier. |

The board shows all six definitions. The first job is unlocked; later jobs unlock in order when the gameplay director records completion. In this foundation, TAKE THE JOB selects a contact without starting execution.

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
| E | Enter a nearby slow vehicle, exit at a free spot, or interact with a named contact |
| Space | Vehicle handbrake |
| Escape / P | Pause or resume; return from the job board |
| 1 / 2 / 3 | Select fists / wrench / water pistol; effects arrive with gameplay |
| F | Radio control, reserved for the gameplay turn |
| X | Spike strip, reserved for the gameplay turn |
| Mouse click | Activate menu buttons |

Exit requires a nearly stopped car and clear space beside or behind it. Walking uses camera-relative directions. Steering weakens at high speed. Collisions stop or slide cars and reduce their condition; condition limits top speed.

## Modules and extension points

Each feature is a plain ES module under `game/src/`. `config.js` owns dimensions and tuning; `random.js` owns seeded placement; `city.js` owns geometry, blockers, shade queries, district lookup and `setTimeOfDay('golden' | 'midday' | 'dusk' | 'night')`. `vehicles.js`, `traffic.js` and `pedestrians.js` expose live vehicle and pedestrian records. `player.js` and `driving.js` own movement and the camera. `minimap.js` draws world, route, target, search, police and vision-cone data. `hud.js` renders state. `mission-director.js` holds ordered job definitions and unlock state. `main.js` owns input, menus and the fixed-step loop.

`window.sunspur` exposes the shared state, city queries, contacts, vehicles, scene, camera, director and event bus. `registerSystem({ update(dt, state), reset(state) })` attaches gameplay modules. The event bus emits `contact`, `jobrequested` and `key` events. The HUD consumes `wanted`, `cooler`, `navigation`, `dialogue`, `radio` and `player.state`; a hidden cooler panel becomes visible when `cooler.active` is true. Pedestrians expose `state.mode`, `state.speed`, `state.panic` and `state.target`. Police, cargo, garage, save and staging modules are deliberately deferred to the next turn.

## Staging and screenshot procedure

The routes below are recorded in `shots.json`. They will be implemented in the second turn; screenshot capture and the kit check are reserved for the third turn. This foundation does not set `window.__shotReady`. Existing starter images remain untouched until that capture pass.

| File under screenshots/ | Local route |
| --- | --- |
| 01-bailout-cover.jpg | /?shot=cover&seed=17 |
| 02-market-mission.jpg | /?shot=market&seed=17 |
| 03-garage-upgrades.jpg | /?shot=garage&seed=17 |
| 04-causeway-chase.jpg | /?shot=causeway&seed=17 |

For the final capture pass, run the local server, open each route in Chrome, and wait until `window.__shotReady === true`. Capture the rendered viewport at 1280 pixels on its long side. Save JPEGs into `screenshots/` with exactly the names in `shots.json`, keep each image within 256 KiB and remove the starter images then. Do not capture the current foundation as if the staging routes were ready.

## Package

From the repository root:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies the local game and current screenshots, and writes `out/dossier.json` using the unchanged kit packager. To verify reproducibility, hash every output file, run the command again, and compare all hashes. Packaging creates local files; it does not submit an entry.

Referral code: **8kbmacyg**
