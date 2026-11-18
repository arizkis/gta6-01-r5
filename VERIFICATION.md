# Gameplay verification

The earlier integration checks below used the configured Playwright MCP Chromium browser at 1280 × 720 and the local server on port 8080, with its coordinator-provided sandbox fix. Later sections record the visual passes and the replacement entry captures; descriptions of unchanged screenshots in earlier passes refer to those passes alone.

This was an assisted integration session: browser keyboard and menu actions exercised interactions, while travel positions, police fixtures and selected fixed-step updates shortened the checks. Mission conditions and payout calculations ran through the real game modules. The checkpoint time produced by these fixtures is test data, not a normal driving record.

## Job loop and progression

- Accepted The Cooler Caper from the board, pressed E at Tavi, heard the opening, and entered the impound van with E.
- Pursuit began at two stars. The van drove through the impound gate; police response rows, distances, tactics and dispatch updated.
- A collision reduced integrity to 97.0697%. Telemetry offered $272.
- Exited with E and walked with the visible cooler. Carry speed was 10.54, and blue vapour was present.
- Hid from the patrols. SEARCHING and the search circle appeared; heat reached zero, stars cleared, and the delivery stage unlocked.
- Delivered on foot at Tin Cup Pier. Cash rose from $140 to $412, the receipt reported $272 and 97% integrity, and MECHANIC respect rose to 45.
- Jobs 2–6 each accepted from the board, advanced after talking to the named contact, and reached their hand-in through assisted stage fixtures. Pays were $220, $240, $380, $420 and $500. The pristine second cooler produced COLD BONUS; the lantern job enabled its glow and air support.

## System checks

- Three stars: two units parked crosswise at their roadblock targets, about 151 meters ahead.
- Four stars: two units used BOXING IN; the helicopter, searchlight cone and ground circle were visible. The response panel showed three rows, and map records supplied vision ranges.
- Arrest: the arm’s-reach timer produced BUSTED, charged $105, cleared stars and returned Juno to the apartment at (430, 637) with full health. Completed jobs remained recorded.
- Workshop: bought plating for $120, insulation for $90 and the spike rack for $80. A 37% car repaired to 100% for $38. The progression summary showed cash, six jobs, faction values and checkpoint time.
- Spike strip: X reduced charges from three to two; a pursuing unit crossing it slowed to speed 5 for six seconds. The vehicle card showed 2/3 charges.
- Collision armour absorbed damage before health. Food restored health to 100, the work vest restored armour to 100, and the clothes menu changed Juno’s shirt to sea glass.
- F cycled SUNSPUR FM, MARLIN TALK, TIDEWAVE and OFF / STATIC with a running AudioContext.
- Number keys selected the wrench and water pistol; the wrench reduced car condition, the pistol consumed tank water and displayed a witness, and Q cycled back to fists.
- A pedestrian fled a car moving at about 74 game units per second with no police present.
- SAVE DAY at the apartment survived a reload. Cash $1669, health/armour 100, sea-glass shirt, all upgrades, two spike charges, three faction values of 90, six completions and the fixture checkpoint time matched exactly.

## Staging, diagnostics and fixes

All four seed-17 routes reached `window.__shotReady === true`. Every required HUD element had a visible rectangle inside the viewport, including the controls. Cooler scenes showed telemetry and scripted scenes showed dialogue.

| Route | Light | Confirmed arrangement |
| --- | --- | --- |
| cover | golden | Juno on foot with cooler, four stars, three units, route and vehicle card |
| market | midday | Active market job and Niko dialogue |
| garage | golden | Repair/upgrades and the entire progression summary inside the panel |
| causeway | dusk | Five stars, four units, speed 92, skid marks, smoke, cone and spotlight |

The browser reported zero console errors. The initial load made 23 successful local requests; the external-request filter found no requests outside the local server. Browser driver warnings were present. Staged routes did not overwrite the saved day.

The verification pass fixed a workshop interaction trap: after closing the garage, E previously reopened it instead of entering the adjacent car. Vehicle entry and exit now take priority there. Both directions passed in the browser after reloading, and the deterministic suite includes a regression check.

`node tests/gameplay.mjs` passed. Both protected vendor files remain unchanged; the kit comparison uses starter commit `f4a0377`. The four mappings in `shots.json` remain intact. Two final `MAKEFUN_OUTPUT_DIR=out node main.ts` runs produced matching SHA-256 hashes for every output file.

## Visual pass / 2026-11-18

