-- TASK-15: editable offer-letter templates with placeholder body.
DROP PROCEDURE IF EXISTS hrms_add_col;
CREATE PROCEDURE hrms_add_col(IN tbl VARCHAR(64), IN col VARCHAR(64), IN ddl VARCHAR(255))
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', ddl);
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END;

CALL hrms_add_col('offer_letter_templates', 'body',        'TEXT NULL');
CALL hrms_add_col('offer_letter_templates', 'include_ctc', 'TINYINT(1) NOT NULL DEFAULT 1');
CALL hrms_add_col('offer_letter_templates', 'updated_at',  'DATETIME NULL ON UPDATE CURRENT_TIMESTAMP');
CALL hrms_add_col('offer_letters',          'template_id', 'INT NULL');

DROP PROCEDURE IF EXISTS hrms_add_col;
