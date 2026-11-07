import {
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { z } from "zod";
import {
  classroomDailyCompletions,
  classroomGameResults,
  classroomMeta,
  classroomPointLogs,
  classroomStudents,
  classroomTeamLogs,
  classroomTeams,
  classroomTeacherSessions,
  type ClassroomGameResult,
  type ClassroomStudent,
} from "../drizzle/schema";
import { calculatePoints, gradeSubmission } from "../shared/gameData";
import { gradeActivity, type ActivitySubmission } from "../shared/varietyData";
import { getDb } from "./db";
import { publicProcedure, router } from "./_core/trpc";

type Database = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type QueryDatabase = Database | Transaction;
const META_KEY = "classroom";
const SEED_VERSION = 1;
const SESSION_MS = 12 * 60 * 60 * 1000;
const TEACHER_PASSWORD = "87654321";
const MIN_POINTS = -2147483648;
const MAX_POINTS = 2147483647;

const tokenInput = z.object({ token: z.string().min(1).max(256) });
const studentIdInput = z.number().int().positive().max(MAX_POINTS);
export const studentNameInput = z
  .string()
  .max(240)
  .transform(name => name.normalize("NFKC").trim().replace(/\s+/gu, " "))
  .pipe(
    z
      .string()
      .min(1, "Enter a student name.")
      .max(60, "Use 60 characters or fewer.")
      .refine(
        name => !/[\u0000-\u001f\u007f]/u.test(name),
        "Name contains invalid characters."
      )
  );

// The grader is the final authority for content IDs, counts, answer ranges and
// whether every memory card is eventually matched. Do not accept a client score.
export const submissionInput = z
  .object({
    game: z.enum(["quiz", "sort", "memory"]),
    questionIds: z.array(z.string().min(1).max(256)).min(1).max(50).optional(),
    answers: z.array(z.number().int().min(0).max(3)).min(1).max(50).optional(),
    levelId: z.string().min(1).max(120).optional(),
    assignments: z
      .array(z.number().int().min(0).max(2))
      .min(1)
      .max(20)
      .optional(),
    attempts: z
      .array(
        z.tuple([
          z.number().int().min(0).max(19),
          z.number().int().min(0).max(19),
        ])
      )
      .min(1)
      .max(2000)
      .optional(),
  })
  .strict();
const finishInput = z.object({
  studentId: studentIdInput,
  runId: z
    .string()
    .min(1)
    .max(128)
    .refine(id => id.trim().length > 0, "Invalid run ID."),
  submission: submissionInput,
});

export const activitySubmissionInput = z
  .object({
    game: z.enum([
      "odd",
      "bingo",
      "builder",
      "auction",
      "fix",
      "maze",
      "story",
      "who",
      "charades",
      "battle",
      "daily",
      "boss",
    ]),
    level: z.string().min(1).max(120),
    questionIds: z.array(z.string().min(1).max(256)).min(1).max(50).optional(),
    answers: z
      .array(z.number().int().min(0).max(100))
      .min(1)
      .max(50)
      .optional(),
    textAnswers: z.array(z.string().max(500)).min(1).max(50).optional(),
    orders: z
      .array(z.array(z.number().int().min(0).max(100)).min(1).max(100))
      .min(1)
      .max(50)
      .optional(),
    bets: z.array(z.number().int().min(0).max(20)).min(1).max(50).optional(),
    teamNames: z.array(studentNameInput).min(2).max(4).optional(),
    teamAssignments: z
      .array(z.number().int().min(0).max(3))
      .min(1)
      .max(50)
      .optional(),
    moderated: z.array(z.boolean()).min(1).max(50).optional(),
  })
  .strict()
  .superRefine((submission, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    if (Boolean(submission.teamNames) !== Boolean(submission.teamAssignments)) {
      fail("Provide both team names and team assignments.");
    }
    if (
      ["auction", "battle"].includes(submission.game) &&
      !submission.teamNames
    ) {
      fail("This activity needs 2–4 named teams.");
    }
    if (submission.teamNames) {
      const names = submission.teamNames.map(name =>
        name.toLocaleLowerCase("en-US")
      );
      if (new Set(names).size !== names.length)
        fail("Use a different name for each team.");
      if (submission.teamAssignments?.some(index => index >= names.length)) {
        fail("A team assignment is outside the selected teams.");
      }
    }
    if (
      submission.moderated &&
      !["charades", "battle"].includes(submission.game)
    ) {
      fail(
        "Teacher observation is only available for Charades and Team Battle."
      );
    }
    if (submission.game === "charades" && !submission.moderated) {
      fail("Charades needs the teacher's observed results.");
    }
    if (submission.game === "auction") {
      if (
        !submission.bets ||
        !submission.teamAssignments ||
        submission.bets.length !== submission.teamAssignments.length
      ) {
        fail(
          "Provide one virtual wager and team assignment for each auction question."
        );
      } else {
        const spent = (submission.teamNames ?? []).map(() => 0);
        submission.bets.forEach((bet, index) => {
          const team = submission.teamAssignments![index];
          if (team < spent.length) spent[team] += bet;
        });
        if (spent.some(budget => budget > 20))
          fail("Each team's virtual auction budget is 20.");
      }
    } else if (submission.bets) {
      fail("Virtual wagers are only available for Grammar Auction.");
    }
  });

const finishActivityInput = finishInput.omit({ submission: true }).extend({
  submission: activitySubmissionInput,
  token: z.string().min(1).max(256).optional(),
  dateKey: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a UTC date in YYYY-MM-DD format.")
    .optional(),
});

type ResultMetadata = {
  streak: boolean;
  teamScores?: { name: string; score: number }[];
  dateKey?: string;
};

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizeStudentName(name: string) {
  const displayName = studentNameInput.parse(name);
  const normalizedName = displayName.toLocaleLowerCase("en-US");
  return {
    name: displayName,
    normalizedName,
    activeNameHash: hash(normalizedName),
  };
}

export function acceptsTeacherPassword(password: string) {
  const supplied = Buffer.from(password);
  const expected = Buffer.from(TEACHER_PASSWORD);
  return (
    supplied.length === expected.length && timingSafeEqual(supplied, expected)
  );
}

async function database() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "The classroom database is unavailable. Please try again.",
    });
  }
  return db;
}

