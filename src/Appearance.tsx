import { useEffect } from "react";
import { Check, Palette, Sun, Moon, X, RotateCcw } from "lucide-react";
export type Appearance = {
  mode: "light" | "dark";
  accent: string;
  bone: string;
  muscle: string;
  studio: "dark" | "adaptive";
};
export const defaultAppearance: Appearance = {
  mode: "light",
  accent: "#5b5ce2",
  bone: "#e6d5b6",
  muscle: "#c96875",
  studio: "dark",
};
export function applyAppearance(value: Appearance) {
  const el = document.documentElement;
  el.dataset.appearance = value.mode;
  el.style.colorScheme = value.mode;
  for (const [key, v] of Object.entries({
    accent: value.accent,
    bone: value.bone,
    muscle: value.muscle,
  }))
    if (/^#[0-9a-f]{6}$/i.test(v)) el.style.setProperty("--" + key, v);
  const hex = value.accent.replace("#", "");
  const rgb = [0, 2, 4]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) =>
      v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4),
    );
  el.style.setProperty(
    "--accent-contrast",
    rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 > 0.179
      ? "#000000"
      : "#ffffff",
  );
}
export function AppearanceSettings({
  value,
  onChange,
  onClose,
}: {
  value: Appearance;
  onChange: (v: Appearance) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    const dialog = document.querySelector<HTMLElement>(".appearance-dialog");
    dialog?.querySelector<HTMLElement>("button")?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = Array.from(
          dialog?.querySelectorAll<HTMLElement>("button,input,select") || [],
        );
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      old?.focus();
    };
  }, []);
  const colors = [
    ["Indigo", "#5b5ce2"],
    ["Ocean", "#0284c7"],
    ["Rose", "#db2777"],
    ["Emerald", "#059669"],
    ["Amber", "#b45309"],
  ];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="appearance-dialog panel"
        role="dialog"
        aria-modal="true"
        aria-label="Customize appearance"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="appearance-head">
          <span className="soft-icon">
            <Palette size={21} />
          </span>
          <button
            className="icon-button"
            aria-label="Close appearance settings"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <span className="eyebrow">MAKE THIS SPACE YOURS</span>
        <h2>Your colors. Your focus.</h2>
        <p>Choose a look that feels comfortable for your study sessions.</p>
        <h3>Appearance</h3>
        <div className="appearance-modes">
          {(["light", "dark"] as const).map((mode) => (
            <button
              aria-pressed={value.mode === mode}
              className={value.mode === mode ? "active" : ""}
              key={mode}
              onClick={() => onChange({ ...value, mode })}
            >
              {mode === "light" ? <Sun size={18} /> : <Moon size={18} />}
              <span>{mode === "light" ? "Light" : "Dark"}</span>
              {value.mode === mode && <Check size={15} />}
            </button>
          ))}
        </div>
        <h3>Accent color</h3>
        <div className="color-presets">
          {colors.map(([name, color]) => (
            <button
              key={name}
              aria-label={`${name} accent`}
              aria-pressed={value.accent === color}
              style={{ background: color }}
              onClick={() => onChange({ ...value, accent: color })}
            >
              {value.accent === color && <Check size={18} />}
            </button>
          ))}
          <label className="custom-color">
            <input
              aria-label="Custom accent color"
              type="color"
              value={value.accent}
              onChange={(e) => onChange({ ...value, accent: e.target.value })}
            />
            <span>Custom</span>
          </label>
        </div>
        <h3>3D anatomy colors</h3>
        <p className="small muted">
          Display colors help distinguish structures; they are not natural
          tissue colors.
        </p>
        <div className="anatomy-color-grid">
          <label>
            <span>Bone</span>
            <input
              aria-label="Bone model color"
              type="color"
              value={value.bone}
              onChange={(e) => onChange({ ...value, bone: e.target.value })}
            />
          </label>
          <label>
            <span>Muscle</span>
            <input
              aria-label="Muscle model color"
              type="color"
              value={value.muscle}
              onChange={(e) => onChange({ ...value, muscle: e.target.value })}
            />
          </label>
        </div>
        <label className="studio-choice">
          Viewer background
          <select
            aria-label="3D viewer background"
            value={value.studio}
            onChange={(e) =>
              onChange({
                ...value,
                studio: e.target.value as Appearance["studio"],
              })
            }
          >
            <option value="dark">Dark studio</option>
            <option value="adaptive">Match app appearance</option>
          </select>
        </label>
        <div className="appearance-footer">
          <button
            className="text-button"
            onClick={() => onChange({ ...defaultAppearance })}
          >
            <RotateCcw size={14} />
            Reset colors
          </button>
          <span>
            <Check size={13} />
            Saved automatically
          </span>
        </div>
      </section>
    </div>
  );
}
