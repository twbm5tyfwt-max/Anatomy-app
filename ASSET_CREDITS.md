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
- Blender add-on/application code was not executed or imported. OpenStax study summaries remain separate from the newly included, attributed archived Wikipedia/Z-Anatomy readings described below.

### Geometry adaptation

`Startup.blend` was opened in Blender with `--disable-autoexec`. Meshes and anatomical curves were evaluated with source transforms and modifiers, with one shared coordinate conversion (x, y, z) to (x, z, −y), in meters. Source vertex normals and tissue materials are retained; mirrored winding is corrected. No new anatomical geometry, smoothing, remeshing, or muscle fiber maps were invented. Large vascular/neural objects receive bounded-error simplification; bone and joint surfaces retain their source tessellation. Meshopt compression produces `public/models/anatomy.glb`: **4,291 parts, 9,156,078 triangles, 42.7 MB**. Parts include material regions of the same structure, not 4,291 independent organs. Derived cartilage/tendon regions remain associated with their parent and original coordinates.

GLB SHA-256: `4ec89d3374ad9e4fb057133e1970db073bccce4d8c062f1087365b2cea77ed43`.

549 skeletal annotation endpoints are retained: 537 target-linked source Hook annotations and 12 original static femur annotation endpoints independently checked against source triangles (distance under 0.05 mm). 548 original endpoints pass the assigned-source-object bounds check and are available for identification. One misplaced source annotation, “Uncinate process of first thoracic vertebra,” is excluded. Nearest-surface distances are recorded separately; openings can be marked within their lumen. Only the explicitly curated subset is eligible for graded quizzes; the remaining points retain source names/readings and distinguish unreviewed landmark-specific roles. Anchors are never transplanted to another bone. Source-authored origin/insertion patches are illustrations, not modeled tendons; only verified muscle-family associations are selectable as attachment overlays. An illustrated patch does not establish a complete origin/insertion map.

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

## Human Reference Atlas / HuBMAP female organ reference

Kristen Browne and Heidi Schlehlein. *3D Reference Organ Set for Female, v1.5* (2023). HuBMAP / Human Reference Atlas. DOI: https://doi.org/10.48539/HBM352.BTSQ.586. CC BY 4.0: https://creativecommons.org/licenses/by/4.0/. Original license text: `public/models/LICENSE-hra.txt`. Underlying Visible Human imagery: U.S. National Library of Medicine. Overall library contributors: Kristen Browne, Heidi Schlehlein, Bruce W. Herr II, Ellen Quardokus, Andreas Bueckle and Katy Börner.

Original public release repository: https://github.com/hubmapconsortium/ccf-releases, revision `b036a91aaf7234f462b1249d4a5f4fb0e982f412`, `v2.0/models/3d-vh-f-united.glb.7z`. Official release metadata: `v2.0/markdown/ref-organs/3d-vh-f-united.md`. Retrieved October 20, 2026.

Original GLB SHA-256: `472567a56896b9b7890508da6501fbf858e56aaa30745365f7a71ade782b529c`. Browser GLB: `public/models/hra-female.glb`, 888 source mesh components, 5,557,599 triangles, SHA-256 `700cfcb10e91a7dc128fb0ecc2d880c90b9c6fd8a249dfbfce1aaa198919e0fb`. Geometry, node transforms and source segmentation are retained. Browser adaptations: IDs, display names/classification, compression and illustrative colors. No generated or borrowed male musculoskeletal geometry was added.

This is an organ-reference assembly with a female body surface, reproductive organs, selected bones and limited muscle coverage. It is not a complete female musculoskeletal atlas or a single-person scan. Pregnancy-reference components are excluded from the default body scope. The source includes a sixth lumbar segment; anatomical counts vary.

The brain incorporates the Allen Human Reference Atlas; source hemispheres are mirrored/resized in the HRA assembly. HRA brain v1.3 release metadata explicitly records CC BY 4.0: https://github.com/hubmapconsortium/ccf-releases/blob/b036a91aaf7234f462b1249d4a5f4fb0e982f412/v2.0/markdown/ref-organs/3d-f-brain.md.

The reference lymph node uses mouse data and the NIH Ce3D method developed by Dr. Weizhe Li, Laboratory of Immune System Biology, NIAID. Li et al., PNAS 114(35), E7321 (2017). It is a comparative teaching object, not a patient-specific human node at the rendered location. HRA reference DOI: https://doi.org/10.48539/HBM463.LFHF.874. This distinction is visible in the app; the node is excluded from the general-body scope.

