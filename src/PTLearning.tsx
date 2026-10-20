import { PTAnatomy } from "./PTAnatomy";
import { useState } from "react";
export const clinicalSources = {
  kneeMotion: {
    name: "AAOS OrthoInfo — Total Knee Replacement Exercise Guide (post-operative context)",
    url: "https://orthoinfo.aaos.org/en/recovery/total-knee-replacement-exercise-guide/",
  },
  functional: {
    name: "NHS — Strength exercises (including sit-to-stand)",
    url: "https://www.nhs.uk/live-well/exercise/strength-and-flex-exercise-plan/strength-exercises/",
  },
  shoulder: {
    name: "AAOS OrthoInfo — Rotator Cuff and Shoulder Conditioning Program",
    url: "https://orthoinfo.aaos.org/en/recovery/rotator-cuff-and-shoulder-conditioning-program/",
  },
  knee: {
    name: "AAOS OrthoInfo — Knee Conditioning Program",
    url: "https://orthoinfo.aaos.org/en/recovery/knee-conditioning-program/",
  },
  ankle: {
    name: "AAOS OrthoInfo — Foot and Ankle Conditioning Program",
    url: "https://orthoinfo.aaos.org/en/recovery/foot-and-ankle-conditioning-program/",
  },
  back: {
    name: "AAOS OrthoInfo — Spine Conditioning Program",
    url: "https://orthoinfo.aaos.org/en/recovery/spine-conditioning-program/",
  },
  sprain: {
    name: "NHS — Sprains and strains",
    url: "https://www.nhs.uk/conditions/sprains-and-strains/",
  },
  meniscus: {
    name: "AAOS OrthoInfo — Meniscus Tears",
    url: "https://orthoinfo.aaos.org/en/diseases--conditions/meniscus-tears/",
  },
};
type Exercise = {
  name: string;
  region: string;
  targets: string;
  purpose: string;
  technique: string;
  mistakes: string;
  precautions: string;
  regression: string;
  progression: string;
  source: keyof typeof clinicalSources;
};
export const exercises: Exercise[] = [
  {
    name: "Supported heel slide",
    region: "Knee",
    targets: "Knee joint motion; quadriceps/hamstring coordination",
    purpose:
      "An example of gentle active-assisted knee mobility when permitted.",
    technique:
      "Lie or sit supported. Slide the heel toward the body within a comfortable allowed range, then return with control.",
    mistakes:
      "Forcing end range, twisting the knee, or lifting the hip to substitute.",
    precautions:
      "Post-operative flexion limits, repairs, swelling, or a locked knee require individual guidance. Do not force a block.",
    regression: "Smaller supported range or clinician-assisted movement.",
    progression: "Less assistance, then functional movement when cleared.",
    source: "kneeMotion",
  },
  {
    name: "Sit-to-stand",
    region: "Knee",
    targets: "Quadriceps, gluteal muscles; hip/knee coordination",
    purpose: "Practice a common functional task and graded lower-limb loading.",
    technique:
      "Use a stable chair. Place feet securely, lean the trunk forward, stand with controlled knee alignment, and sit slowly.",
    mistakes:
      "An unstable chair, uncontrolled collapse, or loading beyond tolerance.",
    precautions:
      "Fall risk, weight-bearing restrictions, recent surgery, pain, or dizziness may require supervision and a different task.",
    regression: "Higher chair and arm support.",
    progression:
      "Lower chair, less support, or graded resistance after assessment.",
    source: "functional",
  },
  {
    name: "Supported shoulder pendulum",
    region: "Shoulder",
    targets: "Shoulder mobility with arm support from gravity",
    purpose:
      "Illustrate gentle shoulder motion; not a strengthening treatment for every injury.",
    technique:
      "Support the other hand on a stable surface, hinge slightly at the hips, relax the arm, and allow small body-driven movement.",
    mistakes:
      "Actively swinging hard with the shoulder or making large forced circles.",
    precautions:
      "Acute dislocation, fracture, post-operative restrictions, or increasing symptoms need clinician guidance.",
    regression: "Smaller movement with more support.",
    progression: "Clinician-approved active-assisted then active movement.",
    source: "shoulder",
  },
  {
    name: "External rotation with light resistance",
    region: "Shoulder",
    targets: "Infraspinatus and teres minor; shoulder control",
    purpose:
      "Example of graded rotator-cuff loading after appropriate assessment.",
    technique:
      "Keep the elbow near the side with a comfortable bend. Rotate the forearm outward through an allowed range without moving the trunk.",
    mistakes: "Shrugging, rotating the trunk, or forcing excessive resistance.",
    precautions:
      "Cuff tears, instability, acute pain, and surgical repairs have different loading limits. Stop with sharp or increasing symptoms.",
    regression: "No resistance or clinician-approved isometric effort.",
    progression:
      "Gradually greater resistance or task-specific positions when appropriate.",
    source: "shoulder",
  },
  {
    name: "Supported heel raise",
    region: "Ankle",
    targets: "Gastrocnemius/soleus and plantar-flexor control",
    purpose: "Example of calf loading and ankle function practice.",
    technique:
      "Hold stable support. Rise onto the forefeet with control, then lower without bouncing.",
    mistakes:
      "Rolling the ankle outward, bouncing, or removing support before balance is safe.",
    precautions:
      "Achilles rupture/repair, acute injury, weight-bearing limits, and fall risk change suitability.",
    regression: "Seated or bilateral version with greater support.",
    progression:
      "Less support or single-leg loading when assessed and cleared.",
    source: "ankle",
  },
  {
    name: "Supported balance practice",
    region: "Ankle",
    targets: "Postural control and lower-limb sensorimotor coordination",
    purpose:
      "Illustrate balance training as one element of functional recovery.",
    technique:
      "Stand near fixed support with a safe clear space. Narrow the base of support only as far as control allows.",
    mistakes:
      "Closing the eyes or using an unstable surface before safe control is established.",
    precautions:
      "Fall risk, neuropathy, vestibular symptoms, or acute injury warrant supervision.",
    regression: "Wider stance, both hands supported.",
    progression:
      "Less hand support, stepping tasks, or task-specific challenges under suitable supervision.",
    source: "ankle",
  },
  {
    name: "Supine abdominal bracing",
    region: "Spine",
    targets: "Trunk muscle coordination and comfortable spinal movement",
    purpose:
      "Example of learning controlled movement; no single exercise corrects all back pain.",
    technique:
      "Lie supported with knees comfortably bent. Gently tighten the abdominal wall while continuing to breathe; keep the pelvis and ribs comfortable rather than forcing the back flat.",
    mistakes:
      "Forcing a painful direction, bracing maximally, or holding the breath.",
    precautions:
      "New weakness, saddle numbness, bladder/bowel change, major trauma, fever, or unexplained systemic symptoms need urgent assessment.",
    regression: "More support and a smaller range.",
    progression:
      "Task-specific movement or resistance based on examination and tolerance.",
    source: "back",
  },
];
const conditions = [
  {
    region: "Knee",
    name: "ACL injury and meniscal injury",
    anatomy:
      "The ACL restrains anterior tibial translation and contributes to rotational control. Menisci are fibrocartilage that distribute load; articular hyaline cartilage is different tissue.",
    goals:
      "Protect the involved tissue or repair, manage swelling, recover permitted motion, restore strength and movement control, and assess readiness for sport or work.",
    caution:
      "Surgery, repair type, instability, locking, and associated injuries change rehabilitation. Return-to-sport decisions require criteria and professional assessment.",
    source: "meniscus" as const,
  },
  {
    region: "Shoulder",
    name: "Rotator-cuff-related symptoms",
    anatomy:
      "Supraspinatus, infraspinatus, teres minor and subscapularis help control the humeral head. Pain does not establish a tear or identify a single tissue.",
    goals:
      "Understand aggravating loads, maintain appropriate movement, progressively restore capacity and functional tolerance.",
    caution:
      "Trauma with major weakness, suspected dislocation, progressive neurological signs, or post-operative restrictions require assessment.",
    source: "shoulder" as const,
  },
  {
    region: "Ankle",
    name: "Lateral ankle sprain",
    anatomy:
      "The anterior talofibular and calcaneofibular ligaments may be involved. Fracture and syndesmotic injury are different problems requiring assessment.",
    goals:
      "Protect as appropriate, regain movement and weight-bearing capacity when allowed, rebuild strength, balance, and task-specific control.",
    caution:
      "Deformity, inability to bear weight after injury, marked bony tenderness, or neurovascular symptoms need clinical assessment.",
    source: "sprain" as const,
  },
  {
    region: "Spine",
    name: "Back pain and movement tolerance",
    anatomy:
      "Symptoms may involve several structures and are not reliably diagnosed from an anatomy model alone.",
    goals:
      "Support safe activity and function, address modifiable limitations, and choose graded movement based on the presentation.",
    caution:
      "Urgent assessment is needed for new bladder/bowel dysfunction, saddle sensory change, or progressive major weakness.",
    source: "back" as const,
  },
];
export function PTLearning({
  initialRegion,
  onExplore,
  onStructure,
}: {
  initialRegion?: string;
  onExplore: (region: string) => void;
  onStructure: (id: string) => void;
}) {
  const initial = /upper|shoulder/i.test(initialRegion || "")
    ? "Shoulder"
    : /lower|knee/i.test(initialRegion || "")
      ? "Knee"
      : "Knee";
  const [region, setRegion] = useState(initial);
  const [view, setView] = useState("Anatomy & injuries");
  const [exerciseFilter, setExerciseFilter] = useState("All");
  const condition = conditions.find((c) => c.region === region)!;
  return (
    <section className="learning-page">
      <p className="eyebrow">CONNECT ANATOMY TO MOVEMENT</p>
      <h1>Physical Therapy / Athletic Training</h1>
      <p className="education-note">
        Educational study, not a diagnosis or personalized rehabilitation plan.
        Study anatomy, injury concepts and exercise technique. For an injury,
        persistent symptoms or post-operative care, a clinician should decide
        which movements and loads are appropriate.
      </p>
      <div className="learning-toolbar">
        <label>
          Region{" "}
          <select
            aria-label="PT region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            {conditions.map((c) => (
              <option key={c.region}>{c.region}</option>
            ))}
          </select>
        </label>
        {[
          "Anatomy & injuries",
          "Healing & approaches",
          "Exercise examples",
        ].map((n) => (
          <button key={n} aria-pressed={view === n} onClick={() => setView(n)}>
            {n}
          </button>
        ))}
        <button
          onClick={() => onExplore(region === "Ankle" ? "Lower limbs" : region)}
        >
          Open anatomy
        </button>
      </div>
      <div className="pt-region-tabs">
        {conditions.map((c) => (
          <button
            key={c.region}
            aria-pressed={region === c.region}
            onClick={() => {
              setRegion(c.region);
              setExerciseFilter("All");
            }}
          >
            <span>{c.region}</span>
            <small>
              {c.region === "Knee"
                ? "Load & stability"
                : c.region === "Shoulder"
                  ? "Cuff & movement"
                  : c.region === "Ankle"
                    ? "Balance & push-off"
                    : "Trunk & daily function"}
            </small>
          </button>
        ))}
      </div>
      {view === "Anatomy & injuries" ? (
        <>
          <PTAnatomy region={region} onSelect={onStructure} />

          <article className="learning-card">
            <h2>{condition.name}</h2>
            <h3>Structures and relationships</h3>
            <p>{condition.anatomy}</p>
            <h3>General rehabilitation goals</h3>
            <p>{condition.goals}</p>
            <h3>Assessment matters</h3>
            <p>{condition.caution}</p>
            <SourceLink source={condition.source} />
          </article>
        </>
      ) : view === "Healing & approaches" ? (
        <div className="learning-grid">
          <article className="learning-card">
            <h2>Healing is not a fixed calendar</h2>
            <p>
              Inflammation, proliferation/repair, and remodeling overlap.
              Vascularity, tissue type, injury severity, surgery, health, and
              loading influence the course. Symptom improvement does not by
              itself establish tissue readiness.
            </p>
            <h3>Educational goals</h3>
            <ul>
              <li>
                Early: protect when appropriate, identify serious injury, manage
                symptoms, and maintain safe function.
              </li>
              <li>
                Repair: recover permitted movement and progressively rebuild
                capacity.
              </li>
              <li>
                Remodeling/function: develop strength, balance, endurance, and
                task-specific tolerance with appropriate assessment.
              </li>
            </ul>
            <p>
              These stages are concepts, not a schedule or permission to
              progress.
            </p>
          </article>
          <article className="learning-card">
            <h2>Why approaches are used</h2>
            <p>
              <strong>Mobility:</strong> address an identified movement
              limitation within allowed ranges.
            </p>
            <p>
              <strong>Strength/loading:</strong> build capacity appropriate to
              tissue and task; loading is not automatically suitable immediately
              after injury.
            </p>
            <p>
              <strong>Balance and functional training:</strong> practice control
              and activity demands.
            </p>
            <p>
              <strong>Manual therapy or symptom-relief modalities:</strong> may
              be adjuncts in selected circumstances. They do not guarantee
              healing and do not replace examination, education, or suitable
              active rehabilitation.
            </p>
            <SourceLink source="sprain" />
          </article>
        </div>
      ) : (
        <>
          <div className="pt-exercise-intro">
            <h2>Understand the movement</h2>
            <p>
              Choose an example to study its target, setup and control. These
              examples have no prescribed dose or automatic progression. Use the
              linked clinical demonstrations and your clinician's restrictions.
            </p>
            <div className="segmented">
              {["All", "Mobility", "Strength / function", "Balance"].map(
                (f) => (
                  <button
                    key={f}
                    aria-pressed={exerciseFilter === f}
                    onClick={() => setExerciseFilter(f)}
                  >
                    {f}
                  </button>
                ),
              )}
            </div>
          </div>
          <div className="learning-grid pt-exercise-grid">
            {exercises
              .filter((e) => e.region === region)
              .filter(
                (e) =>
                  exerciseFilter === "All" ||
                  (exerciseFilter === "Mobility"
                    ? /slide|pendulum|trunk|bracing/i.test(e.name)
                    : exerciseFilter === "Balance"
                      ? /balance/i.test(e.name)
                      : !/slide|pendulum|balance|trunk/i.test(e.name)),
              )
              .map((e) => (
                <article className="learning-card" key={e.name}>
                  <span className="pt-movement-kind">
                    {/slide|pendulum|trunk|bracing/i.test(e.name)
                      ? "MOBILITY / CONTROL"
                      : /balance/i.test(e.name)
                        ? "BALANCE"
                        : "STRENGTH / FUNCTION"}
                  </span>
                  <h2>{e.name}</h2>
                  <p className="pt-targets">{e.targets}</p>
                  <p>{e.purpose}</p>
                  <div className="pt-technique">
                    <h3>How the example works</h3>
                    <p>{e.technique}</p>
                  </div>
                  <details>
                    <summary>
                      Technique checks, precautions & variations
                    </summary>
                    {(
                      [
                        "mistakes",
                        "precautions",
                        "regression",
                        "progression",
                      ] as const
                    ).map((k) => (
                      <div key={k}>
                        <h3>{k[0].toUpperCase() + k.slice(1)}</h3>
                        <p>{e[k]}</p>
                      </div>
                    ))}
                  </details>
                  <SourceLink source={e.source} />
                  <small>
                    Source link offers clinician-authored
                    instructions/illustrations. No video or protocol is embedded
                    or reproduced; follow individual clinical advice.
                  </small>
                </article>
              ))}
          </div>
        </>
      )}
      <footer className="source-review">
        <strong>Source and review status</strong>
        <p>
          General anatomy: OpenStax Anatomy and Physiology 2e, chapters 4, 9,
          11. Educational content revised October 20, 2026. Live AAOS/NHS
          retrieval was blocked by this environment’s network policy, so the
          linked pages, their latest revision dates, and current clinical
          recommendations have not been verified. This section is introductory
          and does not reproduce or claim to implement a current treatment
          guideline. Clinical-source verification remains on the implementation
          checklist.
        </p>
      </footer>
    </section>
  );
}
function SourceLink({ source }: { source: keyof typeof clinicalSources }) {
  const s = clinicalSources[source];
  return (
    <p>
      <a href={s.url} target="_blank" rel="noreferrer">
        View clinical instructions & demonstrations ↗
      </a>
      <br />
      <small>{s.name}</small>
    </p>
  );
}
