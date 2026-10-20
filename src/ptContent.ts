// Educational PT/AT content. General education only: nothing here is a diagnosis,
// a prescription, or a personalised rehabilitation plan.
export const PT_CONTENT_WRITTEN = "2026-10-20";

export type PTSource = {
  id: string;
  org: string;
  title: string;
  url: string;
  kind: "patient education" | "clinical education" | "textbook";
};

// Links point to the organisations' public education pages. They could not be
// opened from the build environment (outbound access to these hosts is blocked), so
// each is shown as "not live-checked". Read the page's own "last reviewed" date.
export const ptSources: PTSource[] = [
  ["aaos-acl", "AAOS OrthoInfo", "Anterior cruciate ligament (ACL) injuries", "https://orthoinfo.aaos.org/en/diseases--conditions/anterior-cruciate-ligament-acl-injuries/"],
  ["aaos-meniscus", "AAOS OrthoInfo", "Meniscus tears", "https://orthoinfo.aaos.org/en/diseases--conditions/meniscus-tears/"],
  ["aaos-pfp", "AAOS OrthoInfo", "Patellofemoral pain syndrome", "https://orthoinfo.aaos.org/en/diseases--conditions/patellofemoral-pain-syndrome/"],
  ["aaos-knee-ex", "AAOS OrthoInfo", "Knee conditioning program", "https://orthoinfo.aaos.org/en/recovery/knee-conditioning-program/"],
  ["aaos-rc", "AAOS OrthoInfo", "Rotator cuff tears", "https://orthoinfo.aaos.org/en/diseases--conditions/rotator-cuff-tears/"],
  ["aaos-shoulder-ex", "AAOS OrthoInfo", "Rotator cuff and shoulder conditioning program", "https://orthoinfo.aaos.org/en/recovery/rotator-cuff-and-shoulder-conditioning-program/"],
  ["aaos-ankle", "AAOS OrthoInfo", "Sprained ankle", "https://orthoinfo.aaos.org/en/diseases--conditions/sprained-ankle/"],
  ["aaos-ankle-ex", "AAOS OrthoInfo", "Foot and ankle conditioning program", "https://orthoinfo.aaos.org/en/recovery/foot-and-ankle-conditioning-program/"],
  ["aaos-achilles", "AAOS OrthoInfo", "Achilles tendinitis", "https://orthoinfo.aaos.org/en/diseases--conditions/achilles-tendinitis/"],
  ["aaos-hamstring", "AAOS OrthoInfo", "Hamstring muscle injuries", "https://orthoinfo.aaos.org/en/diseases--conditions/hamstring-muscle-injuries/"],
  ["aaos-hip-ex", "AAOS OrthoInfo", "Hip conditioning program", "https://orthoinfo.aaos.org/en/recovery/hip-conditioning-program/"],
  ["aaos-fai", "AAOS OrthoInfo", "Femoroacetabular impingement", "https://orthoinfo.aaos.org/en/diseases--conditions/femoroacetabular-impingement/"],
  ["aaos-lbp", "AAOS OrthoInfo", "Low back pain", "https://orthoinfo.aaos.org/en/diseases--conditions/low-back-pain/"],
  ["aaos-spine-ex", "AAOS OrthoInfo", "Spine conditioning program", "https://orthoinfo.aaos.org/en/recovery/spine-conditioning-program/"],
  ["aaos-neck", "AAOS OrthoInfo", "Neck pain", "https://orthoinfo.aaos.org/en/diseases--conditions/neck-pain/"],
  ["aaos-neck-ex", "AAOS OrthoInfo", "Neck conditioning program", "https://orthoinfo.aaos.org/en/recovery/neck-conditioning-program/"],
  ["nhs-sprains", "NHS", "Sprains and strains", "https://www.nhs.uk/conditions/sprains-and-strains/"],
  ["nhs-back", "NHS", "Back pain", "https://www.nhs.uk/conditions/back-pain/"],
  ["nhs-frozen", "NHS", "Frozen shoulder", "https://www.nhs.uk/conditions/frozen-shoulder/"],
  ["openstax", "OpenStax / Rice University", "Anatomy and Physiology 2e (tissues, bone repair, muscle tissue chapters)", "https://openstax.org/books/anatomy-and-physiology-2e/pages/1-introduction"],
].map(([id, org, title, url]) => ({
  id,
  org,
  title,
  url,
  kind: org === "OpenStax / Rice University" ? "textbook" : org === "NHS" ? "patient education" : "patient education",
})) as PTSource[];

export type ExerciseType = "Mobility" | "Strength" | "Balance" | "Functional";

export type PTExercise = {
  id: string;
  name: string;
  type: ExerciseType;
  /** muscles / structures it loads, as plain names; also used for the muscle finder */
  targets: string[];
  purpose: string;
  steps: string[];
  mistakes: string[];
  precautions: string[];
  regression: string;
  progression: string;
  sources: string[];
};

export type PTInjury = {
  id: string;
  name: string;
  structures: string[];
  tissue: HealingTissue;
  what: string;
  context: string;
  goals: string[];
  seeClinician: string[];
  sources: string[];
};

export type HealingTissue =
  | "Muscle"
  | "Tendon"
  | "Ligament"
  | "Bone"
  | "Meniscus / cartilage";

export type PTRegion = {
  id: string;
  name: string;
  blurb: string;
  /** 3D structures: label + regexes matched against non-child, right-sided source names */
  structures: { label: string; match: string; role: string }[];
  /** model region key used to frame/isolate in the viewer */
  viewerRegion: string;
  injuries: PTInjury[];
  exercises: PTExercise[];
};

const commonFlags = [
  "Obvious deformity, a limb that cannot bear weight or be moved after an injury, or severe pain after a fall or impact",
  "Numbness, pins and needles, a cold/pale/blue limb, or new weakness",
  "Fever, a hot red swollen joint, or you feel generally unwell",
  "Symptoms that are worsening, not settling, or waking you at night",
];

