-- ============================================================
-- DEMO DATA for Data Analytics dashboards
-- All rows are tagged so they can be removed later:
--   employees: employeeCode LIKE 'DEMO%'
--   candidates: candidateId LIKE 'DEMO%'
--   attendance/leaves/exits: linked to demo employees
--   revenues/expenses: description = 'DEMO'
-- ============================================================

-- ---------- Employees (8) ----------
INSERT INTO employees (employeeCode, name, email, phone, departmentId, designationId, statusId, joiningDate, salary, isActive)
VALUES
('DEMO001','Aarav Sharma','aarav@demo.hrms','9000000001',3,6,1,DATE_SUB(CURDATE(), INTERVAL 26 MONTH),65000,1),
('DEMO002','Priya Patel','priya@demo.hrms','9000000002',3,5,1,DATE_SUB(CURDATE(), INTERVAL 14 MONTH),58000,1),
('DEMO003','Rohan Verma','rohan@demo.hrms','9000000003',2,3,1,DATE_SUB(CURDATE(), INTERVAL 9 MONTH),40000,1),
('DEMO004','Sneha Iyer','sneha@demo.hrms','9000000004',2,4,1,DATE_SUB(CURDATE(), INTERVAL 40 MONTH),75000,1),
('DEMO005','Vikram Singh','vikram@demo.hrms','9000000005',4,7,1,DATE_SUB(CURDATE(), INTERVAL 5 MONTH),35000,1),
('DEMO006','Ananya Das','ananya@demo.hrms','9000000006',4,8,1,DATE_SUB(CURDATE(), INTERVAL 3 MONTH),38000,1),
('DEMO007','Karan Mehta','karan@demo.hrms','9000000007',1,2,1,DATE_SUB(CURDATE(), INTERVAL 18 MONTH),45000,1),
('DEMO008','Divya Nair','divya@demo.hrms','9000000008',3,6,2,DATE_SUB(CURDATE(), INTERVAL 22 MONTH),70000,1);

-- ---------- Candidates (14, across funnel and months) ----------
INSERT INTO candidates (candidateId, name, email, phone, jobTitle, statusId, isActive, createdAt)
VALUES
('DEMO-C01','Rahul Gupta','c01@demo.hrms','9100000001','Backend Developer',1,1,DATE_SUB(NOW(), INTERVAL 1 MONTH)),
('DEMO-C02','Meera Joshi','c02@demo.hrms','9100000002','Backend Developer',2,1,DATE_SUB(NOW(), INTERVAL 2 MONTH)),
('DEMO-C03','Arjun Rao','c03@demo.hrms','9100000003','Backend Developer',4,1,DATE_SUB(NOW(), INTERVAL 3 MONTH)),
('DEMO-C04','Kavya Menon','c04@demo.hrms','9100000004','Frontend Developer',3,1,DATE_SUB(NOW(), INTERVAL 1 MONTH)),
('DEMO-C05','Siddharth Roy','c05@demo.hrms','9100000005','Frontend Developer',5,1,DATE_SUB(NOW(), INTERVAL 4 MONTH)),
('DEMO-C06','Pooja Reddy','c06@demo.hrms','9100000006','Frontend Developer',4,1,DATE_SUB(NOW(), INTERVAL 5 MONTH)),
('DEMO-C07','Aditya Kulkarni','c07@demo.hrms','9100000007','Sales Executive',1,1,DATE_SUB(NOW(), INTERVAL 10 DAY)),
('DEMO-C08','Nisha Agarwal','c08@demo.hrms','9100000008','Sales Executive',2,1,DATE_SUB(NOW(), INTERVAL 2 MONTH)),
('DEMO-C09','Manish Tiwari','c09@demo.hrms','9100000009','Sales Executive',5,1,DATE_SUB(NOW(), INTERVAL 6 MONTH)),
('DEMO-C10','Ritika Bose','c10@demo.hrms','9100000010','SEO Executive',3,1,DATE_SUB(NOW(), INTERVAL 20 DAY)),
('DEMO-C11','Harsh Vardhan','c11@demo.hrms','9100000011','SEO Executive',1,1,DATE_SUB(NOW(), INTERVAL 7 MONTH)),
('DEMO-C12','Tanvi Shah','c12@demo.hrms','9100000012','HR Recruiter',4,1,DATE_SUB(NOW(), INTERVAL 8 MONTH)),
('DEMO-C13','Deepak Kumar','c13@demo.hrms','9100000013','HR Recruiter',2,1,DATE_SUB(NOW(), INTERVAL 15 DAY)),
('DEMO-C14','Ishita Malhotra','c14@demo.hrms','9100000014','Social Media Manager',1,1,DATE_SUB(NOW(), INTERVAL 3 MONTH));

