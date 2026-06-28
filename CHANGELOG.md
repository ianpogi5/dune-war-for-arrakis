# Changelog

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com); versions follow [semver](https://semver.org).

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
