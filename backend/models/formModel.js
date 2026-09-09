import { db } from "../config/db.js";

// Create forms table if not exists
export const initFormsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS forms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_type ENUM('client', 'candidate') NOT NULL,
      full_name VARCHAR(255),
      company_name VARCHAR(255),
      hr_name VARCHAR(255),
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      job_role VARCHAR(255),
      openings VARCHAR(50),
      salary VARCHAR(100),
      experience VARCHAR(100),
      location VARCHAR(255),
      employment_type VARCHAR(100),
      skills_required TEXT,
      joining_timeline VARCHAR(100),
      job_description TEXT,
      city VARCHAR(100),
      qualification VARCHAR(255),
      skills TEXT,
      expected_salary VARCHAR(100),
      preferred_location VARCHAR(255),
      current_company VARCHAR(255),
      resume_path VARCHAR(500),
      status ENUM('PENDING', 'REVIEWED', 'REJECTED') DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
};

// Add client form
export const addClientForm = async (data) => {
  const {
    companyName,
    hrName,
    email,
    phone,
    jobRole,
    openings,
    salary,
    experience,
    location,
    employmentType,
    skillsRequired,
    joiningTimeline,
    jobDescription,
  } = data;

  const [result] = await db.query(
    `INSERT INTO forms (
      form_type, company_name, hr_name, email, phone, job_role, 
      openings, salary, experience, location, employment_type, 
      skills_required, joining_timeline, job_description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'client',
      companyName,
      hrName,
      email,
      phone,
      jobRole,
      openings,
      salary,
      experience,
      location,
      employmentType,
      skillsRequired,
      joiningTimeline,
      jobDescription,
    ]
  );

  return result;
};

// Add candidate form
export const addCandidateForm = async (data) => {
  const {
    fullName,
    email,
    phone,
    city,
    qualification,
    experience,
    skills,
    expectedSalary,
    preferredLocation,
    currentCompany,
    jobProfile,
    languageName,
    noticePeriod,
    currentCtc,
    resumePath,
  } = data;

  const [result] = await db.query(
    `INSERT INTO forms (
      form_type, full_name, email, phone, city, qualification, 
      experience, skills, expected_salary, preferred_location, 
      current_company, job_profile, language_name, notice_period, 
      current_ctc, resume_path
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'candidate',
      fullName,
      email,
      phone,
      city,
      qualification,
      experience,
      skills,
      expectedSalary,
      preferredLocation,
      currentCompany,
      jobProfile,
      languageName,
      noticePeriod,
      currentCtc,
      resumePath,
    ]
  );

  // Mirror the submission into the recruiting pipeline so HR search,
  // analytics and the Super Admin candidate list see it (they read `candidates`).
  try {
    await syncCandidateToPipeline({
      fullName,
      email,
      phone,
      jobProfile,
      skills,
      experience,
      city,
      expectedSalary,
      noticePeriod,
    });
  } catch (syncErr) {
    console.error("candidate pipeline sync failed:", syncErr.message);
  }

  return result;
};

const syncCandidateToPipeline = async (c) => {
  if (!c.email) return;
  const [dup] = await db.query(
    "SELECT id FROM candidates WHERE email = ? LIMIT 1",
    [c.email]
  );
  if (dup.length) return;

  const noteParts = [
    c.skills && `Skills: ${c.skills}`,
    c.experience && `Experience: ${c.experience}`,
    c.city && `City: ${c.city}`,
    c.expectedSalary && `Expected: ${c.expectedSalary}`,
    c.noticePeriod && `Notice: ${c.noticePeriod}`,
  ].filter(Boolean);

  await db.query(
    `INSERT INTO candidates (candidateId, name, email, phone, jobTitle, statusId, note, isActive)
     VALUES (?, ?, ?, ?, ?, 1, ?, 1)`,
    [
      `CAN${Date.now().toString().slice(-6)}`,
      c.fullName,
      c.email,
      c.phone || null,
      c.jobProfile || "Applicant",
      noteParts.join(" | ") || null,
    ]
  );
};

// Get all forms
export const getAllForms = async (type = null, limit = 50, offset = 0) => {
  let query = "SELECT * FROM forms";
  const params = [];

  if (type) {
    query += " WHERE form_type = ?";
    params.push(type);
  }

  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(Math.max(1, parseInt(limit) || 50), Math.max(0, parseInt(offset) || 0));

  const [rows] = await db.query(query, params);

  return rows;
};

// Get form count
export const getFormCount = async (type = null) => {
  let query = 'SELECT COUNT(*) as count FROM forms';
  const params = [];

  if (type) {
    query += ' WHERE form_type = ?';
    params.push(type);
  }

  const [rows] = await db.query(query, params);
  return rows[0].count;
};

// Get form by ID
export const getFormById = async (id) => {
  const [rows] = await db.query('SELECT * FROM forms WHERE id = ?', [id]);
  return rows[0];
};

// Update form status
export const updateFormStatus = async (id, status) => {
  const [result] = await db.query(
    'UPDATE forms SET status = ? WHERE id = ?',
    [status, id]
  );
  return result;
};

// Delete form
export const deleteForm = async (id) => {
  const [result] = await db.query('DELETE FROM forms WHERE id = ?', [id]);
  return result;
};
