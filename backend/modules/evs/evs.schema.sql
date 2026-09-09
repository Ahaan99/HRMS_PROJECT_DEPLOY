-- =====================================================================
-- Employee Verification System (EVS) - tables inside hrms_db
-- Run once against hrms_db:   mysql -u root -p hrms_db < evs.schema.sql
-- All tables are prefixed evs_ so they never collide with HRMS tables.
-- =====================================================================

CREATE TABLE IF NOT EXISTS evs_employees (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(100) NOT NULL UNIQUE,
  phone       VARCHAR(20)  DEFAULT '',
  department  VARCHAR(100) DEFAULT '',
  designation VARCHAR(100) DEFAULT '',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evs_documents (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  employee_id   INT NOT NULL,
  document_name VARCHAR(100) NOT NULL,
  file_path     VARCHAR(255) NOT NULL,
  status        VARCHAR(50) DEFAULT 'Pending',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_evs_doc_emp (employee_id),
  CONSTRAINT fk_evs_doc_emp FOREIGN KEY (employee_id)
    REFERENCES evs_employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evs_verification_tokens (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT NOT NULL,
  token       VARCHAR(255) NOT NULL UNIQUE,
  expires_at  DATETIME NOT NULL,
  used        TINYINT(1) DEFAULT 0,
  INDEX idx_evs_tok_doc (document_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evs_audit_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT DEFAULT 0,
  action      VARCHAR(100) NOT NULL,
  actor       VARCHAR(120) DEFAULT NULL,
  timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evs_identity_verifications (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  employee_id    INT NOT NULL UNIQUE,
  aadhaar_masked VARCHAR(20)  DEFAULT NULL,
  pan_masked     VARCHAR(20)  DEFAULT NULL,
  aadhaar_status VARCHAR(30)  DEFAULT 'Not Submitted',
  pan_status     VARCHAR(30)  DEFAULT 'Not Submitted',
  remarks        VARCHAR(255) DEFAULT NULL,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_evs_id_emp FOREIGN KEY (employee_id)
    REFERENCES evs_employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evs_international_verifications (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  employee_id  INT NOT NULL,
  country_code VARCHAR(5)   NOT NULL,
  country_name VARCHAR(80)  NOT NULL,
  doc_type     VARCHAR(40)  NOT NULL,
  doc_label    VARCHAR(120) NOT NULL,
  doc_masked   VARCHAR(40)  DEFAULT NULL,
  status       VARCHAR(30)  DEFAULT 'Pending Approval',
  remarks      VARCHAR(255) DEFAULT NULL,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_evs_intl (employee_id, country_code, doc_type),
  CONSTRAINT fk_evs_intl_emp FOREIGN KEY (employee_id)
    REFERENCES evs_employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evs_background_verifications (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  employee_id      INT NOT NULL,
  previous_company VARCHAR(150) DEFAULT '',
  hr_email         VARCHAR(120) DEFAULT '',
  feedback         TEXT,
  rehire_eligible  TINYINT(1) DEFAULT 0,
  criminal_record  TINYINT(1) DEFAULT 0,
  status           VARCHAR(30) DEFAULT 'Pending',
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_evs_bg_emp (employee_id),
  CONSTRAINT fk_evs_bg_emp FOREIGN KEY (employee_id)
    REFERENCES evs_employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evs_employment_history (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  employee_id      INT NOT NULL,
  company_name     VARCHAR(150) NOT NULL,
  designation      VARCHAR(120) DEFAULT '',
  start_date       VARCHAR(10)  NOT NULL,
  end_date         VARCHAR(10)  NOT NULL,
  hr_contact_email VARCHAR(120) DEFAULT '',
  status           VARCHAR(30)  DEFAULT 'Pending',
  remarks          VARCHAR(255) DEFAULT NULL,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_evs_hist_emp (employee_id),
  CONSTRAINT fk_evs_hist_emp FOREIGN KEY (employee_id)
    REFERENCES evs_employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- ONE-TIME DATA MIGRATION from the old standalone database
-- (employee_verification). Safe to re-run: uses INSERT IGNORE.
-- Skip this block if the old DB does not exist on this server.
-- =====================================================================
INSERT IGNORE INTO evs_employees (id, name, email, phone, department, designation)
  SELECT id, name, email, phone, department, designation
  FROM employee_verification.employees;

INSERT IGNORE INTO evs_documents (id, employee_id, document_name, file_path, status)
  SELECT id, employee_id, document_name,
         REPLACE(file_path, 'uploads/', 'uploads/evs/'), status
  FROM employee_verification.documents;

INSERT IGNORE INTO evs_verification_tokens (id, document_id, token, expires_at, used)
  SELECT id, document_id, token, expires_at, used
  FROM employee_verification.verification_tokens;

INSERT IGNORE INTO evs_audit_logs (id, document_id, action, timestamp)
  SELECT id, document_id, action, created_at
  FROM employee_verification.audit_logs;

INSERT IGNORE INTO evs_identity_verifications
  (id, employee_id, aadhaar_masked, pan_masked, aadhaar_status, pan_status, remarks, updated_at)
  SELECT id, employee_id, aadhaar_masked, pan_masked, aadhaar_status, pan_status, remarks, updated_at
  FROM employee_verification.identity_verifications;

INSERT IGNORE INTO evs_international_verifications
  (id, employee_id, country_code, country_name, doc_type, doc_label, doc_masked, status, remarks, updated_at)
  SELECT id, employee_id, country_code, country_name, doc_type, doc_label, doc_masked, status, remarks, updated_at
  FROM employee_verification.international_verifications;

INSERT IGNORE INTO evs_background_verifications
  (id, employee_id, previous_company, hr_email, feedback, rehire_eligible, criminal_record, status)
  SELECT id, employee_id, previous_company, hr_email, feedback, rehire_eligible, criminal_record, status
  FROM employee_verification.background_verifications;

INSERT IGNORE INTO evs_employment_history
  (id, employee_id, company_name, designation, start_date, end_date, hr_contact_email, status, remarks)
  SELECT id, employee_id, company_name, designation, start_date, end_date, hr_contact_email, status, remarks
  FROM employee_verification.employment_history;
