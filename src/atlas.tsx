import { anatomyImages } from "./assetPaths";
import { useId } from "react";
export type AtlasArea = {
  id: string;
  name: string;
  points: string;
  label: [number, number];
  anchor: [number, number];
};
const a = (
  id: string,
  name: string,
  points: string,
  label: [number, number],
  anchor: [number, number],
): AtlasArea => ({ id, name, points, label, anchor });
export const frontMuscles: AtlasArea[] = [
  a(
    "sternocleidomastoid",
    "Sternocleidomastoid",
    "274,78 282,81 291,114 282,108",
    [27, 76],
    [280, 93],
  ),
  a(
    "deltoid",
    "Deltoid",
    "219,108 240,109 228,133 224,155 201,165 200,145 207,124",
    [34, 139],
    [215, 137],
  ),
  a(
    "pectoralis-major",
    "Pectoralis major",
    "244,108 264,106 288,115 290,156 276,164 234,155 228,137",
    [395, 139],
    [260, 139],
  ),
  a(
    "biceps-brachii",
    "Biceps brachii",
    "204,159 223,158 219,176 204,194 190,205 185,197 194,176",
    [25, 204],
    [204, 178],
  ),
  a(
    "brachialis",
    "Brachialis",
    "220,175 218,195 204,212 199,205 211,190",
    [400, 190],
    [214, 195],
  ),
  a(
    "brachioradialis",
    "Brachioradialis",
    "184,201 195,207 182,235 168,262 163,262 173,227",
    [21, 255],
    [180, 235],
  ),
  a(
    "rectus-abdominis",
    "Rectus abdominis",
    "263,166 291,168 292,252 279,293 266,284 262,241",
    [398, 238],
    [280, 217],
  ),
  a(
    "external-oblique",
    "External oblique",
    "233,175 260,197 260,248 267,281 239,267 232,241",
    [25, 298],
    [247, 236],
  ),
  a(
    "serratus-anterior",
    "Serratus anterior",
    "335,142 352,136 355,165 334,192 323,180 336,161",
    [400, 105],
    [341, 161],
  ),
  a(
    "sartorius",
    "Sartorius",
    "241,304 249,309 277,397 275,416 265,406 254,361",
    [395, 341],
    [259, 359],
  ),
  a(
    "rectus-femoris",
    "Rectus femoris",
    "249,331 260,329 269,354 264,390 258,417 250,414 247,381",
    [25, 384],
    [256, 377],
  ),
  a(
    "vastus-lateralis",
    "Vastus lateralis",
    "233,325 245,344 241,379 247,414 237,410 226,382 224,352",
    [25, 433],
    [234, 368],
  ),
  a(
    "tibialis-anterior",
    "Tibialis anterior",
    "258,466 266,471 269,504 271,544 265,556 260,526 254,500",
    [395, 511],
    [262, 507],
  ),
];
const backMuscles: AtlasArea[] = [
  a(
    "trapezius",
    "Trapezius",
    "294,61 314,100 344,113 323,139 304,167 298,143",
    [399, 111],
    [312, 115],
  ),
  a(
    "deltoid",
    "Deltoid",
    "338,123 356,127 378,140 385,171 365,166 347,147",
    [399, 159],
    [366, 144],
  ),
  a(
    "triceps-brachii",
    "Triceps brachii",
    "215,168 229,174 224,200 210,221 194,224 196,208",
    [26, 203],
    [213, 194],
  ),
  a(
    "latissimus-dorsi",
    "Latissimus dorsi",
    "321,155 345,158 360,176 349,203 341,252 323,273 301,250 309,206",
    [391, 242],
    [330, 224],
  ),
  a(
    "external-oblique",
    "External oblique",
    "231,226 252,241 271,274 250,282 233,270",
    [23, 284],
    [246, 260],
  ),
  a(
    "gluteus-maximus",
    "Gluteus maximus",
    "239,290 261,283 285,294 285,321 268,344 239,328 233,311",
    [26, 332],
    [257, 311],
  ),
  a(
    "gastrocnemius",
    "Gastrocnemius",
    "257,432 272,434 279,469 272,497 264,511 253,478",
    [388, 467],
    [267, 467],
  ),
  a(
    "soleus",
    "Soleus",
    "313,482 336,471 336,511 324,542 316,545",
    [391, 533],
    [328, 511],
  ),
];
const bones: AtlasArea[] = [
  a(
    "frontal-bone",
    "Frontal bone",
    "135,20 154,15 173,22 177,40 163,45 141,43",
    [20, 39],
    [154, 31],
  ),
  a(
    "temporal-bone",
    "Temporal bone",
    "176,40 184,49 180,68 169,69 166,53",
    [225, 58],
    [175, 58],
  ),
  a(
    "mandible",
    "Mandible",
    "138,65 146,73 164,73 174,62 171,80 160,86 144,80",
    [20, 87],
    [156, 79],
  ),
  a(
    "clavicle",
    "Clavicle",
    "158,106 179,105 203,113 200,119 178,113 158,113",
    [224, 109],
    [180, 110],
  ),
  a(
    "scapula",
    "Scapula",
    "191,117 211,112 219,120 212,146 201,148 197,133",
    [225, 145],
    [207, 130],
  ),
  a(
    "sternum",
    "Sternum",
    "151,118 159,117 159,161 156,173 150,161",
    [20, 169],
    [155, 148],
  ),
  a(
    "humerus",
    "Humerus",
    "211,123 220,123 231,198 225,211 216,205 212,171",
    [226, 206],
    [219, 174],
  ),
  a(
    "radius",
    "Radius",
    "231,222 238,252 245,288 238,291 232,267 227,232",
    [226, 276],
    [235, 257],
  ),
  a(
    "ulna",
    "Ulna",
    "220,219 227,219 230,254 234,287 229,289 223,250",
    [20, 257],
    [227, 259],
  ),
  a(
    "femur",
    "Femur",
    "177,290 193,291 190,343 186,390 177,399 166,394 172,359 176,319",
    [225, 371],
    [180, 352],
  ),
  a(
    "patella",
    "Patella",
    "175,400 183,396 187,404 183,414 176,411",
    [20, 409],
    [180, 405],
  ),
  a(
    "tibia",
    "Tibia",
    "168,416 181,419 176,470 176,535 165,538 161,528 164,480",
    [20, 489],
    [170, 475],
  ),
  a(
    "fibula",
    "Fibula",
    "187,419 193,417 190,469 187,539 181,548 178,537 182,488",
    [224, 509],
    [185, 480],
  ),
];
export const atlasAreas = (layer: string, view: string) =>
  layer === "skeletal"
    ? view === "front"
      ? bones
      : bones
          .filter((x) =>
            ["scapula", "humerus", "femur", "tibia", "fibula"].includes(x.id),
          )
          .map((x) => ({
            ...x,
            points: x.points
              .split(" ")
              .map((pair) => {
                const [a, b] = pair.split(",").map(Number);
                return `${a + 308},${b}`;
              })
              .join(" "),
            anchor: [x.anchor[0] + 308, x.anchor[1]] as [number, number],
            label: [x.label[0] + 308, x.label[1]] as [number, number],
          }))
    : view === "front"
      ? frontMuscles
      : backMuscles;
