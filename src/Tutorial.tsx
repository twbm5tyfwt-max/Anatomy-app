import { useEffect, useState } from "react";
const steps = [
  {
    title: "Rotate, zoom and select",
    text: "Drag to rotate and scroll or pinch to zoom. A tap/click isolates the structure with a slow close-up. Back to body restores context; empty space clears the selection.",
    selector: ".pro-stage, .reference-stage",
    tab: "explorer",
  },
  {
    title: "Hide, isolate and restore",
    text: "Click to isolate, then use the landmark or whole-muscle checkboxes. Hide removes the selection; Restore and Reset recover anatomy. The overlap list resolves stacked structures.",
    selector: ".pro-camera-tools, .reference-toolbar",
    tab: "explorer",
  },
  {
    title: "Layers and transparency",
    text: "Show tissues with the layer buttons; the arrows open opacity sliders. Below 45% opacity, deeper opaque structures are picked first. Hidden tissues never receive pointer hits.",
    selector: ".pro-layer-dock, .reference-systems",
    tab: "explorer",
  },
  {
    title: "Regional and organ exploration",
    text: "Explore opens regional isolation and guided knee removal. Dissect organ opens source components and published section references. Heart walls can be removed; lung/lobe and bronchial controls reveal airways. Diagrams are labeled separately.",
    selector: ".pro-workspace-tabs, .reference-header",
    tab: "explorer",
  },
  {
    title: "Tissue connections",
    text: "Select a structure and choose Tissue & microscopic features. The body stays in place behind the panel. Photos retain source labels; illustrations have optional labels.",
    selector: ".pro-inspector, .reference-inspector",
    tab: "explorer",
  },
  {
    title: "Study models from notes",
    text: "Use + beside Body/Explore to upload pictures, PDFs, slides or notes. Local OCR reads labels; review spelling, sides and available anatomy. The saved tab contains a study guide, your original image and an independent 3D scope.",
    selector: ".study-workspaces",
    tab: "explorer",
  },
  {
    title: "Quizzes",
    text: "Use a reviewed collection for a strictly scoped quiz. Existing course-card quizzes and saved progress remain available.",
    selector: ".quiz-builder-grid",
    tab: "quizzes",
  },
  {
    title: "Games",
    text: "Choose a region or collection, check the exact structures to study, then start. Untimed is the default; find-and-click pauses during loading, rotation and feedback.",
    selector: ".learning-toolbar",
    tab: "games",
  },
  {
    title: "PT / AT study",
    text: "Connect anatomy to injury concepts, rehabilitation goals and exercise examples. These are educational resources, not individualized treatment plans; check source and review status.",
    selector: ".learning-toolbar",
    tab: "pt",
  },
];
export function Tutorial({
  navigate,
  onClose,
}: {
  navigate: (tab: string) => void;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [position, setPosition] = useState({ top: 100, left: 20 });
  const step = steps[index];
  useEffect(() => {
    navigate(step.tab);
    const place = () => {
      const target = document.querySelector(step.selector);
      document
        .querySelectorAll(".tour-target")
        .forEach((el) => el.classList.remove("tour-target"));
      if (target) {
        target.classList.add("tour-target");
        const r = target.getBoundingClientRect();
        setPosition({
          top: Math.max(12, Math.min(innerHeight - 230, r.top + 45)),
          left: Math.max(12, Math.min(innerWidth - 330, r.left + 15)),
        });
      }
    };
    const timer = setTimeout(place, 180);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      clearTimeout(timer);
      document
        .querySelectorAll(".tour-target")
        .forEach((el) => el.classList.remove("tour-target"));
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [index]);
  return (
    <aside
      className="tutorial-popover"
      role="dialog"
      aria-label="App tutorial"
      style={position}
    >
      <small>
        QUICK TOUR {index + 1} / {steps.length}
      </small>
      <h2>{step.title}</h2>
      <p>{step.text}</p>
      <div>
        <button onClick={onClose}>Skip tour</button>
        <button disabled={!index} onClick={() => setIndex((i) => i - 1)}>
          Back
        </button>
        <button
          className="primary"
          onClick={() =>
            index === steps.length - 1 ? onClose() : setIndex((i) => i + 1)
          }
        >
          {index === steps.length - 1 ? "Done" : "Next"}
        </button>
      </div>
    </aside>
  );
}
