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
- `#/experience/showroom`: chassis showroom. The draft exterior source remains available for future integration, while default public routes and Reset show the chassis.
- `#/vehicle`: dedicated front three-quarter view of the chassis and wheels, with responsive framing and a matching reset.
- `#/mechanical` and `#/electrical`: scoped 3D exhibits of each system. Electrical groups battery calculations and power distribution under separate disclosures.
- `#/mechanical/transmission`: the drivetrain decided on 27 Nov 2026 (single mid motor + half differential + jointed axles). The hub-motor comparison selector is hidden; its data stays in `platform/data/project.json` as an archived "Eski plan" variant.
- `#/autonomy/simulation` and `#/autonomy/vision`: independent software exhibits. Previous perception, sensor and interface routes open Görüntü İşleme, with the corresponding technical resources expanded for the sensor and interface links.
- `#/team/goals`, `#/inventory`: competition context and inventory. The team photo gallery and both software media showcases currently await approved media.
- Add media entries to `presentation.software[].media` or `presentation.competitionMedia` in `platform/data/project.json`. Each entry uses `type` (`image` or `video`), `src` relative to `platform/`, descriptive `alt` and an optional `caption`. Video entries can also reference a Turkish WebVTT file with `captions`.
- `#/driver`: Driver Studio, a separate 3D equipment concept with a full-body view and close-ups of the helmet, suit and left glove. The pilot and equipment are visual concepts.
- Nextion display: browser-only expandable dashboard prototype; mock data, not actual serial/Nextion firmware.
- Intro logo hover grows rather than turning white.
- Overview hero labels fade when dragging to inspect the vehicle, with a restore action.

## Driver Studio asset

- The base is [tevy Pit Crew Member v1, LOD0](https://tevy.dev/models/pit-crew) ([original GLB](https://tevy.dev/models/pit-crew/v1/lod0.glb)), published under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). CC0 permits display, modification and redistribution of the base asset with no attribution requirement. The supplied Shell logo and the Vaccino identity have separate trademark rights. The concept artwork carries no endorsement claim.
- The repackaged `platform/assets/driver/pilot.glb` is a self-contained static pose with 27,999 triangles. It preserves the baked normal map, adds matte black and charcoal with a champagne V and the supplied Shell mark in the suit texture, and uses an adjusted roughness map. The embedded JPEG maps are 2048 px (base color), 1024 px (normal) and 512 px (roughness). No animation, skinning, texture transcoder or network dependency is required at runtime.
- For a replacement GLB, export a standing pilot facing +Z with +Y up and feet at ground level. Set three named empty nodes in the desired camera target positions: `FocusHelmet`, `FocusSuit`, and `FocusGlove`. Review their close-up distances and camera angles in `platform/src/driver.js`.
- The lazy GLB loader is the MIT-licensed GLTFLoader and BufferGeometryUtils from [Three.js 0.160.1](https://github.com/mrdoob/three.js/tree/r160), bundled against the application's existing Three.js global. The loader and GLB share the app release query. Automatic pixel density follows the vehicle policy of 1× at 700 px and below, capped at 1.35× above it.

## Known next step
A **new chassis** may be provided by the actual CAD designer later. Until supplied and explicitly approved, **do not replace the current vehicle/chassis**; produce independent visual comparisons if requested.

## Technical factual boundaries
- Drivetrain (team decision, 27 Nov 2026): single mid motor (label 48 V, 1000 W, 450 r/min, 20 A; 3-phase, hall sensors; make/model unknown) + half differential + jointed axles. The 3D scene hides the old belt and pulleys behind a representative gear case.
- Dropped ("Eski plan"): hub motor(s), chain/belt-pulley drive, Arora/UUMotor/QS260 motors, Flipsky drive. They appear only in the archive and inventory with the "Eski plan" status.
- Frame: Ø30×2 mm 6061-T6 tube, drawing 2,830 × 1,230 × 980 mm (wheels and body excluded). The 3D frame is still the old V2 layout until the STEP-based model replaces it. Run `npm run check:data` after editing either data file.
- Actual material choice, finished vehicle safety, dimensions of every part, driver clothing compliance, battery packaging and performance require verification.
- Driver scene and Nextion screens are visual demonstrations, never specification sheets.

## Team's division of labor
Real detailed structural CAD and production drawing: human CAD designer in Fusion 360. AI team: rapid website prototypes, interaction design, explanation, research and accessible visual concepts.
