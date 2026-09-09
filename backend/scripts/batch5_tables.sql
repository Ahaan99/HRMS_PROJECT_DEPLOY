-- ============ Batch 5 tables ============

-- Benefits
CREATE TABLE IF NOT EXISTS employee_benefits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  employee_name VARCHAR(150) NOT NULL,
  benefit_type ENUM('Insurance','Reimbursement','Bonus','Incentive','Other') NOT NULL,
  title VARCHAR(200) NOT NULL,
  provider VARCHAR(150) NULL,
  policy_number VARCHAR(100) NULL,
  amount DECIMAL(12,2) DEFAULT 0,
  start_date DATE NULL,
  end_date DATE NULL,
  status ENUM('Active','Pending','Approved','Rejected','Expired','Paid') DEFAULT 'Active',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Upskilling
CREATE TABLE IF NOT EXISTS trainings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  category VARCHAR(100) NULL,
  trainer VARCHAR(150) NULL,
  mode ENUM('Online','Offline','Hybrid') DEFAULT 'Online',
  start_date DATE NULL,
  end_date DATE NULL,
  status ENUM('Planned','Ongoing','Completed','Cancelled') DEFAULT 'Planned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  training_id INT NOT NULL,
  employee_id INT NOT NULL,
  employee_name VARCHAR(150) NOT NULL,
  status ENUM('Assigned','In Progress','Completed') DEFAULT 'Assigned',
  completion_date DATE NULL,
  score VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (training_id) REFERENCES trainings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS certifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  employee_name VARCHAR(150) NOT NULL,
  name VARCHAR(200) NOT NULL,
  issuer VARCHAR(150) NULL,
  issue_date DATE NULL,
  expiry_date DATE NULL,
  credential_id VARCHAR(150) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  employee_name VARCHAR(150) NOT NULL,
  skill VARCHAR(150) NOT NULL,
  level ENUM('Beginner','Intermediate','Advanced','Expert') DEFAULT 'Beginner',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance & Audit
CREATE TABLE IF NOT EXISTS compliance_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  category ENUM('PF','ESIC','TDS','GST','PT','Labour','Other') DEFAULT 'Other',
  frequency ENUM('Monthly','Quarterly','Yearly','One-time') DEFAULT 'Monthly',
  due_date DATE NOT NULL,
  status ENUM('Pending','Completed','Overdue') DEFAULT 'Pending',
  completed_at DATETIME NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_name VARCHAR(150) NOT NULL,
  action VARCHAR(100) NOT NULL,
  module VARCHAR(100) NOT NULL,
  details TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  month VARCHAR(7) NOT NULL,
  employee_id INT NOT NULL,
  employee_name VARCHAR(150) NOT NULL,
  base_salary DECIMAL(12,2) DEFAULT 0,
  working_days INT DEFAULT 0,
  present_days DECIMAL(5,1) DEFAULT 0,
  paid_leave_days DECIMAL(5,1) DEFAULT 0,
  unpaid_leave_days DECIMAL(5,1) DEFAULT 0,
  ot_hours DECIMAL(6,1) DEFAULT 0,
  ot_amount DECIMAL(12,2) DEFAULT 0,
  deductions DECIMAL(12,2) DEFAULT 0,
  net_salary DECIMAL(12,2) DEFAULT 0,
  status ENUM('Draft','Approved','Paid') DEFAULT 'Draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_month_emp (month, employee_id)
);

-- Verification portal
CREATE TABLE IF NOT EXISTS verification_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  employee_name VARCHAR(150) NOT NULL,
  doc_type VARCHAR(100) NOT NULL,
  file_path VARCHAR(500) NULL,
  status ENUM('Pending','Verified','Rejected') DEFAULT 'Pending',
  remarks TEXT NULL,
  verified_by VARCHAR(150) NULL,
  verified_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client onboarding
CREATE TABLE IF NOT EXISTS client_onboardings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(150) NULL,
  email VARCHAR(150) NULL,
  phone VARCHAR(30) NULL,
  service VARCHAR(200) NULL,
  stage ENUM('Proposal Sent','Details Submitted','Agreement Generated','Agreement Signed','Onboarded') DEFAULT 'Proposal Sent',
  proposal_notes TEXT NULL,
  requirements TEXT NULL,
  agreement_terms TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2FA columns on super_admins
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'super_admins' AND column_name = 'two_factor_enabled') = 0,
  'ALTER TABLE super_admins ADD COLUMN two_factor_enabled TINYINT(1) DEFAULT 0, ADD COLUMN otp_code VARCHAR(10) NULL, ADD COLUMN otp_expires_at DATETIME NULL',
  'SELECT 1'));
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
