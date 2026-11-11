# Credits and where things came from

After Hours is a reskin and extension of **Harvest Standoff** by andreteow:
https://github.com/andreteow/farm-ca (based on upstream commit 05c9c5f76f01bd65d0576388edb3ff4fcad40488).
Upstream's package.json declares the ISC licence. We keep that attribution. This repository does not claim upstream's work.

## Inherited from Harvest Standoff, included unchanged

- `assets/audio/` - 90 voice lines, announcer lines, music and effects. According to upstream's own README and `tools/audio` scripts these were generated with Google's Gemini text-to-speech and Lyria music tools.
- `assets/tex/`, `assets/ui/` (all files except the ten icons below), `art/generated/` - painted textures, menu and shop art, emblems, logo, key art and share image. Upstream's README describes them as generated.
- `assets/chars/`, `tools/chars/` - the ten Blender-scripted character models and the scripts that build them.
- `art/reference/`, `art/characters/`, `tools/audio/` - upstream reference pictures and audio scripts.
- Most gameplay code: opponent AI (`src/bot.js`), navigation, collision, combat, actors, effects and config values.

To check these against the original, compare with https://github.com/andreteow/farm-ca. Their exact licence scope is whatever upstream declares (ISC in package.json); we have not verified more than that.

## Made for After Hours

- The toy-room scenery and furniture: `src/afterhours.js`, `src/living-room.js` (built in code, no image files).
- Ten UI icons in `assets/ui/` drawn by a script (flat shapes, not AI-generated): icon_coin, icon_cork_kit, icon_egg, icon_flour, icon_mud, icon_overalls, icon_pea, icon_pumpkin, icon_rooster, icon_tomato.
- Toy-team theming and text, touch controls, and edits to `src/audio.js`, `characters.js`, `config.js`, `hud.js`, `main.js`, `page.html`, `throwables.js`, `viewmodel.js`, `world.js` and `build.mjs`.
- No new AI-generated images or audio were added for After Hours. Everything AI-generated in this repository came from Harvest Standoff.

## Third-party

Three.js (MIT) and the Nunito and Lilita One fonts (OFL 1.1). See THIRD-PARTY-NOTICES.md and `licenses/`.
