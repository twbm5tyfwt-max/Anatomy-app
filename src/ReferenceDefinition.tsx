import data from "./generated/reference-definitions.json";
const models = data.models as Record<string, { term: string; match: string }>;
const terms = data.terms as Record<
  string,
  { id: string; name: string; definition: string; citations: string }
>;
export function definitionFor(id: string) {
  const match = models[id];
  return match ? { ...terms[match.term], match: match.match } : undefined;
}
export function ReferenceDefinition({ id }: { id: string }) {
  const term = definitionFor(id);
  if (!term) return null;
  return (
    <section className="reference-definition">
      <h4>Published anatomical definition</h4>
      <p>{term.definition}</p>
      <p>
        <a
          href={`https://purl.obolibrary.org/obo/${term.id.replace(":", "_")}`}
          target="_blank"
          rel="noreferrer"
        >
          {term.name} · {term.id}
        </a>
      </p>
      <small>
        Uberon {data.version}, CC BY 3.0. {term.match}. This is an anatomical
        term definition, not a complete human attachment or innervation entry.
        Original definition citations: {term.citations}
      </small>
    </section>
  );
}
