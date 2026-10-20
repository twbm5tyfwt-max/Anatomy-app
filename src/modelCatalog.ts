import { readingFor } from "./AnatomyReading";
import { definitionFor } from "./ReferenceDefinition";
import { boneNoteFor } from "./boneNotes";
import { connectiveNotes } from "./connectiveNotes";
import manifest from "./model-manifest.json";
import { hraNote, type HraPart } from "./hraCatalog";
import muscleTables from "./generated/muscle-notes.json";
import { structures, type Structure, type Region } from "./content";
export type AnatomyLayer =
  | "skin"
  | "muscles"
  | "bones"
  | "tendons"
  | "ligaments"
  | "cartilage"
  | "fascia"
  | "capsules"
  | "bursae"
  | "organs"
  | "attachment";
export type ModelPart = {
  id: string;
  name: string;
  system: string;
  ancestry: string[];
  sha1: string;
  bounds: number[][];
  triangles: number;
  layer?: AnatomyLayer;
  sourceName?: string;
  sourceMaterial?: string;
  source?: string;
  region?: string;
  parentId?: string;
  surfaceRegion?: boolean;
  attachmentFor?: string;
  attachmentSource?: string;
  attachmentKind?: "origin" | "insertion";
  sharedAttachment?: boolean;
};
/** Which body the whole app uses. Switching reloads the page so every list, quiz and game agrees. */
export type BodyModel = "male" | "female";
export const bodyModel: BodyModel = "male";
export const modelParts: ModelPart[] = manifest.models as ModelPart[];
export type Landmark = {
  name: string;
  description: string;
  view: "front" | "back" | "left" | "right";
};
export type ModelStudy = Structure & {
  kind: string;
  family: string;
  detailLevel: "detailed" | "overview" | "identification";
  landmarkGuide: Landmark[];
};
const actions: Record<string, string> = Object.fromEntries(
  `
lumbrical|Flexes the knuckle joints and extends the interphalangeal joints of the associated digits; in the foot these are metatarsophalangeal joints.
plantar interosseous|Adducts the associated toe toward the second-toe axis, assists metatarsophalangeal flexion, and helps extend the interphalangeal joints.
flexor retinaculum|Fibrous band that holds flexor tendons close to the wrist or ankle; at the wrist it forms the roof of the carpal tunnel.
adductor minimus|Adducts the hip; represents the superior part of the adductor magnus region.
pubococcygeus|Supports the pelvic viscera and contributes to pelvic floor elevation and continence.
puborectalis|Forms a sling around the anorectal junction that helps maintain the anorectal angle and fecal continence.
iliococcygeus|Supports the pelvic viscera and contributes to the muscular pelvic floor.
longus colli|Flexes and stabilizes the cervical vertebral column.
longus capitis|Flexes the head and upper cervical region.
rectus capitis anterior|Flexes and stabilizes the head at the atlanto-occipital joints.
rectus capitis lateralis|Laterally flexes and stabilizes the head at the atlanto-occipital region.
tendinous arch of levator ani|Fascial attachment line for the levator ani along the obturator internus fascia.
coccygeus|Supports the pelvic viscera and assists movement of the coccyx.
frontalis|Raises the eyebrows and produces horizontal forehead wrinkles.
occipitalis|Retracts the scalp.
temporoparietalis|Tenses the scalp and can assist movement of the auricle.
corrugator supercilii|Draws the eyebrows medially and inferiorly, producing vertical wrinkles above the nose.
levator labii superioris alaeque nasi|Elevates the upper lip and helps dilate the nostril.
levator labii superioris|Elevates the upper lip.
depressor labii inferioris|Depresses the lower lip.
levator anguli oris|Elevates the angle of the mouth.
depressor anguli oris|Depresses the angle of the mouth.
nasalis|Its different parts help compress or dilate the nasal aperture.
depressor septi nasi|Draws the nasal septum inferiorly.
procerus|Depresses the medial eyebrows and wrinkles the skin over the bridge of the nose.
iliotibial tract|Thickened lateral fascia that transmits forces from tensor fasciae latae and gluteus maximus and contributes to lateral knee stability.
interspinales|Small muscles that assist extension and stabilization of adjacent spinal segments.
intertransversari|Small muscles that assist lateral flexion and stabilization between adjacent vertebrae.
levatores costarum|Elevates the ribs and assists inspiration.
external intercostal|Elevates the ribs during inspiration and supports the intercostal spaces.
internal intercostal|Its interosseous part assists rib depression during forced expiration; its interchondral part can assist rib elevation.
innermost intercostal|Assists depression of the ribs during forced expiration and supports the intercostal spaces.
transversus thoracis|Weakly depresses the costal cartilages during expiration.
diaphraGM|Contracts to increase thoracic volume during inspiration.
sternohyoid|Depresses the hyoid after it is elevated during swallowing.
omohyoid|Depresses and stabilizes the hyoid.
sternothyroid|Depresses the larynx.
thyrohyoid|Depresses the hyoid or elevates the larynx when the hyoid is fixed.
subscapularis|Medially rotates the arm and stabilizes the humeral head in the glenoid cavity.
supraspinatus|Initiates arm abduction and helps stabilize the glenohumeral joint.
infraspinatus|Laterally rotates the arm and stabilizes the glenohumeral joint.
teres minor|Laterally rotates the arm and stabilizes the humeral head.
teres major|Extends, adducts, and medially rotates the arm.
levator scapulae|Elevates and downwardly rotates the scapula.
internal oblique|Compresses abdominal contents; bilaterally flexes the trunk and unilaterally rotates it toward the same side.
transversus abdominis|Compresses abdominal contents and supports the abdominal wall.
quadratus lumborum|Laterally flexes the vertebral column and stabilizes the twelfth rib.
pyramidalis|Tenses the linea alba.
scalenus anterior|Assists neck flexion and elevates the first rib during forceful inspiration.
scalenus medius|Laterally flexes the neck and elevates the first rib.
scalenus posterior|Laterally flexes the neck and elevates the second rib.
serratus posterior superior|Assists elevation of the upper ribs.
serratus posterior inferior|Assists depression and stabilization of the lower ribs.
splenius capitis|Bilaterally extends the head and neck; unilaterally rotates and laterally flexes them toward the same side.
splenius cervicis|Extends the neck bilaterally and rotates it toward the same side unilaterally.
iliocostalis|Part of the erector spinae: extends and laterally flexes the vertebral column.
longissimus|Part of the erector spinae: extends and laterally flexes the vertebral column; head fibers also extend and rotate the head.
spinalis|Part of the erector spinae: helps extend the vertebral column.
semispinalis|Extends the vertebral column or head bilaterally and rotates toward the opposite side unilaterally.
multifidus|Stabilizes adjacent vertebrae and assists extension and contralateral rotation.
rotator|Small deep back muscles that help stabilize vertebrae and assist local rotation.
rectus capitis posterior major|Extends and rotates the head toward the same side.
rectus capitis posterior minor|Extends the head at the atlanto-occipital joints.
obliquus capitis superior|Extends and laterally flexes the head.
obliquus capitis inferior|Rotates the atlas and head toward the same side.
iliacus|Flexes the hip and helps stabilize it.
psoas major|Flexes the hip; can flex or laterally flex the trunk when the femur is fixed.
gluteus medius|Abducts the hip and helps hold the pelvis level during single-leg support.
gluteus minimus|Abducts and medially rotates the hip; helps stabilize the pelvis during walking.
piriformis|Laterally rotates the extended hip and abducts the flexed hip.
obturator internus|Laterally rotates the extended hip and stabilizes the femoral head.
obturator externus|Laterally rotates the hip and helps stabilize the femoral head.
gemellus superior|Assists lateral rotation of the extended hip and stabilization of the femoral head.
gemellus inferior|Assists lateral rotation of the extended hip and stabilization of the femoral head.
quadratus femoris|Laterally rotates and assists adduction of the hip.
tensor fasciae latae|Flexes, abducts, and medially rotates the hip; tensions the iliotibial tract.
semitendinosus|Extends the hip, flexes the knee, and medially rotates the flexed leg.
semimembranosus|Extends the hip, flexes the knee, and medially rotates the flexed leg.
biceps femoris|Flexes the knee and laterally rotates the flexed leg; its long head also extends the hip.
pectineus|Adducts and flexes the hip.
adductor brevis|Adducts and assists flexion of the hip.
adductor longus|Adducts and assists flexion of the hip.
adductor magnus|Adducts the hip; its adductor part assists flexion and its hamstring part assists extension.
gracilis|Adducts the hip, flexes the knee, and assists medial rotation of the flexed leg.
vastus medialis|Extends the knee and contributes to patellar stability.
vastus intermedius|Extends the knee as part of the quadriceps femoris.
extensor hallucis longus|Extends the great toe and dorsiflexes the ankle.
extensor digitorum longus|Extends toes 2–5 and dorsiflexes the ankle.
fibularis tertius|Assists ankle dorsiflexion and eversion of the foot.
fibularis longus|Everts and plantarflexes the foot and supports the foot arches.
fibularis brevis|Everts and assists plantarflexion of the foot.
plantaris|Weakly assists knee flexion and ankle plantarflexion.
popliteus|Helps unlock the knee and assists knee flexion.
tibialis posterior|Inverts and plantarflexes the foot and supports the medial longitudinal arch.
flexor hallucis longus|Flexes the great toe, assists plantarflexion, and supports the medial arch.
flexor digitorum longus|Flexes toes 2–5 and assists plantarflexion of the foot.
coracobrachialis|Flexes and adducts the arm at the shoulder.
anconeus|Assists elbow extension and stabilizes the elbow joint.
pronator quadratus|Pronates the forearm and stabilizes the distal radioulnar joint.
pronator teres|Pronates the forearm and weakly assists elbow flexion.
flexor carpi radialis|Flexes and abducts the wrist.
flexor carpi ulnaris|Flexes and adducts the wrist.
palmaris longus|Weakly flexes the wrist and tensions the palmar aponeurosis.
flexor digitorum profundus|Flexes the distal interphalangeal joints of fingers 2–5 and assists other finger and wrist flexion.
flexor digitorum superficialis|Flexes the proximal interphalangeal joints of fingers 2–5 and assists wrist flexion.
flexor pollicis longus|Flexes the thumb, especially its interphalangeal joint.
extensor carpi radialis longus|Extends and abducts the wrist.
extensor carpi radialis brevis|Extends and abducts the wrist.
extensor carpi ulnaris|Extends and adducts the wrist.
extensor digitorum|Extends fingers 2–5 and assists wrist extension.
extensor digiti minimi|Extends the little finger.
supinator|Supinates the forearm.
abductor pollicis longus|Abducts and extends the thumb at its carpometacarpal joint.
extensor pollicis longus|Extends the thumb, especially its interphalangeal joint.
extensor pollicis brevis|Extends the thumb at its metacarpophalangeal joint.
extensor indicis|Extends the index finger.
abductor hallucis|Abducts and flexes the great toe; supports the medial longitudinal arch.
flexor digitorum brevis|Flexes the proximal interphalangeal joints of toes 2–5.
flexor accessorius|Assists flexor digitorum longus in flexing the lateral four toes; also called quadratus plantae.
flexor hallucis brevis|Flexes the great toe at its metatarsophalangeal joint.
adductor hallucis|Adducts the great toe and supports the transverse arch.
extensor hallucis brevis|Extends the great toe at its metatarsophalangeal joint.
extensor digitorum brevis|Assists extension of toes 2–4.
occipitofrontalis|Raises the eyebrows and wrinkles the forehead; its occipital belly retracts the scalp.
orbicularis oculi|Closes the eyelids.
orbicularis oris|Closes and protrudes the lips.
buccinator|Compresses the cheek against the teeth during chewing and blowing.
zygomaticus major|Elevates the corner of the mouth during smiling.
zygomaticus minor|Elevates the upper lip.
risorius|Retracts the corner of the mouth laterally.
mentalis|Elevates and protrudes the lower lip and wrinkles the chin.
platysma|Tenses the skin of the neck and assists depression of the mandible and lower lip.
temporalis|Elevates the mandible; posterior fibers retract it.
lateral pterygoid|Protracts and depresses the mandible and helps produce side-to-side jaw movements.
medial pterygoid|Elevates and protracts the mandible and assists side-to-side movements.
digastric|Elevates the hyoid during swallowing; depresses the mandible when the hyoid is fixed.
mylohyoid|Elevates the floor of the mouth and hyoid during swallowing.
geniohyoid|Pulls the hyoid anteriorly and superiorly during swallowing.
stylohyoid|Elevates and retracts the hyoid during swallowing.
external anal sphincter|Voluntarily constricts the anal canal and contributes to continence.
`
    .trim()
    .split("\n")
    .map((l) => {
      const [k, v] = l.split("|");
      return [k.toLowerCase(), v];
    }),
);
const boneGuides: Record<string, Landmark[]> = {
  humerus: [
    {
      name: "Head",
      description:
        "Rounded proximal surface on the medial side; articulates with the glenoid cavity.",
      view: "front",
    },
    {
      name: "Greater & lesser tubercles",
      description:
        "Proximal projections around the intertubercular sulcus; rotator cuff attachment sites.",
      view: "front",
    },
    {
      name: "Deltoid tuberosity",
      description: "Roughened lateral shaft where the deltoid inserts.",
      view: "front",
    },
    {
      name: "Olecranon fossa",
      description:
        "Large posterior distal depression that receives the olecranon during elbow extension.",
      view: "back",
    },
    {
      name: "Capitulum & trochlea",
      description:
        "Distal articular surfaces for the radius and ulna, respectively.",
      view: "front",
    },
  ],
  femur: [
    {
      name: "Head & neck",
      description:
        "The rounded head points medially into the acetabulum; the neck joins it to the shaft.",
      view: "front",
    },
    {
      name: "Greater & lesser trochanters",
      description:
        "Proximal muscle-attachment projections. The lesser trochanter lies posteromedially.",
      view: "back",
    },
    {
      name: "Linea aspera",
      description:
        "Long rough ridge along the posterior shaft; an important attachment area.",
      view: "back",
    },
    {
      name: "Condyles",
      description:
        "Rounded distal medial and lateral surfaces that articulate with the tibia.",
      view: "back",
    },
    {
      name: "Patellar surface",
      description: "Anterior distal groove that articulates with the patella.",
      view: "front",
    },
  ],
  scapula: [
    {
      name: "Spine & acromion",
      description:
        "The prominent posterior spine continues laterally into the acromion above the shoulder joint.",
      view: "back",
    },
    {
      name: "Glenoid cavity",
      description: "Shallow lateral socket for the head of the humerus.",
      view: "front",
    },
    {
      name: "Coracoid process",
      description: "Hooklike anterior projection near the glenoid cavity.",
      view: "front",
    },
    {
      name: "Supra- & infraspinous fossae",
      description: "Posterior depressions above and below the scapular spine.",
      view: "back",
    },
  ],
  radius: [
    {
      name: "Head",
      description:
        "Disc-shaped proximal end; articulates with the capitulum and radial notch of the ulna.",
      view: "front",
    },
    {
      name: "Radial tuberosity",
      description:
        "Medial proximal prominence distal to the neck; receives the biceps tendon.",
      view: "front",
    },
    {
      name: "Styloid process",
      description:
        "Pointed lateral projection at the distal end near the wrist.",
      view: "front",
    },
  ],
  ulna: [
    {
      name: "Olecranon",
      description:
        "Large proximal posterior projection forming the point of the elbow.",
      view: "back",
    },
    {
      name: "Trochlear notch",
      description:
        "Deep anterior proximal notch that embraces the humeral trochlea.",
      view: "front",
    },
    {
      name: "Coronoid process",
      description: "Anterior projection below the trochlear notch.",
      view: "front",
    },
    {
      name: "Head & styloid process",
      description: "Small distal landmarks near the wrist.",
      view: "front",
    },
  ],
  tibia: [
    {
      name: "Tibial condyles",
      description: "Broad proximal surfaces supporting the femoral condyles.",
      view: "front",
    },
    {
      name: "Tibial tuberosity",
      description:
        "Anterior proximal prominence receiving the patellar ligament.",
      view: "front",
    },
    {
      name: "Anterior crest",
      description: "Sharp ridge palpable along the front of the shin.",
      view: "front",
    },
    {
      name: "Medial malleolus",
      description: "Distal medial projection forming the inner ankle.",
      view: "front",
    },
  ],
  fibula: [
    {
      name: "Head & neck",
      description:
        "Proximal end beside the lateral tibial condyle; the common fibular nerve passes around the neck.",
      view: "front",
    },
    {
      name: "Lateral malleolus",
      description: "Distal projection forming the outer ankle.",
      view: "front",
    },
  ],
  clavicle: [
    {
      name: "Sternal end",
      description: "Larger medial end articulating with the manubrium.",
      view: "front",
    },
    {
      name: "Acromial end",
      description: "Flattened lateral end articulating with the acromion.",
      view: "front",
    },
    {
      name: "Conoid tubercle",
      description: "Inferior lateral prominence for the conoid ligament.",
      view: "back",
    },
  ],
};
const boneFunctions: Record<string, string> = {
  vertebra:
    "Supports the body, protects the spinal cord within the vertebral canal, and provides attachment for spinal muscles and ligaments.",
  rib: "Contributes to the thoracic cage, protects thoracic organs, and moves with respiratory muscles during breathing.",
  sacrum:
    "Transfers weight from the vertebral column to the pelvic girdle and forms the posterior pelvic wall.",
  coccyx: "Provides attachment for pelvic floor muscles and ligaments.",
  "hip bone":
    "Supports and transfers body weight, protects pelvic viscera, and forms the acetabular socket for the femoral head.",
  ilium:
    "Forms the broad superior region of the hip bone and provides attachment for trunk and hip muscles.",
  ischium: "Forms the posteroinferior hip bone and bears weight when sitting.",
  pubis: "Forms the anterior hip bone and helps support the pelvic ring.",
  metacarpal:
    "Forms part of the palm and acts as a lever between wrist and finger joints.",
  metatarsal:
    "Forms part of the forefoot, supports the foot arches, and transmits weight during walking.",
  phalanx:
    "Forms part of a finger or toe and provides a lever for digital movement.",
  carpal:
    "Contributes to the wrist framework and permits coordinated wrist movement.",
  scaphoid:
    "Links the proximal and distal carpal rows and contributes to wrist stability.",
  lunate:
    "Articulates with the radius and helps transmit forces through the wrist.",
  triquetral: "Contributes to the proximal carpal row and wrist movement.",
  pisiform:
    "Sesamoid carpal bone within the flexor carpi ulnaris tendon; improves its leverage.",
  trapezium:
    "Articulates with the first metacarpal at the thumb carpometacarpal joint, allowing opposition.",
  trapezoid: "Stabilizes the base of the second metacarpal.",
  capitate:
    "Central carpal bone that transmits forces between the hand and wrist.",
  hamate:
    "Supports the ulnar side of the palm; its hook provides ligament and muscle attachment.",
  talus:
    "Transmits weight from the leg to the foot and articulates with the tibia and fibula at the ankle.",
  calcaneus: "Forms the heel, bears weight, and receives the calcaneal tendon.",
  navicular:
    "Contributes to the medial foot arch between talus and cuneiform bones.",
  cuboid:
    "Supports the lateral foot arch and articulates with the calcaneus and lateral metatarsals.",
  cuneiform:
    "Contributes to the medial and transverse foot arches and connects the navicular to metatarsals.",
  parietal: "Forms part of the cranial roof and sides, protecting the brain.",
  occipital:
    "Forms the posterior skull and base, surrounds the foramen magnum, and articulates with the atlas.",
  sphenoid:
    "Contributes to the cranial base and orbits and houses the pituitary gland in the sella turcica.",
  ethmoid:
    "Contributes to the nasal cavity, nasal septum, medial orbital walls, and anterior cranial floor.",
  zygomatic: "Forms the prominence of the cheek and part of the orbit.",
  maxilla:
    "Supports the upper teeth and contributes to the hard palate, nasal cavity, and orbits.",
  nasal: "Forms part of the bony bridge of the nose.",
  lacrimal:
    "Contributes to the medial orbital wall and the passage for tear drainage.",
  palatine:
    "Forms the posterior part of the hard palate and contributes to nasal and orbital boundaries.",
  vomer: "Forms part of the bony nasal septum.",
  hyoid:
    "Supports the tongue and provides attachment for swallowing and neck muscles.",
  tooth: "Mechanically breaks down food during chewing.",
};
export function getRegion(m: ModelPart): Region {
  if (m.region) return m.region as Region;
  const names = [m.name, ...m.ancestry].join(" ").toLowerCase();
  if (
    /upper limb|forearm|\bhand\b|\barm\b|humerus|radius|\bulna\b|carpal|pollicis/.test(
      names,
    )
  )
    return "Upper limbs";
  if (
    /lower limb|\bfoot\b|\bleg\b|\bthigh\b|femur|tibia|fibula|tarsal|hallucis/.test(
      names,
    )
  )
    return "Lower limbs";
  if (
    /head|neck|skull|cranial|capitis|cervic|brain|cerebr|eye|orbit|mandib|tongue|pharyn|laryn/.test(
      names,
    )
  )
    return "Head & neck";
  return "Torso";
}
function matches(name: string, key: string) {
  return name
    .replace(/\b(right|left)\b/g, "")
    .replace(/\s+/g, " ")
    .includes(key.toLowerCase());
}
const studyCache = new Map<string, ModelStudy>();
export function getModelStudy(m: ModelPart): ModelStudy {
  const cached = studyCache.get(m.id);
  if (cached) return cached;
  const name = m.name.toLowerCase();
  const candidates = structures
    .filter(
      (s) =>
        s.system === m.system &&
        ([s.name, ...s.aliases].some((key) => matches(name, key)) ||
          ({
            lungs: "lung",
            kidneys: "kidney",
            testes: "testis",
            thyroid: "thyroid gland",
          }[s.id] &&
            name.includes(
              (
                {
                  lungs: "lung",
                  kidneys: "kidney",
                  testes: "testis",
                  thyroid: "thyroid gland",
                } as Record<string, string>
              )[s.id],
            ))),
    )
    .sort((a, b) => b.name.length - a.name.length);
  const known = candidates[0];
  const table = muscleTables.find((t) => matches(name, t.name));
  const action = Object.entries(actions)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([key]) => name.includes(key));
  const isBone = m.system === "skeletal" && m.layer === "bones";
  let kind = isBone
    ? "Bone"
    : m.layer === "muscles"
      ? "Skeletal muscle"
      : "Anatomical structure";
  let fn = "";
  let note = "";
  let level: ModelStudy["detailLevel"] = "identification";
  let curatedSource = "";
  if (known) {
    fn = known.function;
    level = "detailed";
  } else if (table) {
    fn = table.actions;
    level = "detailed";
  } else if (action) {
    fn = action[1];
    level = "overview";
  }
  if (!fn && isBone) {
    const row = Object.entries(boneFunctions).find(([key]) =>
      name.includes(key),
    );
    fn =
      row?.[1] ||
      "Contributes to the skeletal framework. A structure-specific function and attachment entry has not yet been reviewed.";
    level = row ? "overview" : "identification";
  }
  if (
    /tendon|ligament|linea alba|aponeurosis|retinaculum|iliotibial tract|tendinous arch|fascia/.test(
      name,
    )
  ) {
    kind = "Connective tissue";
    fn =
      action?.[1] ||
      (/tendon/.test(name)
        ? "Transmits force from a muscle to its attachment."
        : /linea alba/.test(name)
          ? "Fibrous midline seam that joins the abdominal aponeuroses."
          : "Provides fibrous support and attachment; it does not contract like a skeletal muscle.");
    level = "overview";
  }
  if (!fn && /artery|aorta|arterial/.test(name)) {
    kind = "Blood vessel";
    fn =
      "Arteries conduct blood away from the heart. Branch-specific course and supply are not yet curated for this entry.";
  }
  if (!fn && /vein|venous|vena cava/.test(name)) {
    kind = "Blood vessel";
    fn =
      "Veins return blood toward the heart. Branch-specific drainage is not yet curated for this entry.";
  }
  if (!fn && /nerve/.test(name)) {
    kind = "Nerve";
    fn =
      "Carries neural signals. The specific motor, sensory, and autonomic territories of this branch still need a reviewed study entry.";
  }
  if (
    m.layer === "cartilage" ||
    (!fn && /cartilage|disk|disc|meniscus/.test(name))
  ) {
    kind = "Cartilage / joint support";
    level = "overview";
    fn = /intervertebral/.test(name)
      ? "The fibrocartilaginous annulus surrounds a gelatinous nucleus pulposus; together they distribute spinal loading and permit limited movement. No disc lies between C1 and C2."
      : /menisc|labrum|articular disc|interpubic|symphys/.test(name)
        ? "Fibrocartilaginous joint structure that distributes load and helps joint congruence or stability. It is distinct from the hyaline cartilage covering articular bone surfaces."
        : /epiglott|epiglotic|corniculate|auditory tube/.test(name)
          ? "Flexible elastic-cartilage support for the named airway or auditory structure. Elastic fibers permit bending and recoil; this is not an articular surface."
          : /bronch|trachea/.test(name)
            ? "Cartilage supports the conducting airway wall and helps keep it open. It is not itself the air-conducting lumen or the gas-exchanging alveolar lining."
            : /costal/.test(name)
              ? "Hyaline costal cartilage links ribs to their anterior connections and permits flexibility of the thoracic cage during breathing."
              : /nasal|alar/.test(name)
                ? "Supports the flexible cartilaginous framework of the nose; it is distinct from the paired nasal bones."
                : /thyroid|cricoid|arytenoid/.test(name)
                  ? "Forms part of the laryngeal framework supporting the airway and vocal apparatus. Most of these regions are hyaline cartilage; arytenoid apices/processes can contain elastic cartilage."
                  : /triradiate/.test(name)
                    ? "Developmental hyaline growth cartilage at the junction of ilium, ischium and pubis. It normally fuses with skeletal maturity; this source inclusion is a teaching reference."
                    : "Hyaline articular cartilage provides a low-friction surface and distributes contact loads. A source-classified surface patch is not a complete tissue-thickness reconstruction.";
    curatedSource =
      "OpenStax Anatomy and Physiology 2e, chapters 4, 8–9, 14 and 22: cartilage, joints, auditory structures and airways. Source geometry retained; display materials are not histology classifications.";
  }
  if (!fn && m.source === "HRA") {
    const n = hraNote(m as HraPart);
    kind = "Reproductive structure (Human Reference Atlas)";
    if (n) {
      fn = n[1];
      note = n[2];
      level = "overview";
    }
  }
  if (!fn) {
    fn =
      "This part has a verified model name and system classification. A structure-specific function and detailed relationships have not yet been curated.";
    note =
      "Identification coverage only. Do not infer a specific function from shape alone.";
  }
  if (m.layer === "bursae") {
    kind = "Synovial bursa";
    fn =
      "A small fluid-containing sac that reduces friction between adjacent moving tissues. It is not a contracting muscle or a ligament.";
    level = "overview";
  }
  if (m.layer === "capsules") {
    kind = "Articular capsule";
    fn =
      "Encloses a synovial joint, supports stability, and contains the synovial environment. A capsule is distinct from the ligaments reinforcing it.";
    level = "overview";
  }
  if (m.layer === "attachment") {
    kind = "Attachment overlay";
    fn = `Source-authored ${m.attachmentKind || "attachment"} surface illustration. This overlay marks an attachment region; it is not a separately modeled tendon.`;
    level = "overview";
  }
  const connective = connectiveNotes.find((n) => n.match.test(m.name));
  if (connective) {
    kind = "Ligament";
    fn = connective.function;
    level = "detailed";
  }
  if (m.system === "lymphatic" && /node/i.test(name)) {
    kind = /nodes/i.test(name) ? "Regional lymph-node group" : "Lymph node";
    fn =
      "Filters lymph draining nearby tissues. Lymphocytes and antigen-presenting cells support immune surveillance; nodes do not pump lymph. A plural source name represents a group, not a single enlarged node. Specific drainage pathways should be checked in your course atlas.";
    level = "overview";
  }
  if (name === "linea alba") {
    kind = "Aponeurotic raphe";
    fn =
      "Midline fibrous seam formed by the interwoven abdominal muscle aponeuroses. Connects the two sides of the abdominal wall and transmits tension; it does not contract.";
    level = "overview";
  }
  const chambers: Record<string, string> = {
    "left ventricle":
      "Pumps oxygenated blood through the aortic valve into the systemic circulation. Its thick myocardium develops the pressure needed for systemic flow.",
    "right ventricle":
      "Pumps blood through the pulmonary valve into the pulmonary trunk and lungs. It normally operates at lower pressure than the left ventricle.",
    "left atrium":
      "Receives oxygenated blood from the pulmonary veins and delivers it through the mitral valve to the left ventricle.",
    "right atrium":
      "Receives systemic venous blood through the venae cavae and coronary sinus and delivers it through the tricuspid valve to the right ventricle.",
  };
  if (chambers[name]) {
    kind = "Cardiac chamber";
    fn = chambers[name];
    level = "overview";
    note =
      "Source component isolation is not a complete or validated sectional reconstruction of this chamber.";
    curatedSource =
      "OpenStax Anatomy and Physiology 2e, §19.1 Heart Anatomy; source geometry: Z-Anatomy.";
  }
  if (m.system === "cardiovascular" && /leaflet/.test(name)) {
    kind = "Valve leaflet";
    fn = /coronary/.test(name)
      ? "One component of the aortic semilunar valve. Closure limits backflow from the aorta into the left ventricle during relaxation; semilunar cusps do not have chordae tendineae."
      : /pulmonary/.test(name)
        ? "One component of the pulmonary semilunar valve. Valve closure limits backflow from the pulmonary trunk into the right ventricle during ventricular relaxation."
        : "One component of an atrioventricular valve. Closure limits backflow into the atrium during ventricular contraction; chordae tendineae and papillary muscles support the leaflets.";
    level = "overview";
    note =
      "Valve leaflets are fibrous connective tissue with an endothelial covering, not articular cartilage or skeletal ligaments. Only some source leaflets are separately modeled.";
    curatedSource =
      "OpenStax Anatomy and Physiology 2e, §19.1 Heart Anatomy; source geometry: Z-Anatomy.";
  }
  if (
    m.system === "respiratory" &&
    m.layer !== "cartilage" &&
    /bronchus/.test(name)
  ) {
    kind = "Conducting airway";
    fn =
      "Conducts air between the larger airways and more distal lung branches. Bronchi have cartilage support and smooth muscle. Most gas exchange occurs across the alveolar-capillary barrier, not in the conducting bronchus.";
    level = "overview";
    note =
      "The source models larger bronchial branches; microscopic bronchioles and alveoli are shown separately as teaching diagrams.";
    curatedSource =
      "OpenStax Anatomy and Physiology 2e, §§22.1–22.4; source geometry: Z-Anatomy.";
  }
  if (m.layer === "cartilage" && /meniscus/.test(name)) {
    kind = "Fibrocartilaginous meniscus";
    fn =
      "Distributes load across the tibiofemoral joint and improves congruence and stability. Menisci are wedge-shaped fibrocartilage, distinct from the thin hyaline articular cartilage coating bone surfaces.";
    level = "overview";
    note =
      "Peripheral and inner meniscal regions differ in vascular supply. The illustration does not establish the healing potential or treatment of a particular tear.";
    curatedSource =
      "OpenStax Anatomy and Physiology 2e, §9.6 Anatomy of Selected Synovial Joints; source geometry: Z-Anatomy.";
  }
  if (m.system === "lymphatic" && /node/i.test(name))
    note =
      "Regional groups may contain several nodes in one source object. No individual-node segmentation or fine vessel network is inferred.";
  if (/nucleus pulposus/.test(name)) {
    kind = "Gelatinous disc core";
    fn =
      "Hydrated, proteoglycan-rich core that transmits compressive loads within the intervertebral disc. It is surrounded by the fibrocartilaginous annulus; it is not hyaline cartilage.";
    level = "overview";
    note =
      "The fibrocartilage tissue link refers to the surrounding annulus, not to the nucleus itself.";
    curatedSource =
      "OpenStax Anatomy and Physiology 2e, vertebral column and intervertebral-joint anatomy (chapters 7 and 9).";
  }
  if (/falx cerebri|tentorium cerebelli/.test(name)) {
    kind = "Dural fold";
    fn =
      "A tough connective-tissue reflection of cranial dura that partitions and supports parts of the brain. It is neither cartilage nor neural tissue.";
    level = "overview";
    curatedSource =
      "OpenStax Anatomy and Physiology 2e, cranial meninges (chapter 13).";
  }
  if (/(?:superior|inferior) tarsus/.test(name)) {
    kind = "Eyelid tarsal plate";
    fn =
      "Dense connective-tissue support that gives the eyelid shape and houses tarsal glands. It is not cartilage, a foot bone, or a contracting skeletal muscle.";
    level = "overview";
    curatedSource =
      "OpenStax Anatomy and Physiology 2e, accessory eye anatomy (chapter 14).";
  }
  if (isBone && /tooth|incisor|canine|premolar|molar/.test(name))
    kind = "Tooth";
  const archive = readingFor(m.id);
  const definition = definitionFor(m.id);
  if (level === "identification" && archive) {
    const overview =
      archive.sections.find((section) =>
        /^function|^action/i.test(section.heading),
      ) ||
      archive.sections.find((section) => section.heading === "Identification");
    if (overview) {
      fn = overview.text;
      note =
        "Archived anatomical reference; structure-specific clinical or attachment validation is not implied.";
      curatedSource = `Wikipedia contributors; ${archive.url}; archived/adapted by Z-Anatomy, CC BY-SA 4.0. Article history and adaptation notes are retained in the reference panel.`;
    }
  } else if (level === "identification" && definition) {
    fn = definition.definition;
    note =
      "Published anatomical term definition, not a complete human attachment or innervation entry.";
    curatedSource = `Uberon ${definition.id}, CC BY 3.0. Definition citations and source link are retained in the reference panel.`;
  }
  const boneNote = isBone ? boneNoteFor(m.name) : undefined;
  if (boneNote && !known) {
    fn = boneNote.function;
    level = "overview";
  }
  const family = known?.name || table?.name || action?.[0] || m.name;
  const guideKey = Object.keys(boneGuides).find((k) => name.includes(k));
  const result: ModelStudy = {
    ...known,
    id: "model:" + m.id,
    name: m.name,
    aliases: known?.aliases || [],
    system: m.system,
    region: getRegion(m),
    location:
      boneNote?.location ||
      connective?.location ||
      known?.location ||
      getRegion(m) +
        ". See this structure in its original registered position using “Back to body”.",
    function: fn,
    features:
      connective?.features ||
      known?.features ||
      note ||
      "A separately selectable Z-Anatomy surface; display colors are illustrative. Source-authored tissue regions are distinguished from separately modeled structures.",
    description:
      known?.description ||
      note ||
      "This model represents anatomy from one adult male reference. It is optimized for interactive study and is not a diagnostic or surgical model.",
    landmarks: boneNote?.landmarks || known?.landmarks,
    articulations: boneNote?.articulations || known?.articulations,
    attachments: boneNote?.attachments || known?.attachments,
    origin: connective?.origin || known?.origin || table?.origin,
    insertion: connective?.insertion || known?.insertion || table?.insertion,
    actions: known?.actions || table?.actions,
    source:
      (boneNote
        ? "OpenStax Anatomy and Physiology 2e, §§7.2–8.4 (bones, landmarks, joints) and §§11.3–11.6 (representative muscle attachments). Text guides are distinct from source-anchored 3D points."
        : "") ||
      curatedSource ||
      known?.source ||
      table?.source ||
      (level === "overview"
        ? "Introductory anatomy summary: OpenStax Anatomy and Physiology 2e, chapters 7–11. Geometry: Z-Anatomy, derived in part from BodyParts3D."
        : "Z-Anatomy / BodyParts3D; source identification and general-role coverage."),
    kind,
    family,
    detailLevel: level,
    landmarkGuide: guideKey ? boneGuides[guideKey] : [],
  };
  studyCache.set(m.id, result);
  return result;
}
export function resolveStructure(id: string) {
  return (
    structures.find((s) => s.id === id) ||
    (id.startsWith("model:")
      ? (() => {
          const m = modelParts.find((m) => m.id === id.slice(6));
          return m ? getModelStudy(m) : undefined;
        })()
      : undefined)
  );
}
export function modelMatchesStudy(m: ModelPart, studyId: string) {
  const s = structures.find((s) => s.id === studyId);
  return (
    m.layer !== "attachment" &&
    !m.parentId &&
    !!s &&
    getModelStudy(m).family === s.name
  );
}
