# Vaccino — Delivery Workflow

## 1. Understand
- Inspect relevant code and page before changing anything.
- Read `AGENTS.md` and two project docs.
- Restate the user-visible behavior and acceptance criteria in the task response.
- Prefer targeted edits over rewrites; preserve working features.

## 2. Implement
- Make small commits on a review branch.
- Keep CSS additions modular and scope selectors to the intended route.
- Separate illustrative visual layers from engineering facts.
- Avoid external script dependencies unless justified.
- Do not install paid tools or invoke paid external APIs without approval.

## 3. Run locally
From the repository root:

```powershell
python -m http.server 4174
```

Browse `http://localhost:4174/platform/`. GitHub Pages uses `platform/`.

### Runtime cache version
The version on `src/app.js?v=…` in `platform/index.html` names a set of compatible JavaScript and project data files. Bump it when shipping changes to the runtime or project data. The bootstrap applies that version to the whole module graph, Three.js and, through the store, `project.json`. Register new runtime modules in the bootstrap’s import map. Check a navigation with an old unversioned module already in the browser cache when changing the bootstrap.

## 4. Verify
- Smoke-test primary routes and browser console.
- Inspect at least a desktop and narrow/mobile viewport.
- For 3D features test mouse/touch manipulation and keyboard/fallback where possible.
- For modal interactions test Escape, focus and close behavior.
- Report actual tests performed and unresolved limitations; do not claim success based only on code existence.

## 5. Deliver
- Report changed files, visible improvements and verification.
- Publish through a review branch / pull request first.
- Do not merge/push to public `main` or copy in private CAD/engineering files without explicit approval.
