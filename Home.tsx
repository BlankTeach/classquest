import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Crown,
  Gamepad2,
  GraduationCap,
  LayoutGrid,
  LogOut,
  Maximize,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Avatar, BrandMark, EmptyState, Modal } from "@/components/ClassroomUI";
import GamePlayer from "@/components/GamePlayer";
import VarietyPlayer from "@/components/VarietyPlayer";
import GameLibrary from "@/components/GameLibrary";
import type { PlayKind } from "@/components/GameLibrary";
import CurriculumPage from "@/components/CurriculumPage";
import TeamBoard from "@/components/TeamBoard";
import { activityCatalog } from "@shared/varietyData";
import type { ActivityKind } from "@shared/varietyData";
import type { GameKind } from "@shared/gameData";

const games: {
  id: GameKind;
  title: string;
  tag: string;
  description: string;
  meta: string;
  image: string;
  color: string;
}[] = [
  {
    id: "quiz",
    title: "Quiz Quest",
    tag: "THINK & CHOOSE",
    description:
      "Put your grammar and word power to the test. One question at a time!",
    meta: "Grammar & vocabulary",
    image: "/manus-storage/async-images/jZBFIUrvLuQau8FrYd938m/image-1.webp",
    color: "lavender",
  },
  {
    id: "sort",
    title: "Sort It Out",
    tag: "DRAG & DISCOVER",
    description:
      "Every word has a home. Can you find the right basket for each one?",
    meta: "Textbook & chapter adventures",
    image: "/manus-storage/async-images/jZBFIUrvLuQau8FrYd938m/image-2.webp",
    color: "peach",
  },
  {
    id: "memory",
    title: "Memory Match",
    tag: "FLIP & FIND",
    description:
      "A little focus, a little memory. Flip the cards and make a perfect pair.",
    meta: "Textbook & chapter matching",
    image: "/manus-storage/async-images/jZBFIUrvLuQau8FrYd938m/image-3.webp",
    color: "mint",
  },
];
type Student = {
  id: number;
  name: string;
  points: number;
  avatar: number;
  streakBadge?: boolean;
};
function savedValue(key: string, session = false) {
  try {
    return (session ? sessionStorage : localStorage).getItem(key) || "";
  } catch {
    return "";
  }
}
function remember(key: string, value: string, session = false) {
  try {
    (session ? sessionStorage : localStorage).setItem(key, value);
  } catch {
    /* Storage is optional for identity convenience only. */
  }
}
function formatTime(date: Date | string) {
  return new Date(date).toLocaleString("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Home() {
  const [location, navigate] = useLocation();
  const [studentId, setStudentId] = useState<number>(
    () => Number(savedValue("cq-student")) || 0
  );
  const [token, setToken] = useState(() => savedValue("cq-teacher", true));
  const [studentModal, setStudentModal] = useState(false);
  const [loginModal, setLoginModal] = useState(false);
  const [helpModal, setHelpModal] = useState(false);
  const [pendingGame, setPendingGame] = useState<PlayKind | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [search, setSearch] = useState("");
  const [adjustment, setAdjustment] = useState<{
    student: Student;
    sign: number;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState(1);
  const [addModal, setAddModal] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    kind: "games" | "leaderboard" | "remove";
    student?: Student;
  } | null>(null);
  const utils = trpc.useUtils();
  const classroom = trpc.classroom.state.useQuery(
    { token: token || undefined },
    { refetchInterval: 3000, refetchOnWindowFocus: true }
  );
  const verified = trpc.classroom.verify.useQuery(
    { token },
    {
      enabled: !!token,
      retry: false,
      refetchInterval: 3000,
      refetchOnWindowFocus: true,
    }
  );
  const isTeacher = !!token && verified.data?.valid === true;
  const students = classroom.data?.students || [];
  const student = students.find(s => s.id === studentId);
  const leaders = [...students].sort(
    (a, b) => b.points - a.points || a.name.localeCompare(b.name)
  );
  const history = classroom.data?.history || [];
  const invalidate = () => utils.classroom.state.invalidate();
  const join = trpc.classroom.join.useMutation({
    onSuccess: s => {
      selectStudent(s);
      invalidate();
    },
    onError: e => teacherError(e),
  });
  const login = trpc.classroom.login.useMutation({
    onSuccess: result => {
      setToken(result.token);
      remember("cq-teacher", result.token, true);
      setPassword("");
      setLoginModal(false);
      navigate("/teacher");
      toast.success("You're in. Let's celebrate some progress!");
    },
    onError: e => teacherError(e),
  });
  const logout = trpc.classroom.logout.useMutation();
  const adjust = trpc.classroom.adjust.useMutation({
    onSuccess: () => {
      setAdjustment(null);
      setReason("");
      invalidate();
      toast.success("Points updated and reason saved.");
    },
    onError: e => teacherError(e),
  });
  const add = trpc.classroom.addStudent.useMutation({
    onSuccess: () => {
      setAddModal(false);
      setName("");
      invalidate();
      toast.success("A new classroom star is here!");
    },
    onError: e => teacherError(e),
  });
  const remove = trpc.classroom.removeStudent.useMutation({
    onSuccess: () => {
      setConfirmation(null);
      invalidate();
      toast.success("Student removed. History is preserved.");
    },
    onError: e => teacherError(e),
  });
  const reset = trpc.classroom.reset.useMutation({
    onSuccess: () => {
      setConfirmation(null);
      invalidate();
      toast.success("Reset complete. The audit history is preserved.");
    },
    onError: e => teacherError(e),
  });
  useEffect(() => {
    if (token && verified.data?.valid === false) {
      setToken("");
      remember("cq-teacher", "", true);
      setAdjustment(null);
      setAddModal(false);
      setConfirmation(null);
      if (location === "/teacher" || location === "/activity")
        setLoginModal(true);
      toast.info("Your teacher session has ended. Please log in again.");
    }
  }, [token, verified.data, location]);
  function teacherError(error: {
    message: string;
    data?: { code?: string } | null;
  }) {
    if (error.data?.code === "UNAUTHORIZED") {
      setToken("");
      remember("cq-teacher", "", true);
      setAdjustment(null);
      setAddModal(false);
      setConfirmation(null);
      setLoginModal(true);
    }
    toast.error(error.message);
  }
  function selectStudent(s: Student) {
    setStudentId(s.id);
    remember("cq-student", String(s.id));
    setStudentModal(false);
    setName("");
    if (pendingGame) {
      navigate(`/play/${pendingGame}`);
      setPendingGame(null);
    }
  }
  function launch(id: PlayKind) {
    if (!student) {
      setPendingGame(id);
      setStudentModal(true);
    } else navigate(`/play/${id}`);
  }
  function teacherEntry() {
    if (isTeacher) navigate("/teacher");
    else setLoginModal(true);
  }
  function signOut() {
    logout.mutate({ token });
    setToken("");
    remember("cq-teacher", "", true);
    navigate("/");
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      toast.info("For a bigger view, use your browser's full-screen option.");
    }
  }
  const playing = location.startsWith("/play/");
  const game = location.split("/")[2] as PlayKind;
  const isOriginalGame = games.some(g => g.id === game);
  const validGame = isOriginalGame || activityCatalog.some(g => g.id === game);
  const onTeacherPage = location === "/teacher";
  const pageTitle =
    location === "/curriculum"
      ? "Our curriculum"
      : onTeacherPage
        ? "Teacher's corner"
        : location === "/leaderboard"
          ? "Class billboard"
          : location === "/activity"
            ? "Points history"
            : playing
              ? games.find(g => g.id === game)?.title ||
                activityCatalog.find(g => g.id === game)?.title ||
                "Game room"
              : "Game room";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="/"
          onClick={e => {
            e.preventDefault();
            navigate("/");
          }}
        >
          <BrandMark />
          <span>
            ClassQuest<span className="brand-caption">PLAY. LEARN. GROW.</span>
          </span>
        </a>
        <div className="class-label">
          <span className="class-icon">
            <GraduationCap size={21} />
          </span>
          <span>
            {classroom.data?.demo ? "Demo classroom" : "Our classroom"}
            <small>Everyone belongs here</small>
          </span>
        </div>
        <div className="nav-label">YOUR CLASSROOM</div>
        <nav className="navigation">
          <button
            className={
              !onTeacherPage &&
              !["/leaderboard", "/activity", "/curriculum"].includes(location)
                ? "active"
                : ""
            }
            onClick={() => navigate("/")}
          >
            <LayoutGrid size={21} />
            <span>Game room</span>
            <span className="nav-count">15</span>
          </button>
          <button
            className={location === "/leaderboard" ? "active" : ""}
            onClick={() => {
              if (student || isTeacher) navigate("/leaderboard");
              else {
                setStudentModal(true);
              }
            }}
          >
            <Trophy size={21} />
            <span>Class billboard</span>
          </button>
          <button
            className={location === "/activity" ? "active" : ""}
            onClick={() => {
              if (isTeacher) navigate("/activity");
              else teacherEntry();
            }}
          >
            <Clock3 size={21} />
            <span>Points history</span>
          </button>
          <button
            className={location === "/curriculum" ? "active" : ""}
            onClick={() => navigate("/curriculum")}
          >
            <BookOpen size={21} />
            <span>Our curriculum</span>
          </button>
        </nav>
        <div className="sidebar-note">
          <div className="note-stars">
            <Star size={24} fill="currentColor" />
            <Sparkles size={16} />
          </div>
          <h3>Every little win counts.</h3>
          <p>
            Be curious. Be kind.
            <br />
            Keep on growing.
          </p>
          <span className="note-line" />
        </div>
        <div className="sidebar-bottom">
          <button className="help-link" onClick={() => setHelpModal(true)}>
            <CircleHelp size={19} />
            <span>How it works</span>
          </button>
          <button
            className={`teacher-link ${onTeacherPage ? "selected" : ""}`}
            onClick={teacherEntry}
          >
            <ShieldCheck size={19} />
            <span>{isTeacher ? "Teacher dashboard" : "Teacher login"}</span>
            <ArrowRight size={16} />
          </button>
          <small>Made for little minds. Big possibilities.</small>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Your classroom <span>/</span> <strong>{pageTitle}</strong>
          </div>
          <div className="topbar-actions">
            <span
              className="sync-indicator"
              title="Classroom refreshes every 3 seconds"
            >
              <i />
              {classroom.isError ? "Reconnecting" : "Classroom live"}
            </span>
            <button
              className="icon-button fullscreen"
              onClick={fullscreen}
              aria-label="Toggle full screen"
            >
              <Maximize size={19} />
            </button>
            <button
              className="profile-button"
              onClick={() => setStudentModal(true)}
            >
              {student ? (
                <Avatar
                  name={student.name}
                  avatar={student.avatar}
                  size="small"
                />
              ) : (
                <span className="profile-empty">
                  <Users size={17} />
                </span>
              )}
              <span>{student ? student.name : "Choose your name"}</span>
              <ChevronDown size={16} />
            </button>
          </div>
        </header>
        <main className={`main-content ${playing ? "playing-content" : ""}`}>
          {classroom.isError && (
            <div className="error-banner">
              We couldn't reach your classroom. Your saved data is safe.{" "}
              <button onClick={() => classroom.refetch()}>Try again</button>
            </div>
          )}
          {playing && validGame ? (
            student ? (
              isOriginalGame ? (
                <GamePlayer
                  key={`${game}-${student.id}`}
                  game={game as GameKind}
                  student={student}
                  onExit={() => navigate("/")}
                  onBillboard={() => navigate("/leaderboard")}
                  onComplete={invalidate}
                  onBoss={() => navigate("/play/boss")}
                />
              ) : (
                <VarietyPlayer
                  key={`${game}-${student.id}`}
                  game={game as ActivityKind}
                  student={student}
                  teacherToken={isTeacher ? token : undefined}
                  onExit={() => navigate("/")}
                  onBillboard={() => navigate("/leaderboard")}
                  onComplete={invalidate}
                />
              )
            ) : (
              <EmptyState title="Who's playing?">
                <button
                  className="button primary"
                  onClick={() => setStudentModal(true)}
                >
                  Choose your name <ArrowRight size={18} />
                </button>
              </EmptyState>
            )
          ) : playing ? (
            <EmptyState title="That game isn't in our game room.">
              <button className="button primary" onClick={() => navigate("/")}>
                Back to games
              </button>
            </EmptyState>
          ) : location === "/curriculum" ? (
            <CurriculumPage />
          ) : location === "/teacher" ? (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    A LITTLE ENCOURAGEMENT GOES A LONG WAY
                  </span>
                  <h1>
                    Teacher's corner<span className="heading-dot">.</span>
                  </h1>
                  <p>Celebrate the good moments. Help every student grow.</p>
                </div>
                {isTeacher && (
                  <button className="button secondary" onClick={signOut}>
                    <LogOut size={17} />
                    Log out
                  </button>
                )}
              </div>
              {!isTeacher ? (
                <div className="login-panel">
                  <div className="round-icon">
                    <ShieldCheck size={34} />
                  </div>
                  <h2>A little space for teachers.</h2>
                  <p>
                    Log in to manage your class, award points, and see their
                    progress.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => setLoginModal(true)}
                  >
                    Teacher login <ArrowRight size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="teacher-stats">
                    <div>
                      <Users />
                      <span>
                        <strong>{students.length}</strong>Classroom stars
                      </span>
                    </div>
                    <div>
                      <Star />
                      <span>
                        <strong>
                          {classroom.data?.stats.classPoints || 0}
                        </strong>
                        Total class points
                      </span>
                    </div>
                    <div>
                      <Gamepad2 />
                      <span>
                        <strong>
                          {classroom.data?.stats.gamesPlayed || 0}
                        </strong>
                        Games completed
                      </span>
                    </div>
                  </div>
                  <section className="panel student-panel">
                    <div className="panel-header">
                      <div>
                        <h2>
                          Your students{" "}
                          <span className="small-count">{students.length}</span>
                        </h2>
                        <p>Award a little encouragement, with a reason.</p>
                      </div>
                      <button
                        className="button primary"
                        onClick={() => {
                          setName("");
                          setAddModal(true);
                        }}
                      >
                        <Plus size={17} />
                        Add student
                      </button>
                    </div>
                    <label className="search-field">
                      <Search size={18} />
                      <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Find a student"
                      />
                    </label>
                    <div className="student-grid">
                      {students
                        .filter(s =>
                          s.name.toLowerCase().includes(search.toLowerCase())
                        )
                        .map(s => (
                          <div className="student-manage-card" key={s.id}>
                            <button
                              className="remove-student"
                              aria-label={`Remove ${s.name}`}
                              onClick={() =>
                                setConfirmation({ kind: "remove", student: s })
                              }
                            >
                              <X size={15} />
                            </button>
                            <Avatar
                              name={s.name}
                              avatar={s.avatar}
                              size="large"
                            />
                            <h3>{s.name}</h3>
                            <span className="points-total">
                              <Star size={14} fill="currentColor" />
                              {s.points} points
                            </span>
                            <div className="point-controls">
                              <button
                                aria-label={`Deduct points from ${s.name}`}
                                onClick={() => {
                                  setAdjustment({ student: s, sign: -1 });
                                  setReason("");
                                  setAmount(1);
                                }}
                              >
                                <Minus size={20} />
                              </button>
                              <button
                                aria-label={`Add points to ${s.name}`}
                                onClick={() => {
                                  setAdjustment({ student: s, sign: 1 });
                                  setReason("");
                                  setAmount(1);
                                }}
                              >
                                <Plus size={20} />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                    {!students.length && (
                      <EmptyState title="A new class is waiting.">
                        Add your first student to begin.
                      </EmptyState>
                    )}
                  </section>
                  <section className="panel reset-panel">
                    <div>
                      <h3>A fresh start</h3>
                      <p>
                        Reset game results or set everyone's points to zero. The
                        history stays safe.
                      </p>
                    </div>
                    <div className="reset-actions">
                      <button
                        className="button secondary"
                        onClick={() => setConfirmation({ kind: "games" })}
                      >
                        Reset game scores
                      </button>
                      <button
                        className="button danger"
                        onClick={() => setConfirmation({ kind: "leaderboard" })}
                      >
                        Clear leaderboard
                      </button>
                    </div>
                  </section>
                  <HistoryPanel history={history} token={token} key={token} />
                </>
              )}
            </>
          ) : location === "/activity" ? (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">THE STORY BEHIND EVERY POINT</span>
                  <h1>Little moments. Lasting progress.</h1>
                  <p>Game results, kind deeds, and everything in between.</p>
                </div>
              </div>
              {isTeacher ? (
                <HistoryPanel history={history} token={token} key={token} />
              ) : (
                <div className="login-panel">
                  <ShieldCheck size={35} />
                  <h2>History is a teacher space.</h2>
                  <button className="button primary" onClick={teacherEntry}>
                    Teacher login
                  </button>
                </div>
              )}
            </>
          ) : location === "/leaderboard" ? (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">LET'S CHEER EACH OTHER ON</span>
                  <h1>
                    Our classroom stars<span className="heading-dot">.</span>
                  </h1>
                  <p>Every game, every kind deed, every little step forward.</p>
                </div>
                <span className="live-pill">
                  <i />
                  Live points
                </span>
              </div>
              {student || isTeacher ? (
                <>
                  <Leaderboard
                    leaders={leaders}
                    expanded
                    currentId={studentId}
                  />
                  <TeamBoard />
                  <div className="billboard-note">
                    <Sparkles size={22} />
                    <p>
                      It's not just about being first. It's about giving your
                      best.
                    </p>
                  </div>
                </>
              ) : (
                <EmptyState title="Join your class to see the billboard.">
                  <button
                    className="button primary"
                    onClick={() => setStudentModal(true)}
                  >
                    Choose your name
                  </button>
                </EmptyState>
              )}
            </>
          ) : (
            <>
              <div className="welcome-row">
                <div>
                  <span className="eyebrow">
                    A GOOD DAY TO LEARN SOMETHING NEW
                  </span>
                  <h1>
                    {student
                      ? `Let's play, ${student.name}!`
                      : "Hello, little explorer!"}
                    <span className="wave-spark">
                      <Sparkles size={26} />
                    </span>
                  </h1>
                  <p>Your next little adventure is just a game away.</p>
                </div>
                <span className="class-pill">
                  <Users size={17} />
                  <strong>{students.length}</strong> classroom stars
                </span>
              </div>
              <section className="welcome-banner">
                <div className="banner-copy">
                  <span className="banner-label">
                    <span /> LEARNING, WITH A LITTLE MORE PLAY
                  </span>
                  <h2>
                    Small games.
                    <br />
                    Big discoveries.
                  </h2>
                  <p>
                    Build your word power. Earn a little sparkle.
                    <br />
                    And have a whole lot of fun along the way.
                  </p>
                  <button
                    className="button primary"
                    onClick={() =>
                      student
                        ? document.getElementById("games")?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          })
                        : setStudentModal(true)
                    }
                  >
                    {student ? "Find your next game" : "Choose your name"}
                    <ArrowRight size={18} />
                  </button>
                </div>
                <div className="banner-adventure" aria-hidden="true">
                  <div className="adventure-orbit" />
                  <div className="adventure-book">
                    <BookOpen size={58} strokeWidth={1.5} />
                    <span className="tiny-dot" />
                  </div>
                  <div className="adventure-star">
                    <Star size={57} fill="currentColor" strokeWidth={1.2} />
                  </div>
                  <div className="adventure-trophy">
                    <Trophy size={47} strokeWidth={1.5} />
                  </div>
                  <span className="deco-spark spark-a">
                    <Sparkles size={29} />
                  </span>
                  <span className="deco-spark spark-b">
                    <Star size={18} fill="currentColor" />
                  </span>
                  <span className="deco-dot dot-a" />
                  <span className="deco-dot dot-b" />
                  <span className="adventure-caption">
                    A little better, every day.
                  </span>
                </div>
              </section>
              <GameLibrary games={games} onLaunch={launch} />
              <div className="lower-grid">
                <section className="panel classroom-stars">
                  <div className="panel-header">
                    <div>
                      <h2>
                        <Trophy className="gold-icon" size={21} />
                        Our classroom stars
                      </h2>
                      <p>A little cheer for a lot of effort.</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() =>
                        student || isTeacher
                          ? navigate("/leaderboard")
                          : setStudentModal(true)
                      }
                    >
                      View billboard
                      <ArrowRight size={15} />
                    </button>
                  </div>
                  <Leaderboard
                    leaders={leaders}
                    currentId={studentId}
                    loading={classroom.isPending}
                  />
                </section>
                <section className="panel points-guide">
                  <div className="points-guide-top">
                    <span className="mini-star">
                      <Star size={22} fill="currentColor" />
                    </span>
                    <h2>Little wins add up.</h2>
                  </div>
                  <p>
                    Finish a game, earn points.
                    <br />
                    Every effort deserves a little celebration.
                  </p>
                  <div className="scoring-row">
                    <div>
                      <strong className="score-five">+5</strong>
                      <span>All correct</span>
                    </div>
                    <div>
                      <strong className="score-three">+3</strong>
                      <span>Some correct</span>
                    </div>
                    <div>
                      <strong className="score-one">+1</strong>
                      <span>0 or 1 correct</span>
                    </div>
                  </div>
                  <div className="guide-bottom">
                    <Check size={15} />
                    Keep trying. You're growing!
                  </div>
                </section>
              </div>
              <footer className="content-footer">
                <span>Little steps. Brighter minds.</span>
                <span>
                  <ShieldCheck size={13} />
                  Points saved safely to your classroom
                </span>
              </footer>
            </>
          )}
        </main>
      </div>
      <Modal
        open={studentModal}
        onClose={() => {
          setStudentModal(false);
          setPendingGame(null);
        }}
        title="Who's ready to play?"
        description="Choose your name, or tell us what to call you. No password needed."
      >
        <div className="student-picker">
          {students.map(s => (
            <button
              key={s.id}
              className={studentId === s.id ? "picked" : ""}
              onClick={() => selectStudent(s)}
            >
              <Avatar name={s.name} avatar={s.avatar} />
              <span>{s.name}</span>
              {studentId === s.id && <Check size={15} />}
            </button>
          ))}
        </div>
        <div className="form-divider">
          <span>or enter your name</span>
        </div>
        <form
          onSubmit={e => {
            e.preventDefault();
            if (name.trim()) join.mutate({ name: name.trim() });
          }}
        >
          <label className="field-label" htmlFor="student-name">
            Your name
          </label>
          <input
            className="text-input"
            id="student-name"
            autoComplete="given-name"
            placeholder="e.g. Sophie"
            value={name}
            maxLength={40}
            onChange={e => setName(e.target.value)}
            required
          />
          <button
            className="button primary full-width"
            disabled={join.isPending || !name.trim()}
          >
            {join.isPending ? "Joining your class…" : "That's me. Let's play!"}
            <ArrowRight size={18} />
          </button>
        </form>
        <p className="form-footnote">
          <ShieldCheck size={14} />
          Your name connects your games to your classroom points.
        </p>
      </Modal>
      <Modal
        open={loginModal}
        onClose={() => setLoginModal(false)}
        title="Hello, teacher."
        description="Your classroom's little victories are waiting for you."
      >
        <div className="login-modal-icon">
          <ShieldCheck size={32} />
        </div>
        <form
          onSubmit={e => {
            e.preventDefault();
            login.mutate({ password });
          }}
        >
          <label className="field-label" htmlFor="teacher-password">
            Teacher password
          </label>
          <input
            className="text-input"
            id="teacher-password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your classroom password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button
            className="button primary full-width"
            disabled={login.isPending || !password}
          >
            {login.isPending
              ? "Checking your password…"
              : "Open teacher dashboard"}
            <ArrowRight size={18} />
          </button>
        </form>
        <p className="form-footnote">
          <ShieldCheck size={14} />
          Only teachers can change points and manage students.
        </p>
      </Modal>
      <Modal
        open={!!adjustment}
        onClose={() => setAdjustment(null)}
        title={
          adjustment
            ? `${adjustment.sign > 0 ? "Add" : "Deduct"} points for ${adjustment.student.name}`
            : "Adjust points"
        }
        description="Every point has a story. Save a reason for this change."
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            if (adjustment && reason.trim())
              adjust.mutate({
                token,
                studentId: adjustment.student.id,
                delta: adjustment.sign * amount,
                reason: reason.trim(),
              });
          }}
        >
          <label className="field-label" htmlFor="amount">
            How many points?
          </label>
          <select
            className="text-input"
            id="amount"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>
                {adjustment?.sign === -1 ? "−" : "+"}
                {n} {n === 1 ? "point" : "points"}
              </option>
            ))}
          </select>
          <label className="field-label" htmlFor="reason">
            Reason <span className="required">required</span>
          </label>
          <textarea
            className="text-input"
            id="reason"
            placeholder="Tell us what happened…"
            maxLength={200}
            value={reason}
            onChange={e => setReason(e.target.value)}
            required
            rows={3}
          />
          <div className="reason-chips">
            {(adjustment?.sign === -1
              ? ["Off-task behavior", "Unkind words", "Needs a reminder"]
              : [
                  "Great participation",
                  "Helped a classmate",
                  "Fantastic effort",
                  "Odd One Out explanation",
                ]
            ).map(r => (
              <button type="button" key={r} onClick={() => setReason(r)}>
                {r}
              </button>
            ))}
          </div>
          <button
            className="button primary full-width"
            disabled={adjust.isPending || !reason.trim()}
          >
            {adjust.isPending ? "Saving…" : "Save points & reason"}
            <Check size={18} />
          </button>
        </form>
      </Modal>
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="A new classroom star."
        description="Add a student to your class. They won't need a password."
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            add.mutate({ token, name: name.trim() });
          }}
        >
          <label htmlFor="new-student" className="field-label">
            Student name
          </label>
          <input
            className="text-input"
            id="new-student"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={40}
            placeholder="e.g. Oliver"
            required
          />
          <button
            className="button primary full-width"
            disabled={add.isPending || !name.trim()}
          >
            Add student
            <Plus size={18} />
          </button>
        </form>
      </Modal>
      <Modal
        open={!!confirmation}
        onClose={() => setConfirmation(null)}
        title={
          confirmation?.kind === "remove"
            ? `Remove ${confirmation.student?.name}?`
            : confirmation?.kind === "games"
              ? "Reset game scores?"
              : "Give your class a fresh start?"
        }
        description={
          confirmation?.kind === "remove"
            ? "This student will leave the active class list. Their point history will be preserved."
            : confirmation?.kind === "games"
              ? "Game results will be reset and game-earned points removed. Teacher-awarded points and audit history will remain."
              : "Everyone's total points will be set to zero. Past events remain in the history. This cannot be undone."
        }
      >
        <div className="modal-actions">
          <button
            className="button secondary"
            onClick={() => setConfirmation(null)}
          >
            Keep things as they are
          </button>
          <button
            className="button danger"
            disabled={remove.isPending || reset.isPending}
            onClick={() => {
              if (!confirmation) return;
              if (confirmation.kind === "remove" && confirmation.student)
                remove.mutate({ token, studentId: confirmation.student.id });
              else if (confirmation.kind !== "remove")
                reset.mutate({ token, kind: confirmation.kind });
            }}
          >
            Yes, {confirmation?.kind === "remove" ? "remove student" : "reset"}
          </button>
        </div>
      </Modal>
      <Modal
        open={helpModal}
        onClose={() => setHelpModal(false)}
        title="A little play goes a long way."
        description="Pick your name, choose an adventure, and practice your English."
      >
        <div className="help-game-list">
          <p>
            <strong>Your curriculum</strong> — Open Our curriculum to browse the
            exact 1A–6B words and chapter-level grammar targets from merged.pdf.
          </p>
          <p>
            <strong>More ways to play</strong> — Try Odd One Out, Bingo,
            Sentence Builder, Fix the Sentence, Preposition Maze, Story Builder,
            or Who Am I. Teachers can moderate Charades, Grammar Auction, and
            Team Battle.
          </p>
          <p>
            <strong>Daily & streaks</strong> — Daily Challenge gives double
            points once per student per UTC date. Three correct in a row earns a
            badge, not extra standard-game points.
          </p>
          <p>
            <strong>Quiz Quest</strong> — Choose grammar or vocabulary, then
            answer five questions.
          </p>
          <p>
            <strong>Sort It Out</strong> — Drag a word into a basket. You can
            also tap a word, then tap its basket.
          </p>
          <p>
            <strong>Memory Match</strong> — Flip two cards to pair a word with
            its meaning. Pairs matched without earlier mistakes earn a correct
            answer.
          </p>
        </div>
        <div className="scoring-row">
          <div>
            <strong className="score-five">+5</strong>
            <span>All correct</span>
          </div>
          <div>
            <strong className="score-three">+3</strong>
            <span>Some correct</span>
          </div>
          <div>
            <strong className="score-one">+1</strong>
            <span>0 or 1 correct</span>
          </div>
        </div>
        <p className="form-footnote">
          Points and results are stored in your shared classroom database. Your
          chosen name is remembered on this device.
        </p>
        <button
          className="button primary full-width"
          onClick={() => setHelpModal(false)}
        >
          Ready to discover
          <ArrowRight size={18} />
        </button>
      </Modal>
    </div>
  );
}

