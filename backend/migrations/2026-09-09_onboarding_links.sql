-- Links the Client Onboarding pipeline to the real records it must produce:
-- an agreement (Agreement Generated) and a client login (Onboarded).
-- Idempotent on MySQL 8: re-running is safe.

SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'client_onboardings' AND COLUMN_NAME = 'client_id');
SET @ddl := IF(@c = 0,
  'ALTER TABLE client_onboardings ADD COLUMN client_id INT NULL AFTER agreement_terms, ADD INDEX idx_onb_client (client_id)',
  'SELECT "client_onboardings.client_id exists"');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'client_onboardings' AND COLUMN_NAME = 'agreement_id');
SET @ddl := IF(@c = 0,
  'ALTER TABLE client_onboardings ADD COLUMN agreement_id INT NULL AFTER client_id',
  'SELECT "client_onboardings.agreement_id exists"');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'client_onboardings' AND COLUMN_NAME = 'onboarded_at');
SET @ddl := IF(@c = 0,
  'ALTER TABLE client_onboardings ADD COLUMN onboarded_at DATETIME NULL AFTER agreement_id',
  'SELECT "client_onboardings.onboarded_at exists"');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'client_agreements' AND COLUMN_NAME = 'onboarding_id');
SET @ddl := IF(@c = 0,
  'ALTER TABLE client_agreements ADD COLUMN onboarding_id INT NULL AFTER client_id, ADD INDEX idx_agr_onboarding (onboarding_id)',
  'SELECT "client_agreements.onboarding_id exists"');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;

-- 'draft' = generated but not yet signed (Onboarding stage "Agreement Generated").
SET @t := (SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'client_agreements' AND COLUMN_NAME = 'status');
SET @ddl := IF(@t NOT LIKE '%draft%',
  "ALTER TABLE client_agreements MODIFY COLUMN status ENUM('draft','active','expired','terminated') NULL DEFAULT 'active'",
  'SELECT "client_agreements.status already has draft"');
PREPARE s FROM @ddl; EXECUTE s; DEALLOCATE PREPARE s;
