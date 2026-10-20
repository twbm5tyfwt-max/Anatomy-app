import anchorData from "./generated/landmark-anchors.json";
import manifest from "./model-manifest.json";
import type { CameraView } from "./AnatomyScene";
export type AnatomyLandmark = {
  id: string;
  name: string;
  sourceName: string;
  modelId: string;
  anchor: number[];
  view: CameraView;
  location: string;
  function: string;
  features: string;
  contents?: string;
  contextIds: string[];
  source: string;
  quiz: boolean;
};
type Note = {
  name?: string;
  view: CameraView;
  location: string;
  function: string;
  features: string;
  contents?: string;
  quiz?: boolean;
};
const notes: Record<string, Note> = {};
function add(
  key: string,
  view: CameraView,
  location: string,
  fn: string,
  features: string,
  contents?: string,
  name?: string,
  quiz = false,
) {
  notes[key.toLowerCase()] = {
    view,
    location,
    function: fn,
    features,
    contents,
    name,
    quiz,
  };
}
add(
  "Spinous process",
  "back",
  "Midline posterior projection from the junction of the laminae.",
  "Provides leverage and attachment for spinal muscles and ligaments.",
  "A solid projection, not an opening. The lumbar process is relatively broad and stout.",
  undefined,
  undefined,
  true,
);
add(
  "Vertebral body",
  "front",
  "Large anterior, weight-bearing part of a typical vertebra.",
  "Transfers compression through the adjacent intervertebral discs.",
  "Lumbar bodies are large; cervical bodies are smaller. C1 has no vertebral body.",
  undefined,
  undefined,
  true,
);
add(
  "Transverse process",
  "superior",
  "Lateral projection from each side of the vertebral arch.",
  "Provides attachment and leverage for muscles and ligaments.",
  "Thoracic transverse processes usually bear a rib facet; lumbar costal processes project laterally.",
  undefined,
  undefined,
  true,
);
add(
  "Pedicle of vertebral arch",
  "superior",
  "Short bridge between the posterolateral vertebral body and the arch on each side.",
  "Forms part of the lateral wall of the vertebral foramen and the borders of intervertebral foramina.",
  "Vertebral notches lie above and below a pedicle; the pedicle itself is solid bone.",
);
add(
  "Lamina of vertebral arch",
  "superior",
  "Paired bony plates between the transverse/articular region and spinous process.",
  "Forms the posterior roof of the vertebral canal and gives attachment to the ligamenta flava.",
  "The two laminae meet posteriorly; a lamina is not the space inside the arch.",
);
add(
  "Vertebral foramen",
  "superior",
  "Opening within one vertebra, behind the body and inside the arch.",
  "Successive vertebral foramina form the vertebral canal.",
  "Different from the lateral intervertebral foramen and the cervical transverse foramina.",
  "Spinal cord at upper levels; meninges, vessels, and cauda equina nerve roots at lower lumbar levels.",
  undefined,
  true,
);
add(
  "Vertebral arch",
  "superior",
  "Posterior bony arch composed of pedicles and laminae.",
  "Encloses and protects the neural canal with the vertebral body.",
  "Articular, transverse, and spinous processes project from the arch.",
);
add(
  "Superior articular process of vertebra",
  "back",
  "Paired superior projections near the pedicle-lamina junction.",
  "Carries facets for the inferior articular facets of the vertebra above.",
  "In the lumbar region the facets face predominantly medially and limit axial rotation.",
);
add(
  "Superior articular facet of vertebra",
  "superior",
  "Articular surface on a superior articular process.",
  "Participates in a synovial zygapophyseal joint with the vertebra above.",
  "Facet orientation varies by region; a facet is the joint surface, not the entire process.",
);
add(
  "Inferior articular facet of vertebra",
  "inferior",
  "Articular surface on an inferior articular process.",
  "Articulates with the superior facet of the vertebra below.",
  "Lumbar inferior facets face predominantly laterally.",
);
add(
  "Superior vertebral notch",
  "left",
  "Indentation above a pedicle.",
  "Contributes to the boundary of an intervertebral foramen with the adjacent vertebra.",
  "Study it with the neighboring vertebra; it is an indentation in the bone, not a process.",
);
add(
  "Inferior vertebral notch",
  "left",
  "Indentation below a pedicle.",
  "Contributes to an intervertebral foramen with the adjacent superior notch.",
  "Typically deeper than the superior notch.",
);
add(
  "Intervertebral foramen",
  "left",
  "Lateral opening between the pedicles of adjacent articulated vertebrae.",
  "Provides a passage between the vertebral canal and the body periphery.",
  "Shown with L2, L3 and their disc. It is not the central hole in a single vertebra.",
  "Spinal nerve, associated vessels, and usually the dorsal root ganglion.",
);
add(
  "Foramen transversarium",
  "superior",
  "Opening through a cervical transverse process.",
  "Provides a protected vascular passage alongside the cervical vertebral column.",
  "Paired transverse foramina distinguish cervical vertebrae from typical thoracic/lumbar vertebrae.",
  "Vertebral artery and veins usually from C6 to C1; C7 commonly transmits veins without the artery.",
  "Transverse foramen",
  true,
);
add(
  "Dens axis",
  "front",
  "Superior tooth-like projection of C2 into the ring of C1.",
  "Acts as the pivot for atlanto-axial rotation.",
  "Belongs to the axis (C2), not the atlas. The transverse ligament holds it against the anterior arch.",
  undefined,
  "Dens of axis",
  true,
);
add(
  "Apex of dens axis",
  "front",
  "Tip of the dens on C2.",
  "Provides attachment for the apical ligament of the dens.",
  "The apex is the superior tip of the projection, distinct from its articular facets.",
);
add(
  "Anterior articular facet of dens axis",
  "front",
  "Anterior surface of the dens.",
  "Articulates with the facet on the posterior surface of the anterior arch of C1.",
  "Part of the median atlanto-axial joint.",
);
add(
  "Posterior articular facet of dens axis",
  "back",
  "Posterior surface of the dens.",
  "Contacts the transverse ligament of the atlas.",
  "The transverse ligament restrains posterior displacement of the dens relative to the anterior arch.",
);
add(
  "Anterior arch of atlas",
  "superior",
  "Short anterior portion of the C1 ring.",
  "Links the lateral masses and bears the facet for the dens posteriorly.",
  "C1 lacks a body and a conventional spinous process.",
  undefined,
  undefined,
  true,
);
add(
  "Posterior arch of atlas",
  "superior",
  "Long posterior portion of the C1 ring.",
  "Completes the posterior part of the vertebral ring and supports muscular attachments.",
  "The posterior tubercle replaces the large spinous process seen on many other vertebrae.",
);
add(
  "Anterior tubercle of atlas",
  "front",
  "Small midline projection on the anterior arch of C1.",
  "Provides attachment for the anterior longitudinal ligament and longus colli.",
  "A projection on the outside of the anterior arch, distinct from the internal facet for the dens.",
);
add(
  "Posterior tubercle of atlas",
  "back",
  "Small midline projection on the posterior arch of C1.",
  "Provides an attachment for the ligamentum nuchae and rectus capitis posterior minor.",
  "C1 has a posterior tubercle rather than a typical spinous process.",
);
add(
  "Lateral mass",
  "superior",
  "Thickened portion on either side of C1.",
  "Transfers load from the occipital condyles to the axis.",
  "Bears superior and inferior articular surfaces.",
);
add(
  "Superior articular surface of atlas",
  "superior",
  "Concave superior facet on a lateral mass of C1.",
  "Articulates with an occipital condyle and permits nodding at the atlanto-occipital joint.",
  "Elongated and concave; differs from the inferior surface facing C2.",
);
add(
  "Inferior articular surface of atlas",
  "inferior",
  "Inferior facet on a C1 lateral mass.",
  "Articulates with C2 at a lateral atlanto-axial joint.",
  "Relatively flat compared with the concave superior atlanto-occipital facets.",
);
add(
  "Facet for dens",
  "superior",
  "Articular surface on the posterior face of the anterior arch of C1.",
  "Articulates with the anterior facet of the dens.",
  "The dens belongs to C2; this receiving facet belongs to C1.",
);
add(
  "Groove for vertebral artery",
  "superior",
  "Groove on the superior surface of the posterior arch of C1.",
  "Accommodates the vertebral artery as it turns toward the foramen magnum.",
  "A surface groove, distinct from a transverse foramen.",
  "Vertebral artery and the first cervical spinal nerve in this region.",
);
add(
  "(Canal for vertebral artery)",
  "superior",
  "Bony bridge over the vertebral artery groove in this reference atlas.",
  "Forms a variant enclosed passage over the arterial groove.",
  "This is an anatomical variation (arcuate foramen/ponticulus posticus), not a feature present in every atlas.",
  "Vertebral artery.",
);
add(
  "Transverse ligament tubercle",
  "superior",
  "Medial projection on a C1 lateral mass.",
  "Provides attachment for the transverse ligament of the atlas.",
  "The paired attachments hold the dens against the anterior arch.",
);
add(
  "Uncinate process of vertebra",
  "front",
  "Raised lateral lip on a lower cervical vertebral body.",
  "Forms an uncovertebral articulation with the vertebra above and helps guide movement.",
  "Characteristic of the lower cervical region; not the cervical transverse process.",
);
add(
  "Anterior tubercle of transverse process",
  "front",
  "Anterior end of a cervical transverse process.",
  "Provides muscular attachment and forms the anterior border of the spinal nerve groove.",
  "Paired with a posterior tubercle around the transverse process.",
);
add(
  "Posterior tubercle of transverse process",
  "back",
  "Posterior end of a cervical transverse process.",
  "Provides muscular attachment behind the spinal nerve groove.",
  "Distinct from the midline spinous process.",
);
add(
  "Groove for spinal nerve",
  "superior",
  "Groove on a cervical transverse process between its tubercles.",
  "Accommodates the cervical spinal nerve as it passes laterally.",
  "An open groove, not a transverse foramen.",
  "Cervical spinal nerve.",
);
add(
  "Superior costal facet",
  "left",
  "Superior part of the lateral vertebral body in a typical thoracic vertebra.",
  "Receives part of a rib head at a costovertebral joint.",
  "Typical rib heads articulate with adjacent vertebral bodies and the intervening disc.",
  undefined,
  undefined,
  true,
);
add(
  "Inferior costal facet",
  "left",
  "Inferior part of the lateral vertebral body in a typical thoracic vertebra.",
  "Receives part of the head of the rib below.",
  "Thoracic rib facets differ from the superior/inferior articular facets of the spinal joints.",
);
add(
  "Transverse costal facet",
  "back",
  "Facet on a thoracic transverse process.",
  "Articulates with the tubercle of the corresponding rib.",
  "Present on typical T1–T10 transverse processes; T11 and T12 lack this costotransverse articulation.",
);
add(
  "Pars interarticularis of vertebral arch",
  "back",
  "Bony bridge between superior and inferior articular processes.",
  "Transfers force through the posterior elements and supports the facet joints.",
  "A defect here is called spondylolysis; it is not the pedicle.",
);
add(
  "Annular epiphysis",
  "superior",
  "Peripheral bony ring around the vertebral body's end surface.",
  "Provides attachment for the outer annulus fibrosus of the disc.",
  "The ring surrounds the endplate region.",
);
add(
  "Intervertebral surface",
  "superior",
  "Superior or inferior end surface of a vertebral body.",
  "Transfers load through the adjacent endplate and intervertebral disc.",
  "Distinct from the posterior articular facets.",
);
add(
  "Costal part of transverse process",
  "superior",
  "Lateral costal component of a lumbar transverse process.",
  "Provides leverage for trunk muscles.",
  "Its name reflects developmental homology with a rib; it is not a separate rib.",
);
add(
  "Lateral part of transverse process",
  "superior",
  "Lateral projection of the lumbar transverse-process region.",
  "Provides attachment for muscles and fascia.",
  "A lateral projection, not a gap in the vertebral arch.",
);
add(
  "Sacral canal",
  "superior",
  "Continuation of the vertebral canal through the sacrum.",
  "Provides a passage for sacral neural structures.",
  "Ends inferiorly at the sacral hiatus; the dural sac usually ends near S2.",
  "Sacral nerve roots and filum terminale.",
);
add(
  "Anterior sacral foramina",
  "front",
  "Four paired openings on the pelvic surface of the sacrum.",
  "Allow anterior rami to leave the sacral canal.",
  "Different from the posterior sacral foramina on the dorsal surface.",
  "Anterior rami of sacral spinal nerves and lateral sacral vessels.",
);
add(
  "Posterior sacral foramina",
  "back",
  "Paired openings on the dorsal surface of the sacrum.",
  "Allow posterior rami to leave the sacral canal.",
  "Smaller than the anterior sacral foramina.",
  "Posterior rami of sacral spinal nerves.",
);
add(
  "Sacral hiatus",
  "back",
  "Inferior posterior opening of the sacral canal.",
  "Provides an access route to the sacral epidural space.",
  "Usually results from non-fusion of the lower sacral laminae; bounded by sacral cornua.",
);
add(
  "Median sacral crest",
  "back",
  "Midline ridge on the dorsal sacrum.",
  "Provides posterior ligament and muscle attachment.",
  "Represents fused sacral spinous processes.",
);
add(
  "Promontory",
  "left",
  "Projecting anterior edge of the S1 vertebral body.",
  "Contributes to the posterior boundary of the pelvic inlet.",
  "A projection at the sacral base, not a foramen.",
);
add(
  "Auricular surface of sacrum",
  "right",
  "Ear-shaped articular surface on the lateral sacrum.",
  "Articulates with the ilium at the sacroiliac joint and transmits body weight.",
  "A joint surface, not the rough sacral tuberosity behind it.",
);
add(
  "Base of sacrum",
  "superior",
  "Broad superior end of the sacrum.",
  "Receives load from L5 across the lumbosacral joint and disc.",
  "Includes the superior body surface, alae, and superior articular processes.",
);
add(
  "Apex of sacrum",
  "front",
  "Narrow inferior end of the sacrum.",
  "Articulates with the base of the coccyx.",
  "Inferior to the sacral canal and foramina.",
);
add(
  "Base of coccyx",
  "superior",
  "Superior broad end of the coccyx.",
  "Articulates with the apex of the sacrum.",
  "Coccygeal cornua project superiorly near this end.",
);
add(
  "Apex of coccyx",
  "front",
  "Inferior tip of the coccyx.",
  "Provides attachment for pelvic-floor and fibrous structures in the coccygeal region.",
  "The coccyx usually consists of four segments, with normal numerical variation.",
);
add(
  "Coccygeal horn",
  "back",
  "Superior projection from a coccygeal articular-process remnant.",
  "Connects toward the sacral cornua through the sacrococcygeal ligaments.",
  "A solid projection, not a posterior sacral foramen.",
);
add(
  "Head of humerus",
  "front",
  "Rounded proximal articular surface of the humerus.",
  "Articulates with the glenoid cavity of the scapula.",
  "Faces medially, superiorly, and posteriorly; bordered by the anatomical neck.",
);
add(
  "Anatomical neck of humerus",
  "front",
  "Groove around the margin of the humeral head.",
  "Marks much of the attachment of the shoulder joint capsule.",
  "Distinct from the surgical neck below the tubercles.",
);
add(
  "Surgical neck of humerus",
  "front",
  "Narrow region distal to the humeral tubercles.",
  "Connects the proximal humerus to its shaft.",
  "Related to the axillary nerve and posterior circumflex humeral vessels.",
);
add(
  "Greater tubercle",
  "front",
  "Lateral proximal projection of the humerus.",
  "Receives supraspinatus, infraspinatus, and teres minor tendons on its facets.",
  "Larger and more lateral than the lesser tubercle.",
);
add(
  "Lesser tubercle",
  "front",
  "Anterior proximal projection of the humerus.",
  "Receives the subscapularis tendon.",
  "Lies medial to the intertubercular sulcus.",
);
add(
  "Intertubercular sulcus",
  "front",
  "Groove between the greater and lesser tubercles.",
  "Guides the long-head biceps tendon through the proximal humeral region.",
  "Also called the bicipital groove; tendon passage differs from a bony attachment.",
  "Tendon of the long head of biceps brachii.",
);
add(
  "Deltoid tuberosity",
  "front",
  "Roughened lateral area on the humeral shaft.",
  "Receives the deltoid insertion.",
  "A raised attachment area, not an articular surface.",
);
add(
  "Olecranon fossa",
  "back",
  "Deep posterior depression above the distal humeral trochlea.",
  "Receives the olecranon of the ulna during elbow extension.",
  "Posterior fossa; do not confuse it with the anterior coronoid or radial fossae.",
  undefined,
  undefined,
  true,
);
add(
  "Coronoid fossa",
  "front",
  "Anterior depression above the humeral trochlea.",
  "Receives the ulnar coronoid process in elbow flexion.",
  "Larger and more medial than the radial fossa.",
);
add(
  "Radial fossa",
  "front",
  "Anterior depression above the capitulum.",
  "Accommodates the radial head during elbow flexion.",
  "Lateral to the coronoid fossa.",
);
add(
  "Capitulum of humerus",
  "front",
  "Rounded lateral articular surface of the distal humerus.",
  "Articulates with the radial head.",
  "Lateral rounded surface; the trochlea is medial and spool-shaped.",
);
add(
  "Trochlea of humerus",
  "front",
  "Spool-shaped medial distal humeral articular surface.",
  "Articulates with the trochlear notch of the ulna.",
  "Extends around the distal humerus anteriorly and posteriorly.",
);
add(
  "Medial epicondyle of humerus",
  "front",
  "Medial distal humeral projection.",
  "Provides a common flexor-pronator origin and ligament attachment.",
  "The ulnar nerve passes behind it in its groove.",
);
add(
  "Lateral epicondyle of humerus",
  "front",
  "Lateral distal humeral projection.",
  "Provides a common extensor origin and lateral ligament attachment.",
  "A projection above the joint surface, not the capitulum itself.",
);
add(
  "Groove for ulnar nerve",
  "back",
  "Groove behind the medial humeral epicondyle.",
  "Accommodates the ulnar nerve as it passes behind the elbow.",
  "A surface groove, not a foramen.",
  "Ulnar nerve.",
);
add(
  "Radial groove",
  "back",
  "Oblique groove on the posterior humeral shaft.",
  "Accommodates the radial nerve and associated vessels.",
  "Also called the spiral groove.",
  "Radial nerve and profunda brachii vessels.",
);
add(
  "Glenoid fossa",
  "front",
  "Shallow lateral articular cavity of the scapula.",
  "Articulates with the humeral head.",
  "Deepened by the glenoid labrum; it is not an opening through the bone.",
);
add(
  "Acromion",
  "front",
  "Lateral extension of the scapular spine above the shoulder.",
  "Articulates with the clavicle and provides deltoid/trapezius attachment.",
  "Forms part of the roof over the glenohumeral joint.",
);
add(
  "Coracoid process",
  "front",
  "Hook-like anterior projection of the scapula.",
  "Provides attachments for pectoralis minor, short-head biceps, coracobrachialis, and ligaments.",
  "Projects anteriorly; the acromion is a continuation of the posterior spine.",
);
add(
  "Spine of scapula",
  "back",
  "Prominent ridge across the posterior scapula.",
  "Provides muscle attachment and separates supra- and infraspinous fossae.",
  "Continues laterally into the acromion.",
);
add(
  "Supraspinous fossa",
  "back",
  "Depression superior to the scapular spine.",
  "Provides an origin surface for supraspinatus.",
  "Smaller than the infraspinous fossa below the spine.",
);
add(
  "Infraspinous fossa",
  "back",
  "Broad posterior scapular depression below the spine.",
  "Provides an origin surface for infraspinatus.",
  "A fossa is a depression, not an opening.",
);
add(
  "Subscapular fossa",
  "front",
  "Broad costal surface depression of the scapula.",
  "Provides an origin surface for subscapularis.",
  "Faces the thoracic wall.",
);
add(
  "Supraglenoid tubercle",
  "front",
  "Small projection superior to the glenoid cavity.",
  "Provides the origin of the long head of biceps brachii.",
  "Different from the short head's coracoid origin.",
);
add(
  "Infraglenoid tubercle",
  "back",
  "Projection just inferior to the glenoid cavity.",
  "Provides the origin of the long head of triceps brachii.",
  "Located below the glenoid articular surface.",
);
add(
  "Scapular notch",
  "superior",
  "Notch in the superior scapular border medial to the coracoid base.",
  "Forms a passage for the suprascapular nerve beneath the superior transverse scapular ligament.",
  "The artery usually passes above the ligament.",
  "Suprascapular nerve beneath the ligament.",
);
add(
  "Acetabulum",
  "right",
  "Cup-shaped lateral socket of the hip bone.",
  "Receives the femoral head and transfers hip-joint load.",
  "Formed by ilium, ischium, and pubis; the lunate surface is articular.",
);
add(
  "Acetabular fossa",
  "right",
  "Central non-articular depression inside the acetabulum.",
  "Contains fat and attachment for the ligament of the head of the femur.",
  "Distinct from the surrounding articular lunate surface.",
);
add(
  "Lunate surface",
  "right",
  "Crescent-shaped articular region of the acetabulum.",
  "Articulates with the femoral head.",
  "Surrounds the non-articular acetabular fossa.",
);
add(
  "Obturator foramen",
  "front",
  "Large opening bounded by pubic and ischial rami.",
  "Is mostly closed by the obturator membrane, leaving the obturator canal superiorly.",
  "The neurovascular bundle passes through the canal, not freely through the entire opening.",
  "Obturator nerve, artery, and vein through the obturator canal.",
);
add(
  "Iliac crest",
  "front",
  "Superior curved border of the ilium.",
  "Provides attachment for abdominal, back, and hip-region muscles and fascia.",
  "Extends between the anterior and posterior superior iliac spines.",
);
add(
  "Anterior superior iliac spine",
  "front",
  "Anterior end of the iliac crest.",
  "Provides attachment for sartorius and the inguinal ligament.",
  "Superior to the anterior inferior iliac spine.",
);
add(
  "Anterior inferior iliac spine",
  "front",
  "Projection inferior to the anterior superior iliac spine.",
  "Provides origin for the straight head of rectus femoris.",
  "Located just above the acetabular region.",
);
add(
  "Ischial tuberosity",
  "back",
  "Large roughened inferior-posterior projection of the ischium.",
  "Bears weight when seated and gives origin to most hamstrings.",
  "The short head of biceps femoris does not originate here.",
);
add(
  "Ischial spine",
  "back",
  "Projection between the greater and lesser sciatic notches.",
  "Provides attachment for the sacrospinous ligament.",
  "Separates the two sciatic notches.",
);
add(
  "Auricular surface of ilium",
  "left",
  "Ear-shaped medial iliac articular surface.",
  "Articulates with the sacrum at the sacroiliac joint.",
  "Anterior to the rough iliac tuberosity.",
);
add(
  "Tibial tuberosity",
  "front",
  "Roughened anterior proximal tibial projection.",
  "Receives the patellar ligament, transmitting quadriceps force to the tibia.",
  "An attachment prominence below the tibial plateau.",
);
add(
  "Tibial plateau",
  "superior",
  "Proximal articular surface of the tibia.",
  "Supports the femoral condyles through the menisci.",
  "Includes medial and lateral surfaces separated by the intercondylar region.",
);
add(
  "Intercondylar eminence",
  "superior",
  "Raised region between the tibial condylar surfaces.",
  "Separates the articular surfaces and relates to meniscal/cruciate attachment areas.",
  "Includes medial and lateral intercondylar tubercles.",
);
add(
  "Medial malleolus",
  "front",
  "Distal medial projection of the tibia.",
  "Forms the medial side of the ankle mortise and provides deltoid ligament attachment.",
  "The lateral malleolus belongs to the fibula.",
);
add(
  "Soleal line",
  "back",
  "Oblique ridge on the posterior proximal tibia.",
  "Provides part of the origin of soleus.",
  "Distinct from the anterior tibial tuberosity.",
);
add(
  "Olecranon",
  "back",
  "Large proximal posterior projection of the ulna.",
  "Receives triceps insertion and enters the olecranon fossa in extension.",
  "Forms the point of the elbow.",
);
add(
  "Trochlear notch",
  "front",
  "Large proximal ulnar articular notch between olecranon and coronoid process.",
  "Articulates with the humeral trochlea at the elbow hinge.",
  "Different from the smaller radial notch on the lateral side.",
);
add(
  "Coronoid process of ulna",
  "front",
  "Anterior proximal ulnar projection below the trochlear notch.",
  "Provides stability and attachment; enters the humeral coronoid fossa in flexion.",
  "An anterior projection, not the posterior olecranon.",
);
add(
  "Radial tuberosity",
  "front",
  "Roughened proximal radial prominence distal to the neck.",
  "Receives the insertion of biceps brachii.",
  "The biceps tendon transmits force here for supination and elbow flexion.",
);
add(
  "Head of radius",
  "superior",
  "Disc-shaped proximal radial end.",
  "Articulates with the capitulum superiorly and the radial notch around its rim.",
  "Held against the ulna by the annular ligament.",
);
add(
  "Radial styloid process",
  "front",
  "Distal lateral radial projection.",
  "Provides ligament attachment and contributes to wrist stability.",
  "On the thumb side of the forearm in anatomical position.",
);
add(
  "Head of femur",
  "left",
  "Rounded proximal femoral articular surface.",
  "Articulates with the acetabular lunate surface to transfer load at the hip.",
  "Connected to the shaft by the neck; the fovea interrupts its articular surface.",
);
add(
  "Neck of femur",
  "front",
  "Narrow bridge between femoral head and shaft.",
  "Positions the head away from the shaft, permitting hip motion and providing leverage.",
  "Intracapsular anteriorly; distinct from the trochanteric region.",
);
add(
  "Greater trochanter",
  "front",
  "Large lateral proximal femoral projection.",
  "Provides attachment for gluteal and short external-rotator muscles.",
  "Lateral and larger than the lesser trochanter.",
);
add(
  "Lesser trochanter",
  "back",
  "Posteromedial proximal femoral projection.",
  "Receives the iliopsoas insertion.",
  "Best examined from a posterior or medial angle.",
);
add(
  "Linea aspera",
  "back",
  "Longitudinal roughened ridge on the posterior femoral shaft.",
  "Provides attachment for adductors and portions of the thigh musculature.",
  "Its lips diverge toward the supracondylar lines distally.",
);
add(
  "Intercondylar fossa",
  "back",
  "Deep notch between the posterior femoral condyles.",
  "Accommodates the cruciate-ligament attachment region and permits knee-joint mechanics.",
  "Posterior notch; the patellar surface is on the anterior side.",
);
add(
  "Medial condyle of femur",
  "back",
  "Medial rounded distal femoral articular region.",
  "Articulates with the medial tibial plateau through the meniscus.",
  "A joint surface, distinct from the medial epicondylar attachment prominence.",
);
add(
  "Lateral condyle of femur",
  "back",
  "Lateral rounded distal femoral articular region.",
  "Articulates with the lateral tibial plateau through the meniscus.",
  "The ACL attaches on its medial intercondylar surface.",
);
add(
  "Medial epicondyle of femur",
  "front",
  "Medial distal femoral attachment prominence.",
  "Provides tibial collateral-ligament attachment.",
  "Non-articular prominence above the medial condyle.",
);
add(
  "Lateral epicondyle of femur",
  "front",
  "Lateral distal femoral attachment prominence.",
  "Provides fibular collateral-ligament attachment.",
  "Non-articular prominence above the lateral condyle.",
);
add(
  "Patellar surface of femur",
  "front",
  "Anterior distal femoral groove between the condylar regions.",
  "Articulates with the posterior patellar surface during knee movement.",
  "Anterior and articular; different from the posterior intercondylar fossa.",
);
add(
  "Fovea for ligament of head of femur",
  "left",
  "Small depression on the femoral head.",
  "Receives attachment of the ligament of the femoral head.",
  "Non-articular interruption of the otherwise cartilage-covered head.",
);
const sourceModels = manifest.models;
const sourceId = (name: string) =>
  sourceModels.find((m) => m.sourceName === name && !("parentId" in m))?.id;