function publicStudent(student: ClassroomStudent) {
  return {
    id: student.id,
    name: student.name,
    points: student.points,
    avatar: student.avatar,
    streakBadge: Boolean(student.streakBadge),
  };
}

function finishResponse(result: ClassroomGameResult) {
  return {
    correct: result.correct,
    total: result.total,
    points: result.points,
    studentPoints: result.studentPoints,
  };
}

function activityFinishResponse(result: ClassroomGameResult) {
  const metadata: ResultMetadata = result.resultMetadata
    ? JSON.parse(result.resultMetadata)
    : { streak: false };
  return {
    ...finishResponse(result),
    streak: metadata.streak,
    ...(metadata.teamScores ? { teamScores: metadata.teamScores } : {}),
  };
}

function quizStreak(
  submission: z.infer<typeof submissionInput>,
  correct: number
) {
  if (submission.game !== "quiz") return false;
  let consecutive = 0;
  // Ask the existing grader, including its historical answer keys. Replacing
  // just one answer with a different valid option lowers the score iff that
  // original answer was correct. No DB writes or active-catalog assumptions.
  return submission.answers!.some((answer, index) => {
    const alternatives = [...submission.answers!];
    alternatives[index] = answer === 0 ? 1 : 0;
    const changed = gradeSubmission({ ...submission, answers: alternatives });
    consecutive = changed.correct < correct ? consecutive + 1 : 0;
    return consecutive >= 3;
  });
}

function checkedPoints(points: number) {
  if (
    !Number.isSafeInteger(points) ||
    points < MIN_POINTS ||
    points > MAX_POINTS
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "The point total is out of range.",
    });
  }
  return points;
}

async function activeStudent(tx: Transaction, studentId: number) {
  const [student] = await tx
    .select()
    .from(classroomStudents)
    .where(
      and(
        eq(classroomStudents.id, studentId),
        isNull(classroomStudents.removedAt)
      )
    )
    .limit(1);
  if (!student) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message:
        "This student is no longer in the class. Please choose a current student.",
    });
  }
  return student;
}

