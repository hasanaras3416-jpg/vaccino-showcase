# Vaccino — Automotive Art Direction / Design System

## North star
A site that looks like a **premium automotive design studio made it**, not a school project dashboard. The first impression is emotional and visual; technical depth is available behind deliberate navigation.

## Art direction
- Approx. 80% luxury automotive marketing, 20% high-end engineering studio.
- Primary colors: near black `#090B0D`, charcoal `#171B1E`, warm ivory `#F5F2ED`.
- Accent: champagne gold `#CBB98B`, used sparingly for highlights, logos, fine rules and CTA details.
- High contrast; avoid white text on pale areas and layered-overlapping headlines.
- Typography: commanding oversized display headlines with purposeful negative space; thoughtful editorial/serif contrast for a single emphasis word. Content typography must remain readable on mobile.
- Sections: full-bleed hero, refined editorial story, focused interactive tools; variation in scale/contrast without clutter.
- Motion: camera and scene transitions should feel smooth and purposeful, never distracting. Respect `prefers-reduced-motion`.
- 3D model: dominant visual protagonist on landing; hover markers and interactions need accessible controls and explanatory labels.
- No indiscriminate gradients, glowing neon borders, stacked generic cards, unnecessary spinners or random decorative icons.

## Home hero
- Present the inherited V2 vehicle with its existing concept body fitted. The lower front three-quarter camera reveals the nose, wheels and side profile. The home scene has a warm key light, a cool rim light and soft fill over a graphite backdrop.
- Give the headline and vehicle separate space. Put the copy left of the vehicle on desktop and below it at 900 px and under. Fit the default vehicle pose to the scene aspect ratio and keep the full silhouette inside the frame.
- Keep the vehicle and editorial typography as the two main elements. Use the existing Showroom and Engineering links, and reserve champagne for small accents and focus cues.
- Keep vertical page scroll available across the mobile viewer. Use the same inspection state for mouse, touch and keyboard. Keep a static technical illustration in the vehicle area when WebGL is unavailable.

## Functional UX
- Mouse drag, touch drag and keyboard orbit or zoom hide the hero copy and reveal the restore control. Restore returns to the composed view and focuses the viewer. Escape restores the introduction when the viewer has focus.
- Logo hover **scales**, doesn't turn white.
- Main nav has Driver; Driver shows rotating 3D concept mannequin on a display stand, with helmet/gloves/suit hotspots.
- Suit styling: black, centered gold V, small Shell mark.
- Nextion: 3D vehicle HMI item opens an expanded UI prototype; same entry reachable from software page; labels show it's mock data.
- Maintain keyboard focus, visible interactions and meaningful fallbacks.

## Engineering exhibits
- Give the 3D scene priority in Mechanical. Put the active system introduction and keyboard-accessible part list beside the scene on desktop and below it on narrow screens. Keep the working principle and source notes in a disclosure.
- Use the active mechanical system's part list for highlighting, projected markers, mesh picking and the inspector library. Reset returns to the active system view. A vertical touch gesture scrolls the page across the Mechanical viewer. Make the transmission animation easy to reach in Mechanical › Aktarma, and show its coupling control only there.
- Put automatic graphics quality, contact shadows and advanced angles in the viewer settings disclosure. Keep reset and the relevant animation within reach. Use native keyboard behavior and return focus to Settings when Escape closes the disclosure.
- Give Simülasyon and Görüntü İşleme independent routes. Each page has an introduction, a media showcase and concise engineering notes. Preserve sensor and interface records in Technical Resources.
- Use the same media frame for competition photos. Empty frames say “İçerik eklenecek.” Add team-provided media in the project record with descriptive alt text and captions where available.

## Required quality checks
1. Test 1440px and 1920px desktop, ~768px tablet and 390px mobile viewport.
2. Verify scroll boundaries, no text overlap and no horizontal overflow.
3. Test navigation, intro, hover, 3D drag, Driver hotspots, Nextion dialog, Escape/focus, responsive controls.
4. Inspect browser console/network errors. A favicon 404 does not alone invalidate functionality; any missing JS/data/3D asset does.
5. Review screenshots before calling a visual design complete.
6. Keep existing vehicle, routes, assets and engineering data working.

## Output bar
Visually cohesive + real interactions + no misleading technical facts + tested. A passing unit test alone is insufficient for visual approval.
