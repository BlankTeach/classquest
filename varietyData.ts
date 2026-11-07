import { curriculumWords } from "./curriculum";
import { quizQuestions, textbookLevels } from "./gameData";

export type ActivityKind =
  | "odd"
  | "bingo"
  | "builder"
  | "auction"
  | "fix"
  | "maze"
  | "story"
  | "who"
  | "charades"
  | "battle"
  | "daily"
  | "boss";
export type ActivitySubmission = {
  game: ActivityKind;
  level: string;
  questionIds?: string[];
  answers?: number[];
  textAnswers?: string[];
  orders?: number[][];
  bets?: number[];
  teamNames?: string[];
  teamAssignments?: number[];
  moderated?: boolean[];
};
export type ActivityQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  words?: string[];
  correctOrder?: number[];
  errorIndex?: number;
  correction?: string;
  clues?: string[];
  yesNo?: { question: string; answer: boolean }[];
  scenario?: string;
};
export type ActivityResult = {
  correct: number;
  total: number;
  streak: boolean;
  teamScores?: { name: string; score: number }[];
};
export const activityCatalog: {
  id: ActivityKind;
  title: string;
  tag: string;
  description: string;
  category: "Vocabulary" | "Grammar" | "Classroom" | "Daily";
  icon: string;
  color: "lavender" | "peach" | "mint";
}[] = [
  {
    id: "odd",
    title: "Odd One Out",
    tag: "SPOT THE DIFFERENCE",
    description:
      "Four words. One different family. Find the word that does not belong.",
    category: "Vocabulary",
    icon: "ScanSearch",
    color: "lavender",
  },
  {
    id: "bingo",
    title: "Vocabulary Bingo",
    tag: "THREE IN A ROW",
    description:
      "Match each definition to your word board. Complete a row to call bingo.",
    category: "Vocabulary",
    icon: "Grid3X3",
    color: "mint",
  },
  {
    id: "builder",
    title: "Sentence Builder",
    tag: "TAP OR DRAG",
    description:
      "Put the sentence chunks in order and give every word its place.",
    category: "Grammar",
    icon: "Blocks",
    color: "peach",
  },
  {
    id: "auction",
    title: "Grammar Auction",
    tag: "TEACHER & TEAMS",
    description:
      "Take turns wagering a virtual team budget on correct and incorrect sentences.",
    category: "Classroom",
    icon: "Gavel",
    color: "peach",
  },
  {
    id: "fix",
    title: "Fix the Sentence",
    tag: "WORD DETECTIVE",
    description: "Spot the one mistaken word, then type a little repair.",
    category: "Grammar",
    icon: "PencilLine",
    color: "lavender",
  },
  {
    id: "maze",
    title: "Preposition Maze",
    tag: "FIND YOUR PATH",
    description:
      "Choose the right preposition to move through a five-step maze.",
    category: "Grammar",
    icon: "Route",
    color: "mint",
  },
  {
    id: "story",
    title: "Story Builder",
    tag: "ONE SENTENCE AT A TIME",
    description:
      "Choose the next sentence and watch a shared adventure unfold.",
    category: "Grammar",
    icon: "BookOpen",
    color: "peach",
  },
  {
    id: "who",
    title: "Who Am I?",
    tag: "CLUES & QUESTIONS",
    description:
      "Reveal clues and ask yes-or-no questions to discover the mystery word.",
    category: "Vocabulary",
    icon: "CircleHelp",
    color: "lavender",
  },
  {
    id: "charades",
    title: "Act It Out",
    tag: "TEACHER MODERATED",
    description:
      "A performer sees an action. The class guesses and the teacher confirms.",
    category: "Classroom",
    icon: "Drama",
    color: "peach",
  },
  {
    id: "battle",
    title: "Team Battle",
    tag: "2–4 TEAMS",
    description:
      "Teams take turns answering. Save team scores alongside individual progress.",
    category: "Classroom",
    icon: "Swords",
    color: "mint",
  },
  {
    id: "daily",
    title: "Daily Challenge",
    tag: "ONE A DAY · DOUBLE POINTS",
    description:
      "One shared question per UTC date. One saved attempt. Double the usual reward.",
    category: "Daily",
    icon: "CalendarDays",
    color: "mint",
  },
  {
    id: "boss",
    title: "Boss Battle",
    tag: "FIVE TO DEFEAT",
    description:
      "Face five grammar challenges. Get every answer right to defeat the boss.",
    category: "Grammar",
    icon: "Shield",
    color: "lavender",
  },
];

