import { useMemo, useRef } from "react";
import { AnatomyScene, type SceneApi } from "./AnatomyScene";
import { modelParts } from "./modelCatalog";
import { defaultAppearance } from "./Appearance";
import type { PTRegion } from "./ptContent";

const layerNames = new Set([
  "muscles",
  "tendons",
  "ligaments",
  "cartilage",
  "bones",
  "capsules",
]);
const previewLayers = {
  skin: 0,
  muscles: 1,
  bones: 0.55,
  tendons: 1,
  ligaments: 1,
  cartilage: 1,
  fascia: 0,
  capsules: 0,
  bursae: 0,
  organs: 0,
  attachment: 0,
};

/** Right-sided, top-level source parts whose names match a structure pattern. */
export function resolveStructure(match: string) {
  const re = new RegExp(match, "i");
  return modelParts.filter(
    (m) =>
      !m.parentId &&
      m.layer &&
      layerNames.has(m.layer) &&
      !/^left |left /i.test(m.name) &&
      !/overlay|surface of/i.test(m.name) &&
      re.test(m.name),
  );
}

export function PTAnatomy({
  region,
  focus,
  onFocus,
  onOpen,
}: {
  region: PTRegion;
  focus: string | null;
  onFocus: (label: string | null) => void;
  onOpen: (id: string) => void;
}) {
  const api = useRef<SceneApi | null>(null);
  const resolved = useMemo(
    () =>
      region.structures.map((s) => ({
        ...s,
        parts: resolveStructure(s.match),
      })),
    [region],
  );
  const all = useMemo(
    () => [...new Set(resolved.flatMap((s) => s.parts.map((p) => p.id)))],
    [resolved],
  );
  const active = resolved.find((s) => s.label === focus) || null;
  const selectedIds = active ? active.parts.map((p) => p.id) : [];
  const systems = useMemo(
    () => [
      ...new Set(
        all.map((id) => modelParts.find((m) => m.id === id)!.system),
      ),
    ],
    [all],
  );
  return (
    <section className="pt-anatomy">
      <div className="pt-anatomy-preview">
        <AnatomyScene
          key={region.id}
          onlyIds={all}
          appearance={defaultAppearance}
          visible={systems}
          selected={selectedIds}
          hidden={[]}
          isolated={all}
          layers={previewLayers}
          background="midnight"
          onSelect={(id) => {
            const hit = resolved.find((s) => s.parts.some((p) => p.id === id));
            onFocus(hit ? hit.label : null);
          }}
          onReady={(a) => {
            api.current = a;
            a.frame(all, "front", 0);
          }}
        />
        <span className="pt-preview-note">
          Educational 3D reference · drag to rotate · click a structure
        </span>
      </div>
      <div className="pt-structure-list">
        <p className="eyebrow">STRUCTURES INVOLVED</p>
        <h2>{region.name} anatomy</h2>
        <p className="pt-blurb">{region.blurb}</p>
        <ul>
          {resolved.map((s) => (
            <li key={s.label}>
              <button
                className={focus === s.label ? "on" : ""}
                disabled={!s.parts.length}
                aria-pressed={focus === s.label}
                onClick={() => {
                  const next = focus === s.label ? null : s.label;
                  onFocus(next);
                  api.current?.frame(
                    next ? s.parts.map((p) => p.id) : all,
                    "front",
                    500,
                  );
                }}
              >
                <strong>{s.label}</strong>
                <span>{s.role}</span>
                {!s.parts.length && <em>Not separately modeled</em>}
              </button>
              {focus === s.label && !!s.parts.length && (
                <button
                  className="pt-open"
                  onClick={() => onOpen(s.parts[0].id)}
                >
                  Open in the body viewer →
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
