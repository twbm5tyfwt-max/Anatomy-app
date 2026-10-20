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

## Noncommercial educational website/app distribution

The user selected noncommercial educational use. Asset licenses permit redistribution only under their own terms; attribution alone grants no additional permission. Keep these credits, the original license statements, license links, and modification notes with website/app distributions. Share-alike conditions apply to relevant adaptations. Clinical external pages are linked, not copied or embedded. No Complete Anatomy assets are used. Machine-readable provenance is in `public/ASSET_MANIFEST.json` and the ZIP.

## Added microscopy plates

Published OpenStax figures are bundled unchanged, from revision `5ae32b3f4bc24ed003e91dc38bf47dba80751044`. Display zoom and layout differ. These plates contain original embedded labels, which cannot be toggled; they are not used as unlabeled quiz images. Source captions identify microscope method, specimen, and magnification where given; screen zoom is not the stated optical magnification. In particular, the hyaline cartilage example in the cartilage plate is **dog tissue**. Figures compare reference tissues, not histology obtained from the selected 3D structure.

### Four Types of Tissue: Body

- File: `public/anatomy/401_Types_of_Tissue.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/media/401_Types_of_Tissue.jpg
- SHA-256: `8c1070ee0898da2ecc849932126b74349cd0b21023dd15ef404de61f595263b0`
- License: OpenStax / Rice University, CC BY-NC-SA 4.0.
- Original caption and credit: The four types of tissues are exemplified in nervous tissue, stratified squamous epithelial tissue, cardiac muscle tissue, and connective tissue. (Micrographs provided by the Regents of University of Michigan Medical School © 2012)

### Types of Cartilage

- File: `public/anatomy/412_Types_of_Cartilage-new.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/media/412_Types_of_Cartilage-new.jpg
- SHA-256: `25e6e4b4d81353cef9847e71b75a70035ad5101a19cb4223eb016d229fd7f57e`
- License: OpenStax / Rice University, CC BY-NC-SA 4.0.
- Original caption and credit: Cartilage is a connective tissue consisting of collagenous fibers embedded in a firm matrix of chondroitin sulfates. (a) Hyaline cartilage provides support with some flexibility. The example is from dog tissue. (b) Fibrocartilage provides some compressibility and can absorb pressure. (c) Elastic cartilage provides firm but elastic support. From top, LM × 300, LM × 1200, LM × 1016. (Micrographs provided by the Regents of University of Michigan Medical School © 2012)

### Muscle Tissue

- File: `public/anatomy/414_Skeletal_Smooth_Cardiac.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/media/414_Skeletal_Smooth_Cardiac.jpg
- SHA-256: `f3f98e7f67f13fb890a173475630db029586e16527215ee30ba280397f5db66e`
- License: OpenStax / Rice University, CC BY-NC-SA 4.0.
- Original caption and credit: (a) Skeletal muscle cells have prominent striation and nuclei on their periphery. (b) Smooth muscle cells have a single nucleus and no visible striations. (c) Cardiac muscle cells appear striated and have a single nucleus. (Micrographs provided by the Regents of University of Michigan Medical School © 2012)

### Nervous Tissue

- File: `public/anatomy/416_Nervous_Tissue-new.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/media/416_Nervous_Tissue-new.jpg
- SHA-256: `f9a9a5b0c160d9f7656f801866796d6695fa0870046fdaa51e5be384daaaa6bf`
- License: OpenStax / Rice University, CC BY-NC-SA 4.0.
- Original caption and credit: Nervous tissue is made up of neurons and neuroglia. The cells of nervous tissue are specialized to transmit and receive impulses. LM × 872. (Micrograph provided by the Regents of University of Michigan Medical School © 2012)

### Dense Connective Tissue

