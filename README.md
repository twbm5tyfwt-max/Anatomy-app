# Burdett’s Anatomy — interactive 3D anatomy study

A React 19 / TypeScript anatomy and PT/AT educational study app with a real segmented 3D explorer, customizable appearance, tissue study, quizzes, local course materials, and saved progress. No account, API key, or paid AI service is required.

## What changed in the latest round

- **PT/AT** rebuilt: seven regions with 3D previews, common injuries, healing stages by tissue, 28 exercise examples with technique, mistakes, precautions and easier/harder levels, and a Sources tab. Source links are marked "not live-checked"; no exercise videos are embedded.
- **Games** are three steps: pick a region or collection, tick the bones, muscles, ligaments or other structures to be quizzed on, then pick a game and an optional timer.
- **Ligaments** have their own row in the left rail (show/hide, plus a focus mode that fades bones). Ligaments are teal.
- **2D reference** is now a flat atlas drawn from the same 3D model (four views, layers, labels, search); published OpenStax plates remain as a second tab.
- **Study models** from pictures: clearer review (exact matches pre-confirmed, ambiguous ones flagged), shorthand like ACL/quads, tolerance for OCR slips, a region picker for pictures with no readable text, and a compact study guide with progress.
- See `COMMERCIAL_READINESS.md` (and `npm run audit:license`) before selling anything: the current bundle is noncommercial only.

> `delivery/forma-preview.zip` is the standalone build from the previous round. Regenerate it with `npm run build && npm run export:preview` to get these changes.

## Open the downloadable app

Download `delivery/forma-preview.zip` from the `forma-app` branch on GitHub, extract it, and open `forma-preview.html` in a browser with WebGL support. The HTML bundles the anatomy model, images, fonts, and document parsers; no Node installation or server is required for that copy. The standalone copy embeds the model assets, image-reader worker/engine/language, reference images and parsers. Its embedded HTTP-served workflows are tested; this environment blocks direct file:// browser navigation. Verification results are recorded in delivery/VALIDATION.md.

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

- One active reference model with selectable source structures. Clicking isolates with a slow camera close-up; Back to body restores context. Landmark-label and whole-muscle checkboxes appear during isolation. Hover, hide, restore, undo and reset remain available.
- Independent skin, muscle, bone, organ, and connective layer visibility and opacity. Connective controls include cartilage, tendons, ligaments, fascia, capsules, and bursae. Six anatomical camera views, search, and an expanded viewer are available.
- Spine, shoulder, pelvis, and knee presets; matched-scale vertebra comparison; C1/C2 and individually named cervical, thoracic, and lumbar vertebrae. Reviewed landmark notes distinguish projections, facets, and foramina. Source markers hide when occluded or their required context is hidden.
- Whole muscles group source components on the same side. Pectoralis major has clavicular and sternocostal heads plus the source's abdominal region. Tissue regions are not presented as separate complete muscles.
- Source-authored origin/insertion illustrations are available for verified muscle associations. These patches are separate from real tendon geometry and do not constitute a complete attachment atlas.
- App, bone, and muscle colors remain customizable. Existing 2D references, tissue study, bookmarks, course materials, progress, and quiz features remain available.

## Study content and limits

The bundled Z-Anatomy atlas has 4,291 source-derived parts, including tissue surfaces and attachment illustrations. It preserves bone and joint source tessellation and shared coordinates. It does **not** provide Complete Anatomy's proprietary assets, photorealistic skin, or muscle fiber textures. Source anatomy can contain imperfections. Many small catalog structures still have identification/general-role notes rather than detailed reviewed actions, attachments, and innervation. Parent notes may apply to multiple muscle heads and are labeled accordingly.

All 246 source-classified bone parts have introductory landmark, joint and representative attachment guides. Of 549 recorded source annotation endpoints, 548 pass assigned-source-object coordinate checks; one misplaced source marker is excluded. Only explicitly curated landmarks enter graded quizzes. Additional attributed anatomy readings and exact Uberon definitions expand study coverage; see STUDY_DATA_COVERAGE.md. A separate HRA female organ reference provides reproductive organs, body surface and selected organ interiors, with different musculoskeletal coverage from the male atlas. Neither model is patient-specific.

2D reference plates and original educational schematics retain their previous coverage and limitations. Tissue diagrams are not photomicrographs. Display colors are illustrative.

## Quizzes and course materials

Scoped multiple-choice, typed identification, illustrated tissue/muscle questions, and 2D muscle click questions remain available. Combine system and tissue topics, choose Foundations or Detailed, use practice/exam mode, set a timer, retry mistakes, and save difficult questions. Quiz generation remains restricted to the original structured study content or explicitly reviewed course cards; the entire 3D metadata catalog is not automatically treated as a verified quiz bank.

