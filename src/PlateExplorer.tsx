import { useState } from "react";
import { anatomyImages } from "./assetPaths";
import plates from "./generated/organ-plates.json";
import { modelParts } from "./modelCatalog";
const bodyPlates = [
  {
    region: "Muscles",
    file: "1105_Anterior_and_Posterior_Views_of_Muscles.jpg",
    title: "Anterior and posterior muscular anatomy",
    caption:
      "Original labeled OpenStax overview. Superficial and selected deeper muscles are illustrated in the same published plate.",
    source:
      "https://openstax.org/books/anatomy-and-physiology-2e/pages/11-2-naming-skeletal-muscles",
  },
  {
    region: "Skeleton",
    file: "701_Axial_Skeleton-01.jpg",
    title: "Axial and appendicular skeleton",
    caption:
      "Original labeled skeletal reference. Printed source labels remain visible.",
    source:
      "https://openstax.org/books/anatomy-and-physiology-2e/pages/7-1-divisions-of-the-skeletal-system",
  },
];
export const referencePlates = [...bodyPlates, ...plates];
export function plateFor(region: string) {
  return (
    referencePlates.find((p) => p.region === region) ||
    referencePlates.find((p) =>
      region.toLowerCase().includes(p.region.toLowerCase()),
    )
  );
}
export function PublishedPlate({ region }: { region: string }) {
  const [zoom, setZoom] = useState(1);
  const plate = plateFor(region);
  if (!plate)
    return <p>No corresponding published section is bundled for this organ.</p>;
  return (
    <section className="published-plate">
      <div className="plate-zoom">
        <strong>{plate.title}</strong>
        <button
          aria-label="Zoom reference out"
          onClick={() => setZoom((v) => Math.max(1, v - 0.25))}
        >
          −
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button
          aria-label="Zoom reference in"
          onClick={() => setZoom((v) => Math.min(4, v + 0.25))}
        >
          +
        </button>
        <button onClick={() => setZoom(1)}>Fit</button>
      </div>
      <div className="published-plate-image">
        <img
          style={{ width: zoom * 100 + "%", maxWidth: "none" }}
          src={anatomyImages[plate.file]}
          alt={plate.title}
        />
      </div>
      <p>{plate.caption}</p>
      <small>
        Published labeled illustration / reference plate; this is not a new cut
        through your 3D model. Original source labels are embedded. OpenStax /
        Rice University, CC BY-NC-SA 4.0.{" "}
      </small>
      <a href={plate.source} target="_blank" rel="noreferrer">
        Source & caption
      </a>
    </section>
  );
}
export function PlateExplorer({
  initial = "Muscles",
  on3D,
  onTissue,
}: {
  initial?: string;
  on3D: (id?: string) => void;
  onTissue: () => void;
}) {
  const [region, setRegion] = useState(initial),
    [search, setSearch] = useState("");
  const matches = modelParts
    .filter(
      (m) =>
        !m.parentId &&
        m.layer !== "attachment" &&
        search.length > 1 &&
        m.name.toLowerCase().includes(search.toLowerCase()),
    )
    .slice(0, 25);
  return (
    <section className="plate-explorer panel">
      <header>
        <div>
          <p className="eyebrow">PUBLISHED ANATOMY · CLEAR SOURCE LABELS</p>
          <h2>2D reference atlas</h2>
          <p>
            Study high-resolution plates, zoom into labels, then locate the
            structure in 3D.
          </p>
        </div>
        <button onClick={() => on3D()}>Return to 3D</button>
      </header>
      <div className="plate-explorer-layout">
        <aside>
          <label>
            Reference plate
            <select
              aria-label="2D reference plate"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              {referencePlates.map((p) => (
                <option key={p.region} value={p.region}>
                  {p.region}
                </option>
              ))}
            </select>
          </label>
          <label>
            Find linked 3D anatomy
            <input
              aria-label="Find 3D structure from plate"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. humerus or meniscus"
            />
          </label>
          {matches.map((m) => (
            <button key={m.id} onClick={() => on3D(m.id)}>
              {m.name} ↗
            </button>
          ))}
          <button onClick={onTissue}>Explore tissue & microscopy</button>
          <p>
            Plate labels are part of the published image. Search opens the
            corresponding source model; clicks on the plate are not automatic
            anatomical identification.
          </p>
        </aside>
        <PublishedPlate key={region} region={region} />
      </div>
    </section>
  );
}
