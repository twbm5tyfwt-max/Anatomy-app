# Sources and asset credits

Source: OpenStax / Rice University, _Anatomy and Physiology 2e_.

Official source repository: https://github.com/openstax/osbooks-anatomy-physiology

Recorded revision: `5ae32b3f4bc24ed003e91dc38bf47dba80751044`. Retrieved October 19, 2026.

License at that revision: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0). A complete copy is bundled at `public/anatomy/LICENSE-openstax.txt`. License: https://creativecommons.org/licenses/by-nc-sa/4.0/.

## Overview of the Muscular System

- File: `public/anatomy/1105_Anterior_and_Posterior_Views_of_Muscles.jpg`
- Source section: 11.2. Figure title: “Overview of the Muscular System.”
- Source URL: https://raw.githubusercontent.com/openstax/osbooks-anatomy-physiology/5ae32b3f4bc24ed003e91dc38bf47dba80751044/media/1105_Anterior_and_Posterior_Views_of_Muscles.jpg
- SHA-256 of bundled original: `f03d8c7d494e9dc0fcf74faa502f5f0305532702f410f4e953a9ace350d78da8`
- Credit: OpenStax / Rice University. No separate third-party credit appears in this figure’s source caption.

## Axial and Appendicular Skeleton

- File: `public/anatomy/701_Axial_Skeleton-01.jpg`
- Source section: 7.1. Figure title: “Axial and Appendicular Skeleton.”
- Source URL: https://raw.githubusercontent.com/openstax/osbooks-anatomy-physiology/5ae32b3f4bc24ed003e91dc38bf47dba80751044/media/701_Axial_Skeleton-01.jpg
- SHA-256 of bundled original: `f5e7413f39743c22825c4ae7d0ded091991393c23526d7841c743f64292eb405`
- Credit: OpenStax / Rice University. No separate third-party credit appears in this figure’s source caption.

## Cells of Epithelial Tissue

- File: `public/anatomy/403_Epithelial_Tissue.jpg`
- Source section: 4.2. Figure title: “Cells of Epithelial Tissue.”
- Source URL: https://raw.githubusercontent.com/openstax/osbooks-anatomy-physiology/5ae32b3f4bc24ed003e91dc38bf47dba80751044/media/403_Epithelial_Tissue.jpg
- SHA-256 of bundled original: `875950207ab011fa3b726ce0a31019486cb11c26e54e3cdb61f5216ed211df45`
- Credit: OpenStax / Rice University. No separate third-party credit appears in this figure’s source caption.

## Adaptation and educational content

Original source files are preserved. In the interactive muscle viewer, an SVG silhouette clips surrounding printed labels; a display filter reduces black leader lines, leaving some visible gaps. Hand-defined regional masks and selection overlays provide interaction. Front and posterior views use different portions of the same source image. Skeleton views crop the source plate and preserve its embedded labels. The complete original muscle, skeleton, and epithelial plates remain available in the app.

Tissue schematics are original SVG educational diagrams based on the introductory features in OpenStax chapter 4, with compact-bone features from section 6.3. They are explicitly labeled as schematics, not photomicrographs, and are not to scale. Tissue descriptions, structure summaries, and quiz prompts paraphrase the cited textbook. These adapted educational materials are provided under CC BY-NC-SA 4.0 as well.

Text references: chapter 4 (tissues), chapter 5 (integument), chapters 6–8 (bones), chapter 11 (regional muscles), chapters 12–13 (nervous system), chapter 17 (endocrine), chapter 19 (heart), chapter 20 (vessels), chapter 21 (lymphatic and immunity), chapter 22 (respiratory), chapter 23 (digestive), chapter 25 (urinary), and chapter 27 (reproductive). Directions and movement terminology: sections 1.6 and 9.5.

Course uploads are supplied by the user and retain their original ownership. They are stored locally and are not included in the distributed app.

Fonts: DM Sans and Manrope, bundled from @fontsource; font packages include their SIL Open Font License. Icons: Lucide, ISC license, supplied by lucide-react.