PDF text and `.pptx` slide extraction preserves page/slide references. In custom study workspaces, local English OCR reads images and up to 20 scanned PDF pages; extracted text and structure matches require review. No course material goes to a server or AI service. Extracted text, themes, progress, and bookmarks use localStorage; originals use IndexedDB. Clearing browser data removes them. Browser-local data does not automatically move between different origins or files.

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

## Combined anatomy and PT/AT upgrade

Body and Explore use a single picking system. Hover is temporary; clicks/taps select exact source structures, empty space clears, and a drag does not select. The overlap chooser lists visible intersections. Surfaces below 45% opacity let deeper opaque structures win; surfaces at or below 5% are ignored. Hidden geometry is excluded. Small source lymph-node targets have an invisible 8 px hit tolerance only when unoccluded. Reset clears labels, selection, search, and regional state, and restores a fully interactive view in the current scope.

The scene has graphite, ivory, and midnight gradients, and anatomical view names. Default bony views omit nasal cartilage; the source nasal bones are not reshaped. Region filters include knee, skull, face/neck, neck muscles, abdomen, shoulder, spine, pelvis, heart, lungs, and lymphatic structures. Knee dissection includes menisci and articular surfaces; an optional exploded view is explicitly displaced teaching geometry.

Structure-to-tissue links open diagrams or published microscopy plates over the same camera/selection. Photo plates retain source labels, credits, and specimen captions, including animal specimens. Not every subtype has a matching photo; overview plates are identified as such. Prepared heart and magnified airway diagrams are schematics, not validated mesh cross-sections.

Use + beside Body/Explore to upload images/PDF/PPTX/text, review OCR and exact structures/sides/components, and save an independent study guide and linked model. Files are parsed locally with bundled English OCR, without a remote AI or OCR service. Originals use IndexedDB; notes/references, collections, results and viewing settings use localStorage. New storage keys preserve the original bookmark/result/course-card keys. Each collection has its own layers, selection and camera. Quizzes and games stay within confirmed IDs.

PT / AT introduces regional anatomy and injury concepts, general healing stages, and exercise examples with precautions, regressions/progressions and source links. It is not diagnosis or individualized treatment. AAOS/NHS source retrieval was blocked by network policy, so current clinical revision dates/guideline conformance have not been verified. No exercise videos are copied or fabricated.

Games provide name/function matching, memory pairs, tissue-diagram identification and find-and-click challenges with optional timers. The renderer checks actual source-surface visibility before starting a find target; timing pauses during loading, occlusion, rotation and feedback. Help opens the replayable contextual tour.

See [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md) for every requirement, completed work and remaining asset/verification limits, and [LICENSES.md](LICENSES.md) for noncommercial website/app distribution. No paid service is required.

The normal production build prepares `dist/legal/` with attribution, media-license notes, the requirement checklist, and collected software/font notices. Keep this folder and the source-specific license files under `dist/anatomy/` and `dist/models/` when hosting the website/app. The standalone ZIP includes these notices as separate files.

## Latest requested workflow improvements

- **Organ dissection:** Dissect organ opens source components and available published section references. Heart chamber walls can be removed to inspect actual septum/valve/papillary components. Lungs support side/lobe groups and bronchial-tree reveal, linked to the bronchiole–alveolus teaching guide. Organs without a modeled interior retain an explicit surface-only notice and an available source section plate.
- **Visible tissue layers:** Dedicated ligament switch in the sidebar, individual knee tissue checkboxes, staged cover removal, displaced exploded view warning, and 3D cartilage examples linked to the tissue atlas. Source articular surface regions are distinguished from full tissue volumes.
- **Pictures to guides:** Upload an image, scan, PDF, slide deck or notes. Bundled local English OCR reads image labels and the first 20 scanned PDF pages; upright, clear print works best. Review/correct text and side/component matches. Saved tabs include the original image, a written study guide, personal explanations, learned checks, a downloadable/printable HTML guide, and a separately scoped 3D model of confirmed available anatomy. A picture is not a reconstruction of hidden geometry. Unlabeled images need manual topic/structure identification.
- **2D and tissues:** High-resolution published reference plates with zoom and direct 3D search; original interactive overview retained. Tissue views distinguish actual micrographs, diagrams, mixed-specimen references and missing matched specimens. Comparisons and body-camera return remain available.
- **Games:** Choose a region/collection, check exact structures, then practice. Untimed default; up to 24 structures per session (8 for memory). No silent difficulty-based scope changes.
- **PT/AT:** Regional anatomy preview and direct structure links, injury concepts, healing/approach education, technique-focused exercise cards, cautions and variations, linked clinical instructions. Current external guideline revisions remain unverified where source access is blocked; no personalized plan or unlicensed video is generated.

`npm test` covers content/provenance and source geometry; `npm run test:e2e` includes original workflows and the new OCR/dissection/checklist acceptance suite. User storage keys and existing quiz/bookmark/course progress are preserved.
