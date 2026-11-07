import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Drama,
  Flame,
  HelpCircle,
  Layers,
  Map,
  Puzzle,
  Search,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { activityCatalog } from "@shared/varietyData";
import type { ActivityKind } from "@shared/varietyData";
import type { GameKind } from "@shared/gameData";
export type PlayKind = GameKind | ActivityKind;
type OriginalGame = {
  id: GameKind;
  title: string;
  tag: string;
  description: string;
  meta: string;
  image: string;
  color: string;
};
const icons: Record<string, typeof BookOpen> = {
  odd: Puzzle,
  bingo: Target,
  builder: Layers,
  auction: Trophy,
  fix: CheckCircle2,
  maze: Map,
  story: BookOpen,
  who: HelpCircle,
  charades: Drama,
  battle: Users,
  daily: Sparkles,
  boss: Flame,
};
export default function GameLibrary({
  games,
  onLaunch,
}: {
  games: OriginalGame[];
  onLaunch: (kind: PlayKind) => void;
}) {
  const [filter, setFilter] = useState("All games");
  const [search, setSearch] = useState("");
  const originals = games.map(g => ({
    ...g,
    category: g.id === "quiz" ? "Grammar" : "Vocabulary",
  }));
  const all = [...originals, ...activityCatalog];
  const displayed = all.filter(
    g =>
      (filter === "All games" || g.category === filter) &&
      `${g.title} ${g.description}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <section id="games" className="games-section expanded-library">
      <div className="section-heading">
        <div>
          <h2>Pick your adventure</h2>
          <p>{all.length} ways to play, matched to your textbook.</p>
        </div>
        <span className="section-note">
          <BookOpen size={16} />
          Your 1A–6B curriculum
        </span>
      </div>
      <div className="library-toolbar">
        <div className="library-tabs">
          {["All games", "Vocabulary", "Grammar", "Classroom", "Daily"].map(
            c => (
              <button
                className={filter === c ? "selected" : ""}
                key={c}
                onClick={() => setFilter(c)}
              >
                {c}
              </button>
            )
          )}
        </div>
        <label className="library-search">
          <Search size={16} />
          <input
            aria-label="Search games"
            placeholder="Find a game…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>
      </div>
      <div className="game-grid">
        {displayed.map(g => {
          const Icon = icons[g.id] || BookOpen;
          return (
            <article
              className={`game-card ${g.color} ${"image" in g ? "" : "activity-tile"}`}
              key={g.id}
            >
              {"image" in g ? (
                <button
                  className="game-image-button"
                  onClick={() => onLaunch(g.id)}
                  aria-label={`Play ${g.title}`}
                >
                  <img src={g.image} alt={`Illustration for ${g.title}`} />
                  <span className="game-tag">{g.tag}</span>
                </button>
              ) : (
                <div className={`activity-symbol ${g.color}`}>
                  <Icon size={36} strokeWidth={1.6} />
                  <span>{g.tag}</span>
                  {g.category === "Classroom" && (
                    <span className="moderated-pill">
                      <Users size={11} />
                      Teacher-led
                    </span>
                  )}
                </div>
              )}
              <div className="game-card-copy">
                <h3>{g.title}</h3>
                <p>{g.description}</p>
                <div className="game-meta">
                  <BookOpen size={14} />
                  {"meta" in g
                    ? g.meta
                    : g.id === "boss"
                      ? "5A / 6A · 5 rapid-fire questions"
                      : g.id === "daily"
                        ? "One daily question · double points"
                        : g.category === "Classroom"
                          ? "Whiteboard · shared classroom scores"
                          : "Textbook-based · touch-friendly"}
                </div>
                <button className="game-play" onClick={() => onLaunch(g.id)}>
                  Let's play
                  <ArrowRight size={18} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {!displayed.length && (
        <div className="empty-state">
          <h3>No adventures found.</h3>
          <p>Try a different word or category.</p>
        </div>
      )}
      <p className="library-footnote">
        Standard games earn 1, 3 or 5 points. Daily Challenge doubles that
        reward. Three correct in a row earns a streak badge.
      </p>
    </section>
  );
}