Heart dissection removes named source components (chambers, septum, valves and papillary muscles). Kidney and lymph-node controls likewise remove actual components. These operations do not create new histologically valid cut planes. Published 2D section references provide clearly labeled alternatives for organs lacking a detailed 3D interior.

## Archived anatomy readings

Wikipedia contributors, as adapted/archived by Z-Anatomy authors in the pinned source blend. Z-Anatomy adaptations: CC BY-SA 4.0; legacy Wikipedia CC BY-SA 3.0 attribution/license notice retained. Full texts are bundled in `LICENSE-cc-by-sa-4.txt` and `LICENSE-wikipedia.txt`. Every reading in `src/generated/atlas-readings.json` retains its original Wikipedia article URL, contributor-history URL and credit; these links are also visible in the app and exported study guides.

1,393 readings link to 2,434 source parts and 270 source landmark names. Anatomical identification, structure, function and relationship sections were selected. Clinical, variation and comparative-animal sections, and explicit treatment/animal paragraphs, were omitted. The source's prose is not treated as a current clinical guideline. Parent-muscle references are identified; an article does not establish a reviewed 3D attachment point. The archive revision is pinned; original live Wikipedia revision dates were not reconstructed. No source add-on code ran.

## Uberon anatomical definitions

Uberon contributors, https://github.com/obophenotype/uberon, revision `76b965742a97393a4c567b1accf012f163a520a5`, release `2026-10-01`, CC BY 3.0: https://creativecommons.org/licenses/by/3.0/. Full text: `LICENSE-uberon.txt`. Only unique exact labels/synonyms or FMA identifiers were matched. Ambiguous terms and explicitly unvetted/nonhuman comparative definitions were excluded. Each displayed term retains its identifier, definition citations and persistent source URL. These are term definitions, not complete human attachment/innervation records.

## Local image reading

Tesseract.js 6.0.1 and Tesseract.js-core retain their Apache-2.0 notices. The @tesseract.js-data/eng 1.0.0 package declares MIT, credits Balearica and jeromewu, and retains its terms plus the upstream Tesseract trained-data Apache-2.0 notice in LICENSE-ocr-data.txt and THIRD_PARTY_LICENSES.txt. Worker, engine and English language data are bundled; images and scanned pages are processed locally. OCR confidence measures recognition, not anatomical correctness. Uploaded originals stay in browser storage and are excluded from the distributed app.

## Additional source figures

The following originals are bundled unchanged (some `.JPG` filename extensions normalized to `.jpg`), retaining embedded labels, captions and specimen credits. Display layout/zoom differ. All are OpenStax / Rice University A&P 2e, CC BY-NC-SA 4.0, from the pinned revision above. A source figure without a separate prose caption is identified as such; no specimen is invented.

### Internal Structures of the Heart

- File: `public/anatomy/2008_Internal_Anatomy_of_the_HeartN.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/modules/m46676/index.cnxml
- SHA-256: `5d962a658cab2538378fa846e2276c67389902c51968d64950873b9850938437`
- Caption/credit: This anterior view of the heart shows the four chambers, the major vessels and their early branches, as well as the valves. The presence of the pulmonary trunk and aorta covers the interatrial septum, and the atrioventricular septum is cut away to show the atrioventricular valves.

### Gross Anatomy of the Lungs

- File: `public/anatomy/2312_Gross_Anatomy_of_the_Lungs.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/modules/m46551/index.cnxml
- SHA-256: `67a7b18d0ec991f5295d1295a40080b2a356989af995fbd43d985137c1023985`
- Caption/credit: Published labeled gross anatomy of the lungs illustration. The source figure supplies no separate prose caption; original embedded labels are retained.

### Left Kidney

- File: `public/anatomy/2610_The_Kidney.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/modules/m46429/index.cnxml
- SHA-256: `30d15988386d61f74039dee64bb63f7d13556173058bb4d1d42ac97c12546654`
- Caption/credit: Published labeled left kidney illustration. The source figure supplies no separate prose caption; original embedded labels are retained.

### Stomach

- File: `public/anatomy/2414_Stomach.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/modules/m46517/index.cnxml
- SHA-256: `32c814b50a8d86b9d416e8eeadab5270ae1c57405b141db4dd8eecf23de55fdf`
- Caption/credit: The stomach has four major regions: the cardia, fundus, body, and pylorus. The addition of an inner oblique smooth muscle layer gives the muscularis the ability to vigorously churn and mix food.

