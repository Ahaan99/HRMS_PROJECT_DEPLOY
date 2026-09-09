-- =====================================================================
-- HR Robo (AI Interview Portal) - tables inside hrms_db
-- Run once:  node scripts/run-hrrobo-migrate.mjs   (creates tables AND
-- imports integration_store.json / videos_index.json from the old HR_robo
-- Python folder if it is still present on this machine).
-- All tables are prefixed robo_ so they never collide with HRMS tables.
-- =====================================================================

-- One row per snapshot key pushed by the interview portal
-- (reports, proctor_logs, candidates, schedules, config)
CREATE TABLE IF NOT EXISTS robo_snapshots (
  snap_key   VARCHAR(40) PRIMARY KEY,
  data       JSON NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Interview recordings uploaded from the candidate browser
CREATE TABLE IF NOT EXISTS robo_videos (
  candidate_id   INT PRIMARY KEY,
  candidate_name VARCHAR(120) DEFAULT '',
  file           VARCHAR(120) NOT NULL,
  mime           VARCHAR(60)  DEFAULT 'video/webm',
  duration       INT DEFAULT 0,
  size           BIGINT DEFAULT 0,
  uploaded_at    DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Legacy standalone HR Robo admin accounts (login fallback only;
-- the portal now accepts HRMS Super Admin / HR credentials first)
CREATE TABLE IF NOT EXISTS robo_admin_users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  hashed_password VARCHAR(255) NOT NULL,
  role            VARCHAR(30) DEFAULT 'hr_viewer',
  is_active       TINYINT(1) DEFAULT 1,
  last_login      DATETIME DEFAULT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Server-side interview sessions (kept for reporting / future use)
CREATE TABLE IF NOT EXISTS robo_interview_sessions (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id     INT NOT NULL,
  candidate_name   VARCHAR(150) DEFAULT '',
  position_title   VARCHAR(200) DEFAULT '',
  status           VARCHAR(30) DEFAULT 'completed',
  overall_score    FLOAT DEFAULT 0,
  decision         VARCHAR(30) DEFAULT NULL,
  transcript       LONGTEXT,
  ai_summary       JSON,
  started_at       DATETIME DEFAULT NULL,
  ended_at         DATETIME DEFAULT NULL,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_robo_sess_cand (candidate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
