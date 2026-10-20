# Forma — interactive 3D anatomy study

A React 19 / TypeScript anatomy study app with a real segmented 3D explorer, customizable appearance, tissue study, quizzes, local course materials, and saved progress. No account, API key, or paid AI service is required.

## Open the downloadable app

Download `delivery/forma-preview.zip` from the `forma-app` branch on GitHub, extract it, and open `forma-preview.html` in a browser with WebGL support. The HTML bundles the anatomy model, images, fonts, and document parsers; no Node installation or server is required for that copy. Local file navigation is blocked by this environment's managed browser, so the standalone copy is tested through an internal HTTP server with all assets embedded.

This environment setup screen's Index visualization is not a reliable live preview. Use the GitHub download, not a `/workspace` chat link.

## Development

Node.js 22.12+ is required (tested with Node 24).

```sh
cd /workspace/Anatomy-app
npm ci --cache /tmp/forma-npm-cache
npm run dev -- --port 3000
```

`npm run build` checks TypeScript and builds `dist/`. `npm run preview -- --port 3001` serves that bundle. `npm run export:preview` regenerates the standalone HTML and ZIP.

## Body and Explore workspace

- One registered body, with selectable structures, tissue regions, and reviewed landmark pins. Highlight in place, slowly focus the camera, isolate, hide, restore, undo, and reset. An optional Focus after selecting setting makes camera focus automatic.
- Independent skin, muscle, bone, organ, and connective layer visibility and opacity. Connective controls include cartilage, tendons, ligaments, fascia, capsules, and bursae. Six anatomical camera views, search, and an expanded viewer are available.
- Spine, shoulder, pelvis, and knee presets; matched-scale vertebra comparison; C1/C2 and individually named cervical, thoracic, and lumbar vertebrae. Reviewed landmark notes distinguish projections, facets, and foramina. Source markers hide when occluded or their required context is hidden.
- Whole muscles group source components on the same side. Pectoralis major has clavicular and sternocostal heads plus the source's abdominal region. Tissue regions are not presented as separate complete muscles.
- Source-authored origin/insertion illustrations are available for verified muscle associations. These patches are separate from real tendon geometry and do not constitute a complete attachment atlas.
- App, bone, and muscle colors remain customizable. Existing 2D references, tissue study, bookmarks, course materials, progress, and quiz features remain available.

## Study content and limits

The bundled Z-Anatomy atlas has 4,291 source-derived parts, including tissue surfaces and attachment illustrations. It preserves bone and joint source tessellation and shared coordinates. It does **not** provide Complete Anatomy's proprietary assets, photorealistic skin, or muscle fiber textures. Source anatomy can contain imperfections. Many small catalog structures still have identification/general-role notes rather than detailed reviewed actions, attachments, and innervation. Parent notes may apply to multiple muscle heads and are labeled accordingly.

549 original skeletal annotation endpoints are recorded; the explicitly curated subset in `src/landmarkCatalog.ts` has explanatory notes. This is not a complete landmark map for every bone. Quiz eligibility is explicit, never inferred from catalog names. The atlas includes source male and female reproductive structures; it is not a patient-specific model.

2D reference plates and original educational schematics retain their previous coverage and limitations. Tissue diagrams are not photomicrographs. Display colors are illustrative.

## Quizzes and course materials

Scoped multiple-choice, typed identification, illustrated tissue/muscle questions, and 2D muscle click questions remain available. Combine system and tissue topics, choose Foundations or Detailed, use practice/exam mode, set a timer, retry mistakes, and save difficult questions. Quiz generation remains restricted to the original structured study content or explicitly reviewed course cards; the entire 3D metadata catalog is not automatically treated as a verified quiz bank.

PDF text and `.pptx` slide extraction preserves page/slide references. Scanned pages and images require manual transcription and review. No course material goes to a server or AI service. Extracted text, themes, progress, and bookmarks use localStorage; originals use IndexedDB. Clearing browser data removes them. Browser-local data does not automatically move between different origins or files.

## Validation

```sh
npm test
npm run build
# With a server running:
npm run test:e2e
# Against a generated standalone copy served for testing:
FORMA_BASE_URL=http://127.0.0.1:3002/forma-preview.html npm run test:3d
```

Unit tests cover source identities and bounds, registered tissue regions, muscle/connective roles, landmark context, question eligibility, scope, and grading. Browser suites check original study workflows and the new 3D workspace. Screenshots are included in `delivery/`.

## Sources, licenses, and geometry rebuilds

See [ASSET_CREDITS.md](ASSET_CREDITS.md) for exact revisions, hashes, authors, adaptations, and coverage. Z-Anatomy is CC BY-SA 4.0 with upstream asset-specific exceptions retained (including CC BY-NC and CC BY-NC-SA models). BodyParts3D attribution under CC BY-SA 2.1 Japan remains included. OpenStax content/plates are CC BY-NC-SA 4.0. This educational distribution is for noncommercial use; individual asset licenses remain distinct. The ZIP includes the original source statements.

`public/models/anatomy.glb` is ready to use; normal installation needs no Blender or raw anatomy download. Optional rebuild (about 87 MB source download, Blender 4.3, and several GB temporary space):

```sh
python scripts/fetch-z-anatomy.py
blender --background --disable-autoexec /tmp/forma-z-src/Z-Anatomy/Startup.blend --python scripts/extract-z-anatomy.py
npm run build:models
```

The fetch verifies the pinned Git blob. The exporter evaluates source geometry without enabling source scripts; the builder preserves source bone/joint geometry, optimizes large neural/vessel objects, and compresses with meshopt. Never enable embedded source add-ons for this build.

Use the existing checkout directly; cloud tasks are already isolated. The development server must restart in each new task.

Skin limitation: the bundled skin is divided into source anatomical regions with visible seams. It is not a continuous photorealistic skin surface; no invented replacement or cosmetic smoothing is presented as anatomical realism.