export const ptRegions: PTRegion[] = [
  {
    id: "knee",
    name: "Knee",
    blurb:
      "A load-bearing hinge with some rotation. Stability comes from ligaments and menisci; movement control comes from the quadriceps, hamstrings, calf and hip muscles.",
    viewerRegion: "Knee",
    structures: [
      { label: "Quadriceps (rectus femoris, vasti)", match: "rectus femoris|vastus", role: "Extend the knee; absorb load on landing and stairs." },
      { label: "Hamstrings", match: "semitendinosus|semimembranosus|biceps femoris", role: "Flex the knee and extend the hip; resist forward shift of the tibia with the ACL." },
      { label: "Gastrocnemius", match: "gastrocnemius", role: "Crosses the knee and ankle; two heads form part of the calf." },
      { label: "Anterior cruciate ligament", match: "anterior cruciate", role: "Restrains forward translation of the tibia and rotation." },
      { label: "Posterior cruciate ligament", match: "posterior cruciate", role: "Restrains backward translation of the tibia." },
      { label: "Medial collateral (tibial collateral)", match: "tibial collateral", role: "Resists valgus (knock-knee) stress." },
      { label: "Lateral collateral (fibular collateral)", match: "fibular collateral", role: "Resists varus (bow-leg) stress." },
      { label: "Menisci", match: "^right (medial|lateral) meniscus$", role: "Fibrocartilage wedges that spread load and add congruity." },
      { label: "Patella and femur/tibia", match: "patella$|femur$|tibia$", role: "The bony framework; articular (hyaline) cartilage covers the contact surfaces." },
    ],
    injuries: [
      {
        id: "knee-acl",
        name: "ACL sprain / tear",
        structures: ["Anterior cruciate ligament", "Menisci"],
        tissue: "Ligament",
        what: "A stretch or rupture of the ligament that limits forward tibial translation and helps control rotation.",
        context: "Often described after pivoting, sudden deceleration or landing awkwardly. Meniscus or collateral ligament injury can occur at the same time.",
        goals: [
          "Protect the knee and settle swelling early",
          "Recover knee extension and flexion within what the clinician allows",
          "Restore quadriceps and hamstring strength and hip/trunk control",
          "Retrain landing, cutting and sport-specific tasks with objective readiness testing",
        ],
        seeClinician: ["The knee gave way, swelled quickly, or you felt or heard a pop", "The knee locks or cannot fully straighten", ...commonFlags],
        sources: ["aaos-acl", "aaos-knee-ex"],
      },
      {
        id: "knee-meniscus",
        name: "Meniscus injury",
        structures: ["Menisci"],
        tissue: "Meniscus / cartilage",
        what: "A tear or degeneration of the C-shaped fibrocartilage between femur and tibia. The outer rim has a blood supply; the inner portion has very little, which affects repair.",
        context: "Can follow a twist on a loaded knee, or develop gradually with age-related wear.",
        goals: [
          "Settle irritation and keep the knee moving",
          "Restore strength and control so load is shared well",
          "Return gradually to deep flexion, twisting and impact tasks as allowed",
        ],
        seeClinician: ["Locking, catching that stops movement, or a knee that will not straighten", ...commonFlags],
        sources: ["aaos-meniscus", "aaos-knee-ex"],
      },
      {
        id: "knee-pfp",
        name: "Patellofemoral pain",
        structures: ["Patella and femur/tibia", "Quadriceps (rectus femoris, vasti)"],
        tissue: "Meniscus / cartilage",
        what: "Pain around or behind the kneecap, usually load-related. It is a description of symptoms, not a single damaged structure.",
        context: "Commonly linked to a rise in running, jumping or stair load; hip and foot mechanics are sometimes part of the picture.",
        goals: [
          "Identify and temporarily adjust aggravating load",
          "Build quadriceps and hip strength progressively",
          "Return to the preferred activity with a gradual load plan",
        ],
        seeClinician: ["Swelling, giving way or locking", ...commonFlags],
        sources: ["aaos-pfp", "aaos-knee-ex"],
      },
      {
        id: "knee-mcl",
        name: "Medial collateral ligament sprain",
        structures: ["Medial collateral (tibial collateral)"],
        tissue: "Ligament",
        what: "Overstretching of the ligament on the inner knee, graded by how much of it is torn.",
        context: "Often follows a force to the outer knee or a planted foot with the knee collapsing inward.",
        goals: ["Protect from valgus stress while it settles", "Maintain motion and quadriceps activation", "Return to cutting and contact tasks gradually"],
        seeClinician: ["Marked instability or a gap felt on the inner knee", ...commonFlags],
        sources: ["nhs-sprains", "aaos-knee-ex"],
      },
    ],
    exercises: [
      {
        id: "knee-heel-slide",
        name: "Supported heel slide",
        type: "Mobility",
        targets: ["Knee flexion range", "Hamstrings", "Quadriceps"],
        purpose: "A gentle way to practise bending and straightening the knee in a comfortable, allowed range.",
        steps: [
          "Lie on your back or sit supported with the leg straight.",
          "Slowly slide the heel toward the buttock as far as is comfortable and permitted.",
          "Pause briefly, then slide back until the knee is as straight as allowed.",
        ],
        mistakes: ["Forcing the end of range", "Letting the knee drift inward or outward", "Lifting the hip to cheat the movement"],
        precautions: ["After surgery or a repair, bending limits may apply. Follow the surgeon's or therapist's limits.", "A knee that is locked or blocked should not be forced."],
        regression: "Smaller range, or use a strap or towel to assist.",
        progression: "Hold at end range, then a standing or seated knee-bend task as the clinician clears.",
        sources: ["aaos-knee-ex"],
      },
      {
        id: "knee-quad-set",
        name: "Quadriceps set (isometric)",
        type: "Strength",
        targets: ["Quadriceps", "Vastus medialis"],
        purpose: "Switches the thigh muscle on without moving the joint, often an early step when movement is limited.",
        steps: [
          "Sit or lie with the leg straight and a small rolled towel under the knee.",
          "Tighten the front-of-thigh muscle so the knee presses gently toward the towel.",
          "Hold briefly, relax, and repeat with steady breathing.",
        ],
        mistakes: ["Holding the breath", "Tightening the buttock instead of the thigh", "Pushing into pain"],
        precautions: ["Increasing pain or swelling afterwards is a signal to reduce and tell your clinician."],
        regression: "Lower effort, shorter holds.",
        progression: "Straight-leg raise, then short-arc and closed-chain strengthening when appropriate.",
        sources: ["aaos-knee-ex"],
      },
      {
        id: "knee-sit-stand",
        name: "Sit-to-stand",
        type: "Functional",
        targets: ["Quadriceps", "Gluteus maximus", "Hip and knee coordination"],
        purpose: "Practises one of the most common daily tasks and builds leg strength with body weight.",
        steps: [
          "Sit toward the front of a stable chair with feet about hip-width apart and slightly behind the knees.",
          "Lean forward from the hips and stand, keeping the knees tracking over the second toe.",
          "Sit back slowly with control.",
        ],
        mistakes: ["Letting the knees collapse inward", "Dropping into the chair", "Using an unstable or rolling chair"],
        precautions: ["Fall risk, dizziness, or weight-bearing limits may call for supervision or a different task."],
        regression: "Higher seat and use of the arms.",
        progression: "Lower seat, less arm help, slower lowering, or added load once cleared.",
        sources: ["aaos-knee-ex"],
      },
      {
        id: "knee-single-leg-balance",
        name: "Single-leg balance",
        type: "Balance",
        targets: ["Gluteus medius", "Ankle stabilisers", "Proprioception"],
        purpose: "Trains control of the whole leg, a component of landing and cutting tasks.",
        steps: [
          "Stand beside a counter with a clear space around you.",
          "Lift one foot a short distance and hold the position with a softly bent standing knee.",
          "Keep the pelvis level and the knee in line with the foot.",
        ],
        mistakes: ["Locking the knee", "Hitching the hip", "Closing the eyes before control is solid"],
        precautions: ["Keep a support within reach. Supervision is appropriate with fall risk or vestibular symptoms."],
        regression: "Fingertip support or a wider stance.",
        progression: "Hands free, eyes closed, or add reaching or ball tasks under supervision.",
        sources: ["aaos-knee-ex"],
      },
    ],
  },
  {
    id: "shoulder",
    name: "Shoulder",
    blurb:
      "The most mobile joint. The shallow glenohumeral socket is kept centred mainly by the rotator cuff and the scapular muscles rather than by bony shape.",
    viewerRegion: "Shoulder",
    structures: [
      { label: "Supraspinatus", match: "supraspinatus", role: "Rotator cuff; starts arm elevation and compresses the humeral head." },
      { label: "Infraspinatus and teres minor", match: "infraspinatus|teres minor", role: "Rotator cuff; externally rotate the arm." },
      { label: "Subscapularis", match: "subscapularis", role: "Rotator cuff; internally rotates and stabilises the front of the joint." },
      { label: "Deltoid", match: "deltoid", role: "Main arm abductor once the arm is away from the side." },
      { label: "Trapezius and serratus anterior", match: "trapezius|serratus anterior", role: "Position and rotate the scapula." },
      { label: "Glenoid labrum", match: "glenoid labrum", role: "Fibrocartilage rim that deepens the socket." },
      { label: "Glenohumeral ligaments", match: "glenohumeral ligament", role: "Thickenings of the capsule that limit extreme motion." },
      { label: "Humerus, scapula, clavicle", match: "humerus$|scapula$|clavicle$", role: "The bony framework." },
    ],
    injuries: [
      {
        id: "sh-rc",
        name: "Rotator cuff-related shoulder pain / tear",
        structures: ["Supraspinatus", "Infraspinatus and teres minor", "Subscapularis"],
        tissue: "Tendon",
        what: "Pain or weakness from overloaded or torn cuff tendons. Pain alone does not show whether a tear is present.",
        context: "Can build up gradually with repetitive overhead work, or follow a fall or a sudden lift.",
        goals: ["Understand which positions and loads aggravate symptoms", "Maintain comfortable motion", "Build cuff and scapular capacity progressively", "Return to overhead or lifting tasks gradually"],
        seeClinician: ["Sudden weakness after a fall or lift", "Unable to lift the arm", ...commonFlags],
        sources: ["aaos-rc", "aaos-shoulder-ex"],
      },
      {
        id: "sh-labrum",
        name: "Labral injury / instability",
        structures: ["Glenoid labrum", "Glenohumeral ligaments"],
        tissue: "Meniscus / cartilage",
        what: "Damage to the rim of the socket or the capsule can allow the head of the humerus to move more than usual.",
        context: "May follow a dislocation or repeated overhead throwing.",
        goals: ["Protect the joint in vulnerable positions initially", "Restore dynamic stability through cuff and scapular control", "Gradual return to sport-specific loading"],
        seeClinician: ["A dislocation or the feeling the shoulder slipped out", "Repeated catching or clicking with pain", ...commonFlags],
        sources: ["aaos-shoulder-ex"],
      },
      {
        id: "sh-frozen",
        name: "Frozen shoulder (adhesive capsulitis)",
        structures: ["Glenohumeral ligaments"],
        tissue: "Ligament",
        what: "Pain with progressive loss of both active and passive motion as the capsule becomes stiff.",
        context: "Often has a gradual onset; it follows a long, variable course and is more common in some health conditions.",
        goals: ["Manage pain so movement can be maintained", "Keep gentle motion without forcing it", "Return function across stages as stiffness eases"],
        seeClinician: ["Progressive stiffness or night pain", ...commonFlags],
        sources: ["nhs-frozen"],
      },
    ],
    exercises: [
      {
        id: "sh-pendulum",
        name: "Pendulum (Codman)",
        type: "Mobility",
        targets: ["Glenohumeral joint", "Shoulder capsule"],
        purpose: "Lets the arm move passively in small circles with gravity while the muscles stay relaxed.",
        steps: [
          "Lean forward supporting yourself with the other hand on a stable surface.",
          "Let the arm hang loosely.",
          "Gently shift your body weight so the arm moves in small circles or back and forth.",
        ],
        mistakes: ["Swinging the arm actively with force", "Making large circles", "Holding the breath"],
        precautions: ["Not appropriate after some repairs or fractures unless your clinician includes it.", "Dizziness when bending forward: use a seated or supported variation."],
        regression: "Smaller movement and more trunk support.",
        progression: "Clinician-approved active-assisted, then active elevation.",
        sources: ["aaos-shoulder-ex"],
      },
      {
        id: "sh-er-band",
        name: "External rotation with light band",
        type: "Strength",
        targets: ["Infraspinatus", "Teres minor", "Posterior deltoid"],
        purpose: "Loads the external-rotator part of the cuff, which helps keep the humeral head centred.",
        steps: [
          "Stand with the elbow bent to 90° and tucked against the side, forearm forward, band anchored on the opposite side.",
          "Turn the forearm outward, keeping the elbow in place.",
          "Return slowly.",
        ],
        mistakes: ["Elbow drifting away from the side", "Shrugging", "Using too heavy a band and twisting the trunk"],
        precautions: ["Cuff repairs and tears have specific load limits. Stop if you feel sharp or increasing pain."],
        regression: "No band, or an isometric hold against a wall.",
        progression: "A heavier band, a different arm position, or sport-specific positions as cleared.",
        sources: ["aaos-shoulder-ex"],
      },
      {
        id: "sh-scap-row",
        name: "Scapular retraction (band row)",
        type: "Strength",
        targets: ["Rhomboids", "Middle trapezius", "Latissimus dorsi"],
        purpose: "Builds control of the shoulder blade, the base the arm moves from.",
        steps: [
          "Hold a band with arms forward and shoulders relaxed.",
          "Draw the shoulder blades back and down toward the spine as you bend the elbows.",
          "Return slowly.",
        ],
        mistakes: ["Shrugging toward the ears", "Arching the lower back", "Letting the head poke forward"],
        precautions: ["Reduce load if symptoms persist into the next day."],
        regression: "Smaller range or lighter band.",
        progression: "Heavier resistance, single arm, or standing on one leg.",
        sources: ["aaos-shoulder-ex"],
      },
      {
        id: "sh-wall-slide",
        name: "Wall slide",
        type: "Functional",
        targets: ["Serratus anterior", "Lower trapezius", "Overhead reach"],
        purpose: "Practises raising the arm overhead with scapular upward rotation.",
        steps: [
          "Face a wall with forearms on it, elbows below the shoulders.",
          "Slide the forearms upward while keeping the shoulders away from the ears.",
          "Lower with control.",
        ],
        mistakes: ["Shrugging", "Arching the back", "Forcing past comfortable range"],
        precautions: ["Impingement-type pain with overhead reach should be reported to a clinician."],
        regression: "Slide only part-way or lean closer to the wall.",
        progression: "Add a band around the forearms or reach with a foam roller.",
        sources: ["aaos-shoulder-ex"],
      },
    ],
  },
  {
    id: "ankle",
    name: "Ankle & foot",
    blurb:
      "A mortise formed by tibia, fibula and talus, supported by lateral and medial ligaments and by muscles that control push-off and balance.",
    viewerRegion: "Lower limbs",
    structures: [
      { label: "Anterior talofibular ligament", match: "anterior talofibular", role: "Most often involved ligament in lateral sprains." },
      { label: "Calcaneofibular ligament", match: "calcaneofibular", role: "Resists inversion when the ankle is neutral." },
      { label: "Calcaneal (Achilles) tendon", match: "calcaneal tendon", role: "Transmits gastrocnemius and soleus force to the heel." },
      { label: "Gastrocnemius and soleus", match: "gastrocnemius|soleus", role: "Plantar-flexors for push-off and walking." },
      { label: "Tibialis anterior and posterior", match: "tibialis", role: "Dorsiflex (anterior) and support the arch (posterior)." },
      { label: "Fibularis muscles", match: "fibularis", role: "Evert the foot and resist inversion sprains." },
      { label: "Plantar aponeurosis", match: "plantar aponeurosis", role: "Supports the longitudinal arch." },
    ],
    injuries: [
      {
        id: "an-sprain",
        name: "Lateral ankle sprain",
        structures: ["Anterior talofibular ligament", "Calcaneofibular ligament"],
        tissue: "Ligament",
        what: "Overstretching or tearing of the lateral ligaments after the foot rolls inward.",
        context: "Very common in sport and on uneven ground. A fracture can look similar, which is why assessment matters after significant injury.",
        goals: ["Protect for a short period as advised", "Restore ankle motion and walking", "Rebuild strength and, importantly, balance control", "Return to running and cutting tasks gradually"],
        seeClinician: ["You cannot take four steps straight after the injury", "Pain over the bony points at the back or tip of the ankle bones", ...commonFlags],
        sources: ["aaos-ankle", "nhs-sprains", "aaos-ankle-ex"],
      },
      {
        id: "an-achilles",
        name: "Achilles tendon pain (tendinopathy)",
        structures: ["Calcaneal (Achilles) tendon", "Gastrocnemius and soleus"],
        tissue: "Tendon",
        what: "Load-related pain in the tendon above the heel, often worse in the morning or at the start of activity.",
        context: "Often follows an increase in running or jumping.",
        goals: ["Adjust load to a tolerable level", "Progressively load the calf-tendon complex", "Return to impact tasks gradually"],
        seeClinician: ["A sudden pop or snap with loss of push-off", "A palpable gap", ...commonFlags],
        sources: ["aaos-achilles", "aaos-ankle-ex"],
      },
      {
        id: "an-plantar",
        name: "Plantar heel pain",
        structures: ["Plantar aponeurosis"],
        tissue: "Tendon",
        what: "Pain under the heel often felt with the first steps in the morning.",
        context: "Related to load on the arch and calf tightness; shoes and activity patterns can contribute.",
        goals: ["Manage load", "Improve calf and foot capacity", "Return to usual walking and running"],
        seeClinician: ["Night pain, numbness or a lump", ...commonFlags],
        sources: ["aaos-ankle-ex"],
      },
    ],
    exercises: [
      {
        id: "an-alphabet",
        name: "Ankle alphabet",
        type: "Mobility",
        targets: ["Ankle motion", "Dorsiflexors", "Plantar-flexors", "Invertors/evertors"],
        purpose: "Gentle active movement in every direction while swelling and stiffness settle.",
        steps: [
          "Sit with the foot off the floor.",
          "Draw the letters of the alphabet with the big toe, moving only the ankle.",
          "Repeat slowly within a comfortable range.",
        ],
        mistakes: ["Moving the whole leg instead of the ankle", "Forcing into painful ranges"],
        precautions: ["Not for a suspected fracture until it has been assessed."],
        regression: "Single plane motions: up and down only.",
        progression: "Add a light band for resistance when allowed.",
        sources: ["aaos-ankle-ex"],
      },
      {
        id: "an-heel-raise",
        name: "Heel raise",
        type: "Strength",
        targets: ["Gastrocnemius", "Soleus", "Calcaneal tendon"],
        purpose: "Builds calf strength and tendon tolerance for walking, running and jumping.",
        steps: [
          "Stand holding a counter with the weight on both feet.",
          "Rise onto the balls of the feet with a controlled tempo.",
          "Lower slowly without bouncing.",
        ],
        mistakes: ["Rolling toward the outer border of the foot", "Bouncing", "Letting the knees bend or lock"],
        precautions: ["With an Achilles tear or repair, loading must follow the surgeon's or therapist's plan.", "Fall risk: keep a stable support."],
        regression: "Seated version, or both feet with a stronger hand hold.",
        progression: "Single leg, a step edge for greater range, or added weight when cleared.",
        sources: ["aaos-ankle-ex", "aaos-achilles"],
      },
      {
        id: "an-band-eversion",
        name: "Band eversion",
        type: "Strength",
        targets: ["Fibularis longus", "Fibularis brevis"],
        purpose: "Strengthens the muscles that resist the foot rolling inward.",
        steps: [
          "Sit with a band looped around the forefoot and anchored on the inner side.",
          "Turn the sole of the foot outward against the band without moving the lower leg.",
          "Return slowly.",
        ],
        mistakes: ["Rotating the whole leg", "Snapping back"],
        precautions: ["Stop with sharp pain on the outer ankle."],
        regression: "No band: active eversion only.",
        progression: "A heavier band or standing variations.",
        sources: ["aaos-ankle-ex"],
      },
      {
        id: "an-balance",
        name: "Single-leg balance progression",
        type: "Balance",
        targets: ["Ankle proprioception", "Gluteus medius", "Fibularis muscles"],
        purpose: "Retrains reflex control, one of the best-recognised parts of rehabilitation after an ankle sprain.",
        steps: [
          "Stand near a support on the injured leg.",
          "Hold the position with a small knee bend while keeping the foot flat.",
          "Progress by reducing hand support, then by adding movement of the other leg.",
        ],
        mistakes: ["Using an unstable surface before control is secure", "Gripping the support heavily"],
        precautions: ["Keep a support in reach. Supervise if fall risk or sensation loss."],
        regression: "Two hands on the support or a wider stance.",
        progression: "Eyes closed, a foam surface, or reaching in different directions.",
        sources: ["aaos-ankle-ex"],
      },
    ],
  },
  {
    id: "hip",
    name: "Hip & thigh",
    blurb:
      "A deep ball-and-socket joint that transfers load between trunk and leg. The gluteal muscles, hip flexors and adductors control the pelvis in walking and running.",
    viewerRegion: "Lower limbs",
    structures: [
      { label: "Gluteus maximus", match: "gluteus maximus", role: "Hip extension for climbing, rising and sprinting." },
      { label: "Gluteus medius and minimus", match: "gluteus medius|gluteus minimus", role: "Keep the pelvis level during single-leg stance." },
      { label: "Iliopsoas", match: "iliacus|psoas major", role: "Main hip flexor." },
      { label: "Hamstrings", match: "semitendinosus|semimembranosus|biceps femoris", role: "Hip extension and knee flexion; common strain site." },
      { label: "Adductors", match: "adductor", role: "Draw the thigh toward the midline; groin strain site." },
      { label: "Acetabular labrum", match: "acetabular labrum", role: "Fibrocartilage ring that deepens the hip socket." },
      { label: "Iliofemoral ligament", match: "iliofemoral", role: "Strongest hip ligament; limits extension." },
      { label: "Femur and pelvis", match: "femur$|hip bone$", role: "The bony framework." },
    ],
    injuries: [
      {
        id: "hip-hamstring",
        name: "Hamstring strain",
        structures: ["Hamstrings"],
        tissue: "Muscle",
        what: "A tear of muscle fibres, often at the muscle-tendon junction, graded by severity.",
        context: "Typically during sprinting or fast stretching. Prior strains and fatigue are recognised risk factors.",
        goals: ["Settle pain and protect early", "Restore pain-free stretch and strength", "Progress to high-speed and eccentric loading before returning to sprinting"],
        seeClinician: ["A snapping or tearing feeling with major bruising", "Unable to walk without a limp", ...commonFlags],
        sources: ["aaos-hamstring", "nhs-sprains"],
      },
      {
        id: "hip-fai",
        name: "Hip impingement and labral irritation",
        structures: ["Acetabular labrum", "Iliofemoral ligament"],
        tissue: "Meniscus / cartilage",
        what: "Pain in the front or side of the hip with deep flexion or rotation, linked to the shape of the femoral head-neck and socket.",
        context: "Seen in people who flex the hip deeply or twist under load, e.g. squatting sports.",
        goals: ["Identify and modify provocative positions", "Build hip and trunk control", "Return to loading tasks gradually"],
        seeClinician: ["Locking, catching or giving way", "Pain at night or at rest", ...commonFlags],
        sources: ["aaos-fai", "aaos-hip-ex"],
      },
      {
        id: "hip-gluteal",
        name: "Gluteal tendon-related lateral hip pain",
        structures: ["Gluteus medius and minimus"],
        tissue: "Tendon",
        what: "Load-related pain on the outer hip, often worse lying on that side or on stairs.",
        context: "Frequently reported in people increasing walking or running load.",
        goals: ["Modify compressive and aggravating positions", "Progressively load the abductors", "Return to usual activity"],
        seeClinician: ["A sudden loss of strength", ...commonFlags],
        sources: ["aaos-hip-ex"],
      },
    ],
    exercises: [
      {
        id: "hip-bridge",
        name: "Glute bridge",
        type: "Strength",
        targets: ["Gluteus maximus", "Hamstrings", "Trunk stabilisers"],
        purpose: "Introduces hip extension strength with the trunk supported.",
        steps: [
          "Lie on your back with knees bent and feet flat.",
          "Lift the hips until the body forms a line from shoulders to knees.",
          "Lower slowly.",
        ],
        mistakes: ["Over-arching the lower back", "Pushing through the toes", "Letting the knees fall apart"],
        precautions: ["Hamstring cramping suggests moving the feet closer."],
        regression: "Smaller lift or a short hold.",
        progression: "Marching bridge, single-leg bridge, or add resistance.",
        sources: ["aaos-hip-ex"],
      },
      {
        id: "hip-clamshell",
        name: "Side-lying hip abduction (clamshell)",
        type: "Strength",
        targets: ["Gluteus medius", "Gluteus minimus", "External rotators"],
        purpose: "Isolates the hip abductors and external rotators with low load.",
        steps: [
          "Lie on your side with knees bent and heels together.",
          "Lift the top knee without the pelvis rolling backward.",
          "Lower slowly.",
        ],
        mistakes: ["Rolling the pelvis back", "Using momentum"],
        precautions: ["Lying on a painful outer hip may not be comfortable; use a pillow or choose another position."],
        regression: "Smaller range.",
        progression: "Add a band, then standing hip abduction or step-ups.",
        sources: ["aaos-hip-ex"],
      },
      {
        id: "hip-hamstring-bridge-walk",
        name: "Hamstring curl on slider",
        type: "Strength",
        targets: ["Hamstrings", "Gluteus maximus"],
        purpose: "Builds hamstring strength in a lengthened position, relevant to the way the muscle is injured.",
        steps: [
          "Lie on your back with heels on a slider or towel and the hips lifted.",
          "Slide the heels out slowly, keeping the hips up.",
          "Pull the heels back in with control.",
        ],
        mistakes: ["Dropping the hips", "Going too far too quickly"],
        precautions: ["Reduce range if sharp pain develops. Strain rehab has stage-specific limits."],
        regression: "Shorter range or both heels with a bridge.",
        progression: "Single leg, longer lever, or Nordic-type loading when cleared.",
        sources: ["aaos-hamstring"],
      },
      {
        id: "hip-step-up",
        name: "Step-up",
        type: "Functional",
        targets: ["Gluteus maximus", "Quadriceps", "Pelvic control"],
        purpose: "Practises stairs and single-leg stance with progressive load.",
        steps: [
          "Place one foot fully on a low step.",
          "Push through the heel to stand up with the pelvis level.",
          "Lower the other foot down slowly.",
        ],
        mistakes: ["Pushing off the back foot", "Letting the knee collapse inward"],
        precautions: ["Use a rail if balance is a concern."],
        regression: "Lower step with a rail.",
        progression: "Higher step, holding a weight, or a lateral step-up.",
        sources: ["aaos-hip-ex"],
      },
    ],
  },
  {
    id: "spine",
    name: "Low back",
    blurb:
      "Lumbar vertebrae separated by intervertebral discs, bound by ligaments, and moved and stabilised by layered back and abdominal muscles.",
    viewerRegion: "Spine",
    structures: [
      { label: "Multifidus", match: "multifidus lumborum", role: "Deep segmental stabiliser of the lumbar spine." },
      { label: "Erector spinae (longissimus)", match: "longissimus thoracis", role: "Extends the trunk and resists forward flexion." },
      { label: "Quadratus lumborum", match: "quadratus lumborum", role: "Lateral flexion of the trunk and stabilises the 12th rib." },
      { label: "Transversus abdominis", match: "transversus abdominis", role: "Deep abdominal wall muscle that helps stabilise the trunk." },
      { label: "Rectus abdominis", match: "rectus abdominis", role: "Flexes the trunk." },
      { label: "Intervertebral discs (lumbar)", match: "intervertebral disc l", role: "Fibrocartilage shock absorbers between vertebrae." },
      { label: "Lumbar vertebrae", match: "lumbar vertebra", role: "Bony weight-bearing column." },
    ],
    injuries: [
      {
        id: "sp-nonspecific",
        name: "Non-specific low back pain",
        structures: ["Multifidus", "Erector spinae (longissimus)"],
        tissue: "Muscle",
        what: "Pain in the low back without one identifiable structural cause; most episodes improve with time and activity.",
        context: "Very common. Imaging often does not explain the pain, so the model alone cannot say where the pain comes from.",
        goals: ["Stay as active as is comfortable", "Address movement fear and work or sport load", "Build general trunk and hip capacity"],
        seeClinician: [
          "New loss of bladder or bowel control, numbness around the genitals or buttocks (saddle area)",
          "Progressive leg weakness",
          "Back pain after significant trauma, with unexplained weight loss, or with fever",
          "Pain in someone with a history of cancer",
          ...commonFlags,
        ],
        sources: ["aaos-lbp", "nhs-back", "aaos-spine-ex"],
      },
      {
        id: "sp-disc",
        name: "Disc-related leg pain (radiculopathy)",
        structures: ["Intervertebral discs (lumbar)"],
        tissue: "Meniscus / cartilage",
        what: "Irritation of a lumbar nerve root, felt as pain, tingling or weakness spreading into a leg.",
        context: "May be linked to a disc bulge; many disc findings on imaging occur without any symptoms.",
        goals: ["Settle nerve irritation with symptom-guided positions", "Maintain function and walking", "Progress trunk and leg strengthening"],
        seeClinician: ["Weakness such as a foot that drops", "Saddle numbness or bladder/bowel change (urgent)", ...commonFlags],
        sources: ["aaos-lbp", "nhs-back"],
      },
      {
        id: "sp-strain",
        name: "Lumbar muscle strain",
        structures: ["Erector spinae (longissimus)", "Quadratus lumborum"],
        tissue: "Muscle",
        what: "Overload of the spinal muscles, with local tenderness and pain on movement.",
        context: "Often follows lifting, twisting or an unaccustomed activity.",
        goals: ["Keep moving within comfort", "Gradually restore trunk strength and endurance"],
        seeClinician: [...commonFlags],
        sources: ["nhs-sprains", "nhs-back"],
      },
    ],
    exercises: [
      {
        id: "sp-cat-camel",
        name: "Cat-camel",
        type: "Mobility",
        targets: ["Lumbar and thoracic spine motion", "Trunk muscles"],
        purpose: "Gentle repeated spinal flexion and extension in a supported position.",
        steps: [
          "Start on hands and knees with hands under shoulders and knees under hips.",
          "Slowly round the back toward the ceiling.",
          "Then let the belly sag gently, keeping the movement small and comfortable.",
        ],
        mistakes: ["Forcing the end of range", "Rocking back onto the heels"],
        precautions: ["Skip a direction that reproduces leg symptoms or sharp pain."],
        regression: "Smaller range or seated on a chair.",
        progression: "Add arm and leg lifts, as in bird-dog, as tolerated.",
        sources: ["aaos-spine-ex"],
      },
      {
        id: "sp-bird-dog",
        name: "Bird-dog",
        type: "Strength",
        targets: ["Multifidus", "Erector spinae", "Gluteus maximus", "Transversus abdominis"],
        purpose: "Trains the trunk to stay still while the limbs move.",
        steps: [
          "Start on hands and knees with a neutral back.",
          "Extend one arm forward or one leg back (or the opposite pair) without letting the trunk rotate.",
          "Return and swap sides.",
        ],
        mistakes: ["Rotating the pelvis", "Arching the low back", "Raising the leg too high"],
        precautions: ["Wrist pain: use fists or forearms."],
        regression: "Lift only the leg or only the arm.",
        progression: "Hold longer, add a pause, or opposite arm and leg together.",
        sources: ["aaos-spine-ex"],
      },
      {
        id: "sp-dead-bug",
        name: "Dead bug",
        type: "Strength",
        targets: ["Transversus abdominis", "Rectus abdominis", "Hip flexors"],
        purpose: "Trains abdominal control while the arms and legs move.",
        steps: [
          "Lie on your back with hips and knees at 90° and arms toward the ceiling.",
          "Lower the opposite arm and leg slowly without the low back arching.",
          "Return and switch sides.",
        ],
        mistakes: ["Letting the back arch", "Holding the breath", "Moving too fast"],
        precautions: ["Reduce range if the back arches or pain appears."],
        regression: "Move only the legs, with the feet touching down.",
        progression: "Longer lever, light weights, or a band.",
        sources: ["aaos-spine-ex"],
      },
      {
        id: "sp-hip-hinge",
        name: "Hip hinge",
        type: "Functional",
        targets: ["Gluteus maximus", "Hamstrings", "Erector spinae"],
        purpose: "Teaches bending from the hips, the pattern behind lifting and picking things up.",
        steps: [
          "Stand with feet hip-width apart and a soft knee bend.",
          "Push the hips back as the trunk leans forward with a flat back.",
          "Stand tall by driving the hips forward.",
        ],
        mistakes: ["Rounding the back", "Squatting instead of hinging", "Locking the knees"],
        precautions: ["Skip positions that reproduce leg symptoms."],
        regression: "Use a countertop or dowel for feedback.",
        progression: "Hold a light weight, then a deadlift pattern under supervision.",
        sources: ["aaos-spine-ex", "nhs-back"],
      },
    ],
  },
  {
    id: "neck",
    name: "Neck",
    blurb:
      "Seven cervical vertebrae support the head and allow a large range of rotation and flexion. Deep neck flexors and scapular muscles share the load.",
    viewerRegion: "Face and neck",
    structures: [
      { label: "Sternocleidomastoid", match: "sternocleidomastoid", role: "Rotates the head to the opposite side and flexes the neck." },
      { label: "Upper trapezius", match: "descending part of right trapezius|descending part", role: "Elevates the scapula and extends the neck." },
      { label: "Levator scapulae", match: "levator scapulae", role: "Elevates the scapula and side-bends the neck." },
      { label: "Longus colli", match: "longus colli", role: "Deep neck flexor that supports the cervical spine." },
      { label: "Splenius capitis", match: "splenius capitis", role: "Extends and rotates the head." },
      { label: "Cervical discs and vertebrae", match: "intervertebral disc c|cervical vertebra", role: "Weight-bearing column; discs are fibrocartilage." },
    ],
    injuries: [
      {
        id: "nk-strain",
        name: "Neck strain / whiplash-associated pain",
        structures: ["Sternocleidomastoid", "Levator scapulae", "Upper trapezius"],
        tissue: "Muscle",
        what: "Pain and stiffness from overloaded neck muscles, often after sudden acceleration-deceleration.",
        context: "Many episodes settle with time and gradually restored movement.",
        goals: ["Keep moving within comfort", "Restore neck range and strength", "Return to work and driving tasks"],
        seeClinician: [
          "Neck pain after a significant fall or car accident, especially with numbness, weakness, or severe headache",
          "Difficulty swallowing or speaking, dizziness, double vision, or loss of balance",
          ...commonFlags,
        ],
        sources: ["aaos-neck", "aaos-neck-ex", "nhs-sprains"],
      },
      {
        id: "nk-radic",
        name: "Cervical radiculopathy",
        structures: ["Cervical discs and vertebrae"],
        tissue: "Meniscus / cartilage",
        what: "Nerve-root irritation producing arm pain, tingling or weakness.",
        context: "Can relate to disc or joint changes. Clinical examination is needed to localise it.",
        goals: ["Symptom-guided positioning and activity", "Maintain mobility", "Progress neck and shoulder strengthening"],
        seeClinician: ["Arm weakness, loss of grip, or symptoms in both hands or legs", ...commonFlags],
        sources: ["aaos-neck", "aaos-neck-ex"],
      },
    ],
    exercises: [
      {
        id: "nk-chin-tuck",
        name: "Chin tuck",
        type: "Mobility",
        targets: ["Deep neck flexors", "Cervical spine"],
        purpose: "Gently retrains the head position over the shoulders and activates the deep neck flexors.",
        steps: [
          "Sit or stand tall looking forward.",
          "Draw the chin straight back as if making a double chin, without tilting the head.",
          "Hold briefly and release.",
        ],
        mistakes: ["Tilting the head down", "Forcing the movement", "Holding the breath"],
        precautions: ["Stop with arm symptoms or dizziness and seek assessment."],
        regression: "Do it lying with the head supported.",
        progression: "Lift the head slightly off a pillow, as the clinician advises.",
        sources: ["aaos-neck-ex"],
      },
      {
        id: "nk-rotation",
        name: "Active neck rotation",
        type: "Mobility",
        targets: ["Cervical rotation", "Sternocleidomastoid", "Splenius capitis"],
        purpose: "Maintains comfortable rotation, which is needed for driving and reaching.",
        steps: [
          "Sit tall with shoulders relaxed.",
          "Turn the head slowly to one side only as far as is comfortable.",
          "Return to centre and repeat on the other side.",
        ],
        mistakes: ["Hunching the shoulders", "Pushing into pain"],
        precautions: ["Dizziness, visual changes or arm symptoms: stop and seek assessment."],
        regression: "Smaller range.",
        progression: "Add a gentle hold at the end of the comfortable range.",
        sources: ["aaos-neck-ex"],
      },
      {
        id: "nk-iso",
        name: "Isometric neck holds",
        type: "Strength",
        targets: ["Neck flexors", "Neck extensors", "Side flexors"],
        purpose: "Builds neck muscle endurance without moving the joints.",
        steps: [
          "Place a hand against the forehead or the side of the head.",
          "Press gently into the hand without letting the head move.",
          "Hold, relax, repeat in other directions.",
        ],
        mistakes: ["Pushing too hard", "Holding the breath"],
        precautions: ["Light effort only. Stop with dizziness or arm symptoms."],
        regression: "Lower effort.",
        progression: "Band resistance or a longer hold, as the clinician advises.",
        sources: ["aaos-neck-ex"],
      },
      {
        id: "nk-scap",
        name: "Shoulder blade squeeze",
        type: "Functional",
        targets: ["Middle trapezius", "Rhomboids", "Scapular control"],
        purpose: "Trains posture endurance for desk work and carrying tasks.",
        steps: [
          "Sit tall with arms by your sides.",
          "Draw the shoulder blades gently together and down.",
          "Hold briefly and release.",
        ],
        mistakes: ["Shrugging up", "Arching the low back"],
        precautions: ["Keep the effort comfortable."],
        regression: "Smaller movement.",
        progression: "Add a band row.",
        sources: ["aaos-neck-ex"],
      },
    ],
  },
];