const DEMO_STUDENTS = [
  { name: "Emma", points: 42 },
  { name: "Oliver", points: 38 },
  { name: "Ava", points: 35 },
  { name: "Liam", points: 31 },
  { name: "Sophia", points: 28 },
  { name: "Noah", points: 25 },
  { name: "Mia", points: 22 },
  { name: "Lucas", points: 18 },
  { name: "Isla", points: 15 },
  { name: "Ethan", points: 12 },
];
let initialization: Promise<void> | undefined;

/**
 * No import-time setup. Each process checks the durable version only once;
 * unfinished seed work is serialized and committed atomically across instances.
 * The marker survives an empty/removed class, so refreshes never re-seed it.
 */
export function initializeClassroom(): Promise<void> {
  if (!initialization) {
    initialization = (async () => {
      const db = await database();
      const [existing] = await db
        .select()
        .from(classroomMeta)
        .where(eq(classroomMeta.key, META_KEY))
        .limit(1);
      if (existing && existing.seedVersion >= SEED_VERSION) return;
      await db.transaction(async tx => {
        await tx
          .insert(classroomMeta)
          .values({ key: META_KEY })
          .onDuplicateKeyUpdate({ set: { key: META_KEY } });
        const [meta] = await tx
          .select()
          .from(classroomMeta)
          .where(eq(classroomMeta.key, META_KEY))
          .for("update");
        if (meta.seedVersion >= SEED_VERSION) return;
        // Only a truly new classroom receives demo students. Preserve any
        // pre-existing real class if a seed marker is being added to it.
        const [existingStudents] = await tx
          .select({ value: count() })
          .from(classroomStudents);
        if (existingStudents.value === 0) {
          for (const [avatar, seed] of DEMO_STUDENTS.entries()) {
            const [{ id }] = await tx
              .insert(classroomStudents)
              .values({
                ...normalizeStudentName(seed.name),
                points: seed.points,
                avatar,
              })
              .$returningId();
            await tx.insert(classroomPointLogs).values({
              studentId: id,
              studentName: seed.name,
              delta: seed.points,
              kind: "seed",
              reason: "Demo starting points",
            });
          }
          await tx
            .update(classroomMeta)
            .set({ demo: true })
            .where(eq(classroomMeta.key, META_KEY));
        }
        await tx
          .update(classroomMeta)
          .set({ seedVersion: SEED_VERSION, seededAt: new Date() })
          .where(eq(classroomMeta.key, META_KEY));
      });
    })().catch(error => {
      initialization = undefined; // Failed/rolled-back setup may be retried.
      throw error;
    });
  }
  return initialization;
}

async function sessionIsValid(token: string, db: QueryDatabase) {
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  const [session] = await db
    .select({ tokenHash: classroomTeacherSessions.tokenHash })
    .from(classroomTeacherSessions)
    .where(
      and(
        eq(classroomTeacherSessions.tokenHash, hash(token)),
        gt(classroomTeacherSessions.expiresAt, new Date()),
        isNull(classroomTeacherSessions.revokedAt)
      )
    )
    .limit(1);
  return Boolean(session);
}

/** Read older audit entries without initializing, locking, or mutating the class. */
export async function getClassroomHistory(input: {
  token: string;
  cursor?: number;
}) {
  const db = await database();
  if (!(await sessionIsValid(input.token, db))) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Your teacher session has expired. Please log in again.",
    });
  }
  const pageSize = 50;
  const rows = await db
    .select({
      id: classroomPointLogs.id,
      studentId: classroomPointLogs.studentId,
      studentName: classroomPointLogs.studentName,
      delta: classroomPointLogs.delta,
      reason: classroomPointLogs.reason,
      createdAt: classroomPointLogs.createdAt,
      kind: classroomPointLogs.kind,
      score: classroomPointLogs.score,
      total: classroomPointLogs.total,
      game: classroomPointLogs.game,
    })
    .from(classroomPointLogs)
    .where(
      input.cursor === undefined
        ? undefined
        : lt(classroomPointLogs.id, input.cursor)
    )
    .orderBy(desc(classroomPointLogs.id))
    .limit(pageSize + 1);
  const items = rows.slice(0, pageSize);
  return {
    items,
    nextCursor: rows.length > pageSize ? items[items.length - 1].id : null,
  };
}

