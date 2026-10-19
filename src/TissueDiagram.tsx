import { useId } from "react";
import type { Tissue } from "./content";
export function TissueDiagram({
  tissue,
  labels = true,
}: {
  tissue: Tissue;
  labels?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const kind = tissue.kind;
  const epithelial = tissue.class === "Epithelial";
  const strat = [
    "keratin",
    "stratified",
    "stratified-cube",
    "stratified-column",
    "transitional",
  ].includes(kind);
  const rows = strat ? (kind === "stratified-cube" ? 2 : 3) : 1;
  const base = 260;
  const start = 80;
  const cellHeight =
    kind === "squamous"
      ? 18
      : kind === "cuboidal"
        ? 55
        : kind === "stratified-column"
          ? 40
          : strat
            ? 48
            : 125;
  const cells =
    kind === "pseudo"
      ? 10
      : kind === "columnar" || kind === "stratified-column"
        ? 11
        : 8;
  const width = 440 / cells;
  const label = (
    text: string,
    x: number,
    y: number,
    tx: number,
    ty: number,
  ) => (
    <g key={text} className="tissue-annotation">
      <path
        d={`M${x},${y + 5} L${tx},${ty}`}
        stroke="#5f626b"
        strokeWidth="1"
      />
      <text x={x} y={y} fill="#55596b" fontSize="12">
        {text}
      </text>
      <circle cx={tx} cy={ty} r="2.5" fill="#6e627e" />
    </g>
  );
  return (
    <svg
      viewBox="0 0 600 340"
      className="tissue-svg"
      role="img"
      aria-label={`${tissue.name}: educational schematic, not a microscopy image`}
    >
      <defs>
        <pattern
          id={`stripe${id}`}
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
        >
          <path d="M0 0V12" stroke="#c77886" strokeWidth="3" />
        </pattern>
      </defs>
      <rect width="600" height="340" fill="#faf5f2" rx="12" />
      {epithelial ? (
        <g>
          <path d="M75 267H525V291H75Z" fill="#e6dde9" />
          <path d="M75 265H525" stroke="#9186ad" strokeWidth="5" />
          {Array.from({ length: rows }, (_, row) =>
            Array.from({ length: cells }, (_, i) => {
              const surface = row === rows - 1;
              const h =
                surface && ["stratified", "keratin"].includes(kind)
                  ? 20
                  : surface && kind === "stratified-column"
                    ? 75
                    : cellHeight;
              const y = base - row * cellHeight - h;
              const x = start + i * width;
              const nucleusY =
                kind === "pseudo"
                  ? i % 2
                    ? 235
                    : y + 35 + (i % 3) * 26
                  : y + h * (kind === "columnar" ? 0.72 : 0.52);
              return (
                <g key={`${row}-${i}`}>
                  <path
                    d={
                      kind === "pseudo"
                        ? i % 2
                          ? `M${x} 260V225Q${x} 180 ${x + width} 190V260Z`
                          : `M${x} 135H${x + 2 * width}V190Q${x + width} 180 ${x + width} 225V260H${x}Z`
                        : kind === "transitional" && surface
                          ? `M${x} ${y + h} V${y + 20} Q${x + width / 2} ${y - 20} ${x + width - 2} ${y + 20}V${y + h}Z`
                          : `M${x + 2} ${y + h}L${x} ${y + 7}Q${x + width / 2} ${y - 4} ${x + width - 2} ${y + 7}L${x + width - 4} ${y + h}Z`
                    }
                    fill={(i + row) % 2 ? "#f2c7be" : "#f8d8c8"}
                    stroke="#cd938d"
                    strokeWidth="1.8"
                  />
                  {!(kind === "keratin" && surface) && (
                    <ellipse
                      cx={x + width / 2}
                      cy={nucleusY}
                      rx={kind === "squamous" ? 12 : 8}
                      ry={
                        kind === "squamous"
                          ? 3.5
                          : kind === "columnar" || kind === "pseudo"
                            ? 13
                            : 9
                      }
                      fill="#ad6d8c"
                      opacity=".85"
                    />
                  )}
                  {(kind === "pseudo" || kind === "columnar") &&
                    i % 4 === 2 && (
                      <path
                        d={`M${x + 10},${y + 4}Q${x + width / 2},${y + 80} ${x + width - 9},${y + 4}Z`}
                        fill="#9dbdb7"
                        stroke="#6d9d96"
                      />
                    )}
                  {kind === "pseudo" &&
                    i % 2 === 0 &&
                    Array.from({ length: 17 }, (_, j) => (
                      <path
                        key={j}
                        d={`M${x + 4 + j * 5},${y + 5}q-3,-8 1,-15`}
                        fill="none"
                        stroke="#a5687f"
                        strokeWidth="1.5"
                      />
                    ))}
                </g>
              );
            }),
          )}
          {kind === "keratin" && (
            <path
              d="M80 133Q150 130 220 133T380 133T520 133V145H80Z"
              fill="#d8c0ad"
              stroke="#ba9a83"
            />
          )}
          {labels && (
            <>
              {label("Basement membrane", 360, 317, 423, 265)}
              {label(
                kind === "pseudo"
                  ? "Cilia"
                  : kind === "transitional"
                    ? "Umbrella cell"
                    : kind === "keratin"
                      ? "Keratin layer"
                      : "Apical surface",
                85,
                54,
                115,
                kind === "keratin"
                  ? 133
                  : kind === "stratified"
                    ? 144
                    : kind === "stratified-column"
                      ? 105
                      : base - rows * cellHeight,
              )}
              {label(
                "Nucleus",
                405,
                73,
                start + width * (cells === 8 ? 6.5 : 8.5),
                kind === "pseudo"
                  ? base - cellHeight + 35 + 2 * 26
                  : base -
                      cellHeight +
                      cellHeight * (kind === "columnar" ? 0.72 : 0.52),
              )}
              {(kind === "pseudo" || kind === "columnar") &&
                label(
                  "Goblet cell",
                  245,
                  85,
                  kind === "pseudo" ? 190 : 180,
                  160,
                )}
            </>
          )}
        </g>
      ) : kind === "bone" ? (
        <g>
          {[0, 1, 2].map((n) => (
            <g
              key={n}
              transform={`translate(${n === 0 ? 255 : n === 1 ? 95 : 475},${n === 0 ? 174 : n === 1 ? 100 : 240})`}
            >
              {[90, 76, 62, 48, 34].map((r, j) => (
                <circle
                  key={r}
                  r={r}
                  fill={j % 2 ? "#e9d7be" : "#f1e3cf"}
                  stroke="#c49e7e"
                  strokeWidth="2"
                />
              ))}
              <circle r="18" fill="#b67d84" stroke="#986172" strokeWidth="3" />
              {Array.from({ length: 18 }, (_, j) => {
                const an = j * 2.399;
                const r = 42 + (j % 3) * 17;
                const x = Math.cos(an) * r,
                  y = Math.sin(an) * r;
                return (
                  <g key={j}>
                    <ellipse
                      cx={x}
                      cy={y}
                      rx="5"
                      ry="2.5"
                      transform={`rotate(${(an * 180) / Math.PI} ${x} ${y})`}
                      fill="#75647d"
                    />
                    {[-1, 1].map((d) => (
                      <path
                        key={d}
                        d={`M${x},${y}l${Math.cos(an) * d * 13},${Math.sin(an) * d * 13}`}
                        stroke="#a78b8e"
                        strokeWidth=".8"
                      />
                    ))}
                  </g>
                );
              })}
            </g>
          ))}
          {labels && (
            <>
              {label("Central canal", 380, 70, 255, 174)}
              {label("Concentric lamellae", 375, 113, 317, 174)}
              {label("Lacuna with osteocyte", 342, 300, 297, 174)}
              {label("Canaliculi", 74, 300, 307, 174)}
            </>
          )}
        </g>
      ) : kind === "adipose" ? (
        <g>
          {Array.from({ length: 25 }, (_, i) => {
            const x = 60 + (i % 7) * 74 + (Math.floor(i / 7) % 2) * 30,
              y = 54 + Math.floor(i / 7) * 73;
            return (
              <g key={i}>
                <path
                  d={`M${x} ${y - 28}l28 10 10 29-22 24-31-3-20-25 12-26Z`}
                  fill="#fff9e8"
                  stroke="#cc9baa"
                  strokeWidth="2"
                />
                <ellipse
                  cx={x + 23}
                  cy={y + 16}
                  rx="5"
                  ry="9"
                  fill="#99729b"
                  transform={`rotate(-35 ${x + 23} ${y + 16})`}
                />
              </g>
            );
          })}
          {labels &&
            label(
              "Lipid droplet (empty on routine section)",
              140,
              320,
              208,
              200,
            )}
        </g>
      ) : kind === "blood" ? (
        <g>
          {Array.from({ length: 50 }, (_, i) => {
            const x = 35 + ((i * 79) % 525),
              y = 35 + ((i * 57) % 265);
            return (
              <g key={i}>
                <ellipse
                  cx={x}
                  cy={y}
                  rx="15"
                  ry="12"
                  fill="#d98b8b"
                  stroke="#b56d78"
                  strokeWidth="1.5"
                />
                <ellipse cx={x} cy={y} rx="7" ry="5" fill="#efd1ca" />
              </g>
            );
          })}
          <circle cx="308" cy="173" r="26" fill="#e1d3e7" />
          <path
            d="M293 158Q316 138 325 164Q316 179 319 188Q290 198 291 178Z"
            fill="#7b5f98"
          />
          <circle cx="400" cy="230" r="4" fill="#8c72a0" />
          {labels && (
            <>
              {label("Leukocyte", 323, 71, 307, 163)}
              {label("Erythrocyte", 60, 314, 351, 263)}
              {label("Platelet", 419, 299, 400, 230)}
            </>
          )}
        </g>
      ) : kind.includes("cartilage") || kind === "cartilage" ? (
        <g>
          <rect
            x="40"
            y="35"
            width="520"
            height="265"
            rx="10"
            fill={kind === "fibrocartilage" ? "#f1d1d4" : "#e2d8ed"}
          />
          {kind === "fibrocartilage" &&
            Array.from({ length: 20 }, (_, i) => (
              <path
                key={i}
                d={`M40 ${46 + i * 13}Q200 ${20 + i * 13} 560 ${50 + i * 13}`}
                stroke="#c48f9c"
                fill="none"
                strokeWidth="5"
              />
            ))}
          {kind === "elastic-cartilage" &&
            Array.from({ length: 25 }, (_, i) => (
              <path
                key={i}
                d={`M${40 + i * 21} 40Q${80 + i * 14} 160 ${45 + i * 20} 295`}
                stroke="#a78ab0"
                fill="none"
                strokeWidth="2"
              />
            ))}
          {Array.from({ length: 14 }, (_, i) => {
            const x = 85 + ((i * 127) % 440),
              y = 70 + ((i * 73) % 205);
            return (
              <g key={i}>
                <ellipse
                  cx={x}
                  cy={y}
                  rx="19"
                  ry="15"
                  fill="#f8f3fa"
                  stroke="#bca1cd"
                  strokeWidth="2"
                />
                <ellipse cx={x} cy={y} rx="9" ry="8" fill="#ac7ba7" />
                <circle cx={x} cy={y} r="4" fill="#775385" />
              </g>
            );
          })}
          {labels && (
            <>
              {label("Chondrocyte in lacuna", 65, 326, 85, 70)}
              {label("Extracellular matrix", 372, 326, 410, 230)}
            </>
          )}
        </g>
      ) : tissue.class === "Muscle" ? (
        <g>
          {Array.from({ length: kind === "smooth" ? 13 : 5 }, (_, i) => {
            const y = kind === "smooth" ? 60 + (i % 5) * 49 : 50 + i * 54;
            const x = kind === "smooth" ? 40 + Math.floor(i / 5) * 190 : 40;
            return (
              <g key={i}>
                {kind === "smooth" ? (
                  <path
                    d={`M${x} ${y}q95 -35 180 0q-90 35 -180 0Z`}
                    fill="#e2afb0"
                    stroke="#b78293"
                  />
                ) : (
                  <>
                    <rect
                      x="40"
                      y={y - 16}
                      width="520"
                      height="39"
                      rx="9"
                      fill="#edc4bf"
                      stroke="#bf8c9a"
                    />
                    <rect
                      x="42"
                      y={y - 14}
                      width="516"
                      height="35"
                      fill={`url(#stripe${id})`}
                      opacity=".7"
                    />
                    {kind === "cardiac" && (
                      <path
                        d={`M${170 + (i % 2) * 110} ${y - 16}v39M${380 + (i % 2) * 40} ${y - 16}v39`}
                        stroke="#805372"
                        strokeWidth="4"
                      />
                    )}
                  </>
                )}
                <ellipse
                  cx={
                    kind === "smooth"
                      ? x + 90
                      : kind === "cardiac"
                        ? 260 + i * 30
                        : 120 + i * 61
                  }
                  cy={kind === "skeletal" ? y - 12 : y}
                  rx="16"
                  ry="5"
                  fill="#96678a"
                />
              </g>
            );
          })}
          {kind === "cardiac" && (
            <path
              d="M330 110q40 10 80 52"
              stroke="#bf8c9a"
              strokeWidth="28"
              fill="none"
            />
          )}
          {labels && (
            <>
              {label(
                kind === "smooth"
                  ? "Spindle-shaped cell"
                  : kind === "cardiac"
                    ? "Intercalated disc"
                    : "Striations",
                50,
                317,
                kind === "cardiac" ? 170 : 130,
                kind === "cardiac" ? 50 : 105,
              )}
              {label(
                kind === "skeletal" ? "Peripheral nucleus" : "Central nucleus",
                403,
                317,
                kind === "smooth" ? 320 : kind === "skeletal" ? 303 : 350,
                kind === "smooth" ? 158 : kind === "cardiac" ? 212 : 200,
              )}
            </>
          )}
        </g>
      ) : tissue.class === "Nervous" ? (
        <g>
          <path
            d="M240 176L171 74M230 161L91 125M240 185L118 270M257 159L280 60M261 180L356 98M256 198Q340 237 514 221"
            stroke="#9c78a6"
            strokeWidth="9"
            fill="none"
          />
          <path
            d="M174 80l-45-20m50 25l0-45M106 127l-32-36m42 40l-49 30M130 258l-40 10m49-23l-4 47M280 75l-22-34m21 24l33-29"
            stroke="#9c78a6"
            strokeWidth="4"
            fill="none"
          />
          <path
            d="M216 155Q234 124 262 153L280 187L257 211L220 199Z"
            fill="#c39abb"
            stroke="#8b6a9c"
            strokeWidth="2"
          />
          <circle cx="247" cy="177" r="17" fill="#e9c9dc" stroke="#9d739d" />
          <circle cx="247" cy="177" r="6" fill="#8e5f8f" />
          {Array.from({ length: 18 }, (_, i) => (
            <circle
              key={i}
              cx={50 + ((i * 91) % 500)}
              cy={50 + ((i * 73) % 250)}
              r={kind === "glia" ? 7 : 5}
              fill="#7b6899"
              opacity=".8"
            />
          ))}
          {labels && (
            <>
              {label("Cell body (soma)", 310, 306, 247, 190)}
              {label("Dendrite", 44, 51, 171, 74)}
              {label("Axon", 440, 164, 450, 223)}
              {label("Glial nucleus", 340, 39, 141, 123)}
            </>
          )}
        </g>
      ) : (
        <g>
          {Array.from({ length: kind === "regular" ? 22 : 25 }, (_, i) => {
            const y = 45 + i * 10;
            return (
              <path
                key={i}
                d={
                  kind === "regular" || kind === "elastic"
                    ? `M30 ${y}q80 -20 160 0t160 0t220 0`
                    : `M${20 + ((i * 43) % 180)} ${20 + ((i * 47) % 150)}Q${220 + ((i * 17) % 130)} ${30 + ((i * 31) % 220)} ${400 + ((i * 31) % 180)} ${100 + ((i * 37) % 210)}`
                }
                stroke={
                  kind === "reticular"
                    ? "#8f7898"
                    : kind === "elastic"
                      ? "#94739b"
                      : "#d2a2af"
                }
                strokeWidth={
                  kind === "regular" || kind === "irregular"
                    ? 6
                    : kind === "reticular"
                      ? 2
                      : 3
                }
                fill="none"
                opacity=".7"
              />
            );
          })}
          {Array.from({ length: 16 }, (_, i) => (
            <ellipse
              key={i}
              cx={60 + ((i * 93) % 485)}
              cy={50 + ((i * 57) % 245)}
              rx="10"
              ry={kind === "regular" ? 2 : 4}
              fill="#876690"
              transform={`rotate(${kind === "regular" ? 0 : (i * 37) % 180} ${60 + ((i * 93) % 485)} ${50 + ((i * 57) % 245)})`}
            />
          ))}
          {labels && (
            <>
              {label(tissue.features[0], 45, 320, 160, 190)}
              {label("Fibroblast nucleus", 385, 320, 339, 221)}
            </>
          )}
        </g>
      )}
      <text x="16" y="24" fontSize="9" fill="#95838d" letterSpacing="1.5">
        EDUCATIONAL SCHEMATIC · NOT TO SCALE
      </text>
    </svg>
  );
}
