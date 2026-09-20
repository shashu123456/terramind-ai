CREATE TABLE `campuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`city` varchar(100) NOT NULL,
	`country` varchar(100) NOT NULL DEFAULT 'India',
	`siteType` varchar(60) NOT NULL DEFAULT 'campus',
	`areaSqm` decimal(14,2),
	`occupancy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `decision_traces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campusId` int NOT NULL,
	`scenarioId` int,
	`inputHash` varchar(128) NOT NULL,
	`modelVersion` varchar(60) NOT NULL,
	`factorVersion` varchar(60) NOT NULL,
	`citations` text NOT NULL DEFAULT ('[]'),
	`summary` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `decision_traces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interventions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`title` varchar(140) NOT NULL,
	`category` varchar(60) NOT NULL,
	`description` text NOT NULL,
	`capexInr` decimal(14,2),
	`confidence` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`calculatorVersion` varchar(40) NOT NULL DEFAULT 'v1.0',
	`evidence` text NOT NULL DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `interventions_id` PRIMARY KEY(`id`),
	CONSTRAINT `interventions_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `observations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campusId` int NOT NULL,
	`metric` varchar(80) NOT NULL,
	`value` decimal(16,4) NOT NULL,
	`unit` varchar(40) NOT NULL,
	`period` varchar(40) NOT NULL,
	`source` varchar(160),
	`quality` enum('measured','entered','derived','modeled') NOT NULL DEFAULT 'entered',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `observations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campusId` int NOT NULL,
	`name` varchar(140) NOT NULL,
	`status` enum('draft','ran','approved') NOT NULL DEFAULT 'draft',
	`horizonYears` int NOT NULL DEFAULT 5,
	`budgetInr` decimal(14,2),
	`interventionSlugs` text NOT NULL DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `campuses_owner_idx` ON `campuses` (`ownerId`);--> statement-breakpoint
CREATE INDEX `decision_traces_campus_idx` ON `decision_traces` (`campusId`);--> statement-breakpoint
CREATE INDEX `observations_campus_idx` ON `observations` (`campusId`);--> statement-breakpoint
CREATE INDEX `scenarios_campus_idx` ON `scenarios` (`campusId`);