### Microscopic Anatomy of the Liver

- File: `public/anatomy/2423_Microscopic_Anatomy_of_Liver.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/modules/m46496/index.cnxml
- SHA-256: `fcda18a635dc699f7e05f4880e22d8c1d24f04f1bc73a88340e09778367dd277`
- Caption/credit: The liver receives oxygenated blood from the hepatic artery and nutrient-rich deoxygenated blood from the hepatic portal vein.

### Exocrine and Endocrine Pancreas

- File: `public/anatomy/2424_Exocrine_and_Endocrine_Pancreas.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/modules/m46496/index.cnxml
- SHA-256: `dc6fd2bf1ea8c4a72067a60ec729c3a5577b4915a5cadcabb2140bb991204e93`
- Caption/credit: The pancreas has a head, a body, and a tail. It delivers pancreatic juice to the duodenum through the pancreatic duct.

### Spleen

- File: `public/anatomy/2208_Spleen.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/modules/m46563/index.cnxml
- SHA-256: `01fd6818d8a293745b7c6632c0bb7ed3a174bb24c3749dd18286fc9969adbcbc`
- Caption/credit: (a) The spleen is attached to the stomach. (b) A micrograph of spleen tissue shows the germinal center. The marginal zone is the region between the red pulp and white pulp, which sequesters particulate antigens from the circulation and presents these antigens to lymphocytes in the white pulp. EM × 660. (Micrograph provided by the Regents of the University of Michigan Medical School © 2012)

### Bladder

- File: `public/anatomy/2605_The_Bladder.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/modules/m46427/index.cnxml
- SHA-256: `8eb1f9f8dd50d06135882095f5a4568d05f8716c3d41d675fa508a2fa2a20db7`
- Caption/credit: (a) Anterior cross section of the bladder. (b) The detrusor muscle of the bladder (source: monkey tissue) LM × 448. (Micrograph provided by the Regents of the University of Michigan Medical School © 2012)

### Structure of the Eye

- File: `public/anatomy/1413_Structure_of_the_Eye.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/modules/m46577/index.cnxml
- SHA-256: `f8b98bdfa2bd68b17fb2c1e975ede1d571269348f49cdaca6d0851712d377dff`
- Caption/credit: The sphere of the eye can be divided into anterior and posterior chambers. The wall of the eye is composed of three layers: the fibrous tunic, vascular tunic, and neural tunic. Within the neural tunic is the retina, with three layers of cells and two synaptic layers in between. The center of the retina has a small indentation known as the fovea.

### The Brain Stem

- File: `public/anatomy/1311_Brain_Stem.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/modules/m46533/index.cnxml
- SHA-256: `9da8c3dbbdb6240c923d1325e4f6f740765e41d625a5e3d28e6be97cf1e374e4`
- Caption/credit: The brain stem comprises three regions: the midbrain, the pons, and the medulla.

### Thyroid Gland

- File: `public/anatomy/1811_The_Thyroid_Gland.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/modules/m46700/index.cnxml
- SHA-256: `f956a9fc58ca589ebfd91ee889a9686ddaaac32001b53fa03f6b7ed5b4640138`
- Caption/credit: The thyroid gland is located in the neck where it wraps around the trachea. (a) Anterior view of the thyroid gland. (b) Posterior view of the thyroid gland. (c) The glandular tissue is composed primarily of thyroid follicles. The larger parafollicular cells often appear within the matrix of follicle cells. LM × 1332. (Micrograph provided by the Regents of University of Michigan Medical School © 2012)

### Adrenal Glands

- File: `public/anatomy/1818_The_Adrenal_Glands.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/modules/m46684/index.cnxml
- SHA-256: `0e133ab3278e87efffcf1f580f85e0c279bdfbdc9f85c61909596b045dbfb8f0`
- Caption/credit: Both adrenal glands sit atop the kidneys and are composed of an outer cortex and an inner medulla, all surrounded by a connective tissue capsule. The cortex can be subdivided into additional zones, all of which produce different types of hormones. LM × 204. (Micrograph provided by the Regents of University of Michigan Medical School © 2012)

### Hypothalamus–Pituitary Complex