function Leaderboard({
  leaders,
  expanded = false,
  currentId,
  loading = false,
}: {
  leaders: Student[];
  expanded?: boolean;
  currentId: number;
  loading?: boolean;
}) {
  if (loading)
    return <div className="loading-line">Gathering your classroom stars…</div>;
  if (!leaders.length)
    return (
      <EmptyState title="Room for your first classroom star.">
        Choose your name to join.
      </EmptyState>
    );
  const top = leaders.slice(0, 3);
  return (
    <div
      className={
        expanded ? "leaderboard-expanded panel" : "leaderboard-preview"
      }
    >
      <div className="podium">
        {[1, 0, 2].map(index => {
          const s = top[index];
          return s ? (
            <div
              className={`podium-person place-${index + 1} ${currentId === s.id ? "is-you" : ""}`}
              key={s.id}
            >
              {index === 0 && (
                <Crown className="podium-crown" size={22} fill="currentColor" />
              )}
              <div className="podium-avatar">
                <Avatar name={s.name} avatar={s.avatar} size="large" />
                <span className="rank-medal">{index + 1}</span>
              </div>
              <strong>
                {s.name}
                {currentId === s.id && <small> (you)</small>}
              </strong>
              <span className="podium-points">
                <Star size={12} fill="currentColor" />
                {s.points} <small>pts</small>
              </span>
              <div className="podium-block">
                <Trophy size={20} />
              </div>
            </div>
          ) : null;
        })}
      </div>
      {expanded && (
        <div className="rank-table">
          <div className="rank-table-head">
            <span>Rank</span>
            <span>Classroom star</span>
            <span>Total points</span>
          </div>
          {leaders.map((s, i) => (
            <div
              className={`rank-row ${s.id === currentId ? "current" : ""}`}
              key={s.id}
            >
              <span className="rank-number">{i + 1}</span>
              <div>
                <Avatar name={s.name} avatar={s.avatar} size="small" />
                <strong>{s.name}</strong>
                {s.streakBadge && (
                  <span
                    className="streak-badge"
                    title="Three correct answers in a row"
                  >
                    <Sparkles size={12} />
                    Streak
                  </span>
                )}
                {s.id === currentId && <span className="you-tag">You</span>}
              </div>
              <span className="rank-score">
                <Star size={15} fill="currentColor" />
                {s.points}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
type HistoryEntry = {
  id: number;
  studentName: string;
  delta: number;
  reason: string;
  createdAt: Date;
  kind: string;
  score: number | null;
  total: number | null;
  game: string | null;
};
function HistoryPanel({
  history,
  token,
}: {
  history: HistoryEntry[];
  token: string;
}) {
  const utils = trpc.useUtils();
  const [older, setOlder] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const entries = [
    ...new Map([...history, ...older].map(h => [h.id, h])).values(),
  ].sort((a, b) => b.id - a.id);
  const newestOldest = history[history.length - 1]?.id;
  useEffect(() => {
    setFinished(false);
  }, [newestOldest]);
  async function loadOlder() {
    if (loading) return;
    setLoading(true);
    try {
      const page = await utils.classroom.history.fetch({
        token,
        cursor: entries[entries.length - 1]?.id,
      });
      setOlder(current => [...current, ...page.items]);
      setFinished(page.nextCursor === null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Couldn't load older changes. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <section className="panel history-panel">
      <div className="panel-header">
        <div>
          <h2>
            <Clock3 size={21} />
            Every point has a story
          </h2>
          <p>Most recent changes first · game scores and teacher notes</p>
        </div>
        <span className="small-count">{entries.length}</span>
      </div>
      {!entries.length ? (
        <EmptyState title="Your classroom story starts here.">
          Play a game or award points to add the first moment.
        </EmptyState>
      ) : (
        <div className="history-list">
          {entries.map(h => (
            <div className="history-row" key={h.id}>
              <span className={`history-icon ${h.kind}`}>
                {h.kind === "game" ? (
                  <Gamepad2 size={19} />
                ) : h.kind === "manual" ? (
                  <Star size={18} />
                ) : (
                  <Clock3 size={18} />
                )}
              </span>
              <div className="history-copy">
                <strong>
                  {h.studentName}
                  <span className="history-type">
                    {h.kind === "game"
                      ? "Game completed"
                      : h.kind === "manual"
                        ? "Teacher note"
                        : h.kind === "seed"
                          ? "Demo points"
                          : "Class reset"}
                  </span>
                </strong>
                <p>
                  {h.reason}
                  {h.score !== null &&
                    h.total !== null &&
                    ` · ${h.score}/${h.total} correct`}
                </p>
                <time>{formatTime(h.createdAt)}</time>
              </div>
              <span
                className={`history-delta ${h.delta < 0 ? "negative" : ""}`}
              >
                {h.delta > 0 ? "+" : ""}
                {h.delta}
                <Star size={12} fill="currentColor" />
              </span>
            </div>
          ))}
        </div>
      )}
      {entries.length >= 100 && (
        <div className="history-pagination">
          {finished ? (
            <p>You're at the beginning of your classroom story.</p>
          ) : (
            <button
              className="button secondary"
              disabled={loading}
              onClick={loadOlder}
            >
              {loading ? "Loading older moments…" : "Load older changes"}
              <Clock3 size={16} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