This pass changes presentation and seeded staging. It retains the existing driving, missions, cargo rules, police decisions, prices and saves. The local kit was not opened during this pass.

Playwright MCP served the repository through `node serve.ts --port 8080`. All four seed-17 routes were viewed at 1280 × 800 and 768 × 480, with further captures after staging adjustments. Each route settled at simulation tick 90 with `window.__shotReady === true`.

| Route | Current frame |
| --- | --- |
| cover | A 138 KM/H freezer van on the palm-lined Strand, four stars, three converging police cars, low sun, helicopter cone and pool, dust, skids and cooler vapour. Job 1 and secured-cargo telemetry remain visible. |
| market | Juno and Niko between striped stall rows, produce crates and browsing people, with Niko's drawn portrait and dialogue open. |
| garage | Juno and a damaged pink Solace at the open workshop mouth, warm work light, lift, tool boards, stacked tires, crates and a luminous workshop sign beside the complete upgrade menu. |
| causeway | A 160 KM/H pink Solace boxed by four police cars, magenta dusk, horizon sun, skyline, lightbars, headlights, helicopter, skids and drift smoke. |

The narrower HUD keeps its instruments present at 768 × 480. The four-unit police list, cooler telemetry and vehicle card have separate vertical space. The garage camera leaves Juno, the car and the sign visible beside its menu. Runtime canvas portraits cover Juno, Tavi, Niko and Paz; the corresponding figure accessories use the same colours.

The four routes and free play produced zero console errors. Four browser GPU ReadPixels performance warnings appeared. Each fresh route loaded 24 local HTML, CSS and JavaScript resources; external requests and requests after asset loading were zero. Free play also verified walking, E to enter the Solace, acceleration and F to tune SUNSPUR FM. An initial input script walked away from the car before pressing E; restarting and entering before walking verified the intended interaction.

`node tests/gameplay.mjs` passed after the visual changes, including all six job paths and the revised driving cover fixture. `git diff --check` passed. A fresh repeat of the final cover capture was byte-identical.

Exactly two `MAKEFUN_OUTPUT_DIR=out node main.ts` runs produced byte-identical buffers for all 29 output files, totalling 2,853,950 bytes. The dossier SHA-256 is `21b8c4a58bff175f6f702c67daba5109460c0ff44964221b5e76612bf5617d09`.

The tracked `screenshots/` files remain unchanged. Protected vendor hashes remain:

- `game/vendor/three.min.js`: `3e690ac7d180b0aadf0891bea39eec643e29e2d3e75c99b18689518665f69ba6`
- `vendor/makefun-game.ts`: `dc67187521b24025ff952f8c231485a6eb92d6d71d29edd2a08154ffb4376129`

Changed files: `game/src/city.js`, `config.js`, `effects.js`, `hud.js`, `main.js`, `pedestrians.js`, `player.js`, `police-tactics.js`, `portraits.js`, `shots.js`, `vehicles.js`; `game/style.css`; `tests/gameplay.mjs`; this verification record. Preview captures were confined to `polish-preview/` and removed before committing. No submission or recording completion was performed.

## Follow-up visual verification / 2026-11-18

Starting from `f64d3d6222d95bd08ff1da3f16b87016021c9fdc`, Playwright MCP re-viewed all four seed-17 routes at 768 × 480 before any edits, then viewed each again after one focused presentation pass.

- Cover passes: the 138 KM/H freezer van, four stars, three police units, low sun, palm-lined street, helicopter cone and drawn Tavi portrait remain visible. Less opaque cooler vapour reveals more of the van and nearby police car.
- Market passes: Juno and Niko stand among crowded awnings, crates and shoppers in warm daylight. The oversized floating Niko label is hidden in this staged route, and its objective marker is smaller. Niko's identity and drawn portrait remain in the dialogue bar.
- Garage passes: Juno and the car are separated more clearly beside the full upgrade panel. A small shift of the left lift keeps it clear of the repositioned car; the warm work light, luminous sign, tires and tool boards remain.
- Causeway passes: the pink car reads 160 KM/H beneath a saturated dusk sky, with the horizon sun, skyline, four police units and helicopter. Thinner drift smoke reveals its body, and staggered staged lightbar phases show both red and blue.

The bottom control hints use larger text and two rows at contact-sheet size. All nine hints fit inside the viewport. Each route reaches frame 90 with every required HUD rectangle inside the viewport and the wanted, police, cooler and vehicle panels separated vertically. The three dialogue routes load their generated 160-pixel-wide portrait images. No gameplay rules or tuning changed.

