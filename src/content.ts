export type Region = "Head & neck" | "Torso" | "Upper limbs" | "Lower limbs";
export type Structure = {
  id: string;
  name: string;
  aliases: string[];
  system: string;
  region: Region;
  location: string;
  function: string;
  features: string;
  description: string;
  tip?: string;
  origin?: string;
  insertion?: string;
  actions?: string;
  innervation?: string;
  landmarks?: string;
  articulations?: string;
  attachments?: string;
  parts?: string;
  tissues?: string;
  route?: string;
  supply?: string;
  source: string;
};
export const systems = [
  {
    id: "integumentary",
    name: "Integumentary",
    color: "#b98e73",
    overview:
      "The skin and its accessory structures form the body’s external barrier, limit water loss, support sensation, and help regulate temperature.",
    structures: "Skin, hair, nails, sweat glands, sebaceous glands",
    connections:
      "Cutaneous vessels help the cardiovascular system regulate heat. Skin begins vitamin D synthesis, supporting skeletal calcium homeostasis.",
    chapter: 5,
  },
  {
    id: "skeletal",
    name: "Skeletal",
    color: "#ad9e7f",
    overview:
      "Bones, cartilage, joints, and ligaments support and protect the body. Bones act as levers, store minerals, and house blood-forming marrow.",
    structures: "Skull, vertebral column, ribs, sternum, limb bones, cartilage",
    connections:
      "Skeletal muscles pull on bones to create movement. Bone marrow produces the blood cells used by cardiovascular and immune systems.",
    chapter: 6,
  },
  {
    id: "muscular",
    name: "Muscular",
    color: "#c77e72",
    overview:
      "Skeletal muscles produce voluntary movement, stabilize joints, maintain posture, and generate heat. Muscles move bones by pulling through tendons.",
    structures: "Skeletal muscles and their tendons",
    connections:
      "Motor neurons trigger contraction. Bones and joints form the levers; the cardiovascular system delivers oxygen and metabolic fuel.",
    chapter: 11,
  },
  {
    id: "nervous",
    name: "Nervous",
    color: "#c2a653",
    overview:
      "The brain, spinal cord, and peripheral nerves rapidly receive, process, and transmit information using electrical and chemical signals.",
    structures: "Brain, spinal cord, peripheral nerves, sensory receptors",
    connections:
      "Motor output controls muscles; autonomic pathways regulate visceral organs. The hypothalamus links neural and endocrine regulation.",
    chapter: 12,
  },
  {
    id: "endocrine",
    name: "Endocrine",
    color: "#b394b2",
    overview:
      "Endocrine glands release hormones into the blood to coordinate growth, metabolism, stress responses, reproduction, and fluid balance.",
    structures:
      "Pituitary, thyroid, parathyroids, adrenal glands, pancreatic islets, gonads",
    connections:
      "The cardiovascular system carries hormones. Endocrine signals regulate kidney water balance, bone remodeling, and reproductive function.",
    chapter: 17,
  },
  {
    id: "cardiovascular",
    name: "Cardiovascular",
    color: "#bb7379",
    overview:
      "The heart pumps blood through vessels to distribute oxygen, nutrients, hormones, and heat and to transport metabolic wastes.",
    structures: "Heart, arteries, capillaries, veins, blood",
    connections:
      "Lungs oxygenate blood; kidneys regulate its volume and composition. Capillary exchange supports every living tissue.",
    chapter: 19,
  },
  {
    id: "lymphatic",
    name: "Lymphatic & immune",
    color: "#92a179",
    overview:
      "Lymphatic vessels return excess interstitial fluid to the circulation. Lymphoid organs and immune cells detect and respond to pathogens.",
    structures: "Lymphatic vessels, lymph nodes, spleen, thymus, tonsils",
    connections:
      "Lymph returns to the venous circulation. Intestinal lacteals absorb dietary fats, and immune cells patrol tissues throughout the body.",
    chapter: 21,
  },
  {
    id: "respiratory",
    name: "Respiratory",
    color: "#829fac",
    overview:
      "Airways conduct air to the lungs. Gas exchange at alveoli brings oxygen into blood and removes carbon dioxide; ventilation also helps regulate blood pH.",
    structures: "Nasal cavity, pharynx, larynx, trachea, bronchi, lungs",
    connections:
      "The cardiovascular system transports respiratory gases. The diaphragm and other skeletal muscles generate the pressure changes of ventilation.",
    chapter: 22,
  },
  {
    id: "digestive",
    name: "Digestive",
    color: "#bc9663",
    overview:
      "The alimentary canal and accessory organs break down food, absorb nutrients and water, and eliminate indigestible residues.",
    structures:
      "Mouth, esophagus, stomach, intestines, liver, gallbladder, pancreas",
    connections:
      "Absorbed nutrients enter blood or lymph. The liver processes nutrients; autonomic and endocrine signals coordinate digestion.",
    chapter: 23,
  },
  {
    id: "urinary",
    name: "Urinary",
    color: "#bb9273",
    overview:
      "The kidneys filter plasma and adjust water, electrolytes, and acid–base balance. Urine travels through ureters to the bladder and leaves through the urethra.",
    structures: "Kidneys, ureters, urinary bladder, urethra",
    connections:
      "Renal regulation maintains blood volume and pressure. Kidneys also release erythropoietin and activate vitamin D.",
    chapter: 25,
  },
  {
    id: "reproductive",
    name: "Reproductive",
    color: "#a890aa",
    overview:
      "Male and female reproductive organs produce gametes and sex hormones. Female organs also support fertilization, gestation, and birth.",
    structures:
      "Testes, ducts, penis, accessory glands; ovaries, uterine tubes, uterus, vagina",
    connections:
      "Pituitary hormones regulate gonadal activity. Sex hormones influence bone, muscle, and many other tissues.",
    chapter: 27,
  },
];
const data: Omit<Structure, "source">[] = [];
function muscle(
  id: string,
  name: string,
  region: Region,
  location: string,
  origin: string,
  insertion: string,
  actions: string,
  innervation: string,
  features: string,
  tip?: string,
  aliases: string[] = [],
) {
  data.push({
    id,
    name,
    aliases,
    system: "muscular",
    region,
    location,
    origin,
    insertion,
    actions,
    innervation,
    function: actions,
    features,
    description: `${name} is a skeletal muscle. Its attachments and line of pull explain its actions at the joints it crosses.`,
    tip,
  });
}
muscle(
  "pectoralis-major",
  "Pectoralis major",
  "Torso",
  "Superficial anterior chest; forms the anterior axillary fold.",
  "Medial clavicle, sternum, and upper costal cartilages.",
  "Lateral lip of the intertubercular sulcus of the humerus.",
  "Adducts and medially rotates the arm; the clavicular head assists shoulder flexion.",
  "Lateral and medial pectoral nerves (C5–T1).",
  "Large fan-shaped muscle superficial to pectoralis minor.",
  "Think “bring your arms in for a hug.”",
  ["Pecs"],
);
muscle(
  "deltoid",
  "Deltoid",
  "Upper limbs",
  "Superficial shoulder, covering the glenohumeral joint.",
  "Lateral third of clavicle, acromion, and spine of scapula.",
  "Deltoid tuberosity of the humerus.",
  "Middle fibers abduct the arm; anterior fibers flex and medially rotate; posterior fibers extend and laterally rotate.",
  "Axillary nerve (C5–C6).",
  "Triangular shoulder cap with anterior, middle, and posterior fiber groups.",
  "The middle deltoid lifts the arm away from your side.",
);
muscle(
  "biceps-brachii",
  "Biceps brachii",
  "Upper limbs",
  "Anterior compartment of the arm, superficial to brachialis.",
  "Short head: coracoid process. Long head: supraglenoid tubercle of scapula.",
  "Radial tuberosity and forearm fascia through the bicipital aponeurosis.",
  "Supinates the forearm and flexes the elbow; assists shoulder flexion.",
  "Musculocutaneous nerve (C5–C6).",
  "Two proximal heads; distal tendon attaches to the radius.",
  "Biceps turns a screwdriver into supination.",
  ["Biceps"],
);
muscle(
  "triceps-brachii",
  "Triceps brachii",
  "Upper limbs",
  "Posterior compartment of the arm.",
  "Long head: infraglenoid tubercle of scapula. Other heads: posterior humerus above and below the radial groove.",
  "Olecranon of the ulna.",
  "Extends the elbow; the long head also assists shoulder extension and adduction.",
  "Radial nerve (C6–C8).",
  "Three heads converge on a common tendon.",
);
muscle(
  "brachialis",
  "Brachialis",
  "Upper limbs",
  "Anterior arm, deep to biceps brachii.",
  "Distal half of anterior humerus.",
  "Coronoid process and tuberosity of the ulna.",
  "Flexes the elbow regardless of forearm rotation.",
  "Musculocutaneous nerve (C5–C6), with a small radial nerve contribution.",
  "Inserts on the ulna rather than the radius.",
);
muscle(
  "brachioradialis",
  "Brachioradialis",
  "Upper limbs",
  "Superficial lateral forearm.",
  "Lateral supracondylar ridge of humerus.",
  "Lateral distal radius near its styloid process.",
  "Flexes the elbow most effectively with the forearm in a neutral position.",
  "Radial nerve (C5–C7).",
  "Runs from the lateral arm to the distal radius.",
);
muscle(
  "sternocleidomastoid",
  "Sternocleidomastoid",
  "Head & neck",
  "Superficial anterolateral neck.",
  "Manubrium of sternum and medial clavicle.",
  "Mastoid process of temporal bone and lateral superior nuchal line.",
  "Unilateral: ipsilateral lateral flexion and contralateral head rotation. Bilateral: neck flexion.",
  "Spinal accessory nerve (CN XI), with cervical proprioceptive fibers.",
  "Two inferior heads form a visible V above the sternum.",
  "Sterno + cleido + mastoid names its attachments.",
  ["SCM"],
);
muscle(
  "masseter",
  "Masseter",
  "Head & neck",
  "Lateral face, over the ramus of the mandible.",
  "Zygomatic arch.",
  "Lateral surface of mandibular ramus and angle.",
  "Elevates the mandible during chewing.",
  "Masseteric branch of mandibular division of trigeminal nerve (CN V3).",
  "Thick muscle palpable when clenching the teeth.",
);
muscle(
  "rectus-abdominis",
  "Rectus abdominis",
  "Torso",
  "Anterior abdominal wall, on either side of the linea alba.",
  "Pubic crest and pubic symphysis.",
  "Xiphoid process and costal cartilages of ribs 5–7.",
  "Flexes the trunk and compresses abdominal contents.",
  "Thoracoabdominal nerves (T6–T12).",
  "Paired vertical muscles divided by tendinous intersections.",
  "Rectus means straight.",
  ["Abdominals"],
);
muscle(
  "external-oblique",
  "External oblique",
  "Torso",
  "Superficial lateral and anterior abdominal wall.",
  "External surfaces of ribs 5–12.",
  "Linea alba, pubic tubercle, and anterior iliac crest.",
  "Compresses the abdomen; flexes trunk bilaterally and rotates trunk contralaterally.",
  "Thoracoabdominal and subcostal nerves (T7–T12).",
  "Fibers run inferomedially, like hands in pockets.",
);
muscle(
  "serratus-anterior",
  "Serratus anterior",
  "Torso",
  "Lateral thoracic wall, between ribs and scapula.",
  "External surfaces of upper eight or nine ribs.",
  "Anterior surface of medial border of scapula.",
  "Protracts and upwardly rotates the scapula; holds it against the thoracic wall.",
  "Long thoracic nerve (C5–C7).",
  "Serrated slips on lateral ribs.",
);
muscle(
  "trapezius",
  "Trapezius",
  "Torso",
  "Superficial posterior neck and upper back.",
  "Occipital bone, nuchal ligament, and spinous processes C7–T12.",
  "Lateral clavicle, acromion, and spine of scapula.",
  "Elevates, retracts, depresses, and upwardly rotates the scapula through different fiber groups.",
  "Spinal accessory nerve (CN XI), with C3–C4 proprioceptive fibers.",
  "Broad diamond-shaped paired muscle.",
);
muscle(
  "latissimus-dorsi",
  "Latissimus dorsi",
  "Torso",
  "Broad lower posterior trunk; forms the posterior axillary fold.",
  "Lower thoracic spinous processes, thoracolumbar fascia, iliac crest, and lower ribs.",
  "Floor of intertubercular sulcus of humerus.",
  "Extends, adducts, and medially rotates the arm.",
  "Thoracodorsal nerve (C6–C8).",
  "Broad flat muscle whose fibers converge toward the axilla.",
);
muscle(
  "sartorius",
  "Sartorius",
  "Lower limbs",
  "Superficial anterior thigh, crossing obliquely from lateral hip to medial knee.",
  "Anterior superior iliac spine.",
  "Medial proximal tibia at the pes anserinus.",
  "Flexes, abducts, and laterally rotates the hip; flexes the knee.",
  "Femoral nerve (L2–L3).",
  "Long straplike muscle crossing the thigh.",
  "The “tailor’s muscle” helps place the leg in a cross-legged position.",
);
muscle(
  "rectus-femoris",
  "Rectus femoris",
  "Lower limbs",
  "Central superficial anterior thigh; part of quadriceps femoris.",
  "Anterior inferior iliac spine and ilium above the acetabulum.",
  "Patella via quadriceps tendon, then tibial tuberosity via patellar ligament.",
  "Extends the knee and flexes the hip.",
  "Femoral nerve (L2–L4).",
  "The quadriceps component that crosses both hip and knee.",
);
muscle(
  "vastus-lateralis",
  "Vastus lateralis",
  "Lower limbs",
  "Lateral anterior thigh; part of quadriceps femoris.",
  "Greater trochanter and lateral lip of linea aspera.",
  "Patella via quadriceps tendon, then tibial tuberosity via patellar ligament.",
  "Extends the knee.",
  "Femoral nerve (L2–L4).",
  "Large lateral component of quadriceps.",
);
muscle(
  "tibialis-anterior",
  "Tibialis anterior",
  "Lower limbs",
  "Anterior compartment of the leg, just lateral to the tibial crest.",
  "Lateral tibial condyle, proximal lateral tibia, and interosseous membrane.",
  "Medial cuneiform and base of first metatarsal.",
  "Dorsiflexes and inverts the foot.",
  "Deep fibular nerve (L4–L5).",
  "Tendon passes across the anterior ankle to the medial foot.",
);
muscle(
  "gastrocnemius",
  "Gastrocnemius",
  "Lower limbs",
  "Superficial posterior calf.",
  "Medial and lateral condyles of femur.",
  "Calcaneus through the calcaneal (Achilles) tendon.",
  "Plantarflexes the ankle and flexes the knee.",
  "Tibial nerve (S1–S2).",
  "Two heads; crosses both knee and ankle.",
);
muscle(
  "soleus",
  "Soleus",
  "Lower limbs",
  "Posterior leg, deep to gastrocnemius.",
  "Posterior proximal fibula and soleal line of tibia.",
  "Calcaneus through the calcaneal tendon.",
  "Plantarflexes the ankle and helps maintain standing posture.",
  "Tibial nerve (S1–S2).",
  "Broad flat muscle that does not cross the knee.",
);
muscle(
  "gluteus-maximus",
  "Gluteus maximus",
  "Lower limbs",
  "Superficial buttock.",
  "Posterior ilium, sacrum, coccyx, and sacrotuberous ligament.",
  "Iliotibial tract and gluteal tuberosity of femur.",
  "Extends and laterally rotates the hip.",
  "Inferior gluteal nerve (L5–S2).",
  "Large superficial hip extensor, active when rising from a chair.",
);
function bone(
  id: string,
  name: string,
  region: Region,
  location: string,
  fn: string,
  landmarks: string,
  articulations: string,
  attachments: string,
  aliases: string[] = [],
) {
  data.push({
    id,
    name,
    region,
    location,
    function: fn,
    landmarks,
    articulations,
    attachments,
    aliases,
    system: "skeletal",
    features: landmarks,
    description: `${name} contributes to the skeletal framework. Its landmarks identify joint surfaces and the sites where soft tissues attach.`,
  });
}
bone(
  "frontal-bone",
  "Frontal bone",
  "Head & neck",
  "Anterior cranium, forming the forehead and roofs of the orbits.",
  "Protects the anterior brain and contributes to the orbits.",
  "Supraorbital margin, supraorbital foramen or notch, frontal sinus.",
  "Parietal bones, sphenoid, ethmoid, and several facial bones.",
  "Temporalis attaches partly along its temporal surface.",
);
bone(
  "temporal-bone",
  "Temporal bone",
  "Head & neck",
  "Lateral skull and cranial base.",
  "Protects structures of hearing and balance; contributes to the jaw joint.",
  "Mastoid process, styloid process, zygomatic process, mandibular fossa.",
  "Mandible, parietal, occipital, sphenoid, and zygomatic bones.",
  "Sternocleidomastoid attaches to the mastoid process.",
);
bone(
  "mandible",
  "Mandible",
  "Head & neck",
  "Lower facial skeleton.",
  "Supports lower teeth and moves in mastication.",
  "Body, ramus, angle, coronoid process, condylar process, mental foramen.",
  "Temporal bones at the temporomandibular joints.",
  "Masseter and medial pterygoid attach around the ramus and angle; temporalis to coronoid process.",
  ["Lower jaw"],
);
bone(
  "clavicle",
  "Clavicle",
  "Torso",
  "Horizontal S-shaped bone between sternum and scapula.",
  "Braces the shoulder away from the thorax and transmits upper-limb forces.",
  "Sternal end, acromial end, conoid tubercle.",
  "Manubrium at sternoclavicular joint; acromion at acromioclavicular joint.",
  "Pectoralis major, deltoid, trapezius, and sternocleidomastoid attach to it.",
  ["Collarbone"],
);
bone(
  "scapula",
  "Scapula",
  "Upper limbs",
  "Posterior thoracic wall, roughly over ribs 2–7.",
  "Provides the socket for the humeral head and attachment for shoulder muscles.",
  "Spine, acromion, coracoid process, glenoid cavity, supra- and infraspinous fossae.",
  "Humerus and clavicle.",
  "Rotator cuff muscles arise from the scapula; biceps attaches to coracoid process and supraglenoid tubercle.",
  ["Shoulder blade"],
);
bone(
  "sternum",
  "Sternum",
  "Torso",
  "Midline anterior thorax.",
  "Protects thoracic organs and anchors costal cartilages.",
  "Manubrium, sternal angle, body, xiphoid process.",
  "Clavicles and costal cartilages of ribs 1–7.",
  "Pectoralis major attaches anteriorly; diaphragm attaches to xiphoid process.",
  ["Breastbone"],
);
bone(
  "humerus",
  "Humerus",
  "Upper limbs",
  "Long bone of the arm, between shoulder and elbow.",
  "Acts as a lever for shoulder and elbow movements.",
  "Head, anatomical and surgical necks, greater and lesser tubercles, deltoid tuberosity, capitulum, trochlea.",
  "Scapula proximally; radius and ulna distally.",
  "Deltoid inserts at deltoid tuberosity; rotator cuff tendons attach to tubercles.",
);
bone(
  "radius",
  "Radius",
  "Upper limbs",
  "Lateral forearm in anatomical position, on the thumb side.",
  "Rotates around the ulna in pronation and supination and transmits wrist forces.",
  "Head, neck, radial tuberosity, styloid process.",
  "Humerus, ulna, scaphoid, and lunate.",
  "Biceps brachii inserts on the radial tuberosity.",
);
bone(
  "ulna",
  "Ulna",
  "Upper limbs",
  "Medial forearm in anatomical position.",
  "Provides the principal bony hinge at the elbow.",
  "Olecranon, trochlear notch, coronoid process, ulnar tuberosity, styloid process.",
  "Humerus and radius; separated from carpal bones by an articular disc.",
  "Triceps inserts on olecranon; brachialis inserts on coronoid process and tuberosity.",
);
bone(
  "femur",
  "Femur",
  "Lower limbs",
  "Thigh, between hip and knee.",
  "Transmits body weight and acts as a lever for the lower limb.",
  "Head, neck, greater and lesser trochanters, linea aspera, medial and lateral condyles.",
  "Hip bone, tibia, and patella.",
  "Gluteal muscles attach near greater trochanter and gluteal tuberosity; adductors along linea aspera.",
  ["Thigh bone"],
);
bone(
  "patella",
  "Patella",
  "Lower limbs",
  "Within the quadriceps tendon, anterior to knee joint.",
  "Improves the leverage of quadriceps and protects the anterior knee.",
  "Base, apex, posterior articular facets.",
  "Femur.",
  "Quadriceps tendon superiorly and patellar ligament inferiorly.",
  ["Kneecap"],
);
bone(
  "tibia",
  "Tibia",
  "Lower limbs",
  "Medial leg, between knee and ankle.",
  "Major weight-bearing bone of the leg.",
  "Medial and lateral condyles, tibial tuberosity, anterior crest, medial malleolus.",
  "Femur, fibula, and talus.",
  "Patellar ligament attaches to tibial tuberosity; sartorius attaches to proximal medial tibia.",
  ["Shinbone"],
);
bone(
  "fibula",
  "Fibula",
  "Lower limbs",
  "Lateral leg alongside the tibia.",
  "Provides muscle attachment and lateral ankle stability.",
  "Head, neck, shaft, lateral malleolus.",
  "Tibia and talus; does not articulate with femur.",
  "Fibularis muscles arise from its lateral surface.",
);
function organ(
  id: string,
  name: string,
  system: string,
  region: Region,
  location: string,
  fn: string,
  parts: string,
  tissues: string,
  features: string,
  aliases: string[] = [],
) {
  data.push({
    id,
    name,
    system,
    region,
    location,
    function: fn,
    parts,
    tissues,
    features,
    aliases,
    description: `${name} contributes to ${systems.find((s) => s.id === system)?.name.toLowerCase()} function. Its structure supports the role described here.`,
  });
}
organ(
  "skin",
  "Skin",
  "integumentary",
  "Torso",
  "Covers the external surface of the body.",
  "Forms a protective barrier, supports sensation, and participates in temperature regulation.",
  "Epidermis and dermis; hypodermis lies beneath the skin.",
  "Keratinized stratified squamous epithelium; areolar and dense irregular connective tissue.",
  "Avascular epidermis over a vascular connective-tissue dermis.",
  ["Integument"],
);
organ(
  "brain",
  "Brain",
  "nervous",
  "Head & neck",
  "Within the cranial cavity, enclosed by meninges.",
  "Integrates sensory input and coordinates motor output, cognition, and homeostasis.",
  "Cerebrum, diencephalon, brainstem, cerebellum.",
  "Neurons and neuroglia, arranged in gray and white matter.",
  "Cerebral gyri and sulci increase surface area.",
);
organ(
  "spinal-cord",
  "Spinal cord",
  "nervous",
  "Torso",
  "In the vertebral canal; ends around the L1–L2 vertebral level in adults.",
  "Conducts signals between brain and body and integrates spinal reflexes.",
  "Cervical and lumbar enlargements, gray matter horns, white matter columns.",
  "Nervous tissue with neurons and glial cells.",
  "Central gray matter surrounded by white matter.",
);
organ(
  "thyroid",
  "Thyroid gland",
  "endocrine",
  "Head & neck",
  "Anterior neck, below the larynx, with lobes on either side of the trachea.",
  "Produces thyroid hormones that regulate metabolism; parafollicular cells secrete calcitonin.",
  "Right and left lobes joined by an isthmus.",
  "Follicular epithelium surrounding colloid; parafollicular cells.",
  "Follicles store hormone precursor in extracellular colloid.",
);
organ(
  "pituitary",
  "Pituitary gland",
  "endocrine",
  "Head & neck",
  "In the sella turcica, connected to the hypothalamus.",
  "Coordinates several endocrine axes; posterior pituitary releases hypothalamic oxytocin and ADH.",
  "Anterior and posterior pituitary.",
  "Glandular epithelium anteriorly and neural tissue posteriorly.",
  "Linked to the hypothalamus by the infundibulum.",
  ["Hypophysis"],
);
organ(
  "heart",
  "Heart",
  "cardiovascular",
  "Torso",
  "In the middle mediastinum, between the lungs, mostly left of midline.",
  "Pumps blood through pulmonary and systemic circulations.",
  "Right and left atria; right and left ventricles; four valves.",
  "Cardiac muscle, endothelium, connective tissue, and conducting cells.",
  "Right ventricle pumps to lungs; left ventricle pumps to systemic circulation.",
);
data.push({
  id: "aorta",
  name: "Aorta",
  aliases: [],
  system: "cardiovascular",
  region: "Torso",
  location:
    "Begins at the left ventricle and descends through thorax and abdomen.",
  function:
    "Distributes oxygenated blood to the systemic arterial circulation.",
  features: "Largest artery; elastic walls accommodate pulsatile output.",
  description: "The aorta is the main systemic arterial trunk.",
  route:
    "Ascending aorta → aortic arch → descending thoracic aorta → abdominal aorta; bifurcates near L4.",
  supply:
    "Branches supply the heart and systemic tissues. Pulmonary arteries are a separate circulation.",
});
organ(
  "spleen",
  "Spleen",
  "lymphatic",
  "Torso",
  "Left upper abdominal quadrant, posterior to the stomach.",
  "Filters blood, removes aging erythrocytes, and supports immune responses to blood-borne antigens.",
  "Red pulp, white pulp, capsule, trabeculae.",
  "Reticular connective tissue, lymphocytes, macrophages, vascular sinuses.",
  "Filters blood, unlike lymph nodes which filter lymph.",
);
organ(
  "lymph-node",
  "Lymph node",
  "lymphatic",
  "Torso",
  "Along lymphatic vessels throughout the body.",
  "Filters lymph and provides sites for immune-cell activation.",
  "Cortex, paracortex, medulla, afferent and efferent lymphatic vessels.",
  "Lymphoid tissue on a reticular framework.",
  "Afferent lymph enters the convex surface; efferent lymph exits at the hilum.",
);
organ(
  "lungs",
  "Lungs",
  "respiratory",
  "Torso",
  "Paired organs in the pleural cavities of the thorax.",
  "Exchange oxygen and carbon dioxide between alveolar air and pulmonary capillary blood.",
  "Right lung has three lobes; left lung has two and a cardiac notch.",
  "Simple squamous alveolar epithelium, elastic connective tissue, airway epithelium.",
  "Alveoli provide a large, thin surface for gas diffusion.",
);
organ(
  "trachea",
  "Trachea",
  "respiratory",
  "Torso",
  "Anterior to the esophagus, from larynx to main bronchi.",
  "Conducts air and moves trapped particles toward the pharynx.",
  "C-shaped hyaline cartilage rings, trachealis muscle, mucosa.",
  "Pseudostratified ciliated columnar epithelium with goblet cells.",
  "Cartilage rings are open posteriorly.",
  ["Windpipe"],
);
organ(
  "stomach",
  "Stomach",
  "digestive",
  "Torso",
  "Left upper abdomen, between esophagus and duodenum.",
  "Stores and mixes food; begins substantial protein digestion with acid and pepsin.",
  "Cardia, fundus, body, pylorus.",
  "Simple columnar mucous epithelium, glands, three smooth-muscle layers.",
  "Rugae allow expansion; gastric pits open into glands.",
);
organ(
  "liver",
  "Liver",
  "digestive",
  "Torso",
  "Mostly right upper abdomen, beneath the diaphragm.",
  "Produces bile, processes nutrients, detoxifies substances, and synthesizes many plasma proteins.",
  "Right and left anatomical lobes; lobules with portal areas and central veins.",
  "Hepatocytes arranged in plates with blood sinusoids.",
  "Receives blood from hepatic portal vein and hepatic artery.",
);
organ(
  "kidneys",
  "Kidneys",
  "urinary",
  "Torso",
  "Retroperitoneal posterior abdomen; right kidney lies slightly lower than left.",
  "Regulate fluid, electrolytes, and pH; excrete wastes in urine.",
  "Cortex, medulla, renal pyramids, calyces, renal pelvis; functional units are nephrons.",
  "Renal epithelium, vascular glomeruli, interstitial connective tissue.",
  "Renal corpuscles are in cortex; loops of long nephrons extend into medulla.",
);
organ(
  "urinary-bladder",
  "Urinary bladder",
  "urinary",
  "Torso",
  "Pelvic cavity, posterior to pubic symphysis.",
  "Stores urine before micturition.",
  "Apex, body, trigone, neck; detrusor muscle.",
  "Transitional epithelium (urothelium) and smooth muscle.",
  "Urothelium accommodates stretching while maintaining a barrier.",
  ["Bladder"],
);
organ(
  "ovaries",
  "Ovaries",
  "reproductive",
  "Torso",
  "Paired gonads in the lateral pelvic cavity.",
  "Produce oocytes, estrogens, and progesterone.",
  "Cortex with follicles; vascular medulla.",
  "Follicular cells, oocytes, connective tissue.",
  "Follicles contain developing oocytes.",
);
organ(
  "uterus",
  "Uterus",
  "reproductive",
  "Torso",
  "Pelvis, usually between bladder and rectum.",
  "Supports implantation and fetal development; contracts during childbirth.",
  "Fundus, body, cervix; endometrium, myometrium, perimetrium.",
  "Endometrial epithelium and glands; thick smooth-muscle myometrium.",
  "Endometrium changes during the menstrual cycle.",
  ["Womb"],
);
organ(
  "testes",
  "Testes",
  "reproductive",
  "Torso",
  "Paired male gonads within the scrotum.",
  "Produce sperm in seminiferous tubules and testosterone in interstitial cells.",
  "Seminiferous tubules, rete testis, interstitial tissue.",
  "Germinal epithelium with Sertoli cells; interstitial Leydig cells.",
  "Spermatogenesis occurs within seminiferous tubules.",
  ["Testicles"],
);
export const structures: Structure[] = data.map((d) => ({
  ...d,
  source: `OpenStax Anatomy and Physiology 2e, chapter ${d.system === "skeletal" ? (d.region === "Head & neck" || d.region === "Torso" ? 7 : 8) : d.id === "brain" || d.id === "spinal-cord" ? 13 : d.id === "aorta" ? 20 : systems.find((s) => s.id === d.system)!.chapter}`,
}));
export const regions: Region[] = [
  "Head & neck",
  "Torso",
  "Upper limbs",
  "Lower limbs",
];
export type Tissue = {
  id: string;
  name: string;
  class: "Epithelial" | "Connective" | "Muscle" | "Nervous";
  location: string;
  function: string;
  clues: string;
  features: string[];
  compare: string;
  kind: string;
  image?: string;
};
const t = (
  id: string,
  name: string,
  cl: Tissue["class"],
  location: string,
  fn: string,
  clues: string,
  features: string[],
  compare: string,
  kind: string,
  image?: string,
): Tissue => ({
  id,
  name,
  class: cl,
  location,
  function: fn,
  clues,
  features,
  compare,
  kind,
  image,
});
export const tissues: Tissue[] = [
  t(
    "simple-squamous",
    "Simple squamous",
    "Epithelial",
    "Alveoli, vascular endothelium, serous membranes.",
    "Rapid diffusion and filtration; reduces friction.",
    "One layer of very flat cells with flattened nuclei.",
    ["Flat cell", "Flattened nucleus", "Basement membrane"],
    "Simple cuboidal cells are taller with round central nuclei.",
    "squamous",
  ),
  t(
    "simple-cuboidal",
    "Simple cuboidal",
    "Epithelial",
    "Kidney tubules and small gland ducts.",
    "Absorption and secretion.",
    "One layer of roughly cube-shaped cells with central round nuclei.",
    ["Cuboidal cell", "Central nucleus", "Basement membrane"],
    "Simple squamous is flatter; stratified cuboidal has multiple layers.",
    "cuboidal",
  ),
  t(
    "simple-columnar",
    "Simple columnar",
    "Epithelial",
    "Stomach and intestines; ciliated forms in uterine tubes.",
    "Absorption and secretion; cilia move material in ciliated variants.",
    "One layer of tall cells with oval nuclei near the basal surface.",
    ["Columnar cell", "Basal nucleus", "Goblet cell", "Basement membrane"],
    "Pseudostratified tissue has nuclei at different heights; all its cells still contact the basement membrane.",
    "columnar",
  ),
  t(
    "pseudostratified",
    "Pseudostratified ciliated columnar",
    "Epithelial",
    "Much of the conducting respiratory tract, including trachea.",
    "Secretes mucus and moves it with cilia.",
    "Nuclei at different heights; all cells contact the basement membrane, though not all reach the lumen.",
    ["Cilia", "Goblet cell", "Nuclei at varied heights", "Basement membrane"],
    "Stratified columnar truly has multiple layers; pseudostratified is a single layer.",
    "pseudo",
  ),
  t(
    "keratinized",
    "Stratified squamous, keratinized",
    "Epithelial",
    "Epidermis of the skin.",
    "Resists abrasion and limits water loss.",
    "Multiple cell layers; surface cells are flattened, dead, and keratin-filled.",
    [
      "Keratin layer",
      "Flattened surface cells",
      "Basal cells",
      "Basement membrane",
    ],
    "Nonkeratinized surfaces retain nuclei and lack the dry keratin layer.",
    "keratin",
  ),
  t(
    "nonkeratinized",
    "Stratified squamous, nonkeratinized",
    "Epithelial",
    "Oral cavity, esophagus, and vagina.",
    "Protects moist surfaces from abrasion.",
    "Multiple layers with flattened, nucleated surface cells.",
    [
      "Surface nuclei",
      "Flattened surface cells",
      "Basal cells",
      "Basement membrane",
    ],
    "Keratinized epithelium has an anucleate surface keratin layer.",
    "stratified",
  ),
  t(
    "stratified-cuboidal",
    "Stratified cuboidal",
    "Epithelial",
    "Larger sweat gland ducts and some other gland ducts.",
    "Protection with limited secretion and absorption.",
    "Usually two layers of cuboidal cells around a lumen.",
    ["Two cell layers", "Round nuclei", "Lumen", "Basement membrane"],
    "Simple cuboidal has only one cell layer.",
    "stratified-cube",
  ),
  t(
    "stratified-columnar",
    "Stratified columnar",
    "Epithelial",
    "Parts of the male urethra and some large gland ducts.",
    "Protection and secretion.",
    "Multiple layers, with tall columnar cells at the free surface.",
    ["Columnar surface cells", "Basal cells", "Basement membrane"],
    "Classify by the shape of surface cells, not basal cells.",
    "stratified-column",
  ),
  t(
    "transitional",
    "Transitional epithelium",
    "Epithelial",
    "Renal calyces, ureters, urinary bladder, and proximal urethra.",
    "Allows distension while maintaining a urine barrier.",
    "Multiple layers with large dome-shaped surface cells when relaxed.",
    ["Umbrella cell", "Multiple layers", "Basement membrane"],
    "Stratified squamous has flatter surface cells; transitional surface shape changes with distension.",
    "transitional",
  ),
  t(
    "areolar",
    "Areolar connective tissue",
    "Connective",
    "Beneath epithelia and around vessels and organs.",
    "Wraps and cushions tissues; permits diffusion and supports immune defense.",
    "Loose collagen and elastic fibers with abundant ground substance.",
    ["Collagen fiber", "Elastic fiber", "Fibroblast", "Ground substance"],
    "Dense irregular has thicker, more tightly packed collagen bundles.",
    "loose",
  ),
  t(
    "adipose",
    "Adipose tissue",
    "Connective",
    "Hypodermis, around kidneys, and in other fat depots.",
    "Energy storage, insulation, cushioning, and endocrine signaling.",
    "Large adipocytes with lipid droplets; nuclei are displaced to the edge.",
    ["Adipocyte", "Peripheral nucleus", "Lipid droplet"],
    "Areolar tissue has conspicuous extracellular fibers and smaller cells.",
    "adipose",
  ),
  t(
    "reticular",
    "Reticular connective tissue",
    "Connective",
    "Stroma of lymph nodes, spleen, and bone marrow.",
    "Forms a supportive network for free cells.",
    "Delicate branching reticular fibers; often requires special stains to visualize.",
    ["Reticular fiber", "Immune cell", "Supporting network"],
    "Elastic tissue contains elastic fibers for recoil; reticular fibers form a supporting mesh.",
    "reticular",
  ),
  t(
    "dense-regular",
    "Dense regular connective tissue",
    "Connective",
    "Tendons, most ligaments, and aponeuroses.",
    "Resists strong tensile forces mainly along one axis.",
    "Parallel collagen bundles with flattened fibroblast nuclei between them.",
    ["Parallel collagen", "Fibroblast nucleus"],
    "Dense irregular bundles run in many directions.",
    "regular",
  ),
  t(
    "dense-irregular",
    "Dense irregular connective tissue",
    "Connective",
    "Reticular dermis, organ capsules, and periosteum.",
    "Resists tensile stress from multiple directions.",
    "Thick interwoven collagen bundles.",
    ["Collagen bundles", "Fibroblast", "Variable fiber directions"],
    "Dense regular fibers are predominantly parallel.",
    "irregular",
  ),
  t(
    "elastic",
    "Elastic connective tissue",
    "Connective",
    "Ligamenta flava and elastic ligaments; elastic tissue also occurs in large artery walls.",
    "Stretches and recoils.",
    "Abundant wavy elastic fibers or sheets.",
    ["Elastic fiber", "Fibroblast", "Recoil"],
    "Dense regular collagenous tissue resists stretch; elastic fibers permit reversible extension.",
    "elastic",
  ),
  t(
    "hyaline",
    "Hyaline cartilage",
    "Connective",
    "Articular surfaces, costal cartilages, nose, and tracheal rings.",
    "Supports and cushions; provides a low-friction joint surface.",
    "Chondrocytes in lacunae within a glassy matrix; fine collagen is not prominent on routine stains.",
    ["Chondrocyte", "Lacuna", "Glassy matrix"],
    "Elastic cartilage has visible elastic fibers; fibrocartilage has thick collagen bundles.",
    "cartilage",
  ),
  t(
    "elastic-cartilage",
    "Elastic cartilage",
    "Connective",
    "External ear and epiglottis.",
    "Maintains shape with flexibility.",
    "Chondrocytes in lacunae surrounded by an elastic-fiber network.",
    ["Lacuna", "Chondrocyte", "Elastic fibers"],
    "Hyaline cartilage lacks a conspicuous elastic-fiber network.",
    "elastic-cartilage",
  ),
  t(
    "fibrocartilage",
    "Fibrocartilage",
    "Connective",
    "Intervertebral discs, pubic symphysis, and knee menisci.",
    "Resists compression and tensile forces.",
    "Rows of chondrocytes in lacunae between thick collagen bundles.",
    ["Collagen bundle", "Chondrocyte", "Lacuna"],
    "Dense regular connective tissue lacks chondrocytes in lacunae.",
    "fibrocartilage",
  ),
  t(
    "compact-bone",
    "Compact bone",
    "Connective",
    "Dense outer portions of bones.",
    "Rigid support, protection, and mineral storage.",
    "Osteons with concentric lamellae surrounding central canals.",
    ["Central canal", "Lamellae", "Lacuna with osteocyte", "Canaliculi"],
    "Cartilage has lacunae but no osteons or vascular central canals.",
    "bone",
  ),
  t(
    "blood",
    "Blood",
    "Connective",
    "Heart chambers and blood vessels.",
    "Transports gases and solutes, provides immune defense, and supports clotting.",
    "Numerous anucleate erythrocytes, fewer nucleated leukocytes, and small platelets in plasma.",
    ["Erythrocyte", "Leukocyte", "Platelet", "Plasma"],
    "Blood has a fluid extracellular matrix rather than fixed fibers under normal conditions.",
    "blood",
  ),
  t(
    "skeletal-muscle",
    "Skeletal muscle",
    "Muscle",
    "Muscles attached to bones; also tongue and some sphincters.",
    "Voluntary movement, posture, and heat production.",
    "Long unbranched striated fibers with multiple peripheral nuclei.",
    ["Striations", "Peripheral nuclei", "Muscle fiber"],
    "Cardiac fibers branch and have central nuclei and intercalated discs.",
    "skeletal",
  ),
  t(
    "cardiac-muscle",
    "Cardiac muscle",
    "Muscle",
    "Myocardium of the heart.",
    "Pumps blood by involuntary rhythmic contraction.",
    "Branched striated cells, usually one central nucleus, and intercalated discs.",
    ["Intercalated disc", "Central nucleus", "Striations", "Branching cell"],
    "Skeletal muscle is unbranched and multinucleated; smooth muscle lacks striations.",
    "cardiac",
  ),
  t(
    "smooth-muscle",
    "Smooth muscle",
    "Muscle",
    "Walls of hollow viscera and blood vessels.",
    "Propels contents and regulates tube diameter.",
    "Spindle-shaped nonstriated cells with one central nucleus.",
    ["Spindle-shaped cell", "Central nucleus", "No striations"],
    "Skeletal and cardiac muscle both have visible striations.",
    "smooth",
  ),
  t(
    "neurons",
    "Neurons",
    "Nervous",
    "Brain, spinal cord, and peripheral ganglia and nerves.",
    "Receive and transmit information through electrical and chemical signals.",
    "Cell bodies with a prominent nucleus and processes extending from the soma.",
    ["Soma", "Nucleus", "Dendrite", "Axon"],
    "Glial cells generally have smaller nuclei and lack a conspicuous neuronal soma and long processes on routine sections.",
    "neuron",
  ),
  t(
    "glia",
    "Supporting glial cells",
    "Nervous",
    "Central and peripheral nervous systems.",
    "Support, protect, nourish, and, in specific types, myelinate neurons.",
    "Many small glial nuclei around larger neuronal cell bodies; subtype identification may require special stains.",
    ["Glial nucleus", "Neuron", "Supporting cells"],
    "Do not infer every glial subtype from a routine unlabeled section.",
    "glia",
  ),
];
export const directions = [
  ["Superior / inferior", "Toward the head / toward the feet."],
  ["Anterior / posterior", "Toward the front / toward the back."],
  ["Medial / lateral", "Toward / away from the midline."],
  ["Proximal / distal", "Closer to / farther from the limb’s attachment."],
  ["Superficial / deep", "Closer to / farther from the body surface."],
  ["Sagittal plane", "Divides the body into left and right portions."],
  ["Frontal plane", "Divides the body into anterior and posterior portions."],
  ["Transverse plane", "Divides the body into superior and inferior portions."],
  [
    "Flexion / extension",
    "Usually decreases / increases the angle at a joint.",
  ],
  ["Abduction / adduction", "Movement away from / toward the body’s midline."],
  [
    "Medial / lateral rotation",
    "Turns a limb toward / away from the midline around its long axis.",
  ],
  [
    "Pronation / supination",
    "Rotates the forearm so the palm faces posteriorly / anteriorly in anatomical position.",
  ],
  [
    "Dorsiflexion / plantarflexion",
    "Brings the top of the foot toward the leg / points the foot away.",
  ],
];
