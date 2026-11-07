import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Gamepad2,
  Layers,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Avatar, Modal } from "./ClassroomUI";
import {
  grammarTopics,
  memoryLevels,
  quizQuestions,
  sortLevels,
  textbookLevels,
} from "@shared/gameData";
import type { GameKind, QuizQuestion } from "@shared/gameData";

type Submission = {
  game: GameKind;
  questionIds?: string[];
  answers?: number[];
  levelId?: string;
  assignments?: number[];
  attempts?: [number, number][];
};
type Props = {
  game: GameKind;
  student: { id: number; name: string; points: number; avatar: number };
  onExit: () => void;
  onBillboard: () => void;
  onComplete: () => void;
  onBoss?: () => void;
};
const labels = {
  quiz: "Quiz Quest",
  sort: "Sort It Out",
  memory: "Memory Match",
};
function shuffle<T>(items: T[]): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
function makeRunId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `run-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

export default function GamePlayer({
  game,
  student,
  onExit,
  onBillboard,
  onComplete,
  onBoss,
}: Props) {
  const [phase, setPhase] = useState<"setup" | "play" | "result">("setup");
  const [mode, setMode] = useState<"grammar" | "vocabulary">("vocabulary");
  const [level, setLevel] = useState("3A");
  const [topic, setTopic] = useState("all");
  const [chapter, setChapter] = useState(0);
  const [classTurns, setClassTurns] = useState(false);
  const [turn, setTurn] = useState(0);
  const [timed, setTimed] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const poolForSetup = quizQuestions.filter(
    q =>
      q.mode === mode &&
      q.level === level &&
      (!chapter || q.chapter === chapter)
  );
  const focusTopics = [...new Set(poolForSetup.map(q => q.topic))];
  const availableLevels = game === "sort" ? sortLevels : memoryLevels;
  const [levelId, setLevelId] = useState(() => availableLevels[0]?.id || "");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<number[]>(Array(8).fill(-1));
  const [wordOrder, setWordOrder] = useState<number[]>([]);
  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const [drag, setDrag] = useState<{
    index: number;
    x: number;
    y: number;
  } | null>(null);
  const pointer = useRef<{ index: number; x: number; y: number } | null>(null);
  const [cardOrder, setCardOrder] = useState<number[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [attempts, setAttempts] = useState<[number, number][]>([]);
  const [matchMessage, setMatchMessage] = useState(
    "Flip a card. Find its partner."
  );
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [exitModal, setExitModal] = useState(false);
  const runId = useRef(makeRunId());
  const lastSubmission = useRef<Submission | null>(null);
  const sortLevel = sortLevels.find(l => l.id === levelId) || sortLevels[0];
  const memoryLevel =
    memoryLevels.find(l => l.id === levelId) || memoryLevels[0];
  const pairCount = memoryLevel.pairs.length;
  const wordCount = sortLevel.words.length;
  const finish = trpc.classroom.finish.useMutation({
    onSuccess: () => onComplete(),
    onError: e =>
      toast.error(`Your result hasn't been saved yet. ${e.message}`),
  });
  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    []
  );
  useEffect(() => {
    if (!timed || phase !== "play" || game !== "quiz" || chosen !== null)
      return;
    const interval = setInterval(() => setSeconds(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, [timed, phase, game, chosen, questionIndex]);
  function begin() {
    runId.current = makeRunId();
    finish.reset();
    setQuestionIndex(0);
    setSeconds(0);
    setTurn(0);
    setAnswers([]);
    setChosen(null);
    setMatched([]);
    setFlipped([]);
    setAttempts([]);
    setAssignments(Array(wordCount).fill(-1));
    setSelectedWord(null);
    setMatchMessage("Flip a card. Find its partner.");
    if (game === "quiz") {
      const pool = quizQuestions.filter(
        q =>
          q.mode === mode &&
          q.level === level &&
          (!chapter || q.chapter === chapter)
      );
      const focus =
        topic === "all" || mode === "vocabulary"
          ? shuffle(pool)
          : shuffle(pool.filter(q => q.topic === topic));
      const picked = [
        ...focus,
        ...shuffle(pool.filter(q => !focus.some(f => f.id === q.id))),
      ].slice(0, 5);
      if (picked.length < 5) {
        toast.error("This set needs more questions. Choose another level.");
        return;
      }
      setQuestions(picked);
    } else if (game === "sort")
      setWordOrder(shuffle(sortLevel.words.map((_, i) => i)));
    else
      setCardOrder(shuffle(Array.from({ length: pairCount * 2 }, (_, i) => i)));
    setPhase("play");
  }
  function submit(submission: Submission) {
    lastSubmission.current = submission;
    setPhase("result");
    finish.mutate({ studentId: student.id, runId: runId.current, submission });
  }
  function answer(index: number) {
    if (chosen !== null) return;
    setChosen(index);
    setAnswers([...answers, index]);
  }
  function nextQuestion() {
    if (chosen === null) return;
    if (questionIndex === questions.length - 1)
      submit({ game, questionIds: questions.map(q => q.id), answers });
    else {
      setQuestionIndex(questionIndex + 1);
      setChosen(null);
      setSeconds(0);
      setTurn(n => n + 1);
    }
  }
  function putWord(index: number, basket: number) {
    setTurn(n => n + 1);
    setAssignments(current =>
      current.map((v, i) => (i === index ? basket : v))
    );
    setSelectedWord(null);
    setDrag(null);
  }
  function pointerDown(e: PointerEvent<HTMLButtonElement>, index: number) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointer.current = { index, x: e.clientX, y: e.clientY };
    setSelectedWord(index);
  }
  function pointerMove(e: PointerEvent<HTMLButtonElement>) {
    const p = pointer.current;
    if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 7)
      setDrag({ index: p.index, x: e.clientX, y: e.clientY });
  }
  function pointerUp(e: PointerEvent<HTMLButtonElement>) {
    if (pointer.current) {
      const target = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest<HTMLElement>("[data-basket]");
      if (target) putWord(pointer.current.index, Number(target.dataset.basket));
    }
    pointer.current = null;
    setDrag(null);
  }
  function flipCard(index: number) {
    if (
      flipped.length >= 2 ||
      flipped.includes(index) ||
      matched.includes(index % pairCount)
    )
      return;
    if (!flipped.length) {
      setFlipped([index]);
      return;
    }
    const first = flipped[0];
    const pair: [number, number] = [first, index];
    const updatedAttempts = [...attempts, pair];
    setTurn(n => n + 1);
    setFlipped(pair);
    setAttempts(updatedAttempts);
    const isMatch = first % pairCount === index % pairCount && first !== index;
    if (isMatch) {
      setMatchMessage("That's a pair. Nicely done!");
      const nextMatched = [...matched, index % pairCount];
      timeout.current = setTimeout(() => {
        setMatched(nextMatched);
        setFlipped([]);
        if (nextMatched.length === pairCount)
          submit({ game, levelId: memoryLevel.id, attempts: updatedAttempts });
      }, 550);
    } else {
      setMatchMessage("Not quite. Take another look!");
      timeout.current = setTimeout(() => {
        setFlipped([]);
        setMatchMessage("Flip a card. Find its partner.");
      }, 1150);
    }
  }
  const progress =
    game === "quiz"
      ? questionIndex / 5
      : game === "sort"
        ? assignments.filter(v => v >= 0).length / wordCount
        : matched.length / pairCount;
  const result = finish.data;
  return (
    <div className={`game-player game-${game}`}>
      <div className="game-topline">
        <button
          className="text-button"
          onClick={() => (phase === "play" ? setExitModal(true) : onExit())}
        >
          <ArrowLeft size={18} />
          Back to game room
        </button>
        <div className="playing-as">
          <Avatar name={student.name} avatar={student.avatar} size="small" />
          <span>
            Playing as <strong>{student.name}</strong>
          </span>
        </div>
      </div>
      {phase === "setup" ? (
        <>
          <div className="game-intro">
            <span className={`intro-icon ${game}`}>
              {game === "quiz" ? (
                <BookOpen size={35} />
              ) : game === "sort" ? (
                <Layers size={35} />
              ) : (
                <Gamepad2 size={35} />
              )}
            </span>
            <span className="eyebrow">YOUR NEXT LITTLE ADVENTURE</span>
            <h1>
              {labels[game]}
              <span className="heading-dot">.</span>
            </h1>
            <p>
              {game === "quiz"
                ? "A little thinking. A little word power. Five questions to make your mind shine."
                : game === "sort"
                  ? "A home for every word. Sort the words into their happy little baskets."
                  : "Turn over a card. Make a connection. Find every word-and-meaning pair."}
            </p>
          </div>
          <section className="game-setup panel">
            <h2>Make this adventure yours</h2>
            {game === "quiz" ? (
              <>
                <label className="field-label">
                  What would you like to practice?
                </label>
                <div className="mode-selector">
                  <button
                    className={mode === "vocabulary" ? "selected" : ""}
                    onClick={() => setMode("vocabulary")}
                  >
                    <BookOpen size={23} />
                    <strong>Vocabulary</strong>
                    <span>Discover your word power</span>
                  </button>
                  <button
                    className={mode === "grammar" ? "selected" : ""}
                    onClick={() => setMode("grammar")}
                  >
                    <Sparkles size={23} />
                    <strong>Grammar</strong>
                    <span>Give your sentences a boost</span>
                  </button>
                </div>
                <label className="field-label">
                  Choose your textbook level
                </label>
                <div className="level-buttons">
                  {textbookLevels.map(l => (
                    <button
                      key={l}
                      className={l === level ? "selected" : ""}
                      onClick={() => {
                        setLevel(l);
                        setTopic("all");
                        setChapter(0);
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <label className="field-label" htmlFor="chapter-focus">
                  Chapter
                </label>
                <select
                  className="text-input"
                  id="chapter-focus"
                  value={chapter}
                  onChange={e => {
                    setChapter(Number(e.target.value));
                    setTopic("all");
                  }}
                >
                  <option value={0}>All chapters</option>
                  {[1, 2, 3, 4, 5, 6].map(c => (
                    <option
                      key={c}
                      value={c}
                      disabled={
                        quizQuestions.filter(
                          q =>
                            q.level === level &&
                            q.mode === mode &&
                            q.chapter === c
                        ).length < 5
                      }
                    >
                      Chapter {c}
                    </option>
                  ))}
                </select>
                {mode === "grammar" && (
                  <>
                    <label className="field-label" htmlFor="grammar-topic">
                      Language focus
                    </label>
                    <select
                      className="text-input"
                      id="grammar-topic"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                    >
                      <option value="all">
                        All language targets in this selection
                      </option>
                      {focusTopics.map(t => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                <p className="setup-note">
                  Based on merged.pdf · Level {level}
                  {chapter ? ` · Chapter ${chapter}` : ""}. A focus may include
                  mixed practice from this textbook.
                </p>
                {["5A", "6A"].includes(level) && (
                  <label className="practice-toggle">
                    <input
                      type="checkbox"
                      checked={timed}
                      onChange={e => setTimed(e.target.checked)}
                    />
                    Show a speed-practice stopwatch
                  </label>
                )}
              </>
            ) : (
              <>
                <label className="field-label" htmlFor="game-level">
                  Choose your adventure
                </label>
                <select
                  className="text-input"
                  id="game-level"
                  value={levelId}
                  onChange={e => setLevelId(e.target.value)}
                >
                  {availableLevels.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.level} · {l.title}
                    </option>
                  ))}
                </select>
                <div className="level-preview">
                  <span className="level-badge">
                    {game === "sort" ? sortLevel.level : memoryLevel.level}
                  </span>
                  <div>
                    <strong>
                      {game === "sort" ? sortLevel.title : memoryLevel.title}
                    </strong>
                    <p>
                      {game === "sort"
                        ? `${sortLevel.words.length} words · ${sortLevel.baskets.length} baskets`
                        : `${pairCount * 2} cards · ${pairCount} matching pairs`}
                    </p>
                  </div>
                </div>
              </>
            )}
            <div className="presentation-modes">
              <button
                className={!classTurns ? "selected" : ""}
                onClick={() => setClassTurns(false)}
              >
                Solo · iPad
              </button>
              <button
                className={classTurns ? "selected" : ""}
                onClick={() => setClassTurns(true)}
              >
                Class turns · Whiteboard
              </button>
            </div>
            {classTurns && (
              <p className="setup-note">
                Two teams take turns on this screen. Game-earned points go to{" "}
                {student.name}; use Team Battle for persistent team scores.
              </p>
            )}
            <div className="setup-points">
              <Star size={18} fill="currentColor" />
              <span>
                Your effort counts. Earn <strong>1, 3, or 5 points.</strong>
              </span>
            </div>
            <button
              className="button primary full-width big-button"
              onClick={begin}
            >
              Let's play
              <ArrowRight size={20} />
            </button>
          </section>
          <p className="game-help-note">
            {game === "sort"
              ? "Drag with a finger or mouse, or tap a word and then a basket."
              : game === "memory"
                ? "A pair counts as correct when you match it without earlier mistakes involving those cards."
                : "No rush. Read carefully, make a choice, and learn something new."}
          </p>
        </>
      ) : phase === "play" ? (
        <>
          {classTurns && (
            <div className="class-turn-banner">
              <UsersIcon />
              {turn % 2 === 0 ? "Blue team" : "Green team"} — your turn!
            </div>
          )}
          {timed && game === "quiz" && (
            <div className="practice-timer">
              Speed practice · {seconds}s on this question
            </div>
          )}
          <div className="game-progress-header">
            <span className="game-label">
              <span className="game-active-dot" />
              {labels[game]}
            </span>
            <span>
              {game === "quiz"
                ? `Question ${questionIndex + 1} of 5`
                : game === "sort"
                  ? `${assignments.filter(v => v >= 0).length} of ${wordCount} words sorted`
                  : `${matched.length} of ${pairCount} pairs found`}
            </span>
          </div>
          <div className="progress-track">
            <div style={{ width: `${progress * 100}%` }} />
          </div>
          {game === "quiz" && questions[questionIndex] && (
            <section className="quiz-board panel">
              <span className="question-topic">
                {questions[questionIndex].topic}{" "}
                {`· ${level}${questions[questionIndex].chapter ? ` / Ch ${questions[questionIndex].chapter}` : ""}`}
              </span>
              <h2>{questions[questionIndex].question}</h2>
              <p className="question-hint">Choose the best answer.</p>
              <div className="answers-grid">
                {questions[questionIndex].options.map((option, i) => (
                  <button
                    key={i}
                    className={`answer-button ${chosen !== null && i === questions[questionIndex].answer ? "correct" : ""} ${chosen === i && i !== questions[questionIndex].answer ? "incorrect" : ""}`}
                    onClick={() => answer(i)}
                    disabled={chosen !== null}
                  >
                    <span className="answer-letter">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{option}</span>
                    {chosen !== null &&
                      i === questions[questionIndex].answer && (
                        <CheckCircle2 size={24} />
                      )}
                    {chosen === i && i !== questions[questionIndex].answer && (
                      <XCircle size={24} />
                    )}
                  </button>
                ))}
              </div>
              {chosen !== null && (
                <div
                  className={`answer-feedback ${chosen === questions[questionIndex].answer ? "right" : "wrong"}`}
                >
                  <strong>
                    {chosen === questions[questionIndex].answer
                      ? "You've got it!"
                      : "A little something to learn."}
                  </strong>
                  <p>{questions[questionIndex].explanation}</p>
                  <button className="button primary" onClick={nextQuestion}>
                    {questionIndex === 4 ? "See my results" : "Next question"}
                    <ChevronRight size={19} />
                  </button>
                </div>
              )}
            </section>
          )}
          {game === "sort" && (
            <section className="sort-board">
              <div className="activity-heading">
                <h2>{sortLevel.title}</h2>
                <p>
                  Drag each word into a basket. Or tap a word, then tap a
                  basket.
                </p>
              </div>
              <div className="word-tray">
                {wordOrder
                  .filter(i => assignments[i] === -1)
                  .map(i => (
                    <button
                      key={i}
                      className={`word-chip ${selectedWord === i ? "selected" : ""} ${drag?.index === i ? "dragging" : ""}`}
                      onPointerDown={e => pointerDown(e, i)}
                      onPointerMove={pointerMove}
                      onPointerUp={pointerUp}
                      onPointerCancel={() => {
                        pointer.current = null;
                        setDrag(null);
                      }}
                      onClick={e => {
                        if (e.detail === 0) setSelectedWord(i);
                      }}
                    >
                      {sortLevel.words[i].word}
                    </button>
                  ))}
                {assignments.every(v => v >= 0) && (
                  <div className="tray-complete">
                    <CheckCircle2 size={21} />
                    Every word has a home. Ready to check?
                  </div>
                )}
              </div>
              <div
                className="baskets-grid"
                style={{
                  gridTemplateColumns: `repeat(${sortLevel.baskets.length}, minmax(0, 1fr))`,
                }}
              >
                {sortLevel.baskets.map((basket, b) => (
                  <button
                    className={`sort-basket basket-${b} ${selectedWord !== null ? "ready" : ""}`}
                    data-basket={b}
                    key={basket}
                    onClick={() =>
                      selectedWord !== null && putWord(selectedWord, b)
                    }
                  >
                    <span className="basket-label">
                      <Layers size={23} />
                      {basket}
                    </span>
                    <span className="basket-drop-hint">
                      {assignments.some(v => v === b)
                        ? "Tap a word to move it back"
                        : selectedWord !== null
                          ? "Tap here to drop your word"
                          : "Drop words here"}
                    </span>
                    <span className="basket-words">
                      {assignments.map(
                        (v, i) =>
                          v === b && (
                            <span
                              className="basket-word"
                              key={i}
                              role="button"
                              tabIndex={0}
                              onClick={e => {
                                e.stopPropagation();
                                setAssignments(a =>
                                  a.map((value, index) =>
                                    index === i ? -1 : value
                                  )
                                );
                              }}
                              onKeyDown={e => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setAssignments(a =>
                                    a.map((value, index) =>
                                      index === i ? -1 : value
                                    )
                                  );
                                }
                              }}
                            >
                              {sortLevel.words[i].word}
                              <X size={13} />
                            </span>
                          )
                      )}
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="button primary big-button check-sort"
                disabled={assignments.some(v => v < 0)}
                onClick={() =>
                  submit({ game, levelId: sortLevel.id, assignments })
                }
              >
                Check my baskets
                <Check size={20} />
              </button>
              {drag && (
                <span
                  className="drag-ghost"
                  style={{ left: drag.x, top: drag.y }}
                >
                  {sortLevel.words[drag.index].word}
                </span>
              )}
            </section>
          )}
          {game === "memory" && (
            <section className="memory-board">
              <div className="activity-heading">
                <h2>{memoryLevel.title}</h2>
                <p aria-live="polite">{matchMessage}</p>
              </div>
              <div className="memory-meta">
                <span>
                  <Layers size={16} />
                  {matched.length} pairs
                </span>
                <span>
                  <RotateCcw size={16} />
                  {attempts.length} turns
                </span>
              </div>
              <div className="memory-grid">
                {cardOrder.map(index => {
                  const pair = memoryLevel.pairs[index % pairCount];
                  const visible =
                    flipped.includes(index) ||
                    matched.includes(index % pairCount);
                  return (
                    <button
                      className={`memory-card ${visible ? "flipped" : ""} ${matched.includes(index % pairCount) ? "matched" : ""}`}
                      key={index}
                      onClick={() => flipCard(index)}
                      disabled={
                        matched.includes(index % pairCount) ||
                        flipped.length >= 2
                      }
                      aria-label={
                        visible
                          ? index < pairCount
                            ? pair.word
                            : pair.meaning
                          : `Flip card ${cardOrder.indexOf(index) + 1}`
                      }
                    >
                      <span className="card-inner">
                        <span className="card-back">
                          <Star
                            size={30}
                            fill="currentColor"
                            strokeWidth={1.2}
                          />
                          <span className="back-dot" />
                        </span>
                        <span
                          className={`card-front ${index < pairCount ? "word-front" : "meaning-front"}`}
                        >
                          <small>
                            {index < pairCount ? "WORD" : "MEANING"}
                          </small>
                          <strong>
                            {index < pairCount ? pair.word : pair.meaning}
                          </strong>
                          {matched.includes(index % pairCount) && (
                            <CheckCircle2 size={17} />
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="result-panel panel">
          {finish.isPending ? (
            <div className="saving-result">
              <span className="spinner" />
              <h2>A little victory in the making…</h2>
              <p>Saving your result to the classroom.</p>
            </div>
          ) : finish.isError ? (
            <div className="saving-result">
              <XCircle size={40} />
              <h2>Let's save that hard work.</h2>
              <p>
                Your result hasn't reached the classroom yet. Try again — you
                won't earn duplicate points.
              </p>
              <button
                className="button primary"
                onClick={() =>
                  lastSubmission.current &&
                  finish.mutate({
                    studentId: student.id,
                    runId: runId.current,
                    submission: lastSubmission.current,
                  })
                }
              >
                Save my result
                <RotateCcw size={18} />
              </button>
            </div>
          ) : result ? (
            <>
              <div className="result-sparkles" aria-hidden="true">
                <Star size={18} />
                <Sparkles size={25} />
                <Star size={14} />
              </div>
              <span className="result-trophy">
                <Trophy size={55} strokeWidth={1.5} />
              </span>
              <span className="eyebrow">
                A LITTLE PRACTICE. A LITTLE PROGRESS.
              </span>
              <h1>
                {result.correct === result.total
                  ? "You made it shine!"
                  : result.correct <= 1
                    ? "Every try helps you grow."
                    : "Look at you learning!"}
              </h1>
              <p>{student.name}, your effort deserves a little celebration.</p>
              <div className="result-numbers">
                <div>
                  <strong>
                    {result.correct}
                    <span>/{result.total}</span>
                  </strong>
                  <span>correct answers</span>
                </div>
                <div className="earned-points">
                  <strong>
                    +{result.points}
                    <Star size={22} fill="currentColor" />
                  </strong>
                  <span>points earned</span>
                </div>
              </div>
              <div className="result-saved">
                <CheckCircle2 size={17} />
                Saved! Your new total is{" "}
                <strong>{result.studentPoints} points.</strong>
              </div>
              {game === "quiz" &&
                answers.some(
                  (_, i) =>
                    i >= 2 &&
                    [i - 2, i - 1, i].every(
                      j => answers[j] === questions[j]?.answer
                    )
                ) && (
                  <div className="quiz-streak-earned">
                    <Sparkles size={17} />
                    Three in a row! Your streak badge is on the billboard.
                  </div>
                )}
              {["5A", "6A"].includes(level) && game === "quiz" && onBoss && (
                <div className="end-boss-challenge">
                  <p>One final challenge for a brave explorer?</p>
                  <button className="button primary" onClick={onBoss}>
                    Face the grammar boss <Sparkles size={18} />
                  </button>
                  <small>
                    Defeat the boss with five correct rapid-fire answers.
                  </small>
                </div>
              )}
              <div className="result-actions">
                <button className="button primary" onClick={onBillboard}>
                  See class billboard
                  <Trophy size={18} />
                </button>
                <button
                  className="button secondary"
                  onClick={() => {
                    finish.reset();
                    setPhase("setup");
                  }}
                >
                  Play again
                  <RotateCcw size={18} />
                </button>
              </div>
              {game === "quiz" && (
                <div className="answer-review">
                  <h3>A little look back</h3>
                  {questions.map((q, i) => (
                    <div className="review-row" key={q.id}>
                      {answers[i] === q.answer ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <XCircle size={18} />
                      )}
                      <div>
                        <strong>{q.question}</strong>
                        <p>
                          {q.options[q.answer]} — {q.explanation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {game === "sort" && (
                <div className="answer-review">
                  <h3>A home for every word</h3>
                  {sortLevel.words.map((w, i) => (
                    <div className="review-row" key={w.word}>
                      {assignments[i] === w.basket ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <XCircle size={18} />
                      )}
                      <div>
                        <strong>{w.word}</strong>
                        <p>{sortLevel.baskets[w.basket]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </section>
      )}
      <Modal
        open={exitModal}
        onClose={() => setExitModal(false)}
        title="Leave this adventure?"
        description="Your game isn't finished yet, so no points will be awarded. You can always try again."
      >
        <div className="modal-actions">
          <button
            className="button secondary"
            onClick={() => setExitModal(false)}
          >
            Keep playing
          </button>
          <button className="button primary" onClick={onExit}>
            Back to games
            <ArrowRight size={18} />
          </button>
        </div>
      </Modal>
    </div>
  );
}

function UsersIcon() {
  return <Layers size={16} />;
}