// Content generation and strict authoritative grading are defined below.

type Word = (typeof curriculumWords)[number];
const hash = (value: string) => {
  let n = 2166136261;
  for (const character of value)
    n = Math.imul(n ^ character.charCodeAt(0), 16777619);
  return n >>> 0;
};
const normalise = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
function invalid(reason = "activity data"): never {
  throw new Error(`Invalid submission: ${reason}`);
}
function requireLevel(level: string) {
  if (!textbookLevels.includes(level)) invalid("unknown textbook level");
}
function levelWords(level: string): Word[] {
  const seen = new Set<string>();
  return curriculumWords.filter(word => {
    if (word.level !== level || seen.has(normalise(word.word))) return false;
    seen.add(normalise(word.word));
    return true;
  });
}
function citation(word: Word) {
  return `${word.level} · ${word.chapter} · PDF p. ${word.sourcePage}`;
}
function choices(correct: string, distractors: string[], seed: string) {
  const options = [
    ...new Set(distractors.filter(item => item !== correct)),
  ].slice(0, 3);
  const answer = hash(seed) % (options.length + 1);
  options.splice(answer, 0, correct);
  return { options, answer };
}
function rotate<T>(items: T[], amount: number) {
  return [
    ...items.slice(amount % items.length),
    ...items.slice(0, amount % items.length),
  ];
}
function grammarSet(level: string): ActivityQuestion[] {
  const pool = quizQuestions.filter(
    question => question.level === level && question.mode === "grammar"
  );
  if (pool.length < 5)
    throw new Error(`Incomplete grammar content for ${level}`);
  return pool.map(question => ({
    id: question.id,
    question: question.question,
    options: [...question.options],
    answer: question.answer,
    explanation: question.explanation,
  }));
}
function authoredChunks(word: Word): string[] {
  const term = `“${word.word}”`;
  const rows: Record<string, string[]> = {
    "1A": ["The word", "on my card", "is", term, "today."],
    "1B": ["We", "are", "learning", term, "together."],
    "2A": ["We", "must", "practise", term, "at school."],
    "2B": ["She", "usually", "practises", term, "at school."],
    "3A": ["I", "want", "to learn", term, "today."],
    "3B": ["Yesterday,", "I", "learned", term, "at home."],
    "4A": ["I", "learned", term, "at school", "yesterday."],
    "4B": ["We", "will", "practise", term, "after lunch."],
    "5A": ["You", "should", "say", term, "clearly."],
    "5B": ["We", "have", "used", term, "twice today."],
    "6A": ["I", "will", "explain", term, "tomorrow."],
    "6B": ["The word", term, "was", "explained", "by our teacher."],
  };
  return rows[word.level];
}
function builderSet(words: Word[]): ActivityQuestion[] {
  return words.slice(0, 5).map(word => {
    const ordered = authoredChunks(word);
    const indices = rotate(
      ordered.map((_, index) => index).reverse(),
      hash(word.id) % ordered.length
    );
    return {
      id: `builder-${word.id}`,
      question: `Build a sentence using “${word.word}”.`,
      options: [],
      answer: 0,
      words: indices.map(index => ordered[index]),
      correctOrder: ordered.map((_, index) => indices.indexOf(index)),
      explanation: `${ordered.join(" ")} Vocabulary: ${word.definition}. ${citation(word)}.`,
    };
  });
}
function fixSet(words: Word[], level: string): ActivityQuestion[] {
  const pool = quizQuestions.filter(
    q =>
      q.level === level &&
      q.mode === "grammar" &&
      q.question.includes("___") &&
      !/\s/.test(q.options[q.answer])
  );
  const questions = pool
    .slice(0, 5)
    .map((q, index) => {
      const wrong = q.options.find(
        (option, optionIndex) => optionIndex !== q.answer && !/\s/.test(option)
      );
      if (!wrong) return null;
      const [before, after] = q.question.split("___");
      const chunks = [
        ...before.trim().split(/\s+/).filter(Boolean),
        wrong,
        ...after.trim().split(/\s+/).filter(Boolean),
      ];
      return {
        id: `fix-${q.id}`,
        question: chunks.join(" "),
        words: chunks,
        options: [...chunks],
        answer: before.trim().split(/\s+/).filter(Boolean).length,
        errorIndex: before.trim().split(/\s+/).filter(Boolean).length,
        correction: q.options[q.answer],
        explanation: `${q.explanation} Vocabulary extension — “${words[index % words.length].word}”: ${words[index % words.length].definition}. ${citation(words[index % words.length])}.`,
      } satisfies ActivityQuestion;
    })
    .filter((q): q is NonNullable<typeof q> => q !== null);
  // Authored vocabulary-card sentences fill levels without five single-word blanks.
  for (let index = questions.length; index < 5; index++) {
    const word = words[index];
    const chunks = ["We", "is", "learning", `“${word.word}”`, "today."];
    questions.push({
      id: `fix-${word.id}`,
      question: chunks.join(" "),
      words: chunks,
      options: chunks,
      answer: 1,
      errorIndex: 1,
      correction: "are",
      explanation: `Use are with we: We are learning “${word.word}” today. ${word.definition}. ${citation(word)}.`,
    });
  }
  return questions;
}
function mazeSet(words: Word[]): ActivityQuestion[] {
  const prompts = [
    [
      "Place the vocabulary card ___ the bag. It must be inside.",
      "in",
      "on",
      "under",
      "In means inside.",
    ],
    [
      "Put the vocabulary card ___ the desk, touching its top.",
      "on",
      "in",
      "under",
      "On means touching the upper surface.",
    ],
    [
      "Look ___ the desk for the vocabulary card. It is below the desk.",
      "under",
      "on",
      "in",
      "Under means below.",
    ],
    [
      "Walk ___ the vocabulary station. It is your destination.",
      "to",
      "on",
      "in",
      "To shows movement towards a destination.",
    ],
    [
      "Wait ___ the vocabulary station. It is our meeting point.",
      "at",
      "into",
      "onto",
      "At identifies a meeting point.",
    ],
  ];
  return prompts.map(([question, correct, a, b, explanation], index) => ({
    id: `maze-${words[index].id}-${correct}`,
    question: question.replace("vocabulary", `“${words[index].word}”`),
    ...choices(correct, [a, b], `maze-${words[index].id}`),
    explanation: `${explanation} “${words[index].word}”: ${words[index].definition}. ${citation(words[index])}.`,
  }));
}
function storySet(words: Word[]): ActivityQuestion[] {
  const scenario =
    "The classroom word quest: make a five-page vocabulary scrapbook together.";
  const openings = ["First", "Next", "Then", "After that", "Finally"];
  return words.slice(0, 5).map((word, index) => {
    const chunks = authoredChunks(word);
    const correct = chunks.join(" ");
    const wrongSubject = correct
      .replace(/^The word/, "The words")
      .replace(/^We\b/, "Us")
      .replace(/^She\b/, "Her")
      .replace(/^I\b/, "Me")
      .replace(/^You\b/, "Your")
      .replace(/^Yesterday, I\b/, "Yesterday, me");
    const wrongOrder =
      word.level === "1A"
        ? correct.replace(" is ", " are ")
        : [
            ...chunks.slice(0, 1),
            chunks[3],
            chunks[2],
            chunks[1],
            ...chunks.slice(4),
          ].join(" ");
    const frame = (sentence: string) =>
      `${openings[index]} — ${sentence} The card tells us: ${word.definition.replace(/[.!?]$/, "")}.`;
    const right = frame(correct);
    return {
      id: `story-${word.id}`,
      scenario,
      question: `Page ${index + 1}: choose the sentence that fits our story.`,
      ...choices(
        right,
        [frame(wrongSubject), frame(wrongOrder)],
        `story-${word.id}`
      ),
      explanation: `The next page: ${right} ${citation(word)}.`,
    };
  });
}
// Only physical-action curriculum groups are eligible, never illnesses, adjectives or materials.
const actionCategory =
  /(^actions$|action verbs|everyday actions|environmental actions|actions that|activities|routine|housework|verbs for cooking|verbs for crafts|cooking verbs|craft verbs|preparations|things (?:we |friends )?should|things (?:we )?must|things to do|good and bad habits|resolutions|jobs and duties|charity)/i;
