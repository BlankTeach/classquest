import { useEffect, useRef, useState } from "react";
import type { ComponentType, DragEvent, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Blocks,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Drama,
  Eye,
  EyeOff,
  Gavel,
  Grid3X3,
  LockKeyhole,
  PencilLine,
  RotateCcw,
  Route,
  ScanSearch,
  Shield,
  Sparkles,
  Star,
  Swords,
  Timer,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  activityCatalog,
  getActivityQuestions,
  hasBingo,
} from "@shared/varietyData";
import type {
  ActivityKind,
  ActivityQuestion,
  ActivitySubmission,
} from "@shared/varietyData";
import { textbookLevels } from "@shared/gameData";
import { Avatar, Modal } from "./ClassroomUI";
import "./variety.css";

type Props = {
  game: ActivityKind;
  student: { id: number; name: string; points: number; avatar: number };
  teacherToken?: string;
  onExit: () => void;
  onBillboard: () => void;
  onComplete: () => void;
};
type RoundAnswer = {
  answer?: number;
  text?: string;
  order?: number[];
  moderated?: boolean;
  bet?: number;
};
type RoundProps = {
  question: ActivityQuestion;
  onDone: (answer: RoundAnswer) => void;
  last: boolean;
  timeLimit?: number;
};
const icons: Record<string, ComponentType<{ size?: number }>> = {
  ScanSearch,
  Grid3X3,
  Blocks,
  Gavel,
  PencilLine,
  Route,
  BookOpen,
  CircleHelp,
  Drama,
  Swords,
  CalendarDays,
  Shield,
};
const needsTeacher = (game: ActivityKind) =>
  ["auction", "charades", "battle"].includes(game);
const isTeam = (game: ActivityKind) => game === "auction" || game === "battle";
const normalise = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
const newRun = () => globalThis.crypto.randomUUID();

