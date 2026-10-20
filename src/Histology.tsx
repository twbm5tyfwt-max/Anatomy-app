import { anatomyImages } from "./assetPaths";
import { useState } from "react";
import { tissues, type Tissue } from "./content";
import { TissueDiagram } from "./TissueDiagram";
import sources from "./generated/histology.json";
const plates = anatomyImages;
export function HistologyFigure({ tissue }: { tissue: Tissue }) {
  const exact: Record<string, string> = {
    pseudostratified: "2304_Pseudostratified_Epithelium.jpg",
    "simple-squamous": "2310_Structures_of_the_Respiratory_Zone.jpg",
    "simple-cuboidal": "2615_Juxtaglomerular_Apparatus.jpg",
    "simple-columnar": "2421_Histology_of_the_Large_IntestineN.jpg",
    keratinized: "503_Epidermis.jpg",
    nonkeratinized: "401_Types_of_Tissue.jpg",
    areolar: "408_Connective_Tissue.jpg",
    adipose: "409_Adipose_Tissue.jpg",
    reticular: "410_Reticular_Tissue.jpg",
    "spongy-bone": "606_Spongy_Bone.jpg",
    blood: "424_Blood_A_Fluid_Connective_Tissue-new.jpg",
    "dense-regular": "411_Reg_Dense-Irregular_Dense.jpg",
    "dense-irregular": "411_Reg_Dense-Irregular_Dense.jpg",
  };
  const file =
    exact[tissue.id] ||
    (tissue.class === "Muscle"
      ? "414_Skeletal_Smooth_Cardiac.jpg"
      : tissue.class === "Nervous"
        ? "416_Nervous_Tissue-new.jpg"
        : /cartilage|hyaline/.test(tissue.id)
          ? "412_Types_of_Cartilage-new.jpg"
          : "401_Types_of_Tissue.jpg");
  if (
    [
      "stratified-cuboidal",
      "stratified-columnar",
      "transitional",
      "elastic",
      "compact-bone",
    ].includes(tissue.id)
  )
    return (
      <section className="matching-microscopy-unavailable">
        <h3>{tissue.name} · identification diagram</h3>
        <p>
          A matched published specimen is not bundled for this subtype. This
          labeled educational diagram shows the relevant features; it is not a
          micrograph.
        </p>
        <TissueDiagram tissue={tissue} labels />
        <p>Source: OpenStax Anatomy and Physiology 2e, chapter 4 / §6.3.</p>
      </section>
    );
  const source = sources.find((s) => s.file === file);
  return (
    <figure className="histology-figure">
      <img
        src={plates[file]}
        alt={`${source?.title || "Epithelial tissue"} — published reference plate with micrographs and embedded source labels`}
      />
      <figcaption>
        <strong>
          Published microscopy reference plate · embedded labels remain visible
        </strong>
        {tissue.id === "simple-cuboidal" && (
          <p>
            This renal reference includes a glomerulus and surrounding tubules.
            It contains several tissue types; compare the tubular epithelium
            with the selected tissue's diagram.
          </p>
        )}
        {file === "401_Types_of_Tissue.jpg" && (
          <p>
            This is an overview plate; its epithelial micrograph is stratified
            squamous. A matching specimen is not bundled for every selected
            subtype. The educational diagram shows the selected tissue.
          </p>
        )}
        <p>
          {source?.caption ||
            "OpenStax epithelial reference plate: diagrams and light micrographs. Micrographs provided by the Regents of University of Michigan Medical School © 2012. Some panels show animal tissue; use the caption for the specimen."}
        </p>
        <p>
          {source?.license ||
            "OpenStax CC BY-NC-SA 4.0; micrograph credits retained."}{" "}
          <a
            href={
              source?.source ||
              "https://openstax.org/books/anatomy-and-physiology-2e/pages/4-2-epithelial-tissue"
            }
            target="_blank"
            rel="noreferrer"
          >
            Source & full context
          </a>
        </p>
        <small>
          This is a comparison plate, not a patient-specific sample from the
          selected 3D surface. Actual microscope magnification changes with
          display size.
        </small>
      </figcaption>
    </figure>
  );
}
export function TissueBridge({
  id,
  alveoli,
  onClose,
}: {
  id: string;
  alveoli?: boolean;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(
    tissues.some((t) => t.id === id) ? id : "areolar",
  );
  const [tab, setTab] = useState(alveoli ? "airway" : "diagram");
  const [labels, setLabels] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [compare, setCompare] = useState("");
  const tissue = tissues.find((t) => t.id === selected)!,
    other = tissues.find((t) => t.id === compare);
  return (
    <div className="modal-backdrop">
      <section
        className="modal tissue-bridge"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tissue-bridge-title"
      >
        <button
          className="modal-close icon-button"
          aria-label="Return to body"
          onClick={onClose}
        >
          ×
        </button>
        <p className="eyebrow">
          BODY → STRUCTURE → TISSUE → MICROSCOPIC FEATURES
        </p>
        <h2 id="tissue-bridge-title">{tissue.name}</h2>
        <p>
          Your body selection, camera, and layer settings stay in place behind
          this view.
        </p>
        <div className="segmented">
          <button
            onClick={() => setTab("diagram")}
            aria-pressed={tab === "diagram"}
          >
            Educational diagram
          </button>
          <button
            onClick={() => setTab("micro")}
            aria-pressed={tab === "micro"}
          >
            Microscopy reference
          </button>
          {(alveoli || id === "cardiac-muscle") && (
            <button onClick={() => setTab("airway")}>
              Organ teaching section
            </button>
          )}
        </div>
        <label>
          Associated tissue{" "}
          <select
            aria-label="Associated tissue"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {tissues.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Compare with{" "}
          <select
            aria-label="Compare associated tissue"
            value={compare}
            onChange={(e) => setCompare(e.target.value)}
          >
            <option value="">None</option>
            {tissues
              .filter((t) => t.id !== selected)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Zoom{" "}
          <input
            aria-label="Tissue zoom"
            type="range"
            min="1"
            max="3"
            step=".25"
            value={zoom}
            onChange={(e) => setZoom(+e.target.value)}
          />
        </label>
        {tab === "diagram" && (
          <label>
            <input
              type="checkbox"
              checked={labels}
              onChange={(e) => setLabels(e.target.checked)}
            />
            Diagram labels
          </label>
        )}
        <div className="bridge-visual" style={{ overflow: "auto" }}>
          <div style={{ width: `${zoom * 100}%` }}>
            {tab === "micro" ? (
              <HistologyFigure tissue={tissue} />
            ) : tab === "airway" ? (
              alveoli ? (
                <AirwayGuide />
              ) : (
                <HeartSection />
              )
            ) : (
              <TissueDiagram tissue={tissue} labels={labels} />
            )}
          </div>
        </div>
        <h3>Identify it</h3>
        <p>{tissue.clues}</p>
        <p>
          <strong>Function:</strong> {tissue.function}
        </p>
        <p>
          <strong>Where:</strong> {tissue.location}
        </p>
        <p>
          <strong>Compare:</strong> {tissue.compare}
        </p>
        <div className="feature-tags">
          {tissue.features.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>
        {other && (
          <section>
            <h3>{other.name} comparison</h3>
            {tab === "micro" ? (
              <HistologyFigure tissue={other} />
            ) : (
              <TissueDiagram tissue={other} labels={labels} />
            )}
            <p>
              {other.clues} {other.function}
            </p>
          </section>
        )}
        <button className="primary" onClick={onClose}>
          Return to my body view
        </button>
      </section>
    </div>
  );
}
export function AirwayGuide() {
  const [stage, setStage] = useState(0);
  const names = [
    "Bronchus",
    "Bronchiole",
    "Alveolar duct",
    "Alveolar sac",
    "Alveolus",
  ];
  const descriptions = [
    "Cartilage and smooth muscle support conducting bronchi. The source atlas models the larger bronchial tree.",
    "Smaller conducting airways have no cartilage. Smooth muscle regulates caliber; terminal bronchioles end the conducting zone.",
    "Respiratory bronchioles and then alveolar ducts lead into the gas-exchanging region. Alveoli open along the duct.",
    "Clusters of alveoli share a common opening. This schematic shows a group, not a measured reconstruction.",
    "Thin type I alveolar epithelium, fused basal laminae and capillary endothelium form a diffusion barrier. Type II cells make surfactant; macrophages provide defense. Oxygen diffuses into blood and carbon dioxide into alveolar air.",
  ];
  return (
    <section>
      <strong>
        Linked magnified airway schematic · not a 3D cut or to scale
      </strong>
      <div className="airway-stages">
        {names.map((n, i) => (
          <button
            key={n}
            aria-pressed={i === stage}
            onClick={() => setStage(i)}
          >
            {n}
          </button>
        ))}
      </div>
      <svg
        viewBox="0 0 600 280"
        role="img"
        aria-label="Airway branches into alveolar ducts and clusters of alveoli"
      >
        <path
          d="M30 135H180L270 85M180 135L270 190M270 85L350 60M270 85L350 110M270 190L350 160M270 190L350 230"
          fill="none"
          stroke="#c8a5a0"
          strokeWidth={stage < 2 ? 22 : 12}
        />
        {[
          [390, 60],
          [390, 130],
          [390, 205],
        ].map(([x, y], i) => (
          <g key={i}>
            {[
              [0, 0],
              [35, -20],
              [40, 20],
              [10, 40],
              [-20, 20],
            ].map(([dx, dy], j) => (
              <ellipse
                key={j}
                cx={x + dx}
                cy={y + dy}
                rx="25"
                ry="22"
                fill={stage >= 3 ? "#f5c4c2" : "#e6d7d1"}
                stroke="#b66776"
                strokeWidth="3"
              />
            ))}
            <path
              d={`M${x - 22} ${y - 26}q85 0 75 65`}
              fill="none"
              stroke="#7f9fca"
              strokeWidth="6"
            />
          </g>
        ))}
      </svg>
      <h3>{names[stage]}</h3>
      <p>{descriptions[stage]}</p>
      <p>
        Gross bronchi, microscopic airways, and alveolar diagrams are different
        scales. Bronchioles/alveoli are not individually segmented in this
        source model. Source: OpenStax Anatomy and Physiology 2e, §§22.1–22.4.
      </p>
    </section>
  );
}
export function HeartSection() {
  return (
    <section>
      <strong>
        Prepared educational heart section · schematic, not a cut through the 3D
        mesh
      </strong>
      <svg
        viewBox="0 0 600 360"
        role="img"
        aria-label="Schematic four-chamber heart with atrioventricular valves and septum"
      >
        <path
          d="M290 45C100 -10 55 105 155 265L300 335L450 265C555 105 500 -10 310 45Z"
          fill="#d58c98"
          stroke="#9e5268"
          strokeWidth="10"
        />
        <path d="M300 55V310M130 160H470" stroke="#974f63" strokeWidth="15" />
        <path
          d="M165 157l25 25 25-25M370 157l25 25 25-25"
          fill="none"
          stroke="#faf1d7"
          strokeWidth="7"
        />
        {[
          ["Right atrium", 200, 105],
          ["Left atrium", 390, 105],
          ["Right ventricle", 205, 225],
          ["Left ventricle", 390, 225],
          ["Septum", 300, 345],
        ].map(([n, x, y]) => (
          <text
            key={n}
            x={x}
            y={y}
            textAnchor="middle"
            fontSize="17"
            fill="#362639"
          >
            {n}
          </text>
        ))}
      </svg>
      <p>
        Anatomical right appears on your left in an anterior schematic. The
        tricuspid valve joins right atrium to right ventricle; the mitral valve
        joins left atrium to left ventricle. Interatrial and interventricular
        septa separate the sides. Pulmonary and aortic valves guard the
        ventricular outflows (not drawn here). The source model offers only a
        subset of separately named valve leaflets; it is not a complete
        cross-sectional heart atlas. Source: OpenStax Anatomy and Physiology 2e,
        §19.1.
      </p>
    </section>
  );
}
