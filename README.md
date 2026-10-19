# Forma — anatomy, understood

A working, local-first anatomy study app built with React 19, TypeScript, and Vite. No account, API key, or paid AI service is required.

## Run

Use Node.js 22.12+ (tested with Node 24).

```sh
cd /workspace/Anatomy-app
npm ci --cache /tmp/forma-npm-cache
npm run dev -- --port 3000
```

The development server binds to `0.0.0.0:3000`. For a production bundle, run `npm run build`; the static output is in `dist/`. `npm run preview -- --port 3000` serves the production build.

## Standalone interactive preview

This environment setup screen does not provide an embedded live preview. The generated `forma-preview.zip` contains a self-contained browser copy: extract it and open `forma-preview.html`. It bundles the images, fonts, quiz engine, and document parsers. No Node installation or development server is needed to use that copy. Browser-local study data is separate from other origins.

Regenerate it with `npm run export:preview`. The export helper preserves the normal Vite build and includes asset credits and third-party license notices in the archive. The standalone bundle passed all 10 browser workflows when served as a single file, with no separate asset requests. Direct file navigation cannot be tested in this environment because its managed browser blocks `file:` URLs.

## What works

- Responsive body explorer with OpenStax anterior and posterior muscle and skeleton plates. Select supported hotspots, search all entries, hide regional artwork, undo, restore, isolate a supported region, zoom, fade a plate, compare separate plates, and bookmark structures.
- Overviews and cross-system connections for all 11 organ systems; 51 structure entries, including 20 muscles with origin, insertion, action, and innervation, and 13 bones with landmarks, articulations, and attachment sites. Both male and female reproductive study entries are included.
- Anatomy essentials covering anatomical position, directions, planes, and movements.
- 25 educational tissue schematics: all nine requested epithelial variants, 11 connective tissues, three muscle tissues, neurons, and glial support. Label toggling, zoom, and side-by-side comparison. Compact bone includes central canals, lamellae, lacunae, osteocytes, and canaliculi.
- Scoped multiple-choice, typed identification, illustrated identification, and anterior muscle click questions. Combine system and tissue-class collections in one quiz. Foundations covers function and location; Detailed adds muscle origins, insertions, and innervation. Practice and exam modes, optional 10-minute timer, explanations, missed-item retry, and saved questions.
- PDF text and `.pptx` slide extraction with page/slide provenance. Image uploads and scanned PDFs can be opened and manually transcribed. Create explicitly reviewed course cards and take course-only typed quizzes.
- Local quiz results, per-topic accuracy, suggestions based on mistakes, bookmarked structures, course collections, and answer review after reload.

## Honest limits

The explorer is a **2D atlas**, not a 3D model. No individually segmented, licensed 3D asset is bundled. Rotation, lateral views, true dissection, and anatomically registered multi-system transparency remain unimplemented. The interface identifies these limits.

There are 13 supported anterior muscle regions, eight posterior muscle regions, 13 anterior bone regions, and five posterior bone regions. Muscle artwork includes both superficial and selected deeper anatomy on opposite halves, as in the source. Hotspots are regional masks, not exact segmentation of every fiber or structure. Removing one masks artwork; it does not reveal invented underlying anatomy. Skeleton labels are embedded in the source image and cannot be toggled. Selected muscle callouts can be toggled. Some original leader-line gaps remain in the adapted muscle view; the unmodified reference is accessible from the expand button.

Other organ systems have overviews and selected study entries, not selectable body illustrations. Coverage is introductory, with no claim to be comprehensive. Tissue images are clearly labeled educational schematics, not microscopy slides; slide-level detail and accurate relative scale are outside this version.

There is no automatic generation of unreviewed questions from arbitrary course documents. Uploads are indexed locally by source page/slide, and you review each answer/clue before it enters the course quiz bank. Scanned PDFs and images require transcription; OCR and legacy `.ppt` parsing are not bundled. Conflicts are left for review rather than resolved by inference. No server or AI receives uploaded content.

Progress and extracted text use localStorage; original files use IndexedDB. Clearing browser data removes them. There is no cloud synchronization or export/restore UI in this version. If localStorage is full, the app reports that changes could not be saved. Large extracted documents are limited to avoid exhausting browser storage.

## Validation

```sh
npm test
npm run build
# Start the development server in another terminal, then:
npm run test:e2e
```

The 14 unit tests validate scope restrictions and combinations, answer keys, distinguishing clues for shared attachments, visual-question eligibility, missed items, source-linked course questions, and typed grading. The 10 browser workflows passed against both the development server and the production bundle. Browser tests exercise actual selection/masking/restoration, view switching, search, bookmarks after reload, multi-plate comparison, tissue labels/zoom/comparison, practice and exam submission, course import/review/quizzing, and mobile overflow.

Browser checks use `/usr/bin/chromium` when present. On another machine, install the Playwright Chromium browser with `npx playwright install chromium`. Set `FORMA_BASE_URL` to test another running server.

## Content and assets

- `src/content.ts`: study structures, systems, directions, and tissues.
- `src/atlas.tsx`: source-plate presentation and named regional hotspots. A future 3D viewer can reuse stable structure IDs.
- `src/TissueDiagram.tsx`: educational tissue schematics.
- `src/quiz.ts`: source-derived question generation and answer grading.
- `src/Course.tsx`: local document parsing and explicitly reviewed course cards.
- `public/anatomy/`: locally bundled plates and source license.

OpenStax source attribution, exact asset paths, revision, checksums, and adaptation details are in [ASSET_CREDITS.md](ASSET_CREDITS.md). The app also exposes these credits and its coverage from the sidebar. OpenStax assets and adapted educational material are **CC BY-NC-SA 4.0** and carry noncommercial and share-alike conditions. Review those conditions before redistributing this app in a different context.

## Environment

Use this existing checkout directly; cloud tasks are already isolated. No worktree or external service is needed. Dependencies and static assets persist on disk; the Vite server must be started in each new task. Reusable installation and startup instructions are saved to the environment configuration draft when the platform supports it.
