import "./games.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { modelParts } from "./modelCatalog";
import { regionNames, regionParts } from "./atlasDomain";
import { groupOf, structureGroups } from "./GameSetup";
import type { Match, Reference } from "./studyCollections";

const byId = new Map(modelParts.map((m) => [m.id, m]));
const nameOf = (id: string) => byId.get(id)?.name || id;
const side = (id: string) =>
  /^right |right /i.test(nameOf(id)) ? "right" : /^left |left /i.test(nameOf(id)) ? "left" : "mid";

type Review = { matches: Match[]; unmatched: Reference[] };

export function StudyReview({
  review,
  confirmed,
  setConfirmed,
  hasImages,
}: {
  review: Review;
  confirmed: string[];
  setConfirmed: (f: (v: string[]) => string[]) => void;
  hasImages: boolean;
}) {
  const seen = useRef(new Set<string>());
  const chosen = useMemo(() => new Set(confirmed), [confirmed]);
  const add = (ids: string[], on: boolean) =>
    setConfirmed((v) =>
      on ? [...new Set([...v, ...ids])] : v.filter((x) => !ids.includes(x)),
    );

  // Exact-name matches are pre-confirmed once; anything ambiguous waits for a choice.
  useEffect(() => {
    const fresh = review.matches.filter(
      (m) => m.exact && !m.fuzzy && !seen.current.has(m.term),
    );
    for (const m of review.matches) seen.current.add(m.term);
    if (fresh.length) add(fresh.flatMap((m) => m.ids), true);
  }, [review.matches]);

  const exact = review.matches.filter((m) => m.exact && !m.fuzzy);
  const needs = review.matches.filter((m) => !m.exact || m.fuzzy);
  const resolved = (m: Match) => m.ids.some((id) => chosen.has(id));
  const open = needs.filter((m) => !resolved(m));
  const suggested = review.matches.filter((m) => !m.fuzzy).flatMap((m) => m.ids);

  return (
    <section className="sr" aria-label="Review matches">
      <div className="sr-head">
        <div>
          <h3>Review what we found</h3>
          <p>
            {review.matches.length
              ? `${review.matches.length} terms matched the 3D model · ${exact.length} exact · ${open.length} need your choice.`
              : "Nothing matched yet. Add notes, upload an image or slide, or use the pickers below."}
          </p>
        </div>
        {!!review.matches.length && (
          <div className="sr-bulk">
            <button type="button" onClick={() => add(suggested, true)}>
              Add every suggestion
            </button>
            <button
              type="button"
              onClick={() => add(review.matches.flatMap((m) => m.ids), false)}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {needs.length > 0 && (
        <p className="sr-warn" role="status">
          {needs.length} term{needs.length === 1 ? "" : "s"} could mean several
          structures (left/right, heads or parts), came from shorthand, or may be
          a misread word. Nothing in those rows is added until you choose.
        </p>
      )}

      <div className="sr-rows">
        {[...needs, ...exact].map((m) => {
          const ids = m.ids;
          const sides = new Set(ids.map(side));
          return (
            <article
              key={m.term}
              className={"sr-row" + (resolved(m) ? " done" : m.exact && !m.fuzzy ? "" : " todo")}
            >
              <header>
                <strong>{m.term}</strong>
                <span
                  className={
                    "sr-badge " +
                    (m.fuzzy ? "fuzzy" : m.exact ? "exact" : m.alias ? "alias" : "pick")
                  }
                >
                  {m.fuzzy
                    ? "Possible misspelling: check"
                    : m.exact
                      ? "Exact match"
                      : m.alias
                        ? `Shorthand for ${m.alias}`
                        : "Choose side / part"}
                </span>
                <span className="sr-count">
                  {ids.filter((i) => chosen.has(i)).length}/{ids.length}
                </span>
              </header>
              {ids.length > 1 && (
                <div className="sr-quick">
                  <button type="button" onClick={() => add(ids, true)}>
                    All
                  </button>
                  {sides.has("right") && (
                    <button
                      type="button"
                      onClick={() => {
                        add(ids, false);
                        add(ids.filter((i) => side(i) !== "left"), true);
                      }}
                    >
                      Right only
                    </button>
                  )}
                  {sides.has("left") && (
                    <button
                      type="button"
                      onClick={() => {
                        add(ids, false);
                        add(ids.filter((i) => side(i) !== "right"), true);
                      }}
                    >
                      Left only
                    </button>
                  )}
                  <button type="button" onClick={() => add(ids, false)}>
                    None
                  </button>
                </div>
              )}
              <div className="sr-chips">
                {ids.slice(0, 40).map((id) => (
                  <label key={id} className={chosen.has(id) ? "on" : ""}>
                    <input
                      type="checkbox"
                      checked={chosen.has(id)}
                      onChange={(e) => add([id], e.target.checked)}
                    />
                    {nameOf(id)}
                  </label>
                ))}
                {ids.length > 40 && <small>+{ids.length - 40} more variants</small>}
              </div>
              <small className="sr-src">
                From {m.references.map((r) => `${r.file} (${r.kind} ${r.page})`).join("; ")}
              </small>
            </article>
          );
        })}
      </div>

      {!!review.unmatched.length && (
        <details className="sr-unmatched">
          <summary>
            {review.unmatched.length} passage
            {review.unmatched.length === 1 ? "" : "s"} with nothing (or nothing
            modeled) to match
          </summary>
          {review.unmatched.map((r, i) => (
            <p key={i}>
              <b>
                {r.file} · {r.kind} {r.page}:
              </b>{" "}
              {r.text.trim() ||
                "No readable text was found in this file. Use the box above to type the names you can see, or pick the region below."}
            </p>
          ))}
          <p>
            Alveoli and bronchioles have a teaching diagram only. Female-specific
            organs are in the separate female reference; this workspace uses the
            male source atlas. Unmatched text is never turned into invented 3D
            anatomy.
          </p>
        </details>
      )}
      {hasImages && !review.matches.length && (
        <p className="sr-warn">
          Reading text from pictures works best with clear, horizontal labels. A
          photo of an unlabeled diagram can't be turned into a 3D model; type the
          structures you want or pick them by region below.
        </p>
      )}
    </section>
  );
}

/** Build a collection without any text: choose a region and what to include. */
export function RegionPicker({
  confirmed,
  setConfirmed,
}: {
  confirmed: string[];
  setConfirmed: (f: (v: string[]) => string[]) => void;
}) {
  const [region, setRegion] = useState("");
  const [groups, setGroups] = useState<string[]>(["bones", "muscles"]);
  const parts = useMemo(
    () =>
      region
        ? regionParts(region).filter(
            (m) =>
              !m.parentId &&
              m.layer !== "attachment" &&
              m.layer !== "skin" &&
              groups.includes(groupOf(m)),
          )
        : [],
    [region, groups],
  );
  const have = new Set(confirmed);
  const added = parts.filter((m) => have.has(m.id)).length;
  return (
    <details className="sr-region" open={!confirmed.length}>
      <summary>Or pick by region (no notes needed)</summary>
      <div className="sr-pick">
        <div className="sr-chiprow" role="group" aria-label="Region">
          {regionNames.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={region === r}
              onClick={() => setRegion(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="sr-chiprow" role="group" aria-label="Include">
          {structureGroups.slice(0, 6).map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={groups.includes(g.id)}
              onClick={() =>
                setGroups((v) =>
                  v.includes(g.id) ? v.filter((x) => x !== g.id) : [...v, g.id],
                )
              }
            >
              {g.label}
            </button>
          ))}
        </div>
        {region && (
          <div className="sr-pickbar">
            <span>
              {parts.length} structures ({added} already in your model)
            </span>
            <button
              type="button"
              disabled={!parts.length}
              onClick={() =>
                setConfirmed((v) => [...new Set([...v, ...parts.map((m) => m.id)])])
              }
            >
              Add all {parts.length}
            </button>
            <button
              type="button"
              disabled={!added}
              onClick={() =>
                setConfirmed((v) => v.filter((id) => !parts.some((m) => m.id === id)))
              }
            >
              Remove these
            </button>
          </div>
        )}
      </div>
    </details>
  );
}
