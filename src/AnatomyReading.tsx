import data from "./generated/atlas-readings.json";
type Reading = {
  name: string;
  url: string;
  history: string;
  sections: { heading: string; text: string }[];
  credit: string;
};
const notes = data.notes as Record<string, Reading>,
  models = data.models as Record<string, { reading: string; scope: string }>;
export function readingFor(id: string) {
  const match =
    models[id] ||
    (data.landmarks as Record<string, { reading: string; scope: string }>)[id];
  return match ? { ...notes[match.reading], scope: match.scope } : undefined;
}
export function AnatomyReading({
  id,
  topic = "all",
}: {
  id: string;
  topic?: "all" | "attachments" | "landmarks";
}) {
  const reading = readingFor(id);
  if (!reading) return null;
  const sections = reading.sections.filter((s) =>
    topic === "all" || topic === "attachments"
      ? topic === "all" ||
        /structure|origin|insertion|attachment|innervation|nerve supply|blood supply|relations|actions|function/i.test(
          s.heading,
        )
      : /structure|surfaces|parts|borders|articulation|anatomy|identification|relations|boundaries/i.test(
          s.heading,
        ),
  );
  if (!sections.length) return null;
  return (
    <details className="anatomy-reading">
      <summary>Anatomy reference · {reading.name}</summary>
      <p className="small muted">
        {reading.scope}. Archived anatomy text, distinct from a source-anchored
        3D annotation. Attachments described in text are not automatically
        mapped to mesh points.
      </p>
      {sections.map((s, i) => (
        <section key={i}>
          <h4>{s.heading}</h4>
          <p style={{ whiteSpace: "pre-wrap" }}>{s.text}</p>
        </section>
      ))}
      <p>
        <a href={reading.url} target="_blank" rel="noreferrer">
          Wikipedia article
        </a>{" "}
        ·{" "}
        <a href={reading.history} target="_blank" rel="noreferrer">
          Contributor history
        </a>
      </p>
      <small>
        {reading.credit} Source archive: Z-Anatomy {data.revision}. Anatomical
        sections selected; clinical/animal/variation sections omitted. These
        excerpts are not a verified current clinical guideline.
      </small>
    </details>
  );
}
