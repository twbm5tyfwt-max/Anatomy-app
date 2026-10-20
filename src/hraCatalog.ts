import manifest from "./generated/hra-manifest.json";
import type { ModelPart } from "./modelCatalog";
export type HraPart = ModelPart & { pregnancy: boolean };
export const hraParts = manifest.models as HraPart[];
export const hraRegions = [
  "Body",
  "Heart",
  "Lungs",
  "Kidneys",
  "Female pelvis",
  "Breast",
  "Lymph node",
  "Knee",
  "Spine",
  "Skin",
] as const;
export type HraRegion = (typeof hraRegions)[number];
export function hraRegionParts(region: string) {
  return hraParts.filter((m) => {
    const a = m.ancestry.join(" ").toLowerCase();
    if (m.pregnancy) return false;
    switch (region) {
      case "Heart":
        return /heart/.test(a) && m.system === "cardiovascular";
      case "Lungs":
        return /lungs|bronchi|trachea/.test(a) && m.system === "respiratory";
      case "Kidneys":
        return /kidney|renal/.test(a) && m.system === "urinary";
      case "Female pelvis":
        return (
          m.system === "reproductive" ||
          (m.system === "skeletal" && /pelvis/.test(a))
        );
      case "Breast":
        return /mammary/.test(a);
      case "Lymph node":
        return m.sourceName!.startsWith("Yao_");
      case "Knee":
        return /knee|lower limb/.test(a) && / left$/.test(m.name.toLowerCase());
      case "Spine":
        return m.system === "skeletal" && /vertebra|sacrum|coccyx/.test(a);
      case "Skin":
        return m.layer === "skin";
      default:
        return !m.sourceName!.startsWith("Yao_");
    }
  });
}
// Names and segmentation come from the source, explanations from OpenStax.
const notes: [RegExp, string, string][] = [
  [
    /interventricular septum/i,
    "Muscular partition separating the right and left ventricles. It supports pressure separation between pulmonary and systemic pumping.",
    "Identify the septum between the two ventricular components; its superior membranous region is not separately segmented here.",
  ],
  [
    /left (cardiac )?atrium/i,
    "Receives oxygenated pulmonary venous blood and passes it through the mitral valve to the left ventricle.",
    "Posterior superior cardiac chamber; compare its thinner wall with the ventricular myocardium.",
  ],
  [
    /right (cardiac )?atrium/i,
    "Receives systemic venous return and coronary venous blood and passes it through the tricuspid valve to the right ventricle.",
    "Right-sided receiving chamber; trace the associated venae cavae and coronary sinus in the vessel list.",
  ],
  [
    /left ventricle/i,
    "Ejects oxygenated blood through the aortic valve into systemic circulation.",
    "Thicker-walled ventricular pump; the separately selectable septum forms its medial boundary.",
  ],
  [
    /right ventricle/i,
    "Ejects venous blood through the pulmonary valve toward the lungs.",
    "Anterior ventricular pump; the source chamber component is distinct from the interventricular septum.",
  ],
  [
    /mitral valve/i,
    "Limits backflow from the left ventricle into the left atrium during ventricular contraction.",
    "Left atrioventricular valve. Papillary muscles and chordae support closure; valves open and close with pressure differences, not by active muscle contraction.",
  ],
  [
    /tricuspid valve/i,
    "Limits backflow from the right ventricle into the right atrium during ventricular contraction.",
    "Right atrioventricular valve; compare with the left mitral valve.",
  ],
  [
    /aortic valve/i,
    "Limits backflow from the aorta into the left ventricle during ventricular relaxation.",
    "Semilunar valve at the left ventricular outflow; semilunar valves have no chordae tendineae.",
  ],
  [
    /pulmonary valve/i,
    "Limits backflow from the pulmonary trunk into the right ventricle during ventricular relaxation.",
    "Semilunar valve at the right ventricular outflow.",
  ],
  [
    /papillary muscle/i,
    "Tensions the chordae tendineae during ventricular contraction, helping prevent atrioventricular valve prolapse.",
    "This is myocardium, not a skeletal muscle. Chordae are not all separately represented in this model.",
  ],
  [
    /ovary/i,
    "Produces oocytes and ovarian hormones, including estrogens and progesterone.",
    "Paired reproductive organ near the lateral pelvic wall. Ovarian and suspensory ligaments are distinct supporting structures.",
  ],
  [
    /fallopian|uterine tube|fimbria/i,
    "Receives the ovulated oocyte and transports it toward the uterus; fertilization commonly occurs in the ampulla.",
    "The infundibulum/fimbriae lie near the ovary; ampulla, isthmus and uterine portion form the tube.",
  ],
  [
    /cervix/i,
    "Lower uterine region communicating with the vagina through the cervical canal.",
    "Cervical mucus changes through the cycle; this is a reference component, not an examination of a living patient.",
  ],
  [
    /uterus|cornua/i,
    "The uterus supports implantation and fetal development; its muscular wall contracts during labor.",
    "Identify fundus, body and cervix. A named wall component is not proof that all endometrial and myometrial layers are separately modeled.",
  ],
  [
    /vagina|cervicovaginal/i,
    "Fibromuscular passage connecting the cervix to the vestibule; participates in menstruation, intercourse and childbirth.",
    "Posterior to the urethra/bladder and anterior to the rectum.",
  ],
  [
    /mammary lobe|lactiferous/i,
    "Mammary gland lobules produce milk and ducts convey it toward the nipple.",
    "Compare secretory gland regions with ducts, adipose tissue and suspensory ligaments.",
  ],
  [
    /lung|pulmonary lobe/i,
    "Contains the gas-exchanging lung tissue supplied by branching airways and pulmonary vessels.",
    "Right lung has three lobes; left lung has two. Gross lobes are distinct from microscopic alveoli.",
  ],
  [
    /bronch|trachea/i,
    "Conducts air toward or away from the lungs. Bronchi branch through lobar and segmental airways.",
    "Large airways contain supporting cartilage; microscopic bronchioles and alveoli are explained in the magnified guide.",
  ],
  [
    /renal (cortex|pyramid|medulla)|kidney/i,
    "Renal tissue filters blood and regulates water, electrolytes and acid–base balance; collecting pathways convey formed urine.",
    "Cortex, medulla/pyramids and the collecting system are different regions. A gross renal segment is not a single nephron.",
  ],
  [
    /calyx|calyces|renal pelvis|ureter/i,
    "Collects or conveys formed urine toward the urinary bladder.",
    "Minor calyces receive urine at renal papillae, merge into major calyces and the renal pelvis, then the ureter.",
  ],
  [
    /afferent lymphatic/i,
    "Conveys lymph into the lymph node through its capsule.",
    "Afferent vessels enter the convex surface; efferent lymph exits at the hilum.",
  ],
  [
    /efferent lymph/i,
    "Conveys filtered lymph out of the node at the hilum.",
    "This source label refers to the efferent outflow component, rather than a second lymph node.",
  ],
  [
    /follicle/i,
    "Lymphoid follicles are organized B-cell regions involved in immune responses.",
    "Compare the peripheral follicular cortex with the deeper paracortex and medulla.",
  ],
  [
    /paracortex/i,
    "T-cell-rich region supporting antigen presentation and lymphocyte interactions.",
    "Lies between follicular cortex and medullary regions.",
  ],
  [
    /medulla of lymph/i,
    "Medullary cords and sinuses participate in immune responses and lymph flow toward the hilum.",
    "Distinct from peripheral lymphoid follicles and the surrounding capsule.",
  ],
  [
    /capsule of lymph/i,
    "Fibrous covering supporting and enclosing the node.",
    "Hide the capsule to reveal the source internal components.",
  ],
];
export function hraNote(m: HraPart) {
  return notes.find(([pattern]) => pattern.test(m.name));
}