- File: `public/anatomy/411_Reg_Dense-Irregular_Dense.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/media/411_Reg_Dense-Irregular_Dense.jpg
- SHA-256: `0b7256898dc43b2200e05725609d8215c14d6a3531f58ef9e399e29d087fb399`
- License: OpenStax / Rice University, CC BY-NC-SA 4.0.
- Original caption and credit: (a) Dense regular connective tissue consists of collagenous fibers packed into parallel bundles. (b) Dense irregular connective tissue consists of collagenous fibers interwoven into a mesh-like network. From top, LM × 1000, LM × 200. (Micrographs provided by the Regents of University of Michigan Medical School © 2012)

## New teaching illustrations

The airway magnification and prepared heart section are original simplified educational diagrams based on OpenStax Anatomy and Physiology 2e §§19.1 and 22.1–22.4. They are not 3D cross-sections, not to scale, and not a complete internal reconstruction. They are distributed as educational adaptations under CC BY-NC-SA 4.0. No clinical videos or third-party exercise images are reproduced.

### Connective Tissue Proper

- File: `public/anatomy/408_Connective_Tissue.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/media/408_Connective_Tissue.jpg
- SHA-256: `e05e4940a766a561542ea9233fe9f86227fe31299de0a1912fde49ec6cb0ad60`
- License: OpenStax / Rice University, CC BY-NC-SA 4.0.
- Original caption and credit: Fibroblasts produce this fibrous tissue. Connective tissue proper includes the fixed cells fibrocytes, adipocytes, and mesenchymal cells. LM × 400. (Micrograph provided by the Regents of University of Michigan Medical School © 2012)

### Adipose Tissue

- File: `public/anatomy/409_Adipose_Tissue.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/media/409_Adipose_Tissue.jpg
- SHA-256: `873ab0a6133cfb85bf731f7f1cdabc57441c21ba6a222223451ca0db1d20d8ea`
- License: OpenStax / Rice University, CC BY-NC-SA 4.0.
- Original caption and credit: This is a loose connective tissue that consists of fat cells with little extracellular matrix. It stores fat for energy and provides insulation. LM × 800. (Micrograph provided by the Regents of University of Michigan Medical School © 2012)

### Reticular Tissue

- File: `public/anatomy/410_Reticular_Tissue.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/media/410_Reticular_Tissue.jpg
- SHA-256: `b3da70a9dd3ed14ac88faf1199c980bb80e54e70ab72a73660cf2ec4f38efcc2`
- License: OpenStax / Rice University, CC BY-NC-SA 4.0.
- Original caption and credit: This is a loose connective tissue made up of a network of reticular fibers that provides a supportive framework for soft organs. LM × 1600. (Micrograph provided by the Regents of University of Michigan Medical School © 2012)

### Diagram of Spongy Bone

- File: `public/anatomy/606_Spongy_Bone.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/media/606_Spongy_Bone.jpg
- SHA-256: `a5974857388e86e2ce1d8afbc2b8e46a5928b6e878a57239497c9bfbaecac15a`
- License: OpenStax / Rice University, CC BY-NC-SA 4.0.
- Original caption and credit: Spongy bone is composed of trabeculae that contain the osteocytes. Red marrow fills the spaces in some bones.

### Blood: A Fluid Connective Tissue

- File: `public/anatomy/424_Blood_A_Fluid_Connective_Tissue-new.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/media/424_Blood_A_Fluid_Connective_Tissue-new.jpg
- SHA-256: `35d5b28d152fec94f8ee73051af270f8655d59b6e0fa9b0332c6f23f7981dfc8`
- License: OpenStax / Rice University, CC BY-NC-SA 4.0.
- Original caption and credit: Blood is a fluid connective tissue containing erythrocytes and various types of leukocytes that circulate in a liquid extracellular matrix. LM × 1600. (Micrograph provided by the Regents of University of Michigan Medical School © 2012)

### Pseudostratified Ciliated Columnar Epithelium

- File: `public/anatomy/2304_Pseudostratified_Epithelium.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/media/2304_Pseudostratified_Epithelium.jpg
- SHA-256: `23c6600fa8ee5203a3572f4f5ccda90fea253ea2e05698bae2cd3a0d20bde08e`
- License: OpenStax / Rice University, CC BY-NC-SA 4.0.
- Original caption and credit: Respiratory epithelium is pseudostratified ciliated columnar epithelium. Seromucous glands provide lubricating mucus. LM × 680. (Micrograph provided by the Regents of University of Michigan Medical School © 2012)
