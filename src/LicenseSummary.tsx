import plates from "./generated/histology.json";
const unique = plates.filter(
  (p, i, all) => all.findIndex((x) => x.file === p.file) === i,
);
export function LicenseSummary() {
  return (
    <section className="license-summary">
      <h3>Use on an educational website or app</h3>
      <p>
        This bundle is for <strong>noncommercial educational use</strong>.
        Attribution is required, and share-alike terms apply to applicable
        adaptations. Credit alone does not waive a license or grant rights to
        proprietary anatomy products. Website/app redistribution is permitted
        only under the applicable asset terms.
      </p>
      <ul>
        <li>
          <a
            href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            OpenStax / Rice University — CC BY-NC-SA 4.0
          </a>
          : plates, educational adaptations, and the published microscopy
          references below. Keep captions, authors, source links, license
          notice, and adaptation notes.
        </li>
        <li>
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            Z-Anatomy — CC BY-SA 4.0
          </a>
          : shared anatomy geometry and source anchors. Keep the original
          BodyParts3D credit (Database Center for Life Science, CC BY-SA 2.1
          Japan) and upstream exceptions.
        </li>
        <li>
          Source-specific terms retained: Dundee CAHID cranial nerves/foramina
          (CC BY 4.0); Dundee School of Medicine inner ear (CC BY-NC-SA 4.0);
          Lissie Cowley kidney (CC BY-NC 4.0); University of Washington
          Brainder/white matter attribution. See the verbatim upstream statement
          in the download.
        </li>
        <li>
          Third-party code and fonts retain their own licenses. Collected
          package notices are in THIRD_PARTY_LICENSES.txt. The anatomy/media
          licenses are separate from software licenses.
        </li>
      </ul>
      <p>
        The download includes LICENSE-openstax.txt, LICENSE-z-anatomy.txt,
        LICENSE-bodyparts.txt, ASSET_CREDITS.md, ASSET_MANIFEST.json, and
        THIRD_PARTY_LICENSES.txt. No Complete Anatomy assets or branding are
        included. Clinical source pages are links, not reproduced videos or
        licensed treatment protocols.
      </p>
      <h3>New microscopy references</h3>
      {unique.map((p) => (
        <details key={p.file}>
          <summary>{p.title} — OpenStax CC BY-NC-SA 4.0</summary>
          <p>{p.caption}</p>
          <a href={p.source} target="_blank" rel="noreferrer">
            Original published figure
          </a>
          <p>
            <small>
              Bundled original; no image modifications. Display size/zoom may
              differ. SHA-256: {p.sha256}
            </small>
          </p>
        </details>
      ))}
    </section>
  );
}
