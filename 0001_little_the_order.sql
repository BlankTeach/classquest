CREATE TABLE `classroom_game_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` varchar(128) NOT NULL,
	`submissionHash` varchar(64) NOT NULL,
	`studentId` int NOT NULL,
	`game` enum('quiz','sort','memory') NOT NULL,
	`correct` int NOT NULL,
	`total` int NOT NULL,
	`points` int NOT NULL,
	`studentPoints` int NOT NULL,
	`visible` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classroom_game_results_id` PRIMARY KEY(`id`),
	CONSTRAINT `classroom_game_results_runId_unique` UNIQUE(`runId`)
);
--> statement-breakpoint
CREATE TABLE `classroom_meta` (
	`key` varchar(64) NOT NULL,
	`seedVersion` int NOT NULL DEFAULT 0,
	`demo` boolean NOT NULL DEFAULT false,
	`seededAt` timestamp,
	CONSTRAINT `classroom_meta_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `classroom_point_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`studentName` varchar(60) NOT NULL,
	`delta` int NOT NULL,
	`gameDelta` int NOT NULL DEFAULT 0,
	`reason` varchar(200) NOT NULL,
	`kind` enum('game','manual','reset','seed') NOT NULL,
	`score` int,
	`total` int,
	`game` enum('quiz','sort','memory'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classroom_point_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classroom_students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(60) NOT NULL,
	`normalizedName` varchar(120) NOT NULL,
	`activeNameHash` varchar(64),
	`points` int NOT NULL DEFAULT 0,
	`gamePoints` int NOT NULL DEFAULT 0,
	`avatar` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`removedAt` timestamp,
	CONSTRAINT `classroom_students_id` PRIMARY KEY(`id`),
	CONSTRAINT `classroom_students_activeNameHash_unique` UNIQUE(`activeNameHash`)
);
--> statement-breakpoint
CREATE TABLE `classroom_teacher_sessions` (
	`tokenHash` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	CONSTRAINT `classroom_teacher_sessions_tokenHash` PRIMARY KEY(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `classroom_game_results` ADD CONSTRAINT `classroom_game_results_studentId_classroom_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `classroom_students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `classroom_point_logs` ADD CONSTRAINT `classroom_point_logs_studentId_classroom_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `classroom_students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `classroom_results_student_idx` ON `classroom_game_results` (`studentId`);--> statement-breakpoint
CREATE INDEX `classroom_results_visible_idx` ON `classroom_game_results` (`visible`);--> statement-breakpoint
CREATE INDEX `classroom_logs_student_idx` ON `classroom_point_logs` (`studentId`);--> statement-breakpoint
CREATE INDEX `classroom_logs_created_idx` ON `classroom_point_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `classroom_students_active_idx` ON `classroom_students` (`removedAt`);