-- ---------- Attendance: last 30 days for each demo employee ----------
INSERT INTO super_admin_attendance (employee_id, employee_name, date, check_in, check_out, status, is_active)
SELECT
  e.id,
  e.name,
  d.day,
  CASE WHEN (e.id + n) % 11 = 3 THEN NULL
       WHEN (e.id + n) % 7 = 2 THEN '10:05:00'
       ELSE '09:30:00' END,
  CASE WHEN (e.id + n) % 11 = 3 THEN NULL
       WHEN (e.id + n) % 9 = 4 THEN '14:00:00'
       ELSE '18:30:00' END,
  CASE WHEN (e.id + n) % 11 = 3 THEN 'ABSENT'
       WHEN (e.id + n) % 7 = 2 THEN 'LATE'
       WHEN (e.id + n) % 9 = 4 THEN 'HALF_DAY'
       WHEN (e.id + n) % 13 = 5 THEN 'WFH'
       WHEN (e.id + n) % 17 = 6 THEN 'LEAVE'
       ELSE 'PRESENT' END,
  1
FROM employees e
JOIN (
  WITH RECURSIVE nums AS (
    SELECT 0 AS n UNION ALL SELECT n + 1 FROM nums WHERE n < 29
  )
  SELECT n, DATE_SUB(CURDATE(), INTERVAL n DAY) AS day FROM nums
) d
WHERE e.employeeCode LIKE 'DEMO%'
  AND DAYOFWEEK(d.day) NOT IN (1, 7);

-- ---------- Leave applications ----------
INSERT INTO leave_applications (employee_id, leave_type_id, from_date, to_date, days, reason, status, approved_by)
SELECT e.id, t.lt, t.fd, t.td, t.dy, 'DEMO leave', t.st, 'HR Admin'
FROM employees e
JOIN (
  SELECT 'DEMO001' code, 1 lt, DATE_SUB(CURDATE(), INTERVAL 2 MONTH) fd, DATE_SUB(CURDATE(), INTERVAL 2 MONTH) td, 1.0 dy, 'Approved' st UNION ALL
  SELECT 'DEMO002', 2, DATE_SUB(CURDATE(), INTERVAL 40 DAY), DATE_SUB(CURDATE(), INTERVAL 38 DAY), 3.0, 'Approved' UNION ALL
  SELECT 'DEMO003', 3, DATE_SUB(CURDATE(), INTERVAL 5 MONTH), DATE_SUB(CURDATE(), INTERVAL 5 MONTH) + INTERVAL 4 DAY, 5.0, 'Approved' UNION ALL
  SELECT 'DEMO004', 1, DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_SUB(CURDATE(), INTERVAL 19 DAY), 2.0, 'Approved' UNION ALL
  SELECT 'DEMO005', 2, DATE_SUB(CURDATE(), INTERVAL 8 MONTH), DATE_SUB(CURDATE(), INTERVAL 8 MONTH), 1.0, 'Approved' UNION ALL
  SELECT 'DEMO006', 5, DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_SUB(CURDATE(), INTERVAL 9 DAY), 2.0, 'Pending' UNION ALL
  SELECT 'DEMO007', 4, DATE_SUB(CURDATE(), INTERVAL 3 MONTH), DATE_SUB(CURDATE(), INTERVAL 3 MONTH), 1.0, 'Approved' UNION ALL
  SELECT 'DEMO008', 1, DATE_SUB(CURDATE(), INTERVAL 6 DAY), DATE_SUB(CURDATE(), INTERVAL 6 DAY), 1.0, 'Rejected'
) t ON t.code = e.employeeCode;

-- ---------- Exit requests (attrition) ----------
INSERT INTO exit_requests (employee_id, employee_name, resignation_date, notice_period_days, exit_date, exit_type, reason, status)
SELECT e.id, e.name, t.rd, 30, t.xd, t.ty, 'DEMO', 'approved'
FROM employees e
JOIN (
  SELECT 'DEMO008' code, DATE_SUB(CURDATE(), INTERVAL 2 MONTH) rd, DATE_SUB(CURDATE(), INTERVAL 1 MONTH) xd, 'voluntary' ty UNION ALL
  SELECT 'DEMO005', DATE_SUB(CURDATE(), INTERVAL 7 MONTH), DATE_SUB(CURDATE(), INTERVAL 6 MONTH), 'voluntary' UNION ALL
  SELECT 'DEMO006', DATE_SUB(CURDATE(), INTERVAL 10 MONTH), DATE_SUB(CURDATE(), INTERVAL 9 MONTH), 'involuntary'
) t ON t.code = e.employeeCode;

-- ---------- Revenue / Expense (12 months) ----------
INSERT INTO revenues (source, amount, revenue_date, description)
WITH RECURSIVE m AS (SELECT 0 AS n UNION ALL SELECT n + 1 FROM m WHERE n < 11)
SELECT 'demo', 250000 + (n * 13000) % 90000, DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL n MONTH), 'DEMO'
FROM m;

INSERT INTO expenses (source, amount, expense_date, description)
WITH RECURSIVE m AS (SELECT 0 AS n UNION ALL SELECT n + 1 FROM m WHERE n < 11)
SELECT 'demo', 160000 + (n * 9000) % 60000, DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL n MONTH) + INTERVAL 5 DAY, 'DEMO'
FROM m;
