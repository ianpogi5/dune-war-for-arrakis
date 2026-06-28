# Releasing

Versions follow [semver](https://semver.org): `vMAJOR.MINOR.PATCH`.

- **Continuous deploy** — every push to `main` redeploys the live site
  (https://dune-war-for-arrakis.kdc.sh) via `.github/workflows/deploy.yml`.
- **A release** is a versioned snapshot: a git tag + a GitHub Release with notes and a built
  `dist/` zip, produced by `.github/workflows/release.yml`.

## Cut a release

From a clean `main` with green tests:

```bash
git checkout main && git pull
npm test                       # sanity check locally

npm version minor              # patch | minor | major — bumps package.json, commits, tags vX.Y.Z
git push origin main --follow-tags
```

`npm version` creates the commit and the `vX.Y.Z` tag. `--follow-tags` pushes both. That:

1. triggers **deploy.yml** (push to `main`) → live site updates;
2. triggers **release.yml** (the new tag) → builds, tests, and publishes the **GitHub Release**
   with auto‑generated notes + `dune-war-for-arrakis-vX.Y.Z.zip`.

Then add a dated section to [CHANGELOG.md](CHANGELOG.md) (or fold it in before bumping).

## Choosing the bump

- **patch** — bug/UX fixes, no behavior change for users.
- **minor** — new features, backward‑compatible (most of our changes).
- **major** — breaking changes to saved‑game format or workflow.

> Saved games are versioned in their JSON envelope; bump **major** if a change makes older saves
> unreadable, and note the migration in the changelog.

## Re‑run a release

If a release job fails, fix forward and either push a new tag, or re‑run from the Actions tab
(**Release → Run workflow**) passing the existing tag.

## Custom domain

The site is served from `dune-war-for-arrakis.kdc.sh`. The domain is pinned by `public/CNAME`,
which Vite copies into `dist/` on every build, so each deploy preserves it. Changing the domain =
edit `public/CNAME` (and the DNS `CNAME` record → `ianpogi5.github.io`).
