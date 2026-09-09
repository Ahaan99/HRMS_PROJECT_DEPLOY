-- TASK-16: capture 12th, Graduation and Post-graduation alongside the existing 10th columns.
-- TASK-14: employee self-service profile fields.
-- Idempotent on MySQL 8.
DROP PROCEDURE IF EXISTS hrms_add_col;
CREATE PROCEDURE hrms_add_col(IN tbl VARCHAR(64), IN col VARCHAR(64), IN ddl VARCHAR(255))
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', ddl);
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END;

DROP PROCEDURE IF EXISTS hrms_drop_col;
CREATE PROCEDURE hrms_drop_col(IN tbl VARCHAR(64), IN col VARCHAR(64))
BEGIN
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` DROP COLUMN `', col, '`');
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END;

-- 12th keeps the 10th naming style (qualification10/board10/...); degrees use snake_case
-- with `university_*` since a board is not the issuing body there.
CALL hrms_add_col('joining_forms', 'qualification12', 'VARCHAR(120) NULL AFTER percent10');
CALL hrms_add_col('joining_forms', 'board12',         'VARCHAR(120) NULL AFTER qualification12');
CALL hrms_add_col('joining_forms', 'year12',          'VARCHAR(10)  NULL AFTER board12');
CALL hrms_add_col('joining_forms', 'percent12',       'VARCHAR(20)  NULL AFTER year12');

CALL hrms_add_col('joining_forms', 'qualification_grad', 'VARCHAR(120) NULL AFTER percent12');
CALL hrms_add_col('joining_forms', 'university_grad',    'VARCHAR(160) NULL AFTER qualification_grad');
CALL hrms_add_col('joining_forms', 'year_grad',          'VARCHAR(10)  NULL AFTER university_grad');
CALL hrms_add_col('joining_forms', 'percent_grad',       'VARCHAR(20)  NULL AFTER year_grad');

CALL hrms_add_col('joining_forms', 'qualification_pg', 'VARCHAR(120) NULL AFTER percent_grad');
CALL hrms_add_col('joining_forms', 'university_pg',    'VARCHAR(160) NULL AFTER qualification_pg');
CALL hrms_add_col('joining_forms', 'year_pg',          'VARCHAR(10)  NULL AFTER university_pg');
CALL hrms_add_col('joining_forms', 'percent_pg',       'VARCHAR(20)  NULL AFTER year_pg');

-- Remove the short-lived camelCase duplicates created by an earlier draft.
CALL hrms_drop_col('joining_forms', 'qualificationGrad');
CALL hrms_drop_col('joining_forms', 'boardGrad');
CALL hrms_drop_col('joining_forms', 'yearGrad');
CALL hrms_drop_col('joining_forms', 'percentGrad');
CALL hrms_drop_col('joining_forms', 'qualificationPG');
CALL hrms_drop_col('joining_forms', 'boardPG');
CALL hrms_drop_col('joining_forms', 'yearPG');
CALL hrms_drop_col('joining_forms', 'percentPG');

-- Employee self-service profile fields (TASK-14)
CALL hrms_add_col('employees', 'avatar',             'VARCHAR(255) NULL AFTER phone');
CALL hrms_add_col('employees', 'address',            'VARCHAR(500) NULL AFTER avatar');
CALL hrms_add_col('employees', 'emergency_name',     'VARCHAR(120) NULL AFTER address');
CALL hrms_add_col('employees', 'emergency_relation', 'VARCHAR(60)  NULL AFTER emergency_name');
CALL hrms_add_col('employees', 'emergency_mobile',   'VARCHAR(20)  NULL AFTER emergency_relation');

DROP PROCEDURE IF EXISTS hrms_add_col;
DROP PROCEDURE IF EXISTS hrms_drop_col;
