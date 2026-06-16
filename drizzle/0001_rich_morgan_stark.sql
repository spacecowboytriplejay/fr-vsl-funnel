CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int,
	`calendlyEventUri` varchar(512),
	`calendlyInviteeUri` varchar(512),
	`inviteeEmail` varchar(320) NOT NULL,
	`inviteeName` varchar(255),
	`scheduledTime` timestamp,
	`status` enum('active','canceled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funnel_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(128) NOT NULL,
	`value` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `funnel_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `funnel_config_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`source` varchar(255) DEFAULT 'organic',
	`qualified` boolean NOT NULL DEFAULT false,
	`booked` boolean NOT NULL DEFAULT false,
	`vslPlayed` boolean NOT NULL DEFAULT false,
	`vslPercentWatched` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_leadId_leads_id_fk` FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE no action ON UPDATE no action;