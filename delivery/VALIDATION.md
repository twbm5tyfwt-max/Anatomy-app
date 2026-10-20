# Combined learning update validation

The automated commands and detailed outcomes are recorded for the final committed package below. Source-specific asset limitations are in IMPLEMENTATION_CHECKLIST.md and LICENSES.md.

- TypeScript and production build checked.
- Unit coverage includes source registration/bounds, anatomy roles, landmarks, grading, opacity/picking policy, region membership, note ambiguity, strict collection scope, and provenance for every added microscope figure.
- Original study browser suite covers 2D references, tissue diagrams, quizzes/exams, saved progress/bookmarks, course imports, timing and mobile layout.
- 3D suite covers actual source-surface picking and hover independence, gradual focus, hide/isolate/undo/reset, contextual vertebral labels, transparency, regional geometry, comparison and mobile controls.
- Combined-learning suite covers repeated reset/reselection, knee menisci/dissection, microscope-image loading and camera return, saved independent workspaces, scoped quizzes/games, game-history reload, PT links and Help.
- Game/touch suite checks that the timer waits for source geometry and an unoccluded target, a real pointer click scores correctly, feedback pauses timing, and a physical touch tap selects the humerus after clearing selection.
- ZIP integrity, embedded HTML equality, attribution/license files, and every added image's SHA-256 are checked before publication.

Some imported reference plates show animal tissue and have embedded labels; the app retains captions and identifies overview plates without a matching specimen. Images are not inferred histology from the selected 3D object. The skin is visibly segmented; advanced female and internal-heart assets are not supplied. The PT/AT page explicitly reports blocked current clinical-source verification; its resource links are not an assertion that a current guideline was validated.

## Final outcomes — October 20, 2026

- Production build and TypeScript passed; hosting notices prepared in `dist/legal/`.
- **36 unit tests passed.**
- Standalone browser suites: **10 original + 8 3D + 5 combined-learning + 3 game/touch/resource workflows passed (26 total)**. The game/touch suite was rerun after fixing a variable-name collision in its test script; the real pointer answer, feedback pause and touch tap passed.
- The successful original/3D/combined suites reported no JavaScript runtime errors.
- ZIP integrity and embedded HTML equality passed; all original license statements, software notices, asset manifest and implementation checklist are present. **11 added microscopy originals** match their recorded SHA-256 checksums. A figure without a verified source caption was omitted.

A 20-round game transition stress check passed: temporary model viewers release their WebGL contexts and the main body context remains available afterward.
