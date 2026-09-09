-- ============================================================
-- HRMS Production Fix Migration (run on the Hostinger MySQL DB)
-- Fixes: Bug 2 (invoices.employee_id missing)
--        Bug 5 (client_onboardings table missing)
--        Bug 6 (ai_interviews table missing)
-- Safe to run more than once (idempotent).
-- How to run: Hostinger hPanel > Databases > phpMyAdmin >
--             select the HRMS database > SQL tab > paste and Go.
-- ============================================================

-- ---------- Bug 5: missing client_onboardings table ----------
CREATE TABLE IF NOT EXISTS `client_onboardings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `service` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stage` enum('Proposal Sent','Details Submitted','Agreement Generated','Agreement Signed','Onboarded') COLLATE utf8mb4_unicode_ci DEFAULT 'Proposal Sent',
  `proposal_notes` text COLLATE utf8mb4_unicode_ci,
  `requirements` text COLLATE utf8mb4_unicode_ci,
  `agreement_terms` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Bug 6: missing ai_interviews table ----------
CREATE TABLE IF NOT EXISTS `ai_interviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `candidate_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `candidate_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `job_title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `questions` json DEFAULT NULL,
  `answers` json DEFAULT NULL,
  `evaluation` json DEFAULT NULL,
  `score` decimal(5,2) DEFAULT NULL,
  `status` enum('Pending','InProgress','Completed','Evaluated') COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Bug 6 (part 2): missing resume_screenings table ----------
CREATE TABLE IF NOT EXISTS `resume_screenings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidate_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `skills` json DEFAULT NULL,
  `experience_years` decimal(4,1) DEFAULT NULL,
  `education` text COLLATE utf8mb4_unicode_ci,
  `match_score` decimal(5,2) DEFAULT NULL,
  `matched_keywords` json DEFAULT NULL,
  `missing_keywords` json DEFAULT NULL,
  `job_title` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resume_excerpt` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ats_score` decimal(5,1) DEFAULT NULL,
  `ats_breakdown` json DEFAULT NULL,
  `suggestions` json DEFAULT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Client panel: missing client_employee_deleted archive table ----------
-- Iske bina employee delete 500 error deta hai (archive INSERT fail ho jata hai)
CREATE TABLE IF NOT EXISTS `client_employee_deleted` (
  `id` int NOT NULL AUTO_INCREMENT,
  `original_employee_id` int DEFAULT NULL,
  `client_id` int DEFAULT NULL,
  `employeeCode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `departmentId` int DEFAULT NULL,
  `designationId` int DEFAULT NULL,
  `statusId` int DEFAULT NULL,
  `joiningDate` date DEFAULT NULL,
  `salary` int DEFAULT NULL,
  `isActive` tinyint DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Bug 2: invoices.employee_id missing in production ----------
-- MySQL 8 has no "ADD COLUMN IF NOT EXISTS", so guard via a procedure.
DROP PROCEDURE IF EXISTS add_invoices_employee_id;
DELIMITER $$
CREATE PROCEDURE add_invoices_employee_id()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'invoices'
      AND COLUMN_NAME = 'employee_id'
  ) THEN
    ALTER TABLE `invoices` ADD COLUMN `employee_id` int NULL DEFAULT NULL;
  END IF;
END$$
DELIMITER ;
CALL add_invoices_employee_id();
DROP PROCEDURE IF EXISTS add_invoices_employee_id;
