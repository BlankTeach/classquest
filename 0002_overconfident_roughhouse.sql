CREATE TABLE `classroom_daily_completions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`dateKey` varchar(10) NOT NULL,
	`runId` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classroom_daily_completions_id` PRIMARY KEY(`id`),
	CONSTRAINT `classroom_daily_student_date_unique` UNIQUE(`studentId`,`dateKey`)
);
--> statement-breakpoint
CREATE TABLE `classroom_team_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nameHash` varchar(64) NOT NULL,
	`teamName` varchar(60) NOT NULL,
	`delta` int NOT NULL,
	`kind` enum('game','reset') NOT NULL,
	`reason` varchar(200) NOT NULL,
	`runId` varchar(64),
	`game` enum('quiz','sort','memory','odd','bingo','builder','auction','fix','maze','story','who','charades','battle','daily','boss'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classroom_team_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classroom_teams` (
	`nameHash` varchar(64) NOT NULL,
	`name` varchar(60) NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`visible` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classroom_teams_nameHash` PRIMARY KEY(`nameHash`)
);
--> statement-breakpoint
ALTER TABLE `classroom_game_results` MODIFY COLUMN `game` enum('quiz','sort','memory','odd','bingo','builder','auction','fix','maze','story','who','charades','battle','daily','boss') NOT NULL;--> statement-breakpoint
ALTER TABLE `classroom_point_logs` MODIFY COLUMN `game` enum('quiz','sort','memory','odd','bingo','builder','auction','fix','maze','story','who','charades','battle','daily','boss');--> statement-breakpoint
ALTER TABLE `classroom_game_results` ADD `resultMetadata` text;--> statement-breakpoint
ALTER TABLE `classroom_students` ADD `streakBadge` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `classroom_daily_completions` ADD CONSTRAINT `classroom_daily_completions_studentId_classroom_students_id_fk` FOREIGN KEY (`studentId`) REFERENCES `classroom_students`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `classroom_team_logs_name_idx` ON `classroom_team_logs` (`nameHash`);