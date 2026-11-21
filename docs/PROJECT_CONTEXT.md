# Vaccino 2027 — Showcase Project Context

**Last synchronized:** 2026-11-21  
**Status:** design direction agreed; interactive site in active development.

## Goal
A polished public-facing digital presentation for Vaccino, an electric student competition car project focused on energy efficiency and autonomous driving. The user wants an automotive-grade **visual concept**, not production CAD or certified mechanical engineering computed by the web agent.

## Approved design direction
- Roughly **80% Porsche/Mercedes-style premium automotive presentation, 20% detailed engineering exploration**.
- Vehicle should be the visual hero. Sparse navigation, dark graphite, off-white, restrained champagne-gold; expressive large type, genuine whitespace.
- Avoid dashboard layouts, card overload, excessive gold borders or visual effects.

## Existing functional implementation
- Public showcase repo; hash routes and static HTML/CSS/JS ES modules.
- Three.js/WebGL vehicle scene is a **representative** design; its mechanics are not physical validation.
- Intro uses lion/Vaccino brand asset.
- `#/overview`: full-viewport interactive vehicle hero, lion-triggered camera approach and editorial storytelling.
- `#/experience/showroom`: showroom scene.
- `#/vehicle`: dedicated front three-quarter view of the chassis and wheels, with responsive framing and a matching reset.
- `#/mechanical` and `#/electrical`: scoped 3D exhibits of each system. Electrical groups battery calculations and power distribution under separate disclosures.
- `#/mechanical/transmission`: compare the Hub Motor and Merkezi Aktarma concepts in the shared Three.js scene. Part labels and comparison data are kept in `platform/data/project.json`.
- `#/autonomy/simulation` and `#/autonomy/vision`: independent software exhibits. Previous perception, sensor and interface routes open Görüntü İşleme, with the corresponding technical resources expanded for the sensor and interface links.
- `#/team/goals`, `#/inventory`: competition context and inventory. The team photo gallery and both software media showcases currently await approved media.
- Add media entries to `presentation.software[].media` or `presentation.competitionMedia` in `platform/data/project.json`. Each entry uses `type` (`image` or `video`), `src` relative to `platform/`, descriptive `alt` and an optional `caption`. Video entries can also reference a Turkish WebVTT file with `captions`.
- `#/driver`: interactive **concept mannequin** on display stand; black suit, gold V, Shell branding, equipment information hotspots. Real PPE certification not verified.
- Nextion display: browser-only expandable dashboard prototype; mock data, not actual serial/Nextion firmware.
- Intro logo hover grows rather than turning white.
- Overview hero labels fade when dragging to inspect the vehicle, with a restore action.

## Known next step
A **new chassis** may be provided by the actual CAD designer later. Until supplied and explicitly approved, **do not replace the current vehicle/chassis**; produce independent visual comparisons if requested.

## Technical factual boundaries
- Transmission concept A under evaluation: one hub motor within the **right rear wheel**, with the left rear wheel free. The visualization uses a translucent right wheel and an illustrative battery reserve near the former differential. The hub, mount compatibility, battery clearance, weight distribution, wiring and service access await engineering verification.
- Transmission concept B under evaluation: central BLDC, belt/pulley, differential and axle shafts to both rear wheels. The configurator reuses this geometry, the existing battery reserve and the coupled/coasting demonstration. Both configurations and transitions illustrate architecture only. Any efficiency and dynamics differences require validation.
- Older two-hub sketch is historical, not approved alternative A.
- Actual material choice, finished vehicle safety, dimensions of every part, driver clothing compliance, battery packaging and performance require verification.
- Driver scene and Nextion screens are visual demonstrations, never specification sheets.

## Team's division of labor
Real detailed structural CAD and production drawing: human CAD designer in Fusion 360. AI team: rapid website prototypes, interaction design, explanation, research and accessible visual concepts.
