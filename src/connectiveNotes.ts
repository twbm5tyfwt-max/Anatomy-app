export type ConnectiveNote = {
  match: RegExp;
  function: string;
  location: string;
  features: string;
  origin?: string;
  insertion?: string;
};
export const connectiveNotes: ConnectiveNote[] = [
  {
    match: /anterior cruciate ligament/i,
    function:
      "Restrains anterior translation of the tibia relative to the femur and contributes to rotational stability of the knee.",
    location:
      "Inside the knee joint capsule, between anterior intercondylar tibia and the medial surface of the lateral femoral condyle.",
    features:
      "Crosses the posterior cruciate ligament. Intracapsular and extrasynovial; it is not the patellar ligament.",
    origin: "Anterior intercondylar area of the tibia.",
    insertion: "Medial surface of the lateral femoral condyle.",
  },
  {
    match: /posterior cruciate ligament/i,
    function:
      "Restrains posterior translation of the tibia relative to the femur and contributes to knee stability.",
    location:
      "Between posterior intercondylar tibia and the lateral surface of the medial femoral condyle.",
    features:
      "Crosses the ACL; typically stronger than the ACL. Intracapsular and extrasynovial.",
    origin: "Posterior intercondylar area of the tibia.",
    insertion: "Lateral surface of the medial femoral condyle.",
  },
  {
    match: /patellar ligament/i,
    function:
      "Transmits quadriceps force from the patella to the tibia to extend the knee.",
    location: "Anterior knee, from the patellar apex to the tibial tuberosity.",
    features:
      "A continuation of the quadriceps extensor apparatus; distinct from the cruciate ligaments.",
    origin: "Apex and adjacent margins of the patella.",
    insertion: "Tibial tuberosity.",
  },
  {
    match: /annular ligament of radius/i,
    function:
      "Holds the radial head against the radial notch while allowing pronation and supination.",
    location:
      "Encircles the radial head, attaching to anterior and posterior margins of the ulnar radial notch.",
    features:
      "A ring-shaped ligament, not the articular circumference of the radius itself.",
  },
  {
    match: /anterior longitudinal ligament/i,
    function:
      "Limits excessive vertebral extension and supports the anterior spinal column.",
    location:
      "Along anterior surfaces of vertebral bodies and intervertebral discs.",
    features: "Broad longitudinal band anterior to the vertebral bodies.",
  },
  {
    match: /posterior longitudinal ligament/i,
    function:
      "Helps resist excessive spinal flexion and supports the posterior surfaces of bodies and discs.",
    location:
      "Inside the vertebral canal, along posterior surfaces of vertebral bodies.",
    features:
      "Anterior wall of the vertebral canal; distinct from the ligamenta flava posteriorly.",
  },
  {
    match: /ligamentum flavum|ligamenta flava/i,
    function:
      "Joins adjacent laminae, helps limit flexion, and elastically recoils toward an upright posture.",
    location:
      "Between laminae of neighboring vertebrae, along the posterior vertebral canal.",
    features:
      "Rich in elastic fibers; the yellow color in the name describes its elastic-tissue content.",
  },
  {
    match: /transverse ligament of atlas/i,
    function:
      "Holds the dens against the anterior arch of C1 and stabilizes the median atlanto-axial articulation.",
    location:
      "Between the medial aspects of the C1 lateral masses, posterior to the dens.",
    features: "Part of the cruciform ligament; it is not the dens itself.",
  },
  {
    match: /sacrospinous ligament/i,
    function:
      "Stabilizes the sacrum and helps convert the sciatic notches into foramina with the sacrotuberous ligament.",
    location: "From lateral sacrum/coccyx toward the ischial spine.",
    features:
      "Deep to the sacrotuberous ligament; attaches at the ischial spine, not the tuberosity.",
  },
  {
    match: /sacrotuberous ligament/i,
    function:
      "Helps stabilize the sacrum and contributes to the boundaries of the sciatic foramina.",
    location:
      "From the sacral/posterior iliac region toward the ischial tuberosity.",
    features:
      "Broad ligament to the ischial tuberosity, superficial to the sacrospinous ligament.",
  },
  {
    match: /fibular collateral ligament/i,
    function: "Resists varus stress and helps stabilize the lateral knee.",
    location: "From the lateral femoral epicondyle to the fibular head.",
    features:
      "Cord-like and separate from the lateral meniscus; also called the lateral collateral ligament.",
  },
  {
    match: /tibial collateral ligament/i,
    function: "Resists valgus stress and helps stabilize the medial knee.",
    location:
      "From medial femoral epicondylar region to proximal medial tibia.",
    features:
      "A broad ligament with deep attachments related to the medial meniscus; also called the medial collateral ligament.",
  },
];