async function lockedClassroom<T>(
  operation: (tx: Transaction) => Promise<T>,
  token?: string
) {
  await initializeClassroom();
  const db = await database();
  return db.transaction(async tx => {
    // A row lock prevents lost updates and reset/reward races, including when
    // two deployment instances overlap. It is released by commit/rollback.
    await tx
      .select({ key: classroomMeta.key })
      .from(classroomMeta)
      .where(eq(classroomMeta.key, META_KEY))
      .for("update");
    if (token !== undefined && !(await sessionIsValid(token, tx))) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Your teacher session has expired. Please log in again.",
      });
    }
    return operation(tx);
  });
}

async function findOrAddStudent(tx: Transaction, name: string) {
  const normalized = normalizeStudentName(name);
  const [existing] = await tx
    .select()
    .from(classroomStudents)
    .where(eq(classroomStudents.activeNameHash, normalized.activeNameHash))
    .limit(1);
  if (existing) return publicStudent(existing);
  const [{ id }] = await tx
    .insert(classroomStudents)
    .values({ ...normalized, avatar: randomInt(10) })
    .$returningId();
  return publicStudent(await activeStudent(tx, id));
}

async function recordTeamScores(
  tx: Transaction,
  teams: NonNullable<ResultMetadata["teamScores"]>,
  runKey: string,
  game: ActivitySubmission["game"]
) {
  for (const team of teams) {
    const nameHash = hash(team.name.toLocaleLowerCase("en-US"));
    const [existing] = await tx
      .select()
      .from(classroomTeams)
      .where(eq(classroomTeams.nameHash, nameHash))
      .limit(1);
    const score = checkedPoints((existing?.score ?? 0) + team.score);
    if (existing) {
      await tx
        .update(classroomTeams)
        .set({ score, visible: true })
        .where(eq(classroomTeams.nameHash, nameHash));
    } else {
      await tx
        .insert(classroomTeams)
        .values({ nameHash, name: team.name, score });
    }
    await tx.insert(classroomTeamLogs).values({
      nameHash,
      teamName: team.name,
      delta: team.score,
      kind: "game",
      runId: runKey,
      game,
      reason:
        game === "auction"
          ? "Grammar Auction virtual wager net"
          : `${game} team round`,
    });
  }
}