## Z-Anatomy 3D atlas

- Source: https://github.com/Z-Anatomy/Models-of-human-anatomy
- Revision: `0189e82e4dc5c6a4ebc1d2558b78580665e9b0ef`, archive `Z-Anatomy.zip`, Git blob SHA-1 `f43cabc6f366b2a6058dd2ed4a2b3c7b9b2492cb` (86,734,957 bytes). Retrieved October 20, 2026.
- **Z-Anatomy — The libre 3D atlas of anatomy — CC BY-SA 4.0.** Authors: Gauthier Kervyn (design/3D/anatomy), Marcin Zielinski (Blender add-on), Kousaku Okubo (original BodyParts3D).
- **BodyParts3D — The Database Center for Life Science — CC BY-SA 2.1 Japan.** Original license retained in `public/models/LICENSE-bodyparts.txt`. Citation: Mitsuhashi et al., Nucleic Acids Research (2009), https://doi.org/10.1093/nar/gkn613.
- Upstream asset-specific credits/conditions: Brainder and White matter, University of Washington; Cranial Nerves and Foramina, University of Dundee CAHID, CC BY 4.0; Anatomy of the Inner Ear, University of Dundee School of Medicine, CC BY-NC-SA 4.0; Kidney, Lissie Cowley, CC BY-NC 4.0. The full original statement is in `public/models/LICENSE-z-anatomy.txt` and the ZIP. These exceptions are retained, not blanket relicensed. This educational app is distributed for noncommercial use.
- The upstream Wikipedia definitions and application/add-on code were not imported or executed. Study notes are separately authored/paraphrased from the OpenStax references above, not copied source definitions.

### Geometry adaptation

`Startup.blend` was opened in Blender with `--disable-autoexec`. Meshes and anatomical curves were evaluated with source transforms and modifiers, with one shared coordinate conversion (x, y, z) to (x, z, −y), in meters. Source vertex normals and tissue materials are retained; mirrored winding is corrected. No new anatomical geometry, smoothing, remeshing, or muscle fiber maps were invented. Large vascular/neural objects receive bounded-error simplification; bone and joint surfaces retain their source tessellation. Meshopt compression produces `public/models/anatomy.glb`: **4,291 parts, 9,156,078 triangles, 42.7 MB**. Parts include material regions of the same structure, not 4,291 independent organs. Derived cartilage/tendon regions remain associated with their parent and original coordinates.

GLB SHA-256: `4ec89d3374ad9e4fb057133e1970db073bccce4d8c062f1087365b2cea77ed43`.

549 skeletal annotation endpoints are retained: 537 target-linked source Hook annotations and 12 original static femur annotation endpoints independently checked against source triangles (distance under 0.05 mm). Only the manually curated subset in `src/landmarkCatalog.ts` is shown with specific explanations or eligible for quizzes. Anchors are never transplanted to another bone. Source-authored origin/insertion patches are illustrations, not modeled tendons; only verified muscle-family associations are selectable as attachment overlays. An illustrated patch does not establish a complete origin/insertion map.

Selected structures stay registered; camera focus animates instead of moving anatomy apart. Transparency uses depth-tested multisample coverage (hashed coverage fallback). Colors are customizable illustrations. This source has no photorealistic skin or fiber textures. Source anatomy and tissue coverage can contain imperfections and are not a surgical model.

### Educational notes and software

39 muscle-table rows originate from official OpenStax chapter 11 CNXML tables, with module references in `src/generated/muscle-notes.json`. Parent muscle notes can be shared by heads/regions and are labeled accordingly. General-role and identification entries are distinct from detailed reviewed entries; full landmark/attachment/innervation coverage is not claimed.

Three.js (MIT) renders geometry; meshoptimizer (MIT) handles compression; glTF Transform (MIT) is used in the build pipeline. Other package notices are collected in the ZIP.

Skin limitation: the bundled skin is divided into source anatomical regions with visible seams. It is not a continuous photorealistic skin surface; no invented replacement or cosmetic smoothing is presented as anatomical realism.
