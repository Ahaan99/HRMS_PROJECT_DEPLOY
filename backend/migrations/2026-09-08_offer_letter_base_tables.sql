-- Base tables for the offer-letter module. Older servers created these by hand;
-- fresh servers had nothing, so 2026-09-08_offer_letter_templates.sql failed every boot.
CREATE TABLE IF NOT EXISTS offer_letter_templates (
  id INT NOT NULL AUTO_INCREMENT,
  template_name VARCHAR(150) NOT NULL,
  company_name VARCHAR(200) NULL,
  hr_name VARCHAR(150) NULL,
  location VARCHAR(200) NULL,
  terms TEXT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS offer_letters (
  id INT NOT NULL AUTO_INCREMENT,
  candidate_name VARCHAR(150) NOT NULL,
  candidate_email VARCHAR(150) NULL,
  position VARCHAR(150) NOT NULL,
  department VARCHAR(150) NULL,
  salary DECIMAL(12,2) DEFAULT 0.00,
  joining_date DATE NULL,
  company_name VARCHAR(200) NULL,
  hr_name VARCHAR(150) NULL,
  location VARCHAR(200) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
