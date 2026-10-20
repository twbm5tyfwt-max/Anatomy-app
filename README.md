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

## Single-body explorer update

- **One registered body:** show/hide systems with the eye controls; highlight/unhighlight them with the target controls. Adding a system preserves the other layers and the viewing angle. Click a structure again, or use Clear highlights, to unselect it.
- **A simpler starting point:** Superficial starts with major surface muscles instead of every deep muscle. All layers and search retain access to all 924 source parts. This is an introductory overview, not a strict surgical dissection plane.
- **Selection you can follow:** the selected muscle first highlights in place for 320 ms, then lifts and enlarges over 1.6 seconds. The intact body remains dimly visible for context. Returning reverses the motion. Lift selection slowly can be switched off for highlighting in place, and the system's reduced-motion preference removes the transition.
- **Whole muscles before components:** related heads/regions on the same side select together. The pectoralis major retains its clavicular, sternocostal, and abdominal source regions, each with a distinct swatch and a region control. The notes distinguish the two main heads from the source's separately modeled abdominal fibers.
- **Clearer surfaces:** higher muscle geometry budgets, mild smoothing of muscle/skin scan noise, matte lighting, distinct neighboring muscle colors, and an optional head surface from the source skin mesh. Bone landmark geometry is not smoothed. The surface guide is presentation context; All layers exposes the original head structures.
- **A quieter interface:** smaller headings, fewer promotional panels, collapsed study notes, and optional display controls keep the body central. Light/dark modes, custom app/bone/muscle colors, bookmarks, functions, and bone landmark guides remain available.

## Study content and limits

The original 51 detailed study structures and 25 tissue schematics remain available, as do all 11 system overviews, directions, planes, and movement concepts. Additional muscle-table notes come from OpenStax chapter 11. All 437 muscle-related model parts have a functional overview or a detailed parent study entry; connective structures such as tendons and retinacula are distinguished from contracting muscle.

Current per-part study coverage is 183 detailed entries, 478 functional overviews, and 263 identification/general-role entries. These are counts of model parts inheriting notes, not 924 distinct reviewed textbooks entries. Many vessels, neural subdivisions, and other small parts still need specific functions, courses, innervation, and relationships. The UI marks this explicitly. A complete landmark map and complete origin/insertion/action/innervation coverage for every model part are not claimed.

The geometry is from **one adult male reference**. Female reproductive study content remains available, but corresponding female 3D models are not bundled. Source geometry is optimized for browser performance; very small surface features may be smoothed. This is an educational atlas, not a diagnostic or surgical model. Anatomy display colors are user-chosen, not natural tissue colors.

The 2D reference tab preserves the OpenStax anterior/posterior plates and their existing regional masks. Those masks hide plate artwork rather than simulate dissection. Skeleton source labels are embedded. Tissue illustrations are educational schematics, not microscopy slides, and are not to scale.

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

There are 26 unit tests for study scope, answer grading, source identities, model coordinate relationships, muscle-versus-connective roles, explicit content coverage, and landmarks. The browser suites exercise 10 original study workflows plus six 3D workflows for actual surface picking, gradual lift/return, three pectoralis regions, rotation, hide/undo, system visibility/highlighting, landmark guidance, bookmarks, mobile layout, theme/color persistence, and reduced motion. Tests use `/usr/bin/chromium` when present; otherwise install Playwright Chromium.

## Sources, licenses, and geometry rebuilds

See [ASSET_CREDITS.md](ASSET_CREDITS.md) for revisions, checksums, original asset paths, and adaptations. **3D geometry is CC BY-SA 2.1 Japan**, while OpenStax content/plates and their educational adaptations are **CC BY-NC-SA 4.0**. These licenses apply to their respective assets; the 3D model is not relicensed under the OpenStax license. Required notices are included in the downloadable ZIP.

The bundled `public/models/bodyparts.glb` is ready to use; normal installation does not download raw anatomy geometry. For an optional rebuild, `python scripts/fetch-3d-source.py` downloads about 1.31 GB of STLs into `/tmp/forma-stl`, verifies every file against its recorded Git blob hash, and `npm run build:models` converts/optimizes them. This keeps original source coordinates, simplifies meshes with bounded error, and uses meshopt compression. Source metadata and resulting per-part bounds are committed. The rebuild also applies mild Taubin smoothing to muscle/skin surfaces, without smoothing bone landmark geometry.

Use the existing checkout directly; cloud tasks are already isolated. No worktree or external service is required. The development server must restart in each new task.
