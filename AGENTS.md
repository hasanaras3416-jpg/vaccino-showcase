# Vaccino Showcase — Agent Instructions

This repository is the **public-facing Vaccino 2027 concept showcase**. Treat it as a premium automotive website, not a generic engineering dashboard.

## Read before changes
1. `docs/PROJECT_CONTEXT.md` — mission, factual boundaries, current features.
2. `docs/DESIGN_SYSTEM.md` — visual direction and layout rules.
3. `docs/WORKFLOW.md` — implementation, validation and Git workflow.

If the task is visual/UI work, apply `.agents/skills/automotive-ui/SKILL.md`.

## Project
- Main web app: `platform/index.html`.
- Main routing: `platform/src/workspace.js` (hash-based).
- Vehicle/WebGL: `platform/src/vehicle.js` using vendored `platform/vendor/three.js`.
- Landing page stylesheet: `platform/assets/automotive-home.css`.
- Driver and Nextion additions: `platform/src/driver.js`, `platform/src/interactive-upgrades.js`, `platform/assets/driver-and-dashboard.css`.
- Current working review branch: `design/premium-automotive-home`. Do **not** assume it is merged into `main`.

## Non-negotiables
- Preserve functioning 3D scenes, routes, source assets and team/competition information unless explicitly tasked to change them.
- Never represent illustrative 3D geometry, PPE, telemetry or screen layouts as approved physical products, CAD or regulatory compliance.
- Do not invent component specifications, competition compliance, mass, pricing or test results.
- Avoid publishing private Fusion360/STEP/STL/CAD and internal engineering source documents into this public repository.
- Do not push to or merge `main` without explicit approval.
- Work in small, reviewable changes. Check the actual UI at desktop **and** mobile widths. A code-only check is not a visual acceptance test.
- Explain what changed, what was tested and what remains unverified.