const muscleFront =
  "M293 4 C271 3 260 22 262 48 L270 80 L277 92 L268 101 L237 102 Q201 103 196 144 L184 183 L176 210 L150 281 L145 311 L126 329 L125 368 L135 377 L145 355 L152 377 L161 374 L166 346 L173 329 L175 310 L196 265 L216 217 L227 194 L232 238 L230 283 L231 312 L226 352 L233 408 L249 444 L249 464 L244 498 L253 548 L250 574 L247 602 L254 621 L276 621 L281 612 L272 592 L275 565 L279 527 L282 494 L280 450 L288 417 L295 373 L300 411 L307 449 L304 480 L307 532 L315 569 L312 593 L308 612 L316 622 L342 621 L347 609 L340 582 L337 556 L344 517 L347 478 L338 444 L349 416 L354 378 L358 333 L356 293 L358 250 L353 205 L370 238 L387 280 L405 316 L410 340 L423 371 L431 374 L434 351 L449 374 L459 367 L451 340 L437 322 L423 313 L414 284 L398 245 L388 207 L374 178 L370 147 Q368 110 346 104 L318 100 L307 91 L317 72 L326 49 L326 22 Q317 3 293 4 Z";
const muscleBack =
  "M295 4 Q268 5 268 29 L270 57 L281 77 L278 103 L237 120 L218 124 L207 143 L196 189 L185 222 L159 280 L153 307 L126 330 L128 348 L141 338 L138 361 L149 365 L158 344 L161 365 L169 361 L177 327 L181 312 L202 274 L225 235 L234 216 L238 264 L229 301 L234 333 L237 377 L247 412 L251 432 L245 470 L251 511 L258 547 L255 570 L245 595 L251 611 L273 617 L281 608 L278 585 L277 562 L282 532 L285 486 L278 438 L288 400 L293 358 L301 394 L307 432 L304 472 L308 511 L314 548 L315 570 L310 597 L315 616 L340 616 L349 604 L342 580 L337 550 L343 514 L348 478 L341 437 L351 405 L356 368 L355 323 L359 296 L352 263 L355 222 L371 245 L385 278 L408 320 L413 344 L424 370 L432 369 L432 347 L449 368 L457 361 L448 338 L433 322 L426 308 L416 276 L402 244 L391 216 L384 180 L381 150 L374 135 L347 122 L320 108 L311 82 L319 60 L325 43 L323 20 Q316 4 295 4 Z";
