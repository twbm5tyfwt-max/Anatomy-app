import { useMemo } from "react";
import { modeInfo, stars, useGameStats } from "./gameStats";
import {
  ACTIVITY_KEY,
  GOALS_KEY,
  SRS_KEY,
  defaultGoals,
  dayKey,
  isDue,
  streakOf,
  useShared,
  type Goals,
  type Srs,
} from "./studyStore";
import "./study.css";

/** Streak, daily goal, review queue and game results in one place. */
export function StudySnapshot({ onOpen }: { onOpen: (tab: "study" | "games") => void }) {
  const [activity] = useShared<Record<string, number>>(ACTIVITY_KEY, {});
  const [goals] = useShared<Goals>(GOALS_KEY, defaultGoals);
  const [srs] = useShared<Srs>(SRS_KEY, {});
  const [stats] = useGameStats();
  const today = dayKey();
  const done = activity[today] || 0;
  const due = useMemo(() => Object.values(srs).filter((e) => isDue(e)).length, [srs]);
  const mastered = Object.values(stats.mastery).filter((m) => stars(m) === 3).length;
  const learning = Object.values(stats.mastery).filter((m) => stars(m) > 0 && stars(m) < 3).length;
  const bests = Object.entries(stats.bests);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const k = dayKey(d);
    return { k, n: activity[k] || 0, label: d.toLocaleDateString(undefined, { weekday: "narrow" }) };
  });
  const max = Math.max(goals.dailyGoal, ...week.map((w) => w.n), 1);
  return (
    <section className="snap" aria-label="Study snapshot">
      <article>
        <b>{streakOf(activity)}</b>
        <span>day streak</span>
      </article>
      <article>
        <b>
          {done}/{goals.dailyGoal}
        </b>
        <span>answers today</span>
      </article>
      <article>
        <b>{due}</b>
        <span>cards due</span>
        <button onClick={() => onOpen("study")}>Review</button>
      </article>
      <article>
        <b>{stats.totalPoints.toLocaleString()}</b>
        <span>game points</span>
        <button onClick={() => onOpen("games")}>Play</button>
      </article>
      <article className="snap-wide">
        <span>Last 7 days</span>
        <div className="snap-week" role="img" aria-label={`Answers per day: ${week.map((w) => w.n).join(", ")}`}>
          {week.map((w) => (
            <i key={w.k} title={`${w.k}: ${w.n}`}>
              <u style={{ height: `${Math.max(4, (w.n / max) * 100)}%` }} />
              <small>{w.label}</small>
            </i>
          ))}
        </div>
      </article>
      <article className="snap-wide">
        <span>
          Mastery: {mastered} structure{mastered === 1 ? "" : "s"} at 3 stars · {learning} in progress
        </span>
        {bests.length ? (
          <ul>
            {bests.map(([m, b]) => (
              <li key={m}>
                {modeInfo(m as never).title}: <b>{b.points}</b> pts · {Math.round(b.accuracy * 100)}%
              </li>
            ))}
          </ul>
        ) : (
          <small>Play a game to set your first personal best.</small>
        )}
      </article>
    </section>
  );
}