export const landmarks: AnatomyLandmark[] = anchorData.flatMap((a) => {
  const n = notes[a.name.toLowerCase()];
  if (!n) return [];
  const context = [a.modelId];
  if (a.name === "Intervertebral foramen")
    for (const name of ["Vertebra L2", "Intervertebral disc L2-L3"]) {
      const id = sourceId(name);
      if (id) context.push(id);
    }
  return [
    {
      id: a.id,
      name: n.name || a.name,
      sourceName: a.name,
      modelId: a.modelId,
      anchor: a.anchor,
      view: n.view,
      location: n.location,
      function: n.function,
      features: n.features,
      contents: n.contents,
      contextIds: context,
      source:
        "Anchor: Z-Anatomy source annotation endpoint and bone association (Hook or validated static line). Explanatory notes: OpenStax Anatomy and Physiology 2e, chapters 7–9; introductory anatomy review.",
      quiz: !!n.quiz,
    },
  ];
});
export function landmarksFor(modelId: string) {
  const priority = [
    "Vertebral foramen",
    "Spinous process",
    "Vertebral body",
    "Transverse process",
    "Pedicle of vertebral arch",
    "Lamina of vertebral arch",
    "Superior articular facet of vertebra",
    "Inferior articular facet of vertebra",
  ];
  return landmarks
    .filter((l) => l.modelId === modelId)
    .sort(
      (a, b) =>
        (priority.includes(a.name) ? priority.indexOf(a.name) : 100) -
        (priority.includes(b.name) ? priority.indexOf(b.name) : 100),
    );
}
export const spineModels = sourceModels.filter(
  (m) =>
    m.layer === "bones" &&
    /^(Atlas|Axis|.* vertebra|Sacrum|Coccyx)$/.test(m.name) &&
    !m.parentId,
);
export function spineCode(name: string) {
  if (name === "Atlas") return "C1";
  if (name === "Axis") return "C2";
  const m = sourceModels.find((m) => m.name === name && m.layer === "bones");
  return m?.sourceName?.match(/Vertebra ([CTL]\d+)/)?.[1] || name;
}
export function spineRegion(name: string) {
  return name === "Atlas" || name === "Axis" || /cervical/.test(name)
    ? "Cervical"
    : /thoracic/.test(name)
      ? "Thoracic"
      : /lumbar/.test(name)
        ? "Lumbar"
        : /Sacrum/.test(name)
          ? "Sacral"
          : "Coccygeal";
}
export const spineRegionNotes: Record<string, string> = {
  Cervical:
    "Small bodies and paired transverse foramina characterize the cervical region. C1 is a ring without a body; C2 bears the dens. C7 often has a long, non-bifid spinous process.",
  Thoracic:
    "Rib facets distinguish the thoracic region. Typical thoracic spinous processes slope inferiorly; the vertebral foramen is relatively circular. T1 and T10–T12 have important facet variations.",
  Lumbar:
    "Large weight-bearing bodies, broad spinous processes, and predominantly sagittal facet orientation characterize the lumbar region. The vertebral foramen is generally triangular.",
  Sacral:
    "Five sacral vertebrae usually fuse into the sacrum. The sacral canal, anterior/posterior foramina, and sacroiliac surfaces remain important landmarks.",
  Coccygeal:
    "The coccyx usually has four segments, with normal variation. It gives attachment to pelvic-floor muscles and ligaments and articulates with the sacral apex.",
};
