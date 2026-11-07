import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Keep existing enum values first: extending the enum preserves stored values. */
const persistedGames = [
  "quiz",
  "sort",
  "memory",
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
] as const;

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// A durable seed version also provides a cross-instance transaction lock.
export const classroomMeta = mysqlTable("classroom_meta", {
  key: varchar("key", { length: 64 }).primaryKey(),
  seedVersion: int("seedVersion").default(0).notNull(),
  demo: boolean("demo").default(false).notNull(),
  seededAt: timestamp("seededAt"),
});

export const classroomStudents = mysqlTable(
  "classroom_students",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 60 }).notNull(),
    normalizedName: varchar("normalizedName", { length: 120 }).notNull(),
    // Nullable only for removed students, allowing a new student to reuse a name.
    // Hashing avoids accent-insensitive MySQL collations merging different names.
    activeNameHash: varchar("activeNameHash", { length: 64 }).unique(),
    points: int("points").default(0).notNull(),
    gamePoints: int("gamePoints").default(0).notNull(),
    avatar: int("avatar").default(0).notNull(),
    streakBadge: boolean("streakBadge").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    removedAt: timestamp("removedAt"),
  },
  table => [index("classroom_students_active_idx").on(table.removedAt)]
);

export const classroomPointLogs = mysqlTable(
  "classroom_point_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    studentId: int("studentId")
      .notNull()
      .references(() => classroomStudents.id),
    // Snapshot names so the audit trail remains legible after removal.
    studentName: varchar("studentName", { length: 60 }).notNull(),
    delta: int("delta").notNull(),
    gameDelta: int("gameDelta").default(0).notNull(),
    reason: varchar("reason", { length: 200 }).notNull(),
    kind: mysqlEnum("kind", ["game", "manual", "reset", "seed"]).notNull(),
    score: int("score"),
    total: int("total"),
    game: mysqlEnum("game", persistedGames),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("classroom_logs_student_idx").on(table.studentId),
    index("classroom_logs_created_idx").on(table.createdAt),
  ]
);

export const classroomGameResults = mysqlTable(
  "classroom_game_results",
  {
    id: int("id").autoincrement().primaryKey(),
    runId: varchar("runId", { length: 128 }).notNull().unique(),
    submissionHash: varchar("submissionHash", { length: 64 }).notNull(),
    studentId: int("studentId")
      .notNull()
      .references(() => classroomStudents.id),
    game: mysqlEnum("game", persistedGames).notNull(),
    correct: int("correct").notNull(),
    total: int("total").notNull(),
    points: int("points").notNull(),
    // Preserve the original response, even if the student's balance later changes.
    studentPoints: int("studentPoints").notNull(),
    // Nullable for pre-expansion results; contains streak, teamScores and daily date.
    resultMetadata: text("resultMetadata"),
    visible: boolean("visible").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("classroom_results_student_idx").on(table.studentId),
    index("classroom_results_visible_idx").on(table.visible),
  ]
);

// Never clear these markers on reset: another UUID cannot replay today's reward.
export const classroomDailyCompletions = mysqlTable(
  "classroom_daily_completions",
  {
    id: int("id").autoincrement().primaryKey(),
    studentId: int("studentId")
      .notNull()
      .references(() => classroomStudents.id),
    dateKey: varchar("dateKey", { length: 10 }).notNull(),
    runId: varchar("runId", { length: 64 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("classroom_daily_student_date_unique").on(
      table.studentId,
      table.dateKey
    ),
  ]
);

export const classroomTeams = mysqlTable("classroom_teams", {
  nameHash: varchar("nameHash", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 60 }).notNull(),
  score: int("score").default(0).notNull(),
  visible: boolean("visible").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Team wagers affect only this separate ledger, never individual point totals.
export const classroomTeamLogs = mysqlTable(
  "classroom_team_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    nameHash: varchar("nameHash", { length: 64 }).notNull(),
    teamName: varchar("teamName", { length: 60 }).notNull(),
    delta: int("delta").notNull(),
    kind: mysqlEnum("kind", ["game", "reset"]).notNull(),
    reason: varchar("reason", { length: 200 }).notNull(),
    runId: varchar("runId", { length: 64 }),
    game: mysqlEnum("game", persistedGames),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("classroom_team_logs_name_idx").on(table.nameHash)]
);

export const classroomTeacherSessions = mysqlTable(
  "classroom_teacher_sessions",
  {
    tokenHash: varchar("tokenHash", { length: 64 }).primaryKey(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    revokedAt: timestamp("revokedAt"),
  }
);

export type ClassroomStudent = typeof classroomStudents.$inferSelect;
export type ClassroomGameResult = typeof classroomGameResults.$inferSelect;
