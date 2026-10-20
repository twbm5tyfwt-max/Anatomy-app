import { useRef } from "react";
import { AnatomyScene, defaultLayers, type SceneApi } from "./AnatomyScene";
import { landmarks } from "./landmarkCatalog";
import type { AnatomyQuestionView } from "./anatomyQuestions";
import { defaultAppearance } from "./Appearance";
export function AnatomyQuestion({
  question,
  checked,
  onAnswer,
}: {
  question: AnatomyQuestionView;
  checked: boolean;
  onAnswer: (name: string) => void;
}) {
  const api = useRef<SceneApi | null>(null);
  const shown = landmarks.filter((l) => question.landmarkIds?.includes(l.id));
  return (
    <figure
      className="anatomy-question"
      aria-label="Interactive anatomy question"
    >
      <AnatomyScene
        key={JSON.stringify(question)}
        quiz
        visible={[]}
        selected={question.highlightIds || []}
        hidden={[]}
        isolated={null}
        layers={{ ...defaultLayers, ...question.opacity }}
        opacityOverrides={question.opacity}
        onlyIds={question.ids}
        appearance={{ ...defaultAppearance, accent: "#bbd86b" }}
        quality={false}
        landmarks={shown}
        labels={false}
        targetMarker={
          question.interaction === "identify"
            ? question.targetLandmarkId
            : undefined
        }
        initialView={question.view}
        selectionMode="landmark"
        onReady={(value) => {
          api.current = value;
          value.frame(question.frameIds || question.ids, question.view, 0);
        }}
        onLandmark={(id) => {
          if (!checked && question.interaction === "click") {
            const l = shown.find((l) => l.id === id);
            if (l) onAnswer(l.name);
          }
        }}
      />
      <figcaption>
        <span>
          {question.interaction === "click"
            ? "Choose an unlabeled marker. Labels stay hidden until grading."
            : "Study the marked anatomy. Drag to rotate; scroll to zoom."}
        </span>
        <button
          type="button"
          onClick={() =>
            api.current?.frame(
              question.frameIds || question.ids,
              question.view,
              400,
            )
          }
        >
          Reset question view
        </button>
      </figcaption>
    </figure>
  );
}