function Feedback({
  right,
  children,
  onNext,
  last,
}: {
  right: boolean;
  children: ReactNode;
  onNext: () => void;
  last: boolean;
}) {
  return (
    <div
      className={`variety-feedback ${right ? "right" : "wrong"}`}
      aria-live="polite"
    >
      <strong>
        {right ? <CheckCircle2 size={21} /> : <XCircle size={21} />}
        {right ? "Nicely done!" : "A little something to learn."}
      </strong>
      <p>{children}</p>
      <button className="button primary" onClick={onNext}>
        {last ? "Save my results" : "Next round"}
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
function Countdown({
  seconds,
  stopped,
  onExpire,
}: {
  seconds: number;
  stopped: boolean;
  onExpire: () => void;
}) {
  const [left, setLeft] = useState(seconds);
  const callback = useRef(onExpire);
  callback.current = onExpire;
  useEffect(() => {
    if (stopped || left <= 0) return;
    const timer = setTimeout(() => setLeft(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [left, stopped]);
  useEffect(() => {
    if (left === 0 && !stopped) callback.current();
  }, [left, stopped]);
  return (
    <span
      className={`variety-timer ${left <= 5 ? "urgent" : ""}`}
      role="timer"
      aria-label={`${left} seconds remaining`}
    >
      <Timer size={18} />
      {left}s
    </span>
  );
}
function ChoiceRound({
  question,
  onDone,
  last,
  timeLimit,
  heading,
  extra,
}: RoundProps & { heading?: string; extra?: ReactNode }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);
  function expire() {
    if (chosen !== null) return;
    setExpired(true);
    // The contract accepts only option indices. A missed timer is recorded as an incorrect option.
    setChosen((question.answer + 1) % question.options.length);
  }
  return (
    <>
      <div className="variety-round-label">
        <span>{heading || "Choose the best answer"}</span>
        {timeLimit && (
          <Countdown
            seconds={timeLimit}
            stopped={chosen !== null}
            onExpire={expire}
          />
        )}
      </div>
      <h2>{question.question}</h2>
      {extra}
      <div className="variety-options">
        {question.options.map((option, index) => (
          <button
            key={index}
            disabled={chosen !== null}
            className={`variety-option ${chosen !== null && index === question.answer ? "correct" : ""} ${chosen === index && index !== question.answer ? "incorrect" : ""}`}
            onClick={() => setChosen(index)}
          >
            <span className="variety-letter">
              {String.fromCharCode(65 + index)}
            </span>
            <span>{option}</span>
            {chosen !== null && index === question.answer && (
              <CheckCircle2 size={22} />
            )}
          </button>
        ))}
      </div>
      {chosen !== null && (
        <Feedback
          right={chosen === question.answer && !expired}
          last={last}
          onNext={() => onDone({ answer: chosen })}
        >
          {expired && "Time is up. This round counts as a missed answer. "}
          {question.explanation}
        </Feedback>
      )}
    </>
  );
}
function BuilderRound({ question, onDone, last }: RoundProps) {
  const [order, setOrder] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const dragging = useRef<number | null>(null);
  const words = question.words!;
  const right = order.every(
    (value, index) => value === question.correctOrder![index]
  );
  function append(index: number) {
    if (!checked)
      setOrder(current =>
        current.includes(index) ? current : [...current, index]
      );
  }
  function dragStart(event: DragEvent<HTMLButtonElement>, index: number) {
    dragging.current = index;
    event.dataTransfer.setData("text/plain", String(index));
    event.dataTransfer.effectAllowed = "move";
  }
  function drop(event: DragEvent, position = order.length) {
    event.preventDefault();
    event.stopPropagation();
    const index = dragging.current;
    if (index === null || checked) return;
    setOrder(current => {
      const oldPosition = current.indexOf(index);
      const updated = current.filter(value => value !== index);
      updated.splice(
        Math.max(
          0,
          Math.min(
            updated.length,
            position - (oldPosition >= 0 && oldPosition < position ? 1 : 0)
          )
        ),
        0,
        index
      );
      return updated;
    });
    dragging.current = null;
  }
  return (
    <>
      <div className="variety-round-label">TAP OR DRAG · SENTENCE CHUNKS</div>
      <h2>{question.question}</h2>
      <p className="variety-instruction">
        Tap chunks in order, or drag them into the sentence. Tap a placed chunk
        to return it; drag to reorder.
      </p>
      <div
        className="builder-sentence"
        onDragOver={event => event.preventDefault()}
        onDrop={event => drop(event)}
        aria-label="Your sentence"
      >
        {order.length === 0 && <span>Your sentence starts here…</span>}
        {order.map((index, position) => (
          <button
            key={index}
            className="builder-chunk placed"
            draggable={!checked}
            disabled={checked}
            onDragStart={event => dragStart(event, index)}
            onDragOver={event => event.preventDefault()}
            onDrop={event => drop(event, position)}
            onClick={() =>
              setOrder(current => current.filter(value => value !== index))
            }
            aria-label={`Remove ${words[index]} from sentence`}
          >
            {words[index]}
          </button>
        ))}
      </div>
      <div className="builder-tray">
        {words.map(
          (word, index) =>
            !order.includes(index) && (
              <button
                key={index}
                className="builder-chunk"
                draggable={!checked}
                onDragStart={event => dragStart(event, index)}
                onClick={() => append(index)}
                disabled={checked}
              >
                {word}
              </button>
            )
        )}
      </div>
      {!checked ? (
        <div className="variety-round-actions">
          <button
            className="button secondary"
            onClick={() => setOrder([])}
            disabled={!order.length}
          >
            <RotateCcw size={18} />
            Start sentence again
          </button>
          <button
            className="button primary"
            disabled={order.length !== words.length}
            onClick={() => setChecked(true)}
          >
            Check my sentence
            <Check size={18} />
          </button>
        </div>
      ) : (
        <Feedback right={right} last={last} onNext={() => onDone({ order })}>
          {question.explanation}
        </Feedback>
      )}
    </>
  );
}
function FixRound({ question, onDone, last, timeLimit }: RoundProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [checked, setChecked] = useState(false);
  const [expired, setExpired] = useState(false);
  const right =
    selected === question.errorIndex &&
    normalise(text) === normalise(question.correction!);
  function expire() {
    setSelected((question.errorIndex! + 1) % question.words!.length);
    setText("");
    setExpired(true);
    setChecked(true);
  }
  return (
    <>
      <div className="variety-round-label">
        <span>FIND ONE ERROR</span>
        {timeLimit && (
          <Countdown seconds={timeLimit} stopped={checked} onExpire={expire} />
        )}
      </div>
      <h2>Give this sentence a little repair.</h2>
      <p className="variety-instruction">
        Tap the mistaken word, then type its correction. Each sentence is
        checked once.
      </p>
      <div className="fix-sentence">
        {question.words!.map((word, index) => (
          <button
            key={index}
            disabled={checked}
            className={`fix-word ${selected === index ? "selected" : ""} ${checked && index === question.errorIndex ? "correct" : ""}`}
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
          >
            {word}
          </button>
        ))}
      </div>
      <label className="field-label" htmlFor="correction">
        Replace{" "}
        {selected === null
          ? "the selected word"
          : `“${question.words![selected]}”`}{" "}
        with:
      </label>
      <input
        id="correction"
        className="text-input"
        value={text}
        maxLength={100}
        autoComplete="off"
        disabled={checked}
        placeholder="Type the correct word"
        onChange={event => setText(event.target.value)}
        onKeyDown={event => {
          if (event.key === "Enter" && selected !== null && text.trim())
            setChecked(true);
        }}
      />
      {!checked ? (
        <button
          className="button primary variety-check"
          disabled={selected === null || !text.trim()}
          onClick={() => setChecked(true)}
        >
          Check my repair
          <Check size={18} />
        </button>
      ) : (
        <Feedback
          right={right && !expired}
          last={last}
          onNext={() => onDone({ answer: selected!, text })}
        >
          {expired && "Time is up; this repair counts as missed. "}
          {question.explanation}
        </Feedback>
      )}
    </>
  );
}
const mazePath = [0, 5, 6, 11, 12, 17];
const mazeOpen = new Set([
  ...mazePath,
  1,
  2,
  7,
  9,
  14,
  15,
  19,
  20,
  21,
  22,
  23,
  24,
]);
function MazeRound({
  question,
  onDone,
  last,
  position,
}: RoundProps & { position: number }) {
  const first = useRef<number | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const right = chosen === question.answer;
  const reached = position + (right ? 1 : 0);
  function choose(index: number) {
    if (chosen !== null) return;
    if (first.current === null) first.current = index;
    setChosen(index);
  }
  return (
    <>
      <div className="variety-maze-layout">
        <div
          className="maze-grid"
          aria-label={`Maze: ${reached} of 5 steps completed`}
        >
          {Array.from({ length: 25 }, (_, cell) => (
            <div
              key={cell}
              className={`maze-cell ${mazeOpen.has(cell) ? "open" : "wall"} ${mazePath.indexOf(cell) >= 0 && mazePath.indexOf(cell) <= reached ? "travelled" : ""} ${mazePath[reached] === cell ? "current" : ""}`}
            >
              {mazePath[reached] === cell ? (
                <span aria-label="Your explorer">
                  <Star size={26} fill="currentColor" />
                </span>
              ) : cell === mazePath[5] ? (
                <Trophy size={23} aria-label="Maze goal" />
              ) : !mazeOpen.has(cell) ? (
                <span aria-hidden="true" />
              ) : null}
            </div>
          ))}
        </div>
        <div>
          <span className="eyebrow">FIVE STEPS TO THE FLAG</span>
          <h3>
            {right
              ? "The path is open!"
              : chosen !== null
                ? "That path is blocked."
                : "Choose your next step."}
          </h3>
          <p className="variety-instruction">
            Wrong answers block movement. Retry this same question to continue;
            only your first answer is graded.
          </p>
        </div>
      </div>
      <h2>{question.question}</h2>
      <div className="variety-options compact">
        {question.options.map((option, index) => (
          <button
            key={index}
            className={`variety-option ${chosen === index ? (right ? "correct" : "incorrect") : ""}`}
            disabled={chosen !== null}
            onClick={() => choose(index)}
          >
            {option}
          </button>
        ))}
      </div>
      {chosen !== null &&
        (right ? (
          <Feedback
            right
            last={last}
            onNext={() => onDone({ answer: first.current! })}
          >
            {question.explanation}
          </Feedback>
        ) : (
          <div className="variety-feedback wrong" aria-live="polite">
            <strong>
              <LockKeyhole size={20} />
              Not that direction. Try again!
            </strong>
            <p>You have not moved. Read the location clue carefully.</p>
            <button
              className="button secondary"
              onClick={() => setChosen(null)}
            >
              <RotateCcw size={18} />
              Retry this step
            </button>
          </div>
        ))}
    </>
  );
}
function WhoRound(props: RoundProps) {
  const [revealed, setRevealed] = useState(1);
  const [asked, setAsked] = useState<number[]>([]);
  return (
    <ChoiceRound
      {...props}
      heading="MYSTERY WORD · REVEAL CLUES"
      extra={
        <div className="who-clues">
          {props.question.clues!.slice(0, revealed).map((clue, index) => (
            <p key={index}>
              <CircleHelp size={18} />
              {clue}
            </p>
          ))}
          {revealed < props.question.clues!.length && (
            <button
              className="button secondary"
              onClick={() => setRevealed(value => value + 1)}
            >
              <Eye size={18} />
              Reveal another clue
            </button>
          )}
          <h3>Ask a yes-or-no question</h3>
          <div className="who-questions">
            {props.question.yesNo!.map((item, index) => (
              <button
                key={index}
                className={asked.includes(index) ? "asked" : ""}
                onClick={() =>
                  setAsked(current =>
                    current.includes(index) ? current : [...current, index]
                  )
                }
              >
                {item.question}
                {asked.includes(index) && (
                  <strong>{item.answer ? "Yes" : "No"}</strong>
                )}
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}
function CharadesRound({ question, onDone, last }: RoundProps) {
  const [visible, setVisible] = useState(false);
  const [hasSeen, setHasSeen] = useState(false);
  const [judgment, setJudgment] = useState<boolean | null>(null);
  return (
    <>
      <div className="variety-round-label">
        <Drama size={20} />
        PERFORMER + CLASS + TEACHER
      </div>
      <h2>One little action. A whole class of guesses.</h2>
      <p className="variety-instruction">
        Turn the device towards the performer before revealing the word. Hide it
        again before the class guesses. No speaking during the performance.
      </p>
      <div className={`charades-card ${visible ? "revealed" : ""}`}>
        {visible ? (
          <>
            <small>FOR THE PERFORMER ONLY</small>
            <strong>{question.options[0]}</strong>
          </>
        ) : (
          <>
            <Drama size={48} />
            <strong>The action is hidden.</strong>
            <span>
              {hasSeen
                ? "Class, make your guess!"
                : "Performer, come take a look."}
            </span>
          </>
        )}
      </div>
      {judgment === null && (
        <>
          <button
            className="button secondary"
            onClick={() => {
              setVisible(value => !value);
              setHasSeen(true);
            }}
          >
            {visible ? <EyeOff size={20} /> : <Eye size={20} />}
            {visible
              ? "Hide action for the class"
              : "Performer only: reveal action"}
          </button>
          <div className="charades-moderation">
            <h3>
              <LockKeyhole size={19} />
              Teacher confirmation
            </h3>
            <p>
              Teacher login is verified by the server when this result is saved.
            </p>
            <div className="variety-round-actions">
              <button
                className="button primary"
                disabled={!hasSeen || visible}
                onClick={() => setJudgment(true)}
              >
                <Check size={18} />
                Class guessed correctly
              </button>
              <button
                className="button secondary"
                disabled={!hasSeen || visible}
                onClick={() => setJudgment(false)}
              >
                <XCircle size={18} />
                Not guessed this round
              </button>
            </div>
          </div>
        </>
      )}
      {judgment !== null && (
        <Feedback
          right={judgment}
          last={last}
          onNext={() => onDone({ moderated: judgment })}
        >
          {question.explanation}
        </Feedback>
      )}
    </>
  );
}
function AuctionRound({
  question,
  onDone,
  last,
  team,
  budget,
}: RoundProps & { team: string; budget: number }) {
  const [bet, setBet] = useState(1);
  const [chosen, setChosen] = useState<number | null>(null);
  return (
    <>
      <div className="variety-round-label">
        <Gavel size={20} />
        {team.toUpperCase()}’S AUCTION TURN
      </div>
      <div className="auction-budget">
        <span>
          Virtual budget <strong>{budget}</strong>
        </span>
        <small>Separate from student points. Saved only on completion.</small>
      </div>
      <h2>{question.question}</h2>
      <label className="field-label">Wager on your judgment</label>
      <div className="auction-bets">
        {Array.from(
          { length: Math.min(5, budget) },
          (_, index) => index + 1
        ).map(value => (
          <button
            key={value}
            className={value === bet ? "selected" : ""}
            aria-pressed={value === bet}
            disabled={chosen !== null}
            onClick={() => setBet(value)}
          >
            {value}
            <small>virtual</small>
          </button>
        ))}
      </div>
      <div className="variety-options compact">
        {question.options.map((option, index) => (
          <button
            key={index}
            className={`variety-option ${chosen !== null && index === question.answer ? "correct" : ""} ${chosen === index && index !== question.answer ? "incorrect" : ""}`}
            disabled={chosen !== null}
            onClick={() => setChosen(index)}
          >
            {index === 0 ? <CheckCircle2 size={23} /> : <XCircle size={23} />}
            {option}
          </button>
        ))}
      </div>
      {chosen !== null && (
        <Feedback
          right={chosen === question.answer}
          last={last}
          onNext={() => onDone({ answer: chosen, bet })}
        >
          {question.explanation} {team}’s virtual budget{" "}
          {chosen === question.answer ? "gains" : "loses"} {bet}. Student points
          are never deducted by a wager.
        </Feedback>
      )}
    </>
  );
}
function BingoBoard({
  questions,
  onFinish,
  onRestart,
}: {
  questions: ActivityQuestion[];
  onFinish: (ids: string[], answers: number[]) => void;
  onRestart: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const called = questions[index];
  const marked = answers.flatMap((answer, round) =>
    answer === questions[round].answer ? [answer] : []
  );
  const won = hasBingo(marked);
  function choose(cell: number) {
    if (chosen !== null || marked.includes(cell) || won) return;
    setChosen(cell);
    setAnswers(current => [...current, cell]);
  }
  return (
    <>
      <div className="variety-round-label">
        <Grid3X3 size={20} />
        {won ? "BINGO! THREE IN A ROW" : `DEFINITION ${index + 1} OF 9`}
      </div>
      <h2>{won ? "Your words made a connection!" : called.question}</h2>
      <p className="variety-instruction">
        Only the current definition can be marked. Correct matches stay
        coloured; three in a row, column or diagonal wins. One choice per call.
      </p>
      <div className="bingo-grid">
        {questions[0].options.map((word, cell) => (
          <button
            key={word}
            className={`bingo-cell ${marked.includes(cell) ? "marked" : ""} ${chosen === cell && cell !== called.answer ? "missed" : ""}`}
            disabled={chosen !== null || marked.includes(cell) || won}
            onClick={() => choose(cell)}
          >
            {word}
            {marked.includes(cell) && <CheckCircle2 size={21} />}
          </button>
        ))}
      </div>
      {chosen !== null && (
        <div
          className={`variety-feedback ${chosen === called.answer ? "right" : "wrong"}`}
          aria-live="polite"
        >
          <strong>
            {won ? (
              <Trophy size={22} />
            ) : chosen === called.answer ? (
              <CheckCircle2 size={22} />
            ) : (
              <XCircle size={22} />
            )}
            {won
              ? "A whole line! Ready to save."
              : chosen === called.answer
                ? "A matching word!"
                : "That word stays unmarked."}
          </strong>
          <p>{called.explanation}</p>
          {won ? (
            <button
              className="button primary"
              onClick={() =>
                onFinish(
                  questions
                    .slice(0, answers.length)
                    .map(question => question.id),
                  answers
                )
              }
            >
              Save my bingo
              <ArrowRight size={18} />
            </button>
          ) : index < 8 ? (
            <button
              className="button primary"
              onClick={() => {
                setIndex(value => value + 1);
                setChosen(null);
              }}
            >
              Call the next definition
              <ArrowRight size={18} />
            </button>
          ) : (
            <>
              <p>
                No complete line this time. This unfinished board has not
                awarded any points.
              </p>
              <button className="button secondary" onClick={onRestart}>
                <RotateCcw size={18} />
                Try a fresh board
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
function TeamStrip({
  names,
  scores,
  current,
  saved = false,
}: {
  names: string[];
  scores: number[];
  current?: number;
  saved?: boolean;
}) {
  return (
    <div className="variety-teams">
      {names.map((name, index) => (
        <div key={name} className={index === current ? "active" : ""}>
          <Users size={18} />
          <strong>{name}</strong>
          <span>{scores[index]}</span>
          <small>
            {saved
              ? "Saved team contribution"
              : index === current
                ? "Your turn · preview"
                : "Round preview"}
          </small>
        </div>
      ))}
    </div>
  );
}

export default function VarietyPlayer({
  game,
  student,
  teacherToken,
  onExit,
  onBillboard,
  onComplete,
}: Props) {
  const activity = activityCatalog.find(item => item.id === game)!;
  const Icon = icons[activity.icon] || Sparkles;
  const [phase, setPhase] = useState<"setup" | "play" | "result">("setup");
  const [level, setLevel] = useState(game === "boss" ? "5A" : "3A");
  const [whiteboard, setWhiteboard] = useState(needsTeacher(game));
  const [timed, setTimed] = useState(game === "boss");
  const [dateKey, setDateKey] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [teamNames, setTeamNames] = useState(["Forest Stars", "Bright Sparks"]);
  const [questions, setQuestions] = useState<ActivityQuestion[]>([]);
  const [round, setRound] = useState(0);
  const [responses, setResponses] = useState<RoundAnswer[]>([]);
  const [setupError, setSetupError] = useState("");
  const [exitModal, setExitModal] = useState(false);
  const runId = useRef("");
  const lastRequest = useRef<{
    studentId: number;
    runId: string;
    submission: ActivitySubmission;
    token?: string;
    dateKey?: string;
  } | null>(null);
  const finish = trpc.classroom.finishActivity.useMutation({
    onSuccess: () => onComplete(),
  });
  const names = teamNames.map(name => name.trim());
  const validTeams =
    names.length >= 2 &&
    names.length <= 4 &&
    names.every(name => name.length > 0 && name.length <= 40) &&
    new Set(names.map(name => name.toLowerCase())).size === names.length;
  const timerAvailable =
    ["5A", "6A"].includes(level) &&
    ["odd", "who", "battle", "daily", "boss", "fix", "story"].includes(game);
  const timeLimit =
    timed && timerAvailable ? (game === "fix" ? 30 : 20) : undefined;
  const scores = names.map(() => (game === "auction" ? 20 : 0));
  responses.forEach((response, index) => {
    const team = index % names.length;
    if (game === "auction")
      scores[team] +=
        response.answer === questions[index].answer
          ? response.bet!
          : -response.bet!;
    if (game === "battle" && response.answer === questions[index].answer)
      scores[team] += 1;
  });
  function begin() {
    if (game === "boss" && !["5A", "6A"].includes(level)) {
      setSetupError("Boss Battle is for textbook levels 5A and 6A.");
      return;
    }
    if (needsTeacher(game) && !teacherToken) {
      setSetupError(
        "Go back to the game room, open Teacher tools, and log in. Then return to start this teacher-led activity."
      );
      return;
    }
    if (isTeam(game) && !validTeams) {
      setSetupError("Choose 2–4 different team names, each 1–40 characters.");
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    try {
      const set = getActivityQuestions(game, level, date);
      if (set.length !== (game === "daily" ? 1 : game === "bingo" ? 9 : 5))
        throw new Error("This level's activity set is incomplete.");
      setQuestions(set);
      setDateKey(date);
      setRound(0);
      setResponses([]);
      setSetupError("");
      runId.current = newRun();
      lastRequest.current = null;
      finish.reset();
      setPhase("play");
    } catch (error) {
      setSetupError(
        error instanceof Error
          ? error.message
          : "This level is not ready yet. Please choose another."
      );
    }
  }
  function save(submission: ActivitySubmission) {
    const request = {
      studentId: student.id,
      runId: runId.current,
      submission,
      ...(needsTeacher(game) ? { token: teacherToken } : {}),
      ...(game === "daily" ? { dateKey } : {}),
    };
    lastRequest.current = request;
    setPhase("result");
    finish.mutate(request);
  }
  function completeRound(response: RoundAnswer) {
    const updated = [...responses, response];
    setResponses(updated);
    if (round < questions.length - 1) {
      setRound(value => value + 1);
      return;
    }
    const submission: ActivitySubmission = {
      game,
      level,
      questionIds: questions.map(question => question.id),
    };
    if (game === "builder")
      submission.orders = updated.map(value => value.order!);
    else if (game === "charades")
      submission.moderated = updated.map(value => value.moderated!);
    else submission.answers = updated.map(value => value.answer!);
    if (game === "fix")
      submission.textAnswers = updated.map(value => value.text!);
    if (isTeam(game)) {
      submission.teamNames = names;
      submission.teamAssignments = updated.map(
        (_, index) => index % names.length
      );
    }
    if (game === "auction") submission.bets = updated.map(value => value.bet!);
    save(submission);
  }
  const result = finish.data;
  const currentQuestion = questions[round];
  const roundProps: RoundProps = {
    question: currentQuestion,
    onDone: completeRound,
    last: round === questions.length - 1,
    timeLimit,
  };
  const storyPages = responses.flatMap((response, index) =>
    response.answer === questions[index].answer
      ? [questions[index].options[questions[index].answer]]
      : []
  );
  return (
    <div
      className={`game-player variety-player ${activity.color} ${whiteboard ? "variety-whiteboard" : ""}`}
    >
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
            <span className={`variety-intro-icon ${activity.color}`}>
              <Icon size={38} />
            </span>
            <span className="eyebrow">{activity.tag}</span>
            <h1>
              {activity.title}
              <span className="heading-dot">.</span>
            </h1>
            <p>{activity.description}</p>
          </div>
          <section className="game-setup panel">
            <h2>Make this adventure yours</h2>
            <label className="field-label">
              Choose your textbook level
              {game === "boss" ? " · Boss: 5A / 6A" : ""}
            </label>
            <div className="level-buttons">
              {textbookLevels.map(value => (
                <button
                  key={value}
                  className={value === level ? "selected" : ""}
                  aria-pressed={value === level}
                  disabled={game === "boss" && !["5A", "6A"].includes(value)}
                  onClick={() => {
                    setLevel(value);
                    setSetupError("");
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
            {game === "daily" && (
              <div className="daily-notice">
                <CalendarDays size={25} />
                <div>
                  <strong>
                    Today: {new Date().toISOString().slice(0, 10)} · UTC
                  </strong>
                  <p>
                    One shared question for this level and date. One saved
                    challenge per student per UTC day, across all levels. Double
                    the usual reward.
                  </p>
                </div>
              </div>
            )}
            {needsTeacher(game) && (
              <div className={`teacher-gate ${teacherToken ? "ready" : ""}`}>
                <LockKeyhole size={24} />
                <div>
                  <strong>
                    {teacherToken
                      ? "Teacher session supplied"
                      : "Teacher login required"}
                  </strong>
                  <p>
                    {teacherToken
                      ? "The server verifies your teacher session before accepting the result."
                      : "Return to the game room → Teacher tools → Log in. Student mode cannot start this activity."}
                  </p>
                </div>
                {!teacherToken && (
                  <button className="button secondary" onClick={onExit}>
                    Go to game room
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
            )}
            {isTeam(game) && (
              <div className="team-setup">
                <label className="field-label" htmlFor="team-count">
                  Number of teams
                </label>
                <select
                  id="team-count"
                  className="text-input"
                  value={teamNames.length}
                  onChange={event => {
                    const count = Number(event.target.value);
                    setTeamNames(current =>
                      Array.from(
                        { length: count },
                        (_, index) => current[index] || `Team ${index + 1}`
                      )
                    );
                  }}
                >
                  {[2, 3, 4].map(value => (
                    <option key={value} value={value}>
                      {value} teams
                    </option>
                  ))}
                </select>
                <div className="team-name-fields">
                  {teamNames.map((name, index) => (
                    <label key={index}>
                      Team {index + 1}
                      <input
                        className="text-input"
                        value={name}
                        maxLength={40}
                        onChange={event =>
                          setTeamNames(current =>
                            current.map((value, position) =>
                              position === index ? event.target.value : value
                            )
                          )
                        }
                      />
                    </label>
                  ))}
                </div>
                <p className="setup-note">
                  Teams take turns in order. This run’s individual reward is
                  saved to <strong>{student.name}</strong>; team scores are
                  saved separately. To credit another student, select them in
                  the game room before a new run.
                </p>
                {game === "auction" && (
                  <p className="setup-note">
                    Every team starts with 20 virtual points. Wager 1–5 per turn
                    within the current budget; right = +bet, wrong = −bet. Never
                    a student-point deduction.
                  </p>
                )}
              </div>
            )}
            <label className="variety-toggle">
              <input
                type="checkbox"
                checked={whiteboard}
                onChange={event => setWhiteboard(event.target.checked)}
                disabled={needsTeacher(game)}
              />
              <span>
                <Users size={20} />
                Whiteboard presentation
                <span className="setup-note">
                  Larger text and targets for shared class play
                  {needsTeacher(game)
                    ? " · required for teacher-led games"
                    : ""}
                  .
                </span>
              </span>
            </label>
            {game === "story" && (
              <p className="setup-note">
                {whiteboard
                  ? "Whole-class story: discuss each choice and vote by a show of hands; the teacher taps the class’s final choice. This is in-room voting, not live online voting."
                  : "Solo story: choose each next sentence yourself and build your scrapbook."}
              </p>
            )}
            {timerAvailable && (
              <label className="variety-toggle">
                <input
                  type="checkbox"
                  checked={timed}
                  disabled={game === "boss"}
                  onChange={event => setTimed(event.target.checked)}
                />
                <span>
                  <Timer size={20} />
                  {game === "fix"
                    ? "Speed repairs · 30 seconds per sentence"
                    : "Rapid round · 20 seconds per question"}
                  <span className="setup-note">
                    {game === "boss"
                      ? "Boss rounds are timed. A timeout counts as missed."
                      : "Optional. When time runs out, the answer counts as missed."}
                  </span>
                </span>
              </label>
            )}
            {game === "boss" && (
              <p className="setup-note">
                Five grammar questions. All five must be correct to defeat the
                boss. You have 20 seconds per question; normal effort points
                still apply.
              </p>
            )}
            {game === "odd" && (
              <p className="setup-note">
                Explain your choice out loud or in the answer box during play.
                Any explanation extra credit is teacher-awarded in Teacher tools
                with a required reason; it is not automatically added here.
              </p>
            )}
            <div className="setup-points">
              <Star size={18} fill="currentColor" />
              <span>
                Earn{" "}
                <strong>
                  {game === "daily" ? "2 or 10" : "1, 3, or 5"} saved points.
                </strong>{" "}
                A three-correct streak earns a badge, not extra points.
              </span>
            </div>
            {setupError && (
              <div className="variety-error" role="alert">
                {setupError}
              </div>
            )}
            <button
              className="button primary full-width big-button"
              disabled={
                (needsTeacher(game) && !teacherToken) ||
                (isTeam(game) && !validTeams)
              }
              onClick={begin}
            >
              Let’s play
              <ArrowRight size={20} />
            </button>
          </section>
          <p className="game-help-note">
            Static classroom content. Your results and rewards are checked and
            saved by the classroom server.
          </p>
        </>
      ) : phase === "play" ? (
        <>
          <div className="game-progress-header">
            <span className="game-label">
              <Icon size={19} />
              {activity.title}
            </span>
            <span>
              {game === "bingo"
                ? "Match definitions · complete one line"
                : `${game === "daily" ? dateKey + " · UTC" : `Round ${round + 1} of ${questions.length}`} · ${level}`}
            </span>
          </div>
          <div className="progress-track">
            <div
              style={{
                width: `${game === "bingo" ? 0 : (round / questions.length) * 100}%`,
              }}
            />
          </div>
          {isTeam(game) && (
            <TeamStrip
              names={names}
              scores={scores}
              current={round % names.length}
            />
          )}
          {game === "boss" && (
            <div className="boss-banner">
              <Shield size={44} />
              <div>
                <strong>The Grammar Guardian</strong>
                <p>
                  {
                    responses.filter(
                      (response, index) =>
                        response.answer === questions[index].answer
                    ).length
                  }{" "}
                  of 5 hits landed. Five correct answers defeat it.
                </p>
              </div>
              <div className="boss-health">
                {questions.map((question, index) => (
                  <span
                    key={question.id}
                    className={
                      responses[index]?.answer === question.answer ? "hit" : ""
                    }
                  />
                ))}
              </div>
            </div>
          )}
          {game === "story" && (
            <div className="story-scrapbook">
              <BookOpen size={25} />
              <div>
                <h3>{currentQuestion.scenario}</h3>
                {storyPages.length ? (
                  storyPages.map((page, index) => (
                    <p key={index}>
                      <span>{index + 1}</span>
                      {page}
                    </p>
                  ))
                ) : (
                  <p>
                    Your scrapbook is waiting for its first correct sentence.
                  </p>
                )}
              </div>
            </div>
          )}
          <section
            className={`variety-board panel ${game === "bingo" ? "bingo-board" : ""}`}
          >
            {game === "bingo" ? (
              <BingoBoard
                key={runId.current}
                questions={questions}
                onRestart={begin}
                onFinish={(questionIds, answers) =>
                  save({ game, level, questionIds, answers })
                }
              />
            ) : (
              <div key={currentQuestion.id}>
                {game === "builder" ? (
                  <BuilderRound {...roundProps} />
                ) : game === "fix" ? (
                  <FixRound {...roundProps} />
                ) : game === "maze" ? (
                  <MazeRound {...roundProps} position={round} />
                ) : game === "who" ? (
                  <WhoRound {...roundProps} />
                ) : game === "charades" ? (
                  <CharadesRound {...roundProps} />
                ) : game === "auction" ? (
                  <AuctionRound
                    {...roundProps}
                    team={names[round % names.length]}
                    budget={scores[round % names.length]}
                  />
                ) : (
                  <ChoiceRound
                    {...roundProps}
                    heading={
                      game === "battle"
                        ? `${names[round % names.length]}’S TURN`
                        : game === "boss"
                          ? "HIT THE GUARDIAN · GRAMMAR"
                          : game === "story"
                            ? "ADD THE NEXT STORY PAGE"
                            : game === "odd"
                              ? "FOUR WORDS · ONE DIFFERENT FAMILY"
                              : "TODAY’S SHARED CHALLENGE"
                    }
                    extra={
                      game === "odd" ? (
                        <label className="odd-explanation">
                          Why does it not belong?{" "}
                          <span>
                            Optional, for discussion. Teacher extra credit is
                            separate.
                          </span>
                          <textarea
                            maxLength={300}
                            rows={2}
                            placeholder="I think it is different because…"
                          />
                        </label>
                      ) : game === "story" ? (
                        <p className="variety-instruction">
                          Only a correct sentence will be added to the
                          scrapbook. A wrong choice is still part of your honest
                          result.
                        </p>
                      ) : null
                    }
                  />
                )}
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="result-panel panel">
          {finish.isPending ? (
            <div className="saving-result">
              <span className="spinner" />
              <h2>Saving your little victory…</h2>
              <p>No points are added until the server confirms this result.</p>
            </div>
          ) : finish.isError ? (
            <div className="saving-result">
              <XCircle size={44} />
              <h2>Your result is not saved yet.</h2>
              <p>{finish.error.message}</p>
              <p>
                Retry sends the same run ID and answers, so an interrupted
                response cannot award duplicate points.
                {needsTeacher(game)
                  ? " If your teacher session expired, return to Teacher tools and log in."
                  : ""}
                {game === "daily"
                  ? " An already-completed UTC challenge cannot be saved again."
                  : ""}
              </p>
              <div className="result-actions">
                <button
                  className="button primary"
                  onClick={() =>
                    lastRequest.current &&
                    finish.mutate({
                      ...lastRequest.current,
                      ...(needsTeacher(game) ? { token: teacherToken } : {}),
                    })
                  }
                >
                  <RotateCcw size={18} />
                  Retry saving
                </button>
                <button className="button secondary" onClick={onExit}>
                  Back to game room
                </button>
              </div>
            </div>
          ) : result ? (
            <>
              <span className="result-trophy">
                <Trophy size={55} />
              </span>
              <span className="eyebrow">
                CHECKED AND SAVED BY THE CLASSROOM
              </span>
              <h1>
                {game === "boss"
                  ? result.correct === 5
                    ? "Guardian defeated!"
                    : "The guardian lives to play again."
                  : result.correct === result.total
                    ? "You made it shine!"
                    : "Every little practice counts."}
              </h1>
              <p>{student.name}, your result has reached the classroom.</p>
              <div className="result-numbers">
                <div>
                  <strong>
                    {result.correct}
                    <span>/{result.total}</span>
                  </strong>
                  <span>
                    correct{" "}
                    {game === "maze"
                      ? "first answers"
                      : game === "charades"
                        ? "teacher-confirmed guesses"
                        : "answers"}
                  </span>
                </div>
                <div className="earned-points">
                  <strong>
                    +{result.points}
                    <Star size={22} fill="currentColor" />
                  </strong>
                  <span>
                    points saved
                    {game === "daily" ? " · double daily reward" : ""}
                  </span>
                </div>
              </div>
              <div className="result-saved">
                <CheckCircle2 size={18} />
                Saved! Your total is{" "}
                <strong>{result.studentPoints} points.</strong>
              </div>
              <div className="variety-badges">
                {result.streak && (
                  <span>
                    <Sparkles size={19} />
                    Three-correct streak badge
                  </span>
                )}
                {game === "boss" && result.correct === 5 && (
                  <span>
                    <Shield size={19} />
                    Boss defeated
                  </span>
                )}
                {game === "daily" && (
                  <span>
                    <CalendarDays size={19} />
                    {dateKey} · UTC completed
                  </span>
                )}
              </div>
              {result.teamScores && (
                <>
                  <h3 className="saved-team-title">
                    {game === "auction"
                      ? "Saved team score changes · net wagers"
                      : "Saved team result · correct answers"}
                  </h3>
                  <TeamStrip
                    names={result.teamScores.map(team => team.name)}
                    scores={result.teamScores.map(team => team.score)}
                    saved
                  />
                  {game === "auction" && (
                    <p className="setup-note">
                      Round virtual budgets:{" "}
                      {result.teamScores
                        .map(team => `${team.name}: ${20 + team.score}`)
                        .join(" · ")}
                      . Only the net changes above are added to persistent team
                      scores.
                    </p>
                  )}
                </>
              )}
              <div className="result-actions">
                <button className="button primary" onClick={onBillboard}>
                  See class billboard
                  <Trophy size={18} />
                </button>
                {game !== "daily" && (
                  <button
                    className="button secondary"
                    onClick={() => {
                      finish.reset();
                      setPhase("setup");
                    }}
                  >
                    Choose another round
                    <RotateCcw size={18} />
                  </button>
                )}
              </div>
              <div className="answer-review">
                <h3>A little look back</h3>
                {questions.slice(0, result.total).map(question => (
                  <div className="review-row" key={question.id}>
                    <BookOpen size={18} />
                    <div>
                      <strong>{question.question}</strong>
                      <p>{question.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </section>
      )}
      <Modal
        open={exitModal}
        onClose={() => setExitModal(false)}
        title="Leave this adventure?"
        description="This round is unfinished. Leaving now will not save points or team scores."
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
