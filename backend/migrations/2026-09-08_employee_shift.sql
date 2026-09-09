-- Shift assignment: each employee can be pinned to a shift_timings row; attendance rows
-- remember which shift judged them so later edits to a shift do not rewrite history.
DROP PROCEDURE IF EXISTS hrms_add_col;
CREATE PROCEDURE hrms_add_col(IN tbl VARCHAR(64), IN col VARCHAR(64), IN ddl VARCHAR(255))
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', ddl);
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END;

CALL hrms_add_col('employees',              'shift_id', 'INT NULL');
CALL hrms_add_col('super_admin_attendance', 'shift_id', 'INT NULL');

DROP PROCEDURE IF EXISTS hrms_add_col;