export function Atlas({
  layer = "muscular",
  view = "front",
  selected = "",
  hidden = [],
  labels = true,
  onSelect,
  mini = false,
  region = "",
  quiz = false,
}: {
  layer?: string;
  view?: string;
  selected?: string;
  hidden?: string[];
  labels?: boolean;
  onSelect?: (id: string) => void;
  mini?: boolean;
  region?: string;
  quiz?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const skeletal = layer === "skeletal";
  const areas = atlasAreas(layer, view);
  const baseBox = skeletal
    ? view === "front"
      ? "0 0 310 600"
      : "308 0 310 600"
    : "0 0 620 640";
  const focusBox: Record<string, string> = skeletal
    ? {
        "Head & neck": `${view === "front" ? 100 : 408} 0 110 100`,
        Torso: `${view === "front" ? 75 : 383} 90 160 225`,
        "Upper limbs": `${view === "front" ? 35 : 343} 95 240 250`,
        "Lower limbs": `${view === "front" ? 105 : 413} 280 100 325`,
      }
    : {
        "Head & neck": "220 0 145 120",
        Torso: "195 90 190 215",
        "Upper limbs": "110 90 365 285",
        "Lower limbs": "210 280 160 350",
      };
  const vb = region ? focusBox[region] || baseBox : baseBox;
  return (
    <svg
      viewBox={vb}
      className={`atlas-svg ${mini ? "mini" : ""}`}
      role={onSelect ? "group" : "img"}
      aria-label={`${view === "front" ? "Anterior" : "Posterior"} ${skeletal ? "skeletal" : "muscular"} anatomy plate, OpenStax`}
    >
      <defs>
        <filter id={`clear${uid}`} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  8 0 0 0 -3.2"
          />
        </filter>
        <clipPath id={`body${uid}`}>
          <path d={view === "front" ? muscleFront : muscleBack} />
        </clipPath>
        <mask id={`visible${uid}`}>
          <rect x="0" y="0" width="1265" height="2853" fill="white" />
          {areas
            .filter((a) => hidden.includes(a.id))
            .map((a) => (
              <polygon key={a.id} points={a.points} fill="black" />
            ))}
        </mask>
      </defs>
      <g mask={`url(#visible${uid})`}>
        {skeletal ? (
          <image
            href={anatomyImages["701_Axial_Skeleton-01.jpg"]}
            x="0"
            y="0"
            width="620"
            height="631"
          />
        ) : (
          <g clipPath={`url(#body${uid})`} filter={`url(#clear${uid})`}>
            <image
              href={anatomyImages["1105_Anterior_and_Posterior_Views_of_Muscles.jpg"]}
              width="620"
              height="1398.3"
              y={view === "front" ? 0 : -716}
            />
          </g>
        )}
      </g>
      {areas
        .filter((a) => !hidden.includes(a.id))
        .map((a) => (
          <g
            key={a.id}
            className={`atlas-area ${selected === a.id ? "selected" : ""}`}
          >
            <polygon
              role={onSelect ? "button" : undefined}
              tabIndex={onSelect ? 0 : undefined}
              aria-label={
                quiz
                  ? `Select region ${areas.indexOf(a) + 1}`
                  : `Select ${a.name}`
              }
              data-structure={a.id}
              points={a.points}
              onClick={() => onSelect?.(a.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect?.(a.id);
                }
              }}
            >
              {!quiz && <title>{a.name}</title>}
            </polygon>
            {labels &&
              !skeletal &&
              [
                "pectoralis-major",
                "deltoid",
                "biceps-brachii",
                "rectus-abdominis",
                "rectus-femoris",
                "tibialis-anterior",
                "trapezius",
                "latissimus-dorsi",
                "gastrocnemius",
                "gluteus-maximus",
              ].includes(a.id) && (
                <g
                  className={`atlas-label ${selected === a.id ? "active" : ""}`}
                  onClick={() => onSelect?.(a.id)}
                >
                  <path
                    d={`M${a.anchor[0]},${a.anchor[1]} L${a.label[0] < 200 ? 185 : 390},${a.label[1] - 4} L${a.label[0] < 200 ? a.label[0] + 3 : a.label[0] - 5},${a.label[1] - 4}`}
                    fill="none"
                  />
                  <circle cx={a.anchor[0]} cy={a.anchor[1]} r="3" />
                  <rect
                    x={a.label[0] - 7}
                    y={a.label[1] - 19}
                    width={a.name.length * 6.5 + 14}
                    height="28"
                    rx="5"
                  />
                  <text x={a.label[0]} y={a.label[1]}>
                    {a.name}
                  </text>
                </g>
              )}
          </g>
        ))}
    </svg>
  );
}
