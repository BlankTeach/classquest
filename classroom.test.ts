import { createHash } from "node:crypto";
import { getTableName, type SQL } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { memoryLevels, quizQuestions, sortLevels } from "../shared/gameData";
import {
  getActivityQuestions,
  hasBingo,
  type ActivityKind,
  type ActivitySubmission,
} from "../shared/varietyData";
import type { TrpcContext } from "./_core/context";

const databaseMock = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => databaseMock);

type Row = Record<string, any>;
const dialect = new MySqlDialect();
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");

/** A small in-memory Drizzle mock: these tests never connect to the managed DB. */
class FakeDatabase {
  tables: Record<string, Row[]> = {
    classroom_meta: [
      { key: "classroom", seedVersion: 1, demo: true, seededAt: new Date() },
    ],
    classroom_students: [],
    classroom_point_logs: [],
    classroom_game_results: [],
    classroom_daily_completions: [],
    classroom_teams: [],
    classroom_team_logs: [],
    classroom_teacher_sessions: [],
  };
  events: string[] = [];
  failLogInsert = false;
  readQueries: { table: string; limit: number; order: string[] }[] = [];

  matches(row: Row, condition?: SQL) {
    if (!condition) return true;
    const query = dialect.sqlToQuery(condition);
    let index = 0;
    return query.sql
      .replace(/[()]/g, "")
      .split(/\s+and\s+/i)
      .every(part => {
        const match = part.match(/`[^`]+`\.`([^`]+)`\s+(is null|=|>|<)/i);
        if (!match) throw new Error(`Unsupported mock predicate: ${part}`);
        const [, field, operator] = match;
        if (operator === "is null") return row[field] == null;
        const expected = query.params[index++] as any;
        if (operator === "=")
          return typeof row[field] === "boolean"
            ? Number(row[field]) === Number(expected)
            : row[field] === expected;
        if (operator === "<") return row[field] < expected;
        return row[field] instanceof Date
          ? row[field].getTime() > new Date(expected as string).getTime()
          : row[field] > expected;
      });
  }

  select(fields?: Record<string, unknown>) {
    let table = "";
    let condition: SQL | undefined;
    let limit = Infinity;
    let order: SQL[] = [];
    const execute = () => {
      this.events.push(`select:${table}`);
      this.readQueries.push({
        table,
        limit,
        order: order.map(expression => dialect.sqlToQuery(expression).sql),
      });
      let rows = this.tables[table].filter(row => this.matches(row, condition));
      rows = [...rows].sort((a, b) => {
        for (const expression of order) {
          const text = dialect.sqlToQuery(expression).sql;
          const field = text.match(/`[^`]+`\.`([^`]+)`/)?.[1];
          if (!field) continue;
          const direction = /desc/i.test(text) ? -1 : 1;
          if (a[field] < b[field]) return -direction;
          if (a[field] > b[field]) return direction;
        }
        return 0;
      });
      if (fields?.value) return [{ value: rows.length }];
      rows = rows.slice(0, limit);
      return structuredClone(
        fields
          ? rows.map(row =>
              Object.fromEntries(
                Object.keys(fields).map(key => [key, row[key]])
              )
            )
          : rows
      );
    };
    const builder: any = {
      from: (value: any) => {
        table = getTableName(value);
        return builder;
      },
      where: (value: SQL) => {
        condition = value;
        return builder;
      },
      limit: (value: number) => {
        limit = value;
        return builder;
      },
      orderBy: (...values: SQL[]) => {
        order = values;
        return builder;
      },
      for: () => {
        this.events.push(`lock:${table}`);
        return builder;
      },
      then: (resolve: any, reject: any) =>
        Promise.resolve().then(execute).then(resolve, reject),
    };
    return builder;
  }

  insert(value: any) {
    const table = getTableName(value);
    let values: Row;
    let duplicate = false;
    let result: Row[] | undefined;
    const execute = () => {
      if (result) return result;
      if (this.failLogInsert && table === "classroom_point_logs")
        throw new Error("Simulated audit write failure");
      if (
        duplicate &&
        table === "classroom_meta" &&
        this.tables[table].some(row => row.key === values.key)
      )
        return [];
      const id =
        this.tables[table].reduce((max, row) => Math.max(max, row.id ?? 0), 0) +
        1;
      const row: Row = {
        id,
        createdAt: new Date(),
        removedAt: null,
        revokedAt: null,
        points: 0,
        gamePoints: 0,
        gameDelta: 0,
        score: table === "classroom_teams" ? 0 : null,
        total: null,
        game: null,
        visible: true,
        seedVersion: 0,
        streakBadge: false,
        resultMetadata: null,
        demo: false,
        ...values,
      };
      this.tables[table].push(row);
      this.events.push(`insert:${table}`);
      result = [{ id }];
      return result;
    };
    const builder: any = {
      values: (data: Row) => {
        values = data;
        return builder;
      },
      onDuplicateKeyUpdate: () => {
        duplicate = true;
        return builder;
      },
      $returningId: () => Promise.resolve().then(execute),
      then: (resolve: any, reject: any) =>
        Promise.resolve().then(execute).then(resolve, reject),
    };
    return builder;
  }

  update(value: any) {
    const table = getTableName(value);
    let values: Row;
    let condition: SQL | undefined;
    const builder: any = {
      set: (data: Row) => {
        values = data;
        return builder;
      },
      where: (data: SQL) => {
        condition = data;
        return builder;
      },
      then: (resolve: any, reject: any) =>
        Promise.resolve()
          .then(() => {
            for (const row of this.tables[table])
              if (this.matches(row, condition)) Object.assign(row, values);
            this.events.push(`update:${table}`);
          })
          .then(resolve, reject),
    };
    return builder;
  }

  async transaction(callback: (tx: FakeDatabase) => Promise<any>) {
    const original = structuredClone(this.tables);
    this.events.push("begin");
    try {
      const result = await callback(this);
      this.events.push("commit");
      return result;
    } catch (error) {
      this.tables = original;
      this.events.push("rollback");
      throw error;
    }
  }
}

let db: FakeDatabase;
let backend: typeof import("./classroom");
let caller: ReturnType<typeof backend.classroomRouter.createCaller>;
const context = { user: null, req: { headers: {} }, res: {} } as TrpcContext;
const fullQuiz = () => ({
  game: "quiz" as const,
  questionIds: quizQuestions.slice(0, 5).map(question => question.id),
  answers: quizQuestions.slice(0, 5).map(question => question.answer),
});
async function student(name = "Alex") {
  return caller.join({ name });
}
async function teacher() {
  return (await caller.login({ password: "87654321" })).token;
}

beforeEach(async () => {
  vi.resetModules();
  db = new FakeDatabase();
  databaseMock.getDb.mockReset().mockResolvedValue(db);
  backend = await import("./classroom");
  caller = backend.classroomRouter.createCaller(context);
});

describe("classroom identity and teacher sessions (mock database only)", () => {
  it("normalizes names and joins an existing active student without a password", async () => {
    const first = await student("  Ａlex   Smith  ");
    const second = await student("alex smith");
    expect(first).toEqual(second);
    expect(first.name).toBe("Alex Smith");
    expect(first.points).toBe(0);
    expect(first.avatar).toBeGreaterThanOrEqual(0);
    expect(first.avatar).toBeLessThan(10);
    expect(db.tables.classroom_students).toHaveLength(1);
    expect(db.tables.classroom_students[0].activeNameHash).toBe(
      digest("alex smith")
    );
  });

  it("rejects empty, overly long, and control-character names", async () => {
    for (const name of ["   ", "a".repeat(61), "Alex\u0000"]) {
      await expect(caller.join({ name })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    }
    expect(db.tables.classroom_students).toHaveLength(0);
  });

  it("accepts only the exact teacher password and stores a hashed 12-hour session", async () => {
    for (const password of ["wrong", " 87654321", "87654321 ", "12345678"]) {
      await expect(caller.login({ password })).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    }
    const started = Date.now();
    const token = await teacher();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    const session = db.tables.classroom_teacher_sessions[0];
    expect(session.tokenHash).toBe(digest(token));
    expect(session.tokenHash).not.toBe(token);
    expect(session.expiresAt.getTime() - started).toBeGreaterThanOrEqual(
      12 * 60 * 60 * 1000
    );
    expect(session.expiresAt.getTime() - started).toBeLessThan(
      12 * 60 * 60 * 1000 + 5000
    );
    expect(await caller.verify({ token })).toEqual({ valid: true });
    expect(await caller.verify({ token: "invalid" })).toEqual({ valid: false });
    session.expiresAt = new Date(Date.now() - 1000);
    expect(await caller.verify({ token })).toEqual({ valid: false });
  });

  it("revokes persisted tokens on logout without using cookies", async () => {
    const token = await teacher();
    await caller.logout({ token });
    expect(await caller.verify({ token })).toEqual({ valid: false });
    expect(db.tables.classroom_teacher_sessions[0].revokedAt).toBeInstanceOf(
      Date
    );
  });

  it("hides behavioral history from public state and exposes it only for valid teacher tokens", async () => {
    const alex = await student();
    const token = await teacher();
    await caller.adjust({
      token,
      studentId: alex.id,
      delta: 3,
      reason: " Great participation ",
    });
    const publicState = await caller.state();
    expect(publicState.history).toEqual([]);
    expect(publicState.students).toEqual([{ ...alex, points: 3 }]);
    expect(publicState.stats).toEqual({ gamesPlayed: 0, classPoints: 3 });
    expect(publicState.demo).toBe(true);
    expect((await caller.state({ token: "bad" })).history).toEqual([]);
    const privateState = await caller.state({ token });
    expect(privateState.history[0].reason).toBe("Great participation");
    expect(privateState.history[0].createdAt).toBeInstanceOf(Date);
    expect(privateState.history[0]).not.toHaveProperty("gameDelta");
  });
});

describe("classroom history pagination (mock database only)", () => {
  const token = "a".repeat(64);
  function seedHistory(size: number) {
    db.tables.classroom_teacher_sessions.push({
      tokenHash: digest(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      revokedAt: null,
    });
    db.tables.classroom_students.push({
      id: 7,
      name: "Changed name",
      removedAt: new Date(),
    });
    db.tables.classroom_point_logs = Array.from(
      { length: size },
      (_, index) => ({
        id: index + 1,
        studentId: 7,
        studentName: "Removed Alex",
        delta: 1,
        reason: `Change ${index + 1}`,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        kind: "manual",
        score: null,
        total: null,
        game: null,
        gameDelta: 0,
      })
    );
  }
  async function historyApi() {
    const { appRouter } = await import("./routers");
    return appRouter.createCaller(context).classroom;
  }

  it("reads 50 ID-descending entries plus a lookahead, retaining removed students' snapshot names without writes", async () => {
    seedHistory(151);
    // Deliberately disagree with timestamp ordering: pagination must use IDs.
    for (const row of db.tables.classroom_point_logs) {
      row.createdAt = new Date(Date.UTC(2026, 0, 1) - row.id * 1000);
    }
    db.tables.classroom_meta = [];
    const before = structuredClone(db.tables);
    const page = await (await historyApi()).history({ token });
    expect(page.items.map(item => item.id)).toEqual(
      Array.from({ length: 50 }, (_, index) => 151 - index)
    );
    expect(page.nextCursor).toBe(102);
    expect(page.items[0]).toEqual({
      id: 151,
      studentId: 7,
      studentName: "Removed Alex",
      delta: 1,
      reason: "Change 151",
      createdAt: db.tables.classroom_point_logs[150].createdAt,
      kind: "manual",
      score: null,
      total: null,
      game: null,
    });
    expect(db.readQueries.at(-1)).toEqual({
      table: "classroom_point_logs",
      limit: 51,
      order: ["`classroom_point_logs`.`id` desc"],
    });
    expect(db.events).toEqual([
      "select:classroom_teacher_sessions",
      "select:classroom_point_logs",
    ]);
    expect(db.tables).toEqual(before);
  });

  it("continues from the 100-row polling state without gaps or duplicates and ends at exact or empty boundaries", async () => {
    seedHistory(150);
    const api = await historyApi();
    const state = await api.state({ token });
    expect(state.history).toHaveLength(100);
    expect(state.history.at(-1)?.id).toBe(51);
    const first = await api.history({ token });
    expect(first.nextCursor).toBe(101);
    // Newer entries appearing between reads must not shift an ID-cursor page.
    db.tables.classroom_point_logs.push({
      ...db.tables.classroom_point_logs[0],
      id: 151,
    });
    const middle = await api.history({ token, cursor: first.nextCursor! });
    expect(middle.items.map(item => item.id)).toEqual(
      Array.from({ length: 50 }, (_, index) => 100 - index)
    );
    expect(middle.nextCursor).toBe(51);
    const older = await api.history({
      token,
      cursor: state.history.at(-1)!.id,
    });
    expect(older.items.map(item => item.id)).toEqual(
      Array.from({ length: 50 }, (_, index) => 50 - index)
    );
    expect(older.nextCursor).toBeNull();
    expect([...state.history, ...older.items].map(item => item.id)).toEqual(
      Array.from({ length: 150 }, (_, index) => 150 - index)
    );
    expect(Object.keys(older.items[0]).sort()).toEqual(
      Object.keys(state.history[0]).sort()
    );
    expect(await api.history({ token, cursor: 2 })).toMatchObject({
      items: [{ id: 1 }],
      nextCursor: null,
    });
    expect(await api.history({ token, cursor: 1 })).toEqual({
      items: [],
      nextCursor: null,
    });
  });

  it("rejects missing or invalid input and malformed, unknown, expired, or revoked teacher tokens before reading logs", async () => {
    seedHistory(1);
    const api = await historyApi();
    for (const supplied of ["bad", "b".repeat(64)]) {
      await expect(api.history({ token: supplied })).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    }
    const session = db.tables.classroom_teacher_sessions[0];
    session.expiresAt = new Date(Date.now() - 1000);
    await expect(api.history({ token })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    session.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    session.revokedAt = new Date();
    await expect(api.history({ token })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    for (const input of [
      {},
      { token: "" },
      { token: "a".repeat(257) },
      ...[0, -1, 1.5, 2147483648].map(cursor => ({ token, cursor })),
    ]) {
      await expect(api.history(input as any)).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    }
    expect(db.events).not.toContain("select:classroom_point_logs");
    expect(db.events.every(event => event.startsWith("select:"))).toBe(true);
  });
});

describe("classroom point changes and server-graded rewards", () => {
  it("protects every teacher mutation and requires bounded, nonzero, reasoned adjustments", async () => {
    const alex = await student();
    const token = await teacher();
    for (const delta of [-11, 11, 0, 0.5]) {
      await expect(
        caller.adjust({ token, studentId: alex.id, delta, reason: "Reason" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    await expect(
      caller.adjust({ token, studentId: alex.id, delta: 1, reason: "  " })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.adjust({
        token,
        studentId: alex.id,
        delta: 1,
        reason: "a".repeat(201),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.adjust({
        token: "bad",
        studentId: alex.id,
        delta: 1,
        reason: "Reason",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller.addStudent({ token: "bad", name: "Other" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller.removeStudent({ token: "bad", studentId: alex.id })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller.reset({ token: "bad", kind: "leaderboard" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    const adjusted = await caller.adjust({
      token,
      studentId: alex.id,
      delta: -3,
      reason: " Needs a reminder ",
    });
    expect(adjusted.points).toBe(-3);
    expect(db.tables.classroom_point_logs[0]).toMatchObject({
      delta: -3,
      reason: "Needs a reminder",
      kind: "manual",
    });
    expect(db.events).toContain("lock:classroom_meta");
  });

  it("rolls back a point update if its audit log cannot be written", async () => {
    const alex = await student();
    const token = await teacher();
    db.failLogInsert = true;
    await expect(
      caller.adjust({ token, studentId: alex.id, delta: 3, reason: "Reason" })
    ).rejects.toThrow();
    expect(db.tables.classroom_students[0].points).toBe(0);
    expect(db.tables.classroom_point_logs).toHaveLength(0);
    expect(db.events.at(-1)).toBe("rollback");
  });

  it("grades on the server and returns the original response for a retry without duplicate points", async () => {
    const alex = await student();
    const submission = fullQuiz();
    const first = await caller.finish({
      studentId: alex.id,
      runId: "run-1",
      submission,
    });
    expect(first).toEqual({
      correct: 5,
      total: 5,
      points: 5,
      studentPoints: 5,
    });
    const token = await teacher();
    await caller.adjust({
      token,
      studentId: alex.id,
      delta: 2,
      reason: "Helped a classmate",
    });
    expect(
      await caller.finish({ studentId: alex.id, runId: "run-1", submission })
    ).toEqual(first);
    expect(db.tables.classroom_students[0].points).toBe(7);
    expect(db.tables.classroom_game_results).toHaveLength(1);
    expect(
      db.tables.classroom_point_logs.filter(row => row.kind === "game")
    ).toHaveLength(1);
    expect(db.tables.classroom_point_logs[0]).toMatchObject({
      score: 5,
      total: 5,
      game: "quiz",
      delta: 5,
    });
    const changed = {
      ...submission,
      answers: submission.answers.map(answer => (answer + 1) % 3),
    };
    await expect(
      caller.finish({ studentId: alex.id, runId: "run-1", submission: changed })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    // Exact run IDs stay distinct even on a case-insensitive MySQL collation.
    await caller.finish({ studentId: alex.id, runId: "RUN-1", submission });
    expect(db.tables.classroom_game_results).toHaveLength(2);
  });

  it("accepts every active quiz question ID in the submission schema", () => {
    for (const question of quizQuestions) {
      expect(
        backend.submissionInput.safeParse({
          game: "quiz",
          questionIds: [question.id],
          answers: [question.answer],
        }).success,
        question.id
      ).toBe(true);
    }
  });

  it("rejects incomplete, unknown and client-score submissions without awarding points", async () => {
    const alex = await student();
    const submissions = [
      { game: "quiz", questionIds: ["unknown"], answers: [0] },
      { game: "sort", levelId: "unknown", assignments: [0] },
      { game: "memory", levelId: memoryLevels[0].id, attempts: [[0, 8]] },
      { ...fullQuiz(), correct: 5, points: 999 },
    ];
    for (const submission of submissions) {
      await expect(
        caller.finish({
          studentId: alex.id,
          runId: "invalid",
          submission: submission as any,
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    expect(db.tables.classroom_students[0].points).toBe(0);
    expect(db.tables.classroom_game_results).toHaveLength(0);
  });

  it("awards +1 for zero correct, +5 for full sort, and +3 for a memory run with two dirty pairs", async () => {
    const alex = await student();
    const quiz = fullQuiz();
    quiz.answers = quiz.answers.map(answer => (answer + 1) % 3);
    expect(
      (
        await caller.finish({
          studentId: alex.id,
          runId: "quiz",
          submission: quiz,
        })
      ).points
    ).toBe(1);
    const level = sortLevels[0];
    expect(
      (
        await caller.finish({
          studentId: alex.id,
          runId: "sort",
          submission: {
            game: "sort",
            levelId: level.id,
            assignments: level.words.map(word => word.basket),
          },
        })
      ).points
    ).toBe(5);
    const memory = memoryLevels[0];
    const attempts: [number, number][] = [
      [0, 1],
      ...memory.pairs.map((_, index) => [index, index + 8] as [number, number]),
    ];
    expect(
      await caller.finish({
        studentId: alex.id,
        runId: "memory",
        submission: {
          game: "memory",
          levelId: memory.id,
          attempts,
        },
      })
    ).toEqual({ correct: 6, total: 8, points: 3, studentPoints: 9 });
  });
});

describe("classroom soft removal, compensating resets, and seed lifecycle", () => {
  it("soft-removes students, retains history, rejects deleted students, and allows name reuse", async () => {
    const alex = await student();
    await caller.finish({
      studentId: alex.id,
      runId: "old",
      submission: fullQuiz(),
    });
    const token = await teacher();
    await caller.removeStudent({ token, studentId: alex.id });
    expect(db.tables.classroom_students[0].removedAt).toBeInstanceOf(Date);
    expect(db.tables.classroom_students[0].activeNameHash).toBeNull();
    expect((await caller.state({ token })).history).toHaveLength(2);
    expect((await caller.state()).students).toEqual([]);
    await expect(
      caller.finish({
        studentId: alex.id,
        runId: "new",
        submission: fullQuiz(),
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    const replacement = await student("Alex");
    expect(replacement.id).not.toBe(alex.id);
    expect(replacement.points).toBe(0);
  });

  it("game reset undoes only net game points, keeps manual points and audit, and prevents replay awards", async () => {
    const alex = await student();
    const submission = fullQuiz();
    const original = await caller.finish({
      studentId: alex.id,
      runId: "original",
      submission,
    });
    const token = await teacher();
    await caller.adjust({
      token,
      studentId: alex.id,
      delta: 3,
      reason: "Helped",
    });
    await caller.reset({ token, kind: "games" });
    expect(db.tables.classroom_students[0]).toMatchObject({
      points: 3,
      gamePoints: 0,
    });
    expect(db.tables.classroom_game_results[0].visible).toBe(false);
    expect(db.tables.classroom_point_logs.at(-1)).toMatchObject({
      kind: "reset",
      delta: -5,
      gameDelta: -5,
    });
    const state = await caller.state({ token });
    expect(state.stats.gamesPlayed).toBe(0);
    expect(state.history).toHaveLength(3);
    await caller.reset({ token, kind: "games" });
    expect(db.tables.classroom_point_logs).toHaveLength(3);
    expect(
      await caller.finish({ studentId: alex.id, runId: "original", submission })
    ).toEqual(original);
    expect(db.tables.classroom_students[0].points).toBe(3);
  });

  it("leaderboard clear zeroes balances with audit logs and later game reset does not subtract erased rewards", async () => {
    const alex = await student();
    await caller.finish({
      studentId: alex.id,
      runId: "game",
      submission: fullQuiz(),
    });
    const token = await teacher();
    await caller.adjust({
      token,
      studentId: alex.id,
      delta: -2,
      reason: "Reminder",
    });
    await caller.reset({ token, kind: "leaderboard" });
    expect(db.tables.classroom_students[0]).toMatchObject({
      points: 0,
      gamePoints: 0,
    });
    expect(db.tables.classroom_point_logs.at(-1)).toMatchObject({
      kind: "reset",
      delta: -3,
      gameDelta: -5,
    });
    expect(db.tables.classroom_game_results[0].visible).toBe(true);
    await caller.reset({ token, kind: "games" });
    expect(db.tables.classroom_students[0].points).toBe(0);
    expect(db.tables.classroom_point_logs).toHaveLength(3);
  });

  it("seeds a marked demo class exactly once with honest seed logs and no invented games, even after all removals", async () => {
    db.tables.classroom_meta = [];
    await backend.initializeClassroom();
    expect(db.tables.classroom_students).toHaveLength(10);
    expect(db.tables.classroom_point_logs).toHaveLength(10);
    expect(
      db.tables.classroom_point_logs.every(
        row =>
          row.kind === "seed" &&
          row.reason === "Demo starting points" &&
          row.game === null
      )
    ).toBe(true);
    expect(db.tables.classroom_game_results).toHaveLength(0);
    expect(db.tables.classroom_meta[0]).toMatchObject({
      seedVersion: 1,
      demo: true,
    });
    await backend.initializeClassroom();
    const token = await teacher();
    for (const row of [...db.tables.classroom_students])
      await caller.removeStudent({ token, studentId: row.id });
    const count = db.tables.classroom_students.length;
    vi.resetModules();
    const restarted = await import("./classroom");
    await restarted.initializeClassroom();
    expect(db.tables.classroom_students).toHaveLength(count);
    expect(
      db.tables.classroom_students.every(row => row.removedAt instanceof Date)
    ).toBe(true);
  });
});

function fullActivity(
  game: ActivityKind,
  level = "5A",
  dateKey?: string
): ActivitySubmission {
  const questions = getActivityQuestions(game, level, dateKey);
  const firstLine =
    game === "bingo"
      ? questions.findIndex((_, index) =>
          hasBingo(
            questions.slice(0, index + 1).map(question => question.answer)
          )
        )
      : -1;
  const selected =
    game === "bingo" ? questions.slice(0, firstLine + 1) : questions;
  const submission: ActivitySubmission = {
    game,
    level,
    questionIds: selected.map(question => question.id),
  };
  if (game === "builder")
    submission.orders = selected.map(question => question.correctOrder!);
  else if (game === "charades") submission.moderated = selected.map(() => true);
  else submission.answers = selected.map(question => question.answer);
  if (game === "fix")
    submission.textAnswers = selected.map(question => question.correction!);
  if (game === "battle" || game === "auction") {
    submission.teamNames = ["Red", "Blue"];
    submission.teamAssignments = selected.map((_, index) => index % 2);
  }
  if (game === "auction") submission.bets = selected.map(() => 2);
  return submission;
}

describe("expanded activity persistence and authorization (mock database only)", () => {
  it("grades every solo activity, awards only standard completion points, and persists original metadata", async () => {
    const alex = await student();
    for (const game of [
      "odd",
      "bingo",
      "builder",
      "fix",
      "maze",
      "story",
      "who",
      "boss",
    ] as ActivityKind[]) {
      const response = await caller.finishActivity({
        studentId: alex.id,
        runId: game,
        submission: fullActivity(game),
      });
      expect(response).toMatchObject({
        correct: fullActivity(game).questionIds!.length,
        total: fullActivity(game).questionIds!.length,
        points: 5,
        streak: true,
      });
      expect(db.tables.classroom_game_results.at(-1)).toMatchObject({
        game,
        visible: true,
      });
      expect(
        JSON.parse(db.tables.classroom_game_results.at(-1)!.resultMetadata)
      ).toEqual({ streak: true });
    }
    expect(db.tables.classroom_students[0]).toMatchObject({
      points: 40,
      gamePoints: 40,
      streakBadge: true,
    });
    expect((await caller.state()).students[0].streakBadge).toBe(true);
    expect((await caller.state()).history).toEqual([]);
    expect((await caller.state()).stats.gamesPlayed).toBe(8);
    expect(
      db.tables.classroom_point_logs.every(
        row => row.reason.includes("badge") && row.delta === 5
      )
    ).toBe(true);
  });

  it("computes the original quiz badge only from three consecutive correct answers with no extra points or response changes", async () => {
    const alex = await student();
    const quiz = fullQuiz();
    quiz.answers[0] = (quiz.answers[0] + 1) % 3;
    quiz.answers[4] = (quiz.answers[4] + 1) % 3;
    expect(
      await caller.finish({
        studentId: alex.id,
        runId: "streak",
        submission: quiz,
      })
    ).toEqual({ correct: 3, total: 5, points: 3, studentPoints: 3 });
    expect((await caller.state()).students[0].streakBadge).toBe(true);
    expect(db.tables.classroom_point_logs[0].reason).toContain(
      "no extra points"
    );
    const other = await student("No streak");
    const spaced = fullQuiz();
    spaced.answers[1] = (spaced.answers[1] + 1) % 3;
    spaced.answers[3] = (spaced.answers[3] + 1) % 3;
    await caller.finish({
      studentId: other.id,
      runId: "spaced",
      submission: spaced,
    });
    expect(
      db.tables.classroom_students.find(row => row.id === other.id)!.streakBadge
    ).toBe(false);
  });

  it("requires genuine teacher sessions for auction and charades before any award, including expired and revoked sessions", async () => {
    const alex = await student();
    for (const game of ["auction", "charades"] as ActivityKind[]) {
      const submission = fullActivity(game);
      for (const token of [undefined, "bad", "a".repeat(64)]) {
        await expect(
          caller.finishActivity({
            studentId: alex.id,
            runId: game,
            submission,
            token,
          })
        ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
      }
    }
    const token = await teacher();
    let session = db.tables.classroom_teacher_sessions[0];
    session.expiresAt = new Date(Date.now() - 1);
    await expect(
      caller.finishActivity({
        studentId: alex.id,
        runId: "expired",
        submission: fullActivity("charades"),
        token,
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    session = db.tables.classroom_teacher_sessions[0];
    session.expiresAt = new Date(Date.now() + 10000);
    session.revokedAt = new Date();
    await expect(
      caller.finishActivity({
        studentId: alex.id,
        runId: "revoked",
        submission: fullActivity("charades"),
        token,
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(db.tables.classroom_game_results).toHaveLength(0);
    expect(db.tables.classroom_point_logs).toHaveLength(0);
    db.tables.classroom_teacher_sessions[0].revokedAt = null;
    const result = await caller.finishActivity({
      studentId: alex.id,
      runId: "observed",
      submission: fullActivity("charades"),
      token,
    });
    expect(result).toMatchObject({ correct: 5, points: 5 });
    await expect(
      caller.finishActivity({
        studentId: alex.id,
        runId: "forged",
        submission: {
          ...fullActivity("charades"),
          moderated: undefined,
          answers: [0, 0, 0, 0, 0],
        },
        token,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it.each([
    { label: "missing", token: undefined },
    { label: "malformed", token: "bad" },
    { label: "unknown", token: "a".repeat(64) },
  ])(
    "rejects unmoderated battle with a $label teacher token without balance writes",
    async ({ token }) => {
      const alex = await student();
      const submission = fullActivity("battle");
      expect(submission).not.toHaveProperty("moderated");
      const before = structuredClone(db.tables);
      db.events = [];
      await expect(
        caller.finishActivity({
          studentId: alex.id,
          runId: "battle-unmoderated",
          submission,
          token,
        })
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
      expect(db.tables).toEqual(before);
      expect(
        db.events.filter(event => /^(insert|update):/.test(event))
      ).toEqual([]);
    }
  );

  it("protects teacher-moderated battle submissions even when a client adds observed outcomes", async () => {
    const alex = await student();
    const submission = {
      ...fullActivity("battle"),
      moderated: [true, true, true, true, true],
    };
    await expect(
      caller.finishActivity({
        studentId: alex.id,
        runId: "battle-observed",
        submission,
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      caller.finishActivity({
        studentId: alex.id,
        runId: "battle-observed",
        submission,
        token: "bad",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(db.tables.classroom_game_results).toHaveLength(0);
  });

  it("persists and sorts aggregate team net deltas, never charging auction losses to individual students", async () => {
    const alex = await student();
    const token = await teacher();
    const winning = fullActivity("auction");
    const won = await caller.finishActivity({
      studentId: alex.id,
      runId: "auction-win",
      submission: winning,
      token,
    });
    expect(won).toMatchObject({
      points: 5,
      teamScores: [
        { name: "Red", score: 6 },
        { name: "Blue", score: 4 },
      ],
    });
    expect(await caller.teamBoard()).toEqual({
      teams: [
        { name: "Red", score: 6 },
        { name: "Blue", score: 4 },
      ],
    });
    const losing = fullActivity("auction");
    losing.answers = losing.answers!.map(answer => 1 - answer);
    const lost = await caller.finishActivity({
      studentId: alex.id,
      runId: "auction-loss",
      submission: losing,
      token,
    });
    expect(lost).toMatchObject({
      points: 1,
      studentPoints: 6,
      teamScores: [
        { name: "Red", score: -6 },
        { name: "Blue", score: -4 },
      ],
    });
    expect(await caller.teamBoard()).toEqual({
      teams: [
        { name: "Blue", score: 0 },
        { name: "Red", score: 0 },
      ],
    });
    expect(db.tables.classroom_point_logs.every(row => row.delta > 0)).toBe(
      true
    );
    const battle = await caller.finishActivity({
      studentId: alex.id,
      runId: "battle",
      submission: fullActivity("battle"),
      token,
    });
    expect(battle.teamScores).toEqual([
      { name: "Red", score: 3 },
      { name: "Blue", score: 2 },
    ]);
    expect(await caller.teamBoard()).toEqual({
      teams: [
        { name: "Red", score: 3 },
        { name: "Blue", score: 2 },
      ],
    });
    expect(db.tables.classroom_team_logs).toHaveLength(6);
    const before = structuredClone(db.tables);
    expect(
      await caller.finishActivity({
        studentId: alex.id,
        runId: "auction-win",
        submission: winning,
        token,
      })
    ).toEqual(won);
    expect(db.tables).toEqual(before);
  });

  it("rejects invalid team counts, duplicate normalized names, assignments, over-budget wagers, and forged result fields", async () => {
    const alex = await student();
    const token = await teacher();
    const valid = fullActivity("auction");
    const invalid = [
      { ...valid, teamNames: ["Only one"] },
      { ...valid, teamNames: ["A", "B", "C", "D", "E"] },
      { ...valid, teamNames: [" RED ", "red"] },
      { ...valid, teamNames: ["Ａ", "A"] },
      { ...valid, teamNames: ["\u0000", "Blue"] },
      { ...valid, teamAssignments: [0, 3, 0, 1, 0] },
      { ...valid, teamAssignments: [0] },
      { ...valid, bets: [20, 20, 20, 20, 20] },
      { ...valid, bets: [-1, 2, 2, 2, 2] },
      { ...valid, correct: 5, points: 999 },
      { ...valid, teamScores: [{ name: "Red", score: 999 }] },
    ];
    for (const submission of invalid) {
      await expect(
        caller.finishActivity({
          studentId: alex.id,
          runId: "bad",
          submission: submission as any,
          token,
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    expect(db.tables.classroom_game_results).toHaveLength(0);
    expect(db.tables.classroom_team_logs).toHaveLength(0);
  });

  it("returns immutable original activity response after adjustments and rejects changed or cross-student run reuse", async () => {
    const alex = await student();
    const submission = fullActivity("odd");
    const original = await caller.finishActivity({
      studentId: alex.id,
      runId: "original",
      submission,
    });
    const token = await teacher();
    await caller.adjust({
      studentId: alex.id,
      token,
      delta: 3,
      reason: "Helped",
    });
    expect(
      await caller.finishActivity({
        studentId: alex.id,
        runId: "original",
        submission,
      })
    ).toEqual(original);
    const changed = {
      ...submission,
      answers: submission.answers!.map(answer => (answer + 1) % 4),
    };
    await expect(
      caller.finishActivity({
        studentId: alex.id,
        runId: "original",
        submission: changed,
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    const other = await student("Other");
    await expect(
      caller.finishActivity({
        studentId: other.id,
        runId: "original",
        submission,
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      caller.finish({
        studentId: alex.id,
        runId: "original",
        submission: fullQuiz(),
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(db.tables.classroom_game_results).toHaveLength(1);
    expect(db.tables.classroom_students[0].points).toBe(8);
  });

  it("awards daily double points once per student and UTC date, retaining UUID retries and durable uniqueness after resets", async () => {
    const alex = await student();
    const dateKey = new Date().toISOString().slice(0, 10);
    const submission = fullActivity("daily", "5A", dateKey);
    const input = {
      studentId: alex.id,
      runId: "daily-first",
      submission,
      dateKey,
    };
    const original = await caller.finishActivity(input);
    expect(original).toEqual({
      correct: 1,
      total: 1,
      points: 10,
      studentPoints: 10,
      streak: false,
    });
    expect(db.tables.classroom_daily_completions).toHaveLength(1);
    expect(db.tables.classroom_point_logs[0].reason).toContain(
      `${dateKey} UTC double reward`
    );
    expect(await caller.finishActivity(input)).toEqual(original);
    await expect(
      caller.finishActivity({ ...input, runId: "daily-other-uuid" })
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: expect.stringContaining("already completed"),
    });
    const token = await teacher();
    await caller.reset({ token, kind: "games" });
    expect(db.tables.classroom_daily_completions).toHaveLength(1);
    expect(await caller.finishActivity(input)).toEqual(original);
    await expect(
      caller.finishActivity({ ...input, runId: "daily-after-reset" })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(db.tables.classroom_students[0].points).toBe(0);
    vi.resetModules();
    const restarted = (
      await import("./classroom")
    ).classroomRouter.createCaller(context);
    await expect(
      restarted.finishActivity({ ...input, runId: "daily-after-restart" })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    const other = await student("Other");
    const incorrect = {
      ...submission,
      answers: [(submission.answers![0] + 1) % 3],
    };
    expect(
      await caller.finishActivity({
        studentId: other.id,
        runId: "daily-wrong",
        submission: incorrect,
        dateKey,
      })
    ).toMatchObject({ correct: 0, total: 1, points: 2, studentPoints: 2 });
  });

  it("validates daily client date against the server but allows previous run retries across UTC midnight", async () => {
    const alex = await student();
    const dateKey = new Date().toISOString().slice(0, 10);
    const input = {
      studentId: alex.id,
      runId: "daily-midnight",
      submission: fullActivity("daily", "5A", dateKey),
      dateKey,
    };
    await expect(
      caller.finishActivity({ ...input, dateKey: "2000-01-01" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const original = await caller.finishActivity(input);
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date(`${dateKey}T00:00:00Z`).getTime() + 86400000);
      expect(await caller.finishActivity(input)).toEqual(original);
      expect(
        await caller.finishActivity({ ...input, dateKey: undefined })
      ).toEqual(original);
      await expect(
        caller.finishActivity({ ...input, runId: "different-day-stale" })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(
        caller.finishActivity({
          ...input,
          dateKey: new Date().toISOString().slice(0, 10),
        })
      ).rejects.toMatchObject({ code: "CONFLICT" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("compensates all new game points and team scores with logs, hides results, keeps daily markers and all earlier history", async () => {
    const alex = await student();
    const token = await teacher();
    await caller.adjust({
      studentId: alex.id,
      token,
      delta: 3,
      reason: "Existing history",
    });
    const oldLog = structuredClone(db.tables.classroom_point_logs[0]);
    const battle = await caller.finishActivity({
      studentId: alex.id,
      runId: "battle-reset",
      submission: fullActivity("battle"),
      token,
    });
    await caller.finishActivity({
      studentId: alex.id,
      runId: "daily-reset",
      submission: fullActivity("daily"),
    });
    const originalResults = structuredClone(db.tables.classroom_game_results);
    await caller.reset({ token, kind: "games" });
    expect(db.tables.classroom_students[0]).toMatchObject({
      points: 3,
      gamePoints: 0,
    });
    expect(db.tables.classroom_point_logs[0]).toEqual(oldLog);
    expect(db.tables.classroom_point_logs.at(-1)).toMatchObject({
      kind: "reset",
      delta: -15,
      gameDelta: -15,
    });
    expect(
      db.tables.classroom_game_results.map(row => ({ ...row, visible: true }))
    ).toEqual(originalResults);
    expect(db.tables.classroom_daily_completions).toHaveLength(1);
    expect(await caller.teamBoard()).toEqual({ teams: [] });
    expect(
      db.tables.classroom_team_logs.slice(-2).map(row => row.delta)
    ).toEqual([-3, -2]);
    const before = structuredClone(db.tables);
    await caller.reset({ token, kind: "games" });
    expect(db.tables).toEqual(before);
    expect(
      await caller.finishActivity({
        studentId: alex.id,
        runId: "battle-reset",
        submission: fullActivity("battle"),
        token,
      })
    ).toEqual(battle);
    expect(await caller.teamBoard()).toEqual({ teams: [] });
    await caller.finishActivity({
      studentId: alex.id,
      runId: "battle-fresh",
      submission: fullActivity("battle"),
      token,
    });
    await caller.reset({ token, kind: "leaderboard" });
    expect(db.tables.classroom_students[0].points).toBe(0);
    expect(await caller.teamBoard()).toEqual({ teams: [] });
    expect(db.tables.classroom_team_logs.at(-1)).toMatchObject({
      kind: "reset",
      delta: -2,
      reason: "Team leaderboard cleared",
    });
  });

  it("rolls back daily markers, team deltas, metadata, badges and points when the individual audit write fails", async () => {
    const alex = await student();
    const token = await teacher();
    for (const game of ["daily", "battle", "auction"] as ActivityKind[]) {
      const before = structuredClone(db.tables);
      db.failLogInsert = true;
      await expect(
        caller.finishActivity({
          studentId: alex.id,
          runId: `failure-${game}`,
          submission: fullActivity(game),
          token,
        })
      ).rejects.toThrow();
      expect(db.tables).toEqual(before);
      expect(db.events.at(-1)).toBe("rollback");
      db.failLogInsert = false;
    }
  });
});

describe("historical quiz compatibility (mock database only)", () => {
  it("grades immutable pre-update quiz IDs and earns a streak without depending on the active curriculum catalog", async () => {
    const alex = await student();
    const submission = {
      game: "quiz" as const,
      questionIds: [
        "g-simple-present-1a-1a3bg9w",
        "g-simple-present-1b-ujkmtt",
        "g-simple-present-2a-1vxesg5",
        "g-simple-present-2b-1lq81q3",
        "g-simple-present-3a-1cwdj5o",
      ],
      answers: [0, 1, 2, 2, 2],
    };
    const result = await caller.finish({
      studentId: alex.id,
      runId: "legacy-quiz",
      submission,
    });
    expect(result).toEqual({
      correct: 5,
      total: 5,
      points: 5,
      studentPoints: 5,
    });
    expect((await caller.state()).students[0].streakBadge).toBe(true);
    expect(
      await caller.finish({
        studentId: alex.id,
        runId: "legacy-quiz",
        submission,
      })
    ).toEqual(result);
    expect(db.tables.classroom_game_results).toHaveLength(1);
    expect(db.tables.classroom_point_logs).toHaveLength(1);
  });
});