const actionWord =
  /^(?:to\s+)?(?:sit|stand|open|close|look|point|run|walk|jump|hop|skip|swim|dance|sing|play|read|write|draw|paint|brush|wash|clean|cook|cut|chop|peel|stir|mix|fry|bake|boil|pour|fold|make|do|take|put|pick|give|help|feed|raise|collect|recycle|plant|save|turn|pack|buy|bring|visit|go|ride|eat|drink|sleep|wake|get|sweep|mop|tidy|hang|carry|share|throw|clap|kick|catch|donate|protect|hug|listen|water|cover|spread|glue|stick|knit|sew|build|wrap|blow|greet|celebrate|watch|comb|respect|finish|prepare|hold|lift|wear|cheer|smile|talk|speak|practise|practice|keep|use|avoid|wait|cross|tell|return|switch|leave|set|check|order|lend|borrow|join|squash|sort|weed|learn)\b/i;
function charadesSet(words: Word[]): ActivityQuestion[] {
  const actions = words.filter(
    word => actionCategory.test(word.category) && actionWord.test(word.word)
  );
  if (actions.length < 5)
    throw new Error(
      `Need five source-backed physical actions for ${words[0]?.level}`
    );
  return actions.slice(0, 5).map(word => ({
    id: `charades-${word.id}`,
    question: "Performer: act this action without saying it.",
    options: [word.word],
    answer: 0,
    explanation: `${word.word}: ${word.definition}. ${citation(word)}. The teacher confirms the class's guess.`,
  }));
}
function oddSet(words: Word[]): ActivityQuestion[] {
  const grouped = new Map<string, Word[]>();
  for (const word of words)
    grouped.set(word.category, [...(grouped.get(word.category) || []), word]);
  const groups = [...grouped.entries()].filter(
    ([, entries]) => entries.length >= 3
  );
  if (groups.length === 0 || grouped.size < 2)
    throw new Error("Insufficient odd-one-out categories");
  return Array.from({ length: 5 }, (_, index) => {
    const [category, members] = groups[index % groups.length];
    const peers = rotate(members, index).slice(0, 3);
    const others = words.filter(word => word.category !== category);
    const odd = others[index % others.length];
    return {
      id: `odd-${peers.map(word => word.id).join("-")}-${odd.id}`,
      question: "Which word does not belong to the same textbook category?",
      ...choices(
        odd.word,
        peers.map(word => word.word),
        `odd-${index}-${odd.id}`
      ),
      explanation: `“${odd.word}” belongs to ${odd.category}; the other three belong to ${category}. ${citation(odd)}.`,
    };
  });
}
function bingoSet(words: Word[]): ActivityQuestion[] {
  // Interleave categories so the board is varied, then keep stable source word IDs.
  const groups = [...new Set(words.map(word => word.category))].map(category =>
    words.filter(word => word.category === category)
  );
  const board: Word[] = [];
  for (let offset = 0; board.length < 9 && offset < words.length; offset++)
    for (const group of groups)
      if (group[offset] && board.length < 9) board.push(group[offset]);
  if (board.length < 9)
    throw new Error("Bingo needs nine distinct curriculum words");
  const callOrder = [0, 4, 2, 6, 8, 1, 3, 5, 7];
  return callOrder.map(cell => ({
    id: `bingo-${board[cell].id}`,
    question: board[cell].definition,
    options: board.map(word => word.word),
    answer: cell,
    explanation: `“${board[cell].word}” means ${board[cell].definition}. ${citation(board[cell])}.`,
  }));
}
function whoSet(words: Word[]): ActivityQuestion[] {
  return words.slice(0, 5).map((word, index) => {
    const others = rotate(
      words.filter(other => other.id !== word.id),
      index
    ).slice(0, 3);
    const alternativeCategory =
      words.find(other => other.category !== word.category)?.category ||
      "a different category";
    return {
      id: `who-${word.id}`,
      question: "What is the mystery word or phrase?",
      ...choices(
        word.word,
        others.map(other => other.word),
        `who-${word.id}`
      ),
      clues: [
        `My meaning: ${word.definition}`,
        `Find me in the ${word.category} chapter group.`,
        `I start with “${word.word.replace(/^(?:a|an|the) /i, "").charAt(0)}”.`,
      ],
      yesNo: [
        { question: `Do you belong to ${word.category}?`, answer: true },
        { question: `Do you belong to ${alternativeCategory}?`, answer: false },
        {
          question: "Is your answer a phrase with more than one word?",
          answer: word.word.trim().split(/\s+/).length > 1,
        },
      ],
      explanation: `The mystery answer is “${word.word}”: ${word.definition}. ${citation(word)}.`,
    };
  });
}
export function getActivityQuestions(
  game: ActivityKind,
  level: string,
  dateKey?: string
): ActivityQuestion[] {
  requireLevel(level);
  if (!activityCatalog.some(activity => activity.id === game))
    invalid("unknown activity");
  const words = levelWords(level);
  if (words.length < 9) throw new Error(`Incomplete vocabulary for ${level}`);
  switch (game) {
    case "odd":
      return oddSet(words);
    case "bingo":
      return bingoSet(words);
    case "builder":
      return builderSet(words);
    case "fix":
      return fixSet(words, level);
    case "maze":
      return mazeSet(words);
    case "story":
      return storySet(words);
    case "who":
      return whoSet(words);
    case "charades":
      return charadesSet(words);
    case "auction":
      return grammarSet(level)
        .filter(question => question.question.includes("___"))
        .slice(0, 5)
        .map((question, index) => {
          const isCorrect = index % 2 === 0;
          const correctSentence = question.question.replace(
            "___",
            question.options[question.answer]
          );
          const repairs: Record<string, [string, string, string]> = {
            "1A": [
              "This are my school bag.",
              "This is my school bag.",
              "This is singular, so use is.",
            ],
            "1B": [
              "The children is playing in the park.",
              "The children are playing in the park.",
              "Children is plural, so use are.",
            ],
            "2A": [
              "Lily and I goes to school on foot every day.",
              "Lily and I go to school on foot every day.",
              "A plural subject uses go, not goes.",
            ],
            "2B": [
              "He usually brush his teeth at seven.",
              "He usually brushes his teeth at seven.",
              "With he in the simple present, use brushes.",
            ],
            "3A": [
              "We wants to plant vegetables.",
              "We want to plant vegetables.",
              "With we, use want, not wants.",
            ],
            "3B": [
              "She goed to the park yesterday.",
              "She went to the park yesterday.",
              "The past tense of go is went.",
            ],
            "4A": [
              "This box is heavyer than that box.",
              "This box is heavier than that box.",
              "Change y to i before adding er: heavier.",
            ],
            "4B": [
              "I am going visit a museum tomorrow.",
              "I am going to visit a museum tomorrow.",
              "The future pattern is be going to plus a verb.",
            ],
            "5A": [
              "They has already packed their suitcases.",
              "They have already packed their suitcases.",
              "They takes have in the present perfect.",
            ],
            "5B": [
              "We was cooking when the phone rang.",
              "We were cooking when the phone rang.",
              "Use were with we in the past continuous.",
            ],
            "6A": [
              "She gived up because she was tired.",
              "She gave up because she was tired.",
              "The past tense of the phrasal verb give up is gave up.",
            ],
            "6B": [
              "The bridge was build last year.",
              "The bridge was built last year.",
              "The passive requires the past participle built.",
            ],
          };
          const [incorrect, repair, rule] = repairs[level];
          return {
            id: `auction-${question.id}-v2`,
            question: isCorrect ? correctSentence : incorrect,
            options: ["Correct sentence", "Incorrect sentence"],
            answer: isCorrect ? 0 : 1,
            explanation: isCorrect
              ? `This sentence is correct. ${question.explanation}`
              : `Repair: ${repair} ${rule}`,
          };
        });
    case "battle":
      return grammarSet(level)
        .slice(0, 5)
        .map(question => ({ ...question, id: `battle-${question.id}` }));
    case "boss":
      return grammarSet(level)
        .slice(0, 5)
        .map(question => ({ ...question, id: `boss-${question.id}` }));
    case "daily": {
      const date = dateKey ?? new Date().toISOString().slice(0, 10);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
        new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
      )
        invalid("invalid UTC date");
      const pool = grammarSet(level);
      const index =
        Math.floor(Date.parse(`${date}T00:00:00Z`) / 86400000) % pool.length;
      return [
        {
          ...pool[(index + pool.length) % pool.length],
          id: `daily-${date}-${pool[(index + pool.length) % pool.length].id}`,
        },
      ];
    }
  }
}
const bingoLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
export function hasBingo(cells: number[]): boolean {
  return bingoLines.some(line => line.every(cell => cells.includes(cell)));
}
function exactArray(value: unknown, length: number): value is unknown[] {
  return (
    Array.isArray(value) &&
    value.length === length &&
    Array.from({ length }, (_, index) => index in value).every(Boolean)
  );
}
function integer(
  value: unknown,
  minimum: number,
  maximum: number
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
  );
}
function checkTeams(submission: ActivitySubmission, rounds: number) {
  const names = submission.teamNames;
  if (
    !Array.isArray(names) ||
    names.length < 2 ||
    names.length > 4 ||
    !exactArray(names, names.length) ||
    names.some(
      name =>
        typeof name !== "string" ||
        name.trim().length < 1 ||
        name.trim().length > 40 ||
        /[\u0000-\u001f]/.test(name)
    )
  )
    invalid("use 2–4 named teams");
  const trimmed = names.map(name => name.trim());
  if (new Set(trimmed.map(name => name.toLowerCase())).size !== trimmed.length)
    invalid("team names must be unique");
  if (
    !exactArray(submission.teamAssignments, rounds) ||
    submission.teamAssignments.some(
      (assignment, index) =>
        !integer(assignment, 0, names.length - 1) ||
        assignment !== index % names.length
    )
  )
    invalid("team turns must rotate in order");
  return trimmed;
}
export function gradeActivity(
  submission: ActivitySubmission,
  dateKey?: string
): ActivityResult {
  if (
    !submission ||
    typeof submission !== "object" ||
    Array.isArray(submission)
  )
    invalid("activity object");
  const { game, level } = submission;
  if (
    typeof level !== "string" ||
    !activityCatalog.some(activity => activity.id === game)
  )
    invalid("activity or level");
  const pool = getActivityQuestions(game, level, dateKey);
  const ids = submission.questionIds;
  const rounds =
    game === "bingo"
      ? Array.isArray(ids)
        ? ids.length
        : 0
      : game === "daily"
        ? 1
        : 5;
  if (
    (game === "bingo" && (rounds < 3 || rounds > 9)) ||
    !exactArray(ids, rounds) ||
    new Set(ids).size !== rounds ||
    ids.some((id, index) => typeof id !== "string" || id !== pool[index]?.id)
  )
    invalid("question IDs must match the authoritative set in order");
  // Reject unrelated answer channels to prevent ambiguous grading.
  const allowed =
    game === "builder"
      ? ["orders"]
      : game === "fix"
        ? ["answers", "textAnswers"]
        : game === "charades"
          ? ["moderated"]
          : ["answers"];
  if (game === "auction") allowed.push("bets", "teamNames", "teamAssignments");
  if (game === "battle") allowed.push("teamNames", "teamAssignments");
  for (const field of [
    "answers",
    "textAnswers",
    "orders",
    "bets",
    "teamNames",
    "teamAssignments",
    "moderated",
  ] as const)
    if (submission[field] !== undefined && !allowed.includes(field))
      invalid(`unexpected ${field}`);
  const questions = pool.slice(0, rounds);
  let correct: boolean[];
  if (game === "builder") {
    if (!exactArray(submission.orders, rounds))
      invalid("five sentence orders required");
    correct = questions.map((question, index) => {
      const order = submission.orders![index];
      const length = question.words!.length;
      if (
        !exactArray(order, length) ||
        new Set(order).size !== length ||
        order.some(value => !integer(value, 0, length - 1))
      )
        invalid("sentence order must be a full permutation");
      return order.every(
        (value, position) => value === question.correctOrder![position]
      );
    });
  } else if (game === "charades") {
    if (
      !exactArray(submission.moderated, rounds) ||
      submission.moderated.some(value => typeof value !== "boolean")
    )
      invalid("five teacher judgments required");
    correct = [...submission.moderated];
    // This pure grader checks judgment shape. The server MUST verify the teacher token.
  } else {
    if (!exactArray(submission.answers, rounds)) invalid("answer count");
    if (
      game === "fix" &&
      (!exactArray(submission.textAnswers, rounds) ||
        submission.textAnswers.some(
          value => typeof value !== "string" || value.length > 100
        ))
    )
      invalid("five short corrections required");
    correct = questions.map((question, index) => {
      const value = submission.answers![index];
      if (!integer(value, 0, question.options.length - 1))
        invalid("answer outside options");
      if (game === "fix")
        return (
          value === question.errorIndex &&
          normalise(submission.textAnswers![index]) ===
            normalise(question.correction!)
        );
      return value === question.answer;
    });
  }
  if (game === "bingo") {
    const marked: number[] = [];
    correct.forEach((right, index) => {
      const cell = submission.answers![index];
      if (marked.includes(cell))
        invalid("a called cell cannot be answered again");
      if (right) marked.push(cell);
      if (hasBingo(marked) && index !== rounds - 1)
        invalid("bingo must finish at the first completed line");
    });
    if (!hasBingo(marked))
      invalid("three correct cells in a row, column or diagonal are required");
  }
  let teamScores: ActivityResult["teamScores"];
  if (game === "battle" || game === "auction") {
    const names = checkTeams(submission, rounds);
    const scores = names.map(() => (game === "auction" ? 20 : 0));
    if (game === "auction" && !exactArray(submission.bets, rounds))
      invalid("five wagers required");
    correct.forEach((right, index) => {
      const team = submission.teamAssignments![index];
      if (game === "auction") {
        const bet = submission.bets![index];
        if (!integer(bet, 1, Math.min(5, scores[team])))
          invalid("wager must be 1–5 within the current virtual budget");
        scores[team] += right ? bet : -bet;
      } else if (right) scores[team] += 1;
    });
    // Persistent team scores accumulate round NET changes, not a fresh 20-point budget.
    teamScores = names.map((name, index) => ({
      name,
      score: scores[index] - (game === "auction" ? 20 : 0),
    }));
  }
  let consecutive = 0;
  let streak = false;
  for (const right of correct) {
    consecutive = right ? consecutive + 1 : 0;
    if (consecutive >= 3) streak = true;
  }
  return {
    correct: correct.filter(Boolean).length,
    total: rounds,
    streak,
    ...(teamScores ? { teamScores } : {}),
  };
}