export const classroomRouter = router({
  teamBoard: publicProcedure.query(async () => {
    await initializeClassroom();
    const db = await database();
    const teams = await db
      .select({ name: classroomTeams.name, score: classroomTeams.score })
      .from(classroomTeams)
      .where(eq(classroomTeams.visible, true))
      .orderBy(desc(classroomTeams.score), asc(classroomTeams.name));
    return { teams };
  }),

  state: publicProcedure
    .input(z.object({ token: z.string().max(256).optional() }).optional())
    .query(async ({ input }) => {
      await initializeClassroom();
      const db = await database();
      return db.transaction(async tx => {
        const students = await tx
          .select()
          .from(classroomStudents)
          .where(isNull(classroomStudents.removedAt))
          .orderBy(
            desc(classroomStudents.points),
            asc(classroomStudents.name),
            asc(classroomStudents.id)
          );
        const teacher = input?.token
          ? await sessionIsValid(input.token, tx)
          : false;
        const history = teacher
          ? await tx
              .select({
                id: classroomPointLogs.id,
                studentId: classroomPointLogs.studentId,
                studentName: classroomPointLogs.studentName,
                delta: classroomPointLogs.delta,
                reason: classroomPointLogs.reason,
                createdAt: classroomPointLogs.createdAt,
                kind: classroomPointLogs.kind,
                score: classroomPointLogs.score,
                total: classroomPointLogs.total,
                game: classroomPointLogs.game,
              })
              .from(classroomPointLogs)
              .orderBy(
                desc(classroomPointLogs.createdAt),
                desc(classroomPointLogs.id)
              )
              .limit(100)
          : [];
        const [games] = await tx
          .select({ value: count() })
          .from(classroomGameResults)
          .where(eq(classroomGameResults.visible, true));
        const [meta] = await tx
          .select()
          .from(classroomMeta)
          .where(eq(classroomMeta.key, META_KEY))
          .limit(1);
        return {
          students: students.map(publicStudent),
          history,
          stats: {
            gamesPlayed: games.value,
            classPoints: students.reduce(
              (total, student) => total + student.points,
              0
            ),
          },
          demo: meta.demo,
        };
      });
    }),

  join: publicProcedure
    .input(z.object({ name: studentNameInput }))
    .mutation(({ input }) =>
      lockedClassroom(tx => findOrAddStudent(tx, input.name))
    ),

  login: publicProcedure
    .input(z.object({ password: z.string().max(128) }))
    .mutation(async ({ input }) => {
      if (!acceptsTeacherPassword(input.password)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Incorrect teacher password.",
        });
      }
      const db = await database();
      const token = randomBytes(32).toString("hex");
      await db.insert(classroomTeacherSessions).values({
        tokenHash: hash(token),
        expiresAt: new Date(Date.now() + SESSION_MS),
      });
      return { token };
    }),

  verify: publicProcedure.input(tokenInput).query(async ({ input }) => ({
    valid: await sessionIsValid(input.token, await database()),
  })),

  logout: publicProcedure.input(tokenInput).mutation(async ({ input }) => {
    const db = await database();
    await db
      .update(classroomTeacherSessions)
      .set({ revokedAt: new Date() })
      .where(eq(classroomTeacherSessions.tokenHash, hash(input.token)));
    return { success: true } as const;
  }),

  adjust: publicProcedure
    .input(
      tokenInput.extend({
        studentId: studentIdInput,
        delta: z
          .number()
          .int()
          .min(-10)
          .max(10)
          .refine(delta => delta !== 0, "Choose a nonzero adjustment."),
        reason: z.string().trim().min(1, "A reason is required.").max(200),
      })
    )
    .mutation(({ input }) =>
      lockedClassroom(async tx => {
        const student = await activeStudent(tx, input.studentId);
        const points = checkedPoints(student.points + input.delta);
        await tx
          .update(classroomStudents)
          .set({ points })
          .where(eq(classroomStudents.id, student.id));
        await tx.insert(classroomPointLogs).values({
          studentId: student.id,
          studentName: student.name,
          delta: input.delta,
          kind: "manual",
          reason: input.reason,
        });
        return publicStudent({ ...student, points });
      }, input.token)
    ),

  addStudent: publicProcedure
    .input(tokenInput.extend({ name: studentNameInput }))
    .mutation(({ input }) =>
      lockedClassroom(tx => findOrAddStudent(tx, input.name), input.token)
    ),

  removeStudent: publicProcedure
    .input(tokenInput.extend({ studentId: studentIdInput }))
    .mutation(({ input }) =>
      lockedClassroom(async tx => {
        const student = await activeStudent(tx, input.studentId);
        await tx
          .update(classroomStudents)
          .set({ removedAt: new Date(), activeNameHash: null })
          .where(eq(classroomStudents.id, student.id));
        await tx.insert(classroomPointLogs).values({
          studentId: student.id,
          studentName: student.name,
          delta: 0,
          kind: "manual",
          reason: "Removed from class",
        });
        return { success: true } as const;
      }, input.token)
    ),

  reset: publicProcedure
    .input(tokenInput.extend({ kind: z.enum(["games", "leaderboard"]) }))
    .mutation(({ input }) =>
      lockedClassroom(async tx => {
        // Include soft-removed students: their historical balances are also reset,
        // without removing either the student record or any audit entries.
        const students = await tx
          .select()
          .from(classroomStudents)
          .orderBy(asc(classroomStudents.id));
        for (const student of students) {
          const delta =
            input.kind === "games" ? -student.gamePoints : -student.points;
          if (delta === 0 && student.gamePoints === 0) continue;
          const points = checkedPoints(student.points + delta);
          await tx
            .update(classroomStudents)
            .set({ points, gamePoints: 0 })
            .where(eq(classroomStudents.id, student.id));
          await tx.insert(classroomPointLogs).values({
            studentId: student.id,
            studentName: student.name,
            delta,
            gameDelta: -student.gamePoints,
            kind: "reset",
            reason:
              input.kind === "games"
                ? "Game scores reset"
                : "Leaderboard cleared",
          });
        }
        if (input.kind === "games") {
          // Keep runId tombstones and original scores forever: replaying an old
          // request after a reset must not create another reward.
          await tx
            .update(classroomGameResults)
            .set({ visible: false })
            .where(eq(classroomGameResults.visible, true));
        }
        const teams = await tx
          .select()
          .from(classroomTeams)
          .where(eq(classroomTeams.visible, true));
        for (const team of teams) {
          await tx
            .update(classroomTeams)
            .set({ score: 0, visible: false })
            .where(eq(classroomTeams.nameHash, team.nameHash));
          await tx.insert(classroomTeamLogs).values({
            nameHash: team.nameHash,
            teamName: team.name,
            delta: -team.score,
            kind: "reset",
            reason:
              input.kind === "games"
                ? "Team game scores reset"
                : "Team leaderboard cleared",
          });
        }
        return { success: true } as const;
      }, input.token)
    ),

  finish: publicProcedure.input(finishInput).mutation(({ input }) =>
    lockedClassroom(async tx => {
      const student = await activeStudent(tx, input.studentId);
      const submissionHash = hash(JSON.stringify(input.submission));
      const runKey = hash(input.runId); // Preserve exact IDs regardless of MySQL collation.
      const [previous] = await tx
        .select()
        .from(classroomGameResults)
        .where(eq(classroomGameResults.runId, runKey))
        .limit(1);
      if (previous) {
        if (
          previous.studentId !== student.id ||
          previous.submissionHash !== submissionHash
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This run ID was already used for a different submission.",
          });
        }
        return finishResponse(previous);
      }
      let grade: ReturnType<typeof gradeSubmission>;
      try {
        grade = gradeSubmission(input.submission);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error ? error.message : "Invalid game submission.",
        });
      }
      const { correct, total } = grade;
      if (
        !Number.isInteger(total) ||
        total <= 0 ||
        !Number.isInteger(correct) ||
        correct < 0 ||
        correct > total
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid game score.",
        });
      }
      const points = calculatePoints(correct, total);
      if (![1, 3, 5].includes(points)) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Invalid reward calculation.",
        });
      }
      const streak = quizStreak(input.submission, correct);
      const studentPoints = checkedPoints(student.points + points);
      await tx.insert(classroomGameResults).values({
        studentId: student.id,
        runId: runKey,
        submissionHash,
        game: input.submission.game,
        correct,
        total,
        points,
        studentPoints,
        resultMetadata: JSON.stringify({ streak }),
      });
      await tx
        .update(classroomStudents)
        .set({
          points: studentPoints,
          gamePoints: checkedPoints(student.gamePoints + points),
          streakBadge: Boolean(student.streakBadge) || streak,
        })
        .where(eq(classroomStudents.id, student.id));
      const gameName = {
        quiz: "Quiz",
        sort: "Category Sort",
        memory: "Memory Match",
      }[input.submission.game];
      await tx.insert(classroomPointLogs).values({
        studentId: student.id,
        studentName: student.name,
        delta: points,
        gameDelta: points,
        kind: "game",
        reason: `${gameName}: ${correct}/${total} correct${streak ? "; streak badge earned (no extra points)" : ""}`,
        score: correct,
        total,
        game: input.submission.game,
      });
      return { correct, total, points, studentPoints };
    })
  ),

  finishActivity: publicProcedure
    .input(finishActivityInput)
    .mutation(({ input }) => {
      const submission = input.submission;
      const teacherRequired =
        submission.game === "auction" ||
        submission.game === "charades" ||
        submission.game === "battle";
      if (teacherRequired && !input.token) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "A signed-in teacher must moderate this activity.",
        });
      }
      return lockedClassroom(async tx => {
        const student = await activeStudent(tx, input.studentId);
        const submissionHash = hash(JSON.stringify(submission));
        const runKey = hash(input.runId);
        const [previous] = await tx
          .select()
          .from(classroomGameResults)
          .where(eq(classroomGameResults.runId, runKey))
          .limit(1);
        // Retry lookup precedes today's date/marker checks, so a committed run
        // remains safely retryable after midnight and after any reset.
        if (previous) {
          const metadata: ResultMetadata | undefined = previous.resultMetadata
            ? JSON.parse(previous.resultMetadata)
            : undefined;
          if (
            previous.studentId !== student.id ||
            previous.submissionHash !== submissionHash ||
            (submission.game === "daily" &&
              input.dateKey !== undefined &&
              input.dateKey !== metadata?.dateKey)
          ) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "This run ID was already used for a different submission.",
            });
          }
          return activityFinishResponse(previous);
        }
        const dateKey = new Date().toISOString().slice(0, 10);
        if (submission.game === "daily") {
          if (input.dateKey !== undefined && input.dateKey !== dateKey) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "The Daily Challenge date has changed. Refresh for today's UTC question.",
            });
          }
          const [completed] = await tx
            .select()
            .from(classroomDailyCompletions)
            .where(
              and(
                eq(classroomDailyCompletions.studentId, student.id),
                eq(classroomDailyCompletions.dateKey, dateKey)
              )
            )
            .limit(1);
          if (completed) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "You have already completed today's Daily Challenge. Come back tomorrow!",
            });
          }
        }
        let grade: ReturnType<typeof gradeActivity>;
        try {
          grade = gradeActivity(
            submission,
            submission.game === "daily" ? dateKey : undefined
          );
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              error instanceof Error
                ? error.message
                : "Invalid activity submission.",
          });
        }
        const { correct, total, streak, teamScores } = grade;
        if (
          !Number.isInteger(total) ||
          total <= 0 ||
          total > 50 ||
          !Number.isInteger(correct) ||
          correct < 0 ||
          correct > total ||
          typeof streak !== "boolean" ||
          (submission.game === "daily" && total !== 1) ||
          (submission.game === "boss" && total !== 5) ||
          (submission.teamAssignments &&
            submission.teamAssignments.length !== total) ||
          (submission.moderated && submission.moderated.length !== total)
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid activity score or round count.",
          });
        }
        if (
          Boolean(teamScores) !== Boolean(submission.teamNames) ||
          (teamScores &&
            (teamScores.length !== submission.teamNames!.length ||
              teamScores.some(
                (team, index) =>
                  team.name !== submission.teamNames![index] ||
                  !Number.isSafeInteger(team.score) ||
                  (submission.game !== "auction" && team.score < 0) ||
                  (submission.game === "auction" && Math.abs(team.score) > 20)
              )))
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid team scores.",
          });
        }
        const standardPoints = calculatePoints(correct, total);
        if (![1, 3, 5].includes(standardPoints)) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Invalid reward calculation.",
          });
        }
        const points = standardPoints * (submission.game === "daily" ? 2 : 1);
        const studentPoints = checkedPoints(student.points + points);
        const metadata: ResultMetadata = {
          streak,
          ...(teamScores ? { teamScores } : {}),
          ...(submission.game === "daily" ? { dateKey } : {}),
        };
        await tx.insert(classroomGameResults).values({
          studentId: student.id,
          runId: runKey,
          submissionHash,
          game: submission.game,
          correct,
          total,
          points,
          studentPoints,
          resultMetadata: JSON.stringify(metadata),
        });
        if (submission.game === "daily") {
          await tx
            .insert(classroomDailyCompletions)
            .values({ studentId: student.id, dateKey, runId: runKey });
        }
        await tx
          .update(classroomStudents)
          .set({
            points: studentPoints,
            gamePoints: checkedPoints(student.gamePoints + points),
            streakBadge: Boolean(student.streakBadge) || streak,
          })
          .where(eq(classroomStudents.id, student.id));
        if (teamScores)
          await recordTeamScores(tx, teamScores, runKey, submission.game);
        const gameName = {
          odd: "Odd One Out",
          bingo: "Vocabulary Bingo",
          builder: "Sentence Builder",
          auction: "Grammar Auction",
          fix: "Fix the Sentence",
          maze: "Preposition Maze",
          story: "Story Builder",
          who: "Who Am I?",
          charades: "Charades",
          battle: "Team Battle",
          daily: "Daily Challenge",
          boss: "Boss Battle",
        }[submission.game];
        await tx.insert(classroomPointLogs).values({
          studentId: student.id,
          studentName: student.name,
          delta: points,
          gameDelta: points,
          kind: "game",
          reason: `${gameName}: ${correct}/${total} correct${submission.game === "daily" ? `; ${dateKey} UTC double reward` : ""}${streak ? "; streak badge earned (no extra points)" : ""}`,
          score: correct,
          total,
          game: submission.game,
        });
        return {
          correct,
          total,
          points,
          studentPoints,
          streak,
          ...(teamScores ? { teamScores } : {}),
        };
      }, input.token);
    }),
});
