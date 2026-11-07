import { useState } from "react";
import { BookOpen, FileText, Search } from "lucide-react";
import { curriculumWords, grammarTargets } from "@shared/curriculum";
import { textbookLevels } from "@shared/gameData";
export default function CurriculumPage() {
  const [level, setLevel] = useState("1A");
  const [chapter, setChapter] = useState(0);
  const [mode, setMode] = useState("Vocabulary");
  const [search, setSearch] = useState("");
  const words = curriculumWords.filter(
    w =>
      w.level === level &&
      (!chapter || w.chapter === chapter) &&
      `${w.word} ${w.category} ${w.definition}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );
  const targets = grammarTargets.filter(
    t =>
      t.level === level &&
      (!chapter || t.chapter === chapter) &&
      t.topic.toLowerCase().includes(search.toLowerCase())
  );
  const categories = [...new Set(words.map(w => `${w.chapter}|${w.category}`))];
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR TEXTBOOK. YOUR LEARNING PATH.</span>
          <h1>
            Our curriculum<span className="heading-dot">.</span>
          </h1>
          <p>
            Vocabulary and language focus taken from your supplied textbook
            overview.
          </p>
        </div>
        <span className="live-pill">
          <FileText size={16} />
          merged.pdf
        </span>
      </div>
      <section className="panel curriculum-controls">
        <div className="curriculum-levels">
          {textbookLevels.map(l => (
            <button
              className={level === l ? "selected" : ""}
              key={l}
              onClick={() => {
                setLevel(l);
                setChapter(0);
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="curriculum-options">
          <div className="library-tabs">
            {["Vocabulary", "Grammar & tenses"].map(m => (
              <button
                className={mode === m ? "selected" : ""}
                key={m}
                onClick={() => setMode(m)}
              >
                {m}
              </button>
            ))}
          </div>
          <select
            aria-label="Select curriculum chapter"
            className="text-input"
            value={chapter}
            onChange={e => setChapter(Number(e.target.value))}
          >
            <option value={0}>All chapters</option>
            {[1, 2, 3, 4, 5, 6].map(c => (
              <option key={c} value={c}>
                Chapter {c}
              </option>
            ))}
          </select>
          <label className="library-search">
            <Search size={16} />
            <input
              aria-label="Search curriculum"
              placeholder="Search words or topics…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </label>
        </div>
        <p className="curriculum-summary">
          <BookOpen size={15} />
          {mode === "Vocabulary"
            ? `${words.length} vocabulary entries`
            : `${targets.length} chapter-level language targets`}{" "}
          · Level {level}
          {chapter ? ` · Chapter ${chapter}` : ""} · Source: merged.pdf
        </p>
      </section>
      {mode === "Vocabulary" ? (
        <div className="curriculum-groups">
          {categories.map(key => {
            const [c, category] = key.split("|");
            const group = words.filter(
              w => w.chapter === Number(c) && w.category === category
            );
            return (
              <section className="panel curriculum-group" key={key}>
                <div className="panel-header">
                  <div>
                    <span className="eyebrow">CHAPTER {c}</span>
                    <h2>{category}</h2>
                  </div>
                  <span className="small-count">{group.length}</span>
                </div>
                <div className="curriculum-words">
                  {group.map(w => (
                    <div key={w.id}>
                      <strong>{w.word}</strong>
                      <p>{w.definition}</p>
                      <small>PDF page {w.sourcePage}</small>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <section className="panel grammar-curriculum">
          <div className="panel-header">
            <div>
              <h2>Language focus · {level}</h2>
              <p>
                Chapter numbers indicate where each focus is emphasised. Earlier
                language can be recycled.
              </p>
            </div>
          </div>
          {targets.map((t, i) => (
            <div
              className="grammar-target"
              key={`${t.chapter}-${t.topic}-${i}`}
            >
              <span>Chapter {t.chapter}</span>
              <strong>{t.topic}</strong>
              <small>PDF page {t.sourcePage}</small>
            </div>
          ))}
        </section>
      )}
      {!words.length && mode === "Vocabulary" && (
        <div className="empty-state">
          No matching vocabulary in this chapter.
        </div>
      )}
      <p className="curriculum-disclaimer">
        The PDF supplies word lists and language targets; definitions and
        practice questions are written for ClassQuest. They are not quotations
        from the textbook.
      </p>
    </>
  );
}
