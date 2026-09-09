-- Links Sales-portal invoices to a client so the Client portal can list them.
-- Idempotent on MySQL 8: re-running is safe.
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invoices' AND COLUMN_NAME = 'client_id'
);
SET @ddl := IF(@col_exists = 0,
  'ALTER TABLE invoices ADD COLUMN client_id INT NULL AFTER employee_id, ADD INDEX idx_invoices_client (client_id)',
  'SELECT "invoices.client_id already exists"');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