export type StageInfo = { stage: string; what: string; goal: string };
export const healingStages: Record<HealingTissue, { blurb: string; stages: StageInfo[] }> = {
  Muscle: {
    blurb: "Muscle has a good blood supply and can regenerate some fibres, but repair can include scar tissue.",
    stages: [
      { stage: "1. Inflammation (reactive)", what: "Bleeding, swelling and pain; debris is cleared. Often lasts days.", goal: "Protect, manage symptoms, keep non-painful movement." },
      { stage: "2. Repair (proliferative)", what: "New fibres and scar tissue form and become more organised. Over days to a few weeks.", goal: "Restore comfortable range and begin graded loading." },
      { stage: "3. Remodelling", what: "Tissue reorganises and strengthens with load. Weeks to months.", goal: "Build strength, speed and sport/work capacity with graded, assessed progression." },
    ],
  },
  Tendon: {
    blurb: "Tendons have a modest blood supply and adapt slowly. Many tendon problems are load-related rather than a single acute injury.",
    stages: [
      { stage: "1. Reactive / inflammatory", what: "Pain and swelling after overload or tear; days to weeks.", goal: "Relative rest from the aggravating load, keep gentle movement." },
      { stage: "2. Repair", what: "Collagen is laid down in a disorganised pattern; weeks.", goal: "Progressive loading to guide fibre organisation, as prescribed by the clinician." },
      { stage: "3. Remodelling", what: "Slow reorganisation continues for months.", goal: "Build tendon capacity with heavier, then faster, loading and return to sport." },
    ],
  },
  Ligament: {
    blurb: "Ligaments have limited blood supply; healing is slower, and a healed ligament may not match the original stiffness. Severity and instability matter.",
    stages: [
      { stage: "1. Inflammation", what: "Swelling, bruising and protective pain; days.", goal: "Protect the joint, manage swelling, keep safe movement." },
      { stage: "2. Repair", what: "Collagen scar forms; weeks.", goal: "Regain motion and gradually load. Balance training begins." },
      { stage: "3. Remodelling", what: "Slow strengthening of the scar; months.", goal: "Strength, neuromuscular control and task-specific training, with criteria before a return to sport." },
    ],
  },
  Bone: {
    blurb: "Bone heals well with a good blood supply and stability. Healing follows overlapping phases and depends on the fracture and treatment.",
    stages: [
      { stage: "1. Inflammation / haematoma", what: "A blood clot forms at the fracture; days.", goal: "Immobilise or protect as directed." },
      { stage: "2. Soft then hard callus", what: "Cartilage then woven bone bridges the gap; weeks.", goal: "Controlled movement and loading when the surgeon allows." },
      { stage: "3. Remodelling", what: "Bone is reshaped along lines of stress; months to years.", goal: "Progressive loading and return to function, guided by imaging and the care team." },
    ],
  },
  "Meniscus / cartilage": {
    blurb: "Articular cartilage and the inner meniscus have little or no blood supply, so healing is limited. This is one reason management is individualised.",
    stages: [
      { stage: "1. Reactive", what: "Pain, swelling and a feeling of catching can follow injury or overload.", goal: "Settle irritation, keep motion, avoid provoking positions." },
      { stage: "2. Adaptation", what: "Healing is limited for the inner meniscus and articular cartilage; the outer meniscus can repair with blood supply.", goal: "Build muscle strength to share joint load; follow repair-specific limits if surgery was done." },
      { stage: "3. Return to load", what: "Tolerance to deeper bending, twisting and impact is rebuilt.", goal: "Gradual progression with criteria and professional guidance." },
    ],
  },
};