- File: `public/anatomy/1806_The_Hypothalamus-Pituitary_Complex.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/modules/m46699/index.cnxml
- SHA-256: `2c44dfbbad90124e0971494b1da017f3ac7ee4488d6503575d44736a5e8564f3`
- Caption/credit: The hypothalamus region lies inferior and anterior to the thalamus. It connects to the pituitary gland by the stalk-like infundibulum. The pituitary gland consists of an anterior and posterior lobe, with each lobe secreting different hormones in response to signals from the hypothalamus.

### Small Intestine

- File: `public/anatomy/2417_Small_IntestineN.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/modules/m46512/index.cnxml
- SHA-256: `78f2da45cafc2ba2d038f8b2f39b9c3e1a964c34ff3eb1331ec3514edd303aa2`
- Caption/credit: The three regions of the small intestine are the duodenum, jejunum, and ileum.

### Anatomy of the Testis

- File: `public/anatomy/Figure_28_01_03.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/modules/m46400/index.cnxml
- SHA-256: `0b3a72c39e1c1c745b8895bb236a587cecd957e0d32f235409a6b19a9660a6c1`
- Caption/credit: This sagittal view shows the seminiferous tubules, the site of sperm production. Formed sperm are transferred to the epididymis, where they mature. They leave the epididymis during an ejaculation via the ductus deferens.

### Ovaries, Uterine Tubes, and Uterus

- File: `public/anatomy/Figure_28_02_06.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/modules/m46392/index.cnxml
- SHA-256: `28650c4df939a434fac565abd73672b1ec7ebb2c4603db5f89028985aa9cfea4`
- Caption/credit: This anterior view shows the relationship of the ovaries, uterine tubes (oviducts), and uterus. Sperm enter through the vagina, and fertilization of an ovulated oocyte usually occurs in the distal uterine tube. From left to right, LM × 400, LM × 20. (Micrographs provided by the Regents of University of Michigan Medical School © 2012)

### Structures of the Respiratory Zone

- File: `public/anatomy/2310_Structures_of_the_Respiratory_Zone.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/media/2310_Structures_of_the_Respiratory_Zone.jpg
- SHA-256: `1198546c2181baccded04f6da52f051e2461360b8628ef4b493d04417dbb1169`
- Caption/credit: (a) The alveolus is responsible for gas exchange. (b) A micrograph shows the alveolar structures within lung tissue. LM × 178. (Micrograph provided by the Regents of University of Michigan Medical School © 2012)

### Histology of the large Intestine

- File: `public/anatomy/2421_Histology_of_the_Large_IntestineN.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/media/2421_Histology_of_the_Large_IntestineN.jpg
- SHA-256: `1684737ba76983bff2f4dedba115910b5cd0d794201f724e149168e3c6cf3792`
- Caption/credit: (a) The histologies of the large intestine and small intestine (not shown) are adapted for the digestive functions of each organ. (b) This micrograph shows the colon’s simple columnar epithelium and goblet cells. LM x 464. (credit b: Micrograph provided by the Regents of University of Michigan Medical School © 2012)

### Epidermis

- File: `public/anatomy/503_Epidermis.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/media/503_Epidermis.jpg
- SHA-256: `45e6e5d7fbb85ae5f7d67e6179356bbd1487150fa040b46ad8eaad7992a25f82`
- Caption/credit: The epidermis is epithelium composed of multiple layers of cells. The basal layer consists of cuboidal cells, whereas the outer layers are squamous, keratinized cells, so the whole epithelium is often described as being keratinized stratified squamous epithelium. LM × 40. (Micrograph provided by the Regents of University of Michigan Medical School © 2012)

### Juxtaglomerular Apparatus and Glomerulus

- File: `public/anatomy/2615_Juxtaglomerular_Apparatus.jpg`
- Source: https://github.com/openstax/osbooks-anatomy-physiology/blob/5ae32b3f4bc24ed003e91dc38bf47dba80751044/media/2615_Juxtaglomerular_Apparatus.jpg
- SHA-256: `596d8046f8121c397701d26659373631f5edf2a9b2d3713d94b34d6ff43a845a`
- Caption/credit: (a) The JGA allows specialized cells to monitor the composition of the fluid in the DCT and adjust the glomerular filtration rate. (b) This micrograph shows the glomerulus and surrounding structures. LM × 1540. (Micrograph provided by the Regents of University of Michigan Medical School © 2012)

### Tissue metadata corrections

The atlas display material named Cartilage is not a tissue diagnosis. Thirty-nine metadata records identify cardiac valve leaflets, dural folds, eyelid tarsal plates and nucleus pulposus correctly; 33 require additional layer changes. See `src/generated/tissue-corrections.json`. Source geometry and identifiers are unchanged. Teeth are identified separately from bone and have no fabricated compact-bone histology link.
