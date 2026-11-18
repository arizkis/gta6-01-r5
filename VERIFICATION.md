# Gameplay verification

Verified in the configured Playwright MCP Chromium browser at 1280 × 720, using the local server on port 8080. The server launches with its coordinator-provided sandbox fix. No final screenshots or kit check were run.

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
