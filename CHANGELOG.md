# Changelog

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com); versions follow [semver](https://semver.org).

## [0.2.0] — 2026-06-30

A board‑map overhaul, a completed in‑app round, locating polish, and a battle‑rules fix.

### Added
- **Real board geometry** — the map now draws each of the 101 areas as its actual traced shape
  (replacing the earlier Voronoi cells), arranged in the board's radial sector structure, with
  impassable walls along shared edges and board‑accurate blue air‑zone circles.
- **Spice Must Flow harvesting panel** — previews the solo spice allocation as a before→after marker
  table and applies it (markers, reserve, bans, supremacy). This was the last round‑completing piece,
  so a full Mahdi‑solo round now runs end‑to‑end in the app.
- **Locate from anywhere** — every area name in the app is a clickable chip that jumps to the board
  map and pulses the area; air‑zone names (vehicle placement, area details) are now clickable too and
  pulse their circle. A "by sector" colour view and a full‑window map view were also added.

### Changed
- Locating an area no longer force‑zooms the map — it re‑centres at the current zoom and shows a
  larger, readable label that scales with the map.
- Map palette matched to the printed components; whole located/selected areas highlight (not just a
  dot).

### Fixed
- **Deployment tokens in battle** — tokens are now revealed to their units at the start of a battle
  (rulebook p24) before combat. Previously the casualty code never removed tokens, so a legion that
  carried tokens into a fight had immortal tokens (a tokens‑only attacker could never be eliminated).
  Harkonnen marker tokens return to the solo pool on reveal.

### Engine
- Test suite grown to **238 tests** (new `revealTokens` module covering the battle‑reveal fix).

[0.2.0]: https://github.com/ianpogi5/dune-war-for-arrakis/releases/tag/v0.2.0

## [0.1.0] — 2026-06-28

First tagged release. The Mahdi‑solo Harkonnen companion is feature‑complete.

### Added
- **Harkonnen decision engine** (pure TypeScript, fully tested): action‑die resolution cascade,
  shortest‑path movement, the "cease attack" rule, deployment, vehicle placement, planning‑card and
  named‑leader special abilities.
- **Battle resolver** — round‑by‑round dice entry with Harkonnen casualty priority, leader combat
  abilities, reinforcement spending, reserve replenishment, and sietch capture.
- **Desert Hazards** — official wormsign placement (terrain + occupancy rules) and Coriolis storms.
- **Spice Must Flow** — imperium markers driving action‑dice/vehicle availability and bans.
- **Interactive board map** — all 101 areas plotted and colored by terrain, game‑state overlays,
  hover/tap details card, "find an area", pinch‑zoom & pan, and an area picker for the editor.
- **Locating labels** for unnamed areas and air zones (named after nearby board landmarks).
- **Game management** — auto‑save, multiple named saves, JSON export/import.
- **Round walkthrough** guiding play phase‑by‑phase.

### Infrastructure
- Continuous deploy to GitHub Pages at https://dune-war-for-arrakis.kdc.sh (custom domain via
  `public/CNAME`).
- Tag‑driven release workflow (GitHub Release with notes + built `dist/` zip).

[0.1.0]: https://github.com/ianpogi5/dune-war-for-arrakis/releases/tag/v0.1.0
