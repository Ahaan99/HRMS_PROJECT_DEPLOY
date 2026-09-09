-- Emergency alerts: the button used to write rows nobody could read. Add who/where
-- metadata and a resolution trail so Super Admin + HR can triage and close alerts.
DROP PROCEDURE IF EXISTS hrms_add_col;
CREATE PROCEDURE hrms_add_col(IN tbl VARCHAR(64), IN col VARCHAR(64), IN ddl VARCHAR(255))
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', ddl);
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END;

CALL hrms_add_col('emergency_logs', 'user_role',   'VARCHAR(30) NULL');
CALL hrms_add_col('emergency_logs', 'user_name',   'VARCHAR(150) NULL');
CALL hrms_add_col('emergency_logs', 'user_email',  'VARCHAR(150) NULL');
CALL hrms_add_col('emergency_logs', 'note',        'VARCHAR(500) NULL');
CALL hrms_add_col('emergency_logs', 'resolved_at', 'DATETIME NULL');
CALL hrms_add_col('emergency_logs', 'resolved_by', 'VARCHAR(150) NULL');
CALL hrms_add_col('emergency_logs', 'resolution_note', 'VARCHAR(500) NULL');

DROP PROCEDURE IF EXISTS hrms_add_col;
