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

## BodyParts3D 3D model geometry

**BodyParts3D, © The Database Center for Life Science, licensed under Creative Commons Attribution-ShareAlike 2.1 Japan.**

- Dataset: BodyParts3D release 3.0 / 20110915; one adult male reference.
- Original archive: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- Source mirror and conversion to STL: Kevin-Mattheus-Moerman/BodyParts3D, https://github.com/Kevin-Mattheus-Moerman/BodyParts3D
- Exact source revision: `f0eeb6e843380cfe6b83797cf8c3e1af74de5e61`.
- Original mesh paths: `assets/BodyParts3D_data/stl/<model ID>.stl`.
- Model names / ontology: source `parts_list_e.txt` and FMA.csv; source names, classifications, and individual Git blob hashes are recorded in `scripts/bodyparts-source.json`.
- Attribution license: https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en
- Source license statement is bundled as `public/models/LICENSE-bodyparts.txt` and in the preview ZIP.
- Citation: Mitsuhashi N, Fujieda K, Tamura T, Kawamoto S, Takagi T, Okubo K. BodyParts3D: 3D structure database for anatomical concepts. Nucleic Acids Res. 2009;37(Database issue):D782–D785. DOI: https://doi.org/10.1093/nar/gkn613. Dataset DOI: https://doi.org/10.18908/lsdba.nbdc00837-000.

### Adaptation

924 named source meshes are bundled. Alternate `nsn` mesh variants are omitted. Raw STLs were checked against the Git blob hashes at the recorded source revision. Coordinates were converted from millimeters (x = subject left, y = posterior, z = superior) to browser meters (x = subject left, y = superior, z = anterior). This is a shared rigid coordinate conversion, preserving original spatial registration.

The pipeline merges coincident vertices, performs bounded-error mesh simplification with protected boundaries, recomputes smooth normals, and uses quantized meshopt-compressed glTF. Important long bones receive higher triangle budgets. The single-body update increases muscle budgets to 6,000 triangles and the skin budget to 40,000, subject to bounded-error simplification. Two mild Taubin smoothing pairs are applied to muscle surfaces and three to skin; bone geometry is not smoothed. The resulting model has 4,102,964 triangles and is about 18.7 MB. Surface details can be reduced; users should compare fine landmarks to their course references. Models are rendered with illustrative, customizable colors. The introductory view filters deep muscles and optionally displays the source head skin as context; all source parts remain available in All layers and search. Muscle heads/regions are grouped by family and side without merging their source geometry. The pectoralis retains all three source regions (clavicular, sternocostal, and abdominal); labels distinguish the two main heads from the inferior abdominal fibers. Selection transforms animate wrappers around the unchanged glTF coordinate transforms. The test picking fixture in tests/fixtures/3d-picks.json is a source-mesh triangle centroid used to validate selection, not an anatomical landmark. These derived geometry assets retain CC BY-SA 2.1 Japan.

Bundled model SHA-256: `3d0ab800ac6fa9dd80523b9e0dc3047aea8147d801b0fa7cc8da9fb90a9103b7`.

### Additional study notes

39 parsed muscle table rows originate from the official OpenStax chapter 11 CNXML tables. Included notes retain source module references in `src/generated/muscle-notes.json`. Additional introductory functional summaries distinguish muscle actions, skeletal roles, and noncontractile support tissues; these are overviews, not exhaustive origin/insertion/innervation entries. Detailed notes for a parent muscle or bone are explicitly labeled when shown with an individual side, head, or part. Neural and vascular entries without reviewed specific details are marked as identification/general-role coverage.

Three.js (MIT) renders the geometry; meshoptimizer (MIT) handles compression; glTF Transform (MIT) is used in the build pipeline. Package license notices are collected in the preview ZIP.
