ALTER TABLE `decision_traces` MODIFY COLUMN `citations` text NOT NULL;--> statement-breakpoint
ALTER TABLE `interventions` MODIFY COLUMN `evidence` text NOT NULL;--> statement-breakpoint
ALTER TABLE `scenarios` MODIFY COLUMN `interventionSlugs` text NOT NULL;