export type Approach = {
  name: string;
  purpose: string;
  evidence: string;
  limits: string;
};
export const approaches: Approach[] = [
  {
    name: "Therapeutic exercise",
    purpose: "Restore motion, strength, endurance, balance and task-specific capacity, with load tailored to the tissue and goal.",
    evidence: "Exercise is a core part of rehabilitation for many musculoskeletal problems.",
    limits: "The right exercise, dose and timing depend on examination. An exercise cannot be assumed to be suitable for every injury.",
  },
  {
    name: "Education and activity modification",
    purpose: "Explain what is happening, which loads to adjust temporarily, and when and how to return to activity.",
    evidence: "Widely recommended in guidance for pain such as low back pain.",
    limits: "Not a substitute for assessment of serious injury.",
  },
  {
    name: "Manual therapy",
    purpose: "Hands-on techniques that may temporarily reduce pain or improve motion, so active movement is easier.",
    evidence: "Effects tend to be short-term; usually considered an adjunct to exercise and education.",
    limits: "Does not make tissue heal faster and does not replace active rehabilitation.",
  },
  {
    name: "Cold, heat and electrical modalities",
    purpose: "Used for short-term symptom relief such as comfort or muscle relaxation.",
    evidence: "Evidence for changing healing is limited; relief varies between people.",
    limits: "Should not mask warning signs or be used on skin with reduced sensation without clinical advice.",
  },
  {
    name: "Taping, bracing and assistive devices",
    purpose: "Temporarily protect, offload or provide feedback while capacity is rebuilt.",
    evidence: "Benefit depends on the problem and phase.",
    limits: "Long-term reliance can reduce use of the muscles that should be doing the work.",
  },
];

export const generalRedFlags = commonFlags;