Fresh final diagnostics on each staged route and in free play recorded zero console errors, failed requests or HTTP error responses. Each navigation loaded 24 successful local static resources; external requests and requests after initial loading were zero. The browser session reported four GPU ReadPixels performance warnings. Free play verified E vehicle entry, acceleration, F tuning SUNSPUR FM, restart and walking 3.4 world units.

`node tests/gameplay.mjs` and `git diff --check` pass. Two new `MAKEFUN_OUTPUT_DIR=out node main.ts` runs compare byte-for-byte equal across all 29 files, totalling 2,854,592 bytes. Dossier SHA-256: `85a755b9e0ec3df1a5139ce34e20a75a1a9d8d4a761cf63a80ebde8d00de9be8`.

`polish-preview/` was removed after the final views. `screenshots/` still contains exactly its four original entry images with the same hashes, and both protected vendor hashes match the preceding verification record. This follow-up changes only `game/src/shots.js`, `game/src/effects.js`, the lightbar visibility expression in `game/src/police-tactics.js`, `game/style.css` and this record. No submission or recording completion was performed.

## Entry recapture / 2026-11-18

Starting at `546d9b4`, the configured Playwright MCP browser captured each staging route directly into `screenshots/` at 1280 × 960, device scale 1 and JPEG quality 86. Every route used seed 17, reached simulation frame 90 and reported `window.__shotReady === true`; all nine control hints fit inside the viewport. Each file contains one complete browser render. No image editing or recompression was needed.

All four saved files were opened for visual inspection, and their JPEG headers, dimensions, byte sizes and route mappings were checked on disk. The directory contains exactly these four files:

| File | Bytes | Verified frame |
| --- | ---: | --- |
| 01-bailout-cover.jpg | 193726 | Low camera behind the 138 KM/H freezer van at sunset; three police units, helicopter searchlight, secured-cargo telemetry, Tavi portrait dialogue and full HUD. |
| 02-market-mission.jpg | 163229 | Street-level crowded stall rows with Juno, Niko, produce crates, Niko portrait dialogue and full HUD. |
| 03-garage-upgrades.jpg | 183342 | Warm workshop mouth with Juno, the pink Solace, luminous sign, complete repair/upgrade panel, progression summary and full HUD. |
| 04-causeway-chase.jpg | 189312 | Low camera on the 160 KM/H pink Solace at dusk; four police units boxing in, helicopter, searchlight, Tavi portrait dialogue and full HUD. |

Each JPEG is 1280 × 960 and below 262144 bytes. `shots.json` still maps the four filenames to `cover`, `market`, `garage` and `causeway`, respectively, with seed 17. The staged capture session reported zero console errors and four GPU ReadPixels performance warnings.

The fresh kit's submission instructions and `check --help` were read before running `node cli/makefun.mjs check --kit . --repo /home/hatch/workspace/makefun/projects/gta6-01/entry-r6` from its unpacked directory. No additional flags are required for this GitHub-repository configuration. The check returned 4 passed, 0 failed, 16 skipped and 5 checked at submission. Transcript rows are deferred to the site's checks on sealed recordings; this local result does not verify them. The kit remained read only, and check scratch files stayed under this checkout's ignored `.verification/` directory.

Two subsequent `MAKEFUN_OUTPUT_DIR=out node main.ts` runs each produced 29 files totalling 2,701,067 bytes. Their file lists and every file's complete byte buffers matched. `out/dossier.json` is 1,139,456 bytes, with SHA-256 `1d3a70b3284dc08666b5cc7b6604b2352a1974bcfef6b070882b9f19e750f5b1`.

`vendor/makefun-game.ts` is byte-identical to starter commit `f4a0377`; `game/vendor/three.min.js` is byte-identical to the starting HEAD, `546d9b4`. Their SHA-256 values remain the ones recorded above. The existing authored capture line in `main.ts` and the factual scope header in `game/src/main.js` remain intact. README changes are confined to its staging/capture section; its badges, referral code, systems, jobs and controls match the starting commit. The deterministic gameplay suite passed before recapture.

The final browser run used ordinary free play at `/?seed=17`, with `staged === false`. Real keyboard and menu input entered Juno's Solace, accelerated to a displayed 21 KM/H, tuned SUNSPUR FM, restarted the day, walked 5.1 world units, opened the six-job board and paused/resumed. Its initial load made 24 local requests. After that load, the entire interaction run made zero requests; external requests, console errors, failed requests, HTTP error responses and warnings were also zero. This pass performed no submission or recording completion.
