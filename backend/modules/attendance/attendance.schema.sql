-- =====================================================================
-- Smart Attendance - tables inside hrms_db (replaces the Flask :5050 app)
-- Run once:  node scripts/run-attendance-migrate.mjs
-- Every table is prefixed attendance_ so nothing collides with HRMS.
-- Face data: the old Python service stored dlib 128-d encodings which are
-- NOT compatible with the browser face-api.js descriptors used now, so
-- employees keep their record but must re-register their face once.
-- =====================================================================

CREATE TABLE IF NOT EXISTS attendance_users (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(120) NULL,
  mobile    VARCHAR(20)  NULL UNIQUE,
  password  VARCHAR(100) NULL,
  role      VARCHAR(20)  NULL,
  emp_id    VARCHAR(50)  NULL,
  created   VARCHAR(20)  NULL,
  INDEX idx_att_users_role (role),
  INDEX idx_att_users_emp (emp_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_employees (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  emp_id        VARCHAR(50)  NULL UNIQUE,
  name          VARCHAR(120) NULL,
  encoding      LONGTEXT     NULL,          -- JSON: array of 128-d face-api descriptors
  face_engine   VARCHAR(20)  DEFAULT NULL,  -- 'face-api' | NULL (needs re-register)
  registered_at VARCHAR(20)  NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_records (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  emp_id            VARCHAR(50)  NULL,
  name              VARCHAR(120) NULL,
  date              VARCHAR(10)  NULL,
  time              VARCHAR(8)   NULL,
  status            VARCHAR(20)  NULL,
  method            VARCHAR(20)  NULL,
  ip                VARCHAR(45)  NULL,
  approval          VARCHAR(20)  NULL,
  check_out         VARCHAR(8)   NULL,
  hours             DOUBLE       NULL,
  overtime          DOUBLE       NULL,
  lat               DOUBLE       NULL,
  lng               DOUBLE       NULL,
  hrms_sync         VARCHAR(20)  NULL,
  hrms_sync_error   VARCHAR(200) NULL,
  hrms_sync_at      VARCHAR(20)  NULL,
  corrected         TINYINT(1)   NULL,
  corrected_by      VARCHAR(120) NULL,
  corrected_at      VARCHAR(20)  NULL,
  correction_reason TEXT         NULL,
  original          LONGTEXT     NULL,
  approved_by       VARCHAR(120) NULL,
  approved_at       VARCHAR(20)  NULL,
  INDEX idx_att_rec_emp_date (emp_id, date),
  INDEX idx_att_rec_date (date),
  INDEX idx_att_rec_approval (approval),
  INDEX idx_att_rec_sync (hrms_sync)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance_corrections (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  emp_id       VARCHAR(50)  NULL,
  name         VARCHAR(120) NULL,
  date         VARCHAR(10)  NULL,
  check_in     VARCHAR(5)   NULL,
  check_out    VARCHAR(5)   NULL,
  reason       TEXT         NULL,
  state        VARCHAR(20)  NULL,
  requested_at VARCHAR(20)  NULL,
  decided_by   VARCHAR(120) NULL,
  decided_at   VARCHAR(20)  NULL,
  INDEX idx_att_cor_emp (emp_id),
  INDEX idx_att_cor_state (state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- key/value: office, shift, hrms, otp_<emp_id>
CREATE TABLE IF NOT EXISTS attendance_settings (
  skey VARCHAR(80) PRIMARY KEY,
  data LONGTEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
