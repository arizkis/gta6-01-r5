# Foundation verification — 2026-11-18

Tested the local game in real Chrome at 1280 × 800 through Playwright MCP browser tools. The configured MCP launch initially failed because this environment runs Chrome as root. The same MCP executable was launched with `--no-sandbox` for the successful verification. No screenshot capture, kit check, submission or recording completion was performed.

## Browser checks

| Check | Observed result |
| --- | --- |
| Load game/index.html through the local server | Title screen loaded; local Three.js rendered the city. |
| Start | Both Enter and a click on START entered play. |
| Walk and sprint | Keyboard movement covered 5.6 units walking and 7.7 sprinting in the sampled intervals; configured speeds are 7 and 11 units/s. |
| District transition | Driving from Citrus Commons across x = 1000 changed the live brand and map district to MARIGOLD MARKET. |
| Vehicle entry | E entered Sunspur Solace; Juno's figure hid and the vehicle card appeared. |
| Drive and camera | Accelerated, reversed and steered with the keyboard. At x = 1036.42, z = 680.32 the card showed Sunspur Solace, 229 KM/H and 84% condition; the camera followed behind at x = 928.84, z = 685.05, with FOV 69.87°. |
| Collision | A curbside palm stopped the car and reduced condition from 100% to 84%. Reversing and steering around it allowed the district crossing. |
| Vehicle exit | Braked and pressed E; Juno reappeared at a clear spot and the vehicle card hid. |
| Traffic | All 14 traffic cars moved in the sampled interval; all remained within the street grid. |
| Pedestrians | All 40 pedestrians moved in the sampled interval; zero were inside building blockers. |
| Pause | Escape opened the pause menu, the clock remained fixed while paused, and P resumed. |
| Job board | Opened from both title and pause menus; all six jobs displayed contact, faction, pay and description. Job 1 had TAKE THE JOB enabled; jobs 2–6 showed disabled LOCKED buttons. |
| Job selection | The first button set requestedJobId to cooler-caper and returned to play; execution remained inactive as intended for this turn. |
| Restart day | Restored spawn (472, 648), $140, 100% car condition, fists selection and a full tank display. |
| Freezer van | Sunspur Coldfin was at (980, 1770) in the impound, with a 34 × 16 body and the exact prompt E / ENTER FREEZER VAN. Enter and exit both worked. The browser inspection relocated Juno beside the yard for this check. |
| Contacts | Browser inspection beside all three contacts produced TALK TO TAVI MOSS, TALK TO NIKO VALE and TALK TO PAZ SOL prompts. |
| Spatial queries | Buildings, trees and the water edge blocked movement; the impound gate gap and pier were clear; tree shade returned true. |
| Lighting | Golden, midday, dusk and night presets changed the sky. Dusk and night showed 55 lit lamp meshes; golden and midday showed none. |
| HUD state inputs | Temporary inspection data rendered three wanted stars, dispatch text, at most three police rows, cooler telemetry (4.5°C / 91% / $255), two filled stage pips, dialogue, radio text, weapon selection, health, armour, tank and respect values. Route, target, search and police cone layers rendered without errors. Inspection data was reset afterward. |
| Console | Zero errors across the successful browser session. Four Chrome software-renderer warnings reported GPU stalls due to ReadPixels. |
| Network | Each page load required 15 successful local GETs: the document and 14 resources. No external requests. Resource count stayed 14 after starting play and waiting, confirming no additional runtime requests in that check. |
| Layout | Controls stayed within the 1280-pixel viewport. The WebGL canvas was 1280 × 800. |

The first automation attempt used an exact START name that omitted its arrow glyph; it timed out and was corrected to the button's ID. A straight driving attempt hit the palm and timed out; the continued test reversed and steered around the obstacle. Both were resolved before committing. No 429, 503 or usage-limit response occurred.

## Original packaging and repository checks

JavaScript syntax checks and `git diff --check` passed. `git diff --exit-code f4a0377 -- vendor/makefun-game.ts` passed: the kit packager is unchanged. The downloaded Three.js file is 670,681 bytes, with SHA-256 `3e690ac7d180b0aadf0891bea39eec643e29e2d3e75c99b18689518665f69ba6`.

The final two runs of `MAKEFUN_OUTPUT_DIR=out node main.ts` both succeeded. SHA-256 comparison of every output file found all **19 files byte-identical**, including `dossier.json` and the three untouched starter screenshots. The final dossier SHA-256 is `0a16bc0090d091e988996bbd2f2e16954db1415dd6149aafa9430c13e4027373`. The sorted file/hash manifest digest is `6bb370d49990e8786259c3a38b9f61982ff8b6b15d8109c08610aea786cc2164`.

Earlier packaging pairs also matched, before the restart-state and trailing-whitespace adjustments. Generated output and temporary browser inspection files are ignored by Git. No application asset depends on those files.

## Completion pass — 2026-11-18

Repeated the short Playwright MCP check at 1280 × 800: title and START, keyboard walking at 7 units/s, sprinting at 11, entering Sunspur Solace, driving to x = 510.66 at 50.4 units/s with a following camera and visible vehicle card, pausing and opening the board. All six jobs appeared; only the first was unlocked. The load made 15 local requests, with zero external or additional runtime requests and zero console errors. The four software-renderer warnings remained.

Confirmed all 12 feature modules and their scope comments, the authored root entrypoint comment, three correctly linked badges, referral code, absence of the owner placeholder, all four screenshot mappings with seed 17, and the unchanged kit packager relative to f4a0377.

Reproduced a vehicle-access collision gap by placing a thin fence between Juno and a nearby car: the original code offered entry through it. Added a short sampled path check in player.js for entry and exit. After reload, the same fence suppressed the prompt and prevented entry; removing it restored normal entry. With a fence across the preferred exit, Juno used the clear opposite side at (480, 659), without crossing the barrier. Temporary test blockers were removed and the day reset.

Both packaging runs after this change succeeded and all 19 output files matched byte for byte. Dossier SHA-256: `671e8b6f1e9ff6972813052c7132969e8bbbc3a0d696a589e88e163f6a1f60e0`. File/hash manifest digest: `2d172f76067af68ab6523bf3876b92e16c758d2de5143dd01692f6412fe17668`. Syntax and diff checks passed. No screenshots, gameplay systems, submissions or recording actions were added in this pass.

## Deliberately deferred

Police behavior and wanted logic; job execution and dialogue content; cooler simulation and payout logic; garage repairs and upgrades; weapon effects; radio audio; saves; pedestrian panic; motion cues; and screenshot staging routes. No empty gameplay stubs were added. The four requested route mappings are in shots.json, but this foundation does not announce screenshot readiness. Starter screenshots remain untouched for the final capture turn.
