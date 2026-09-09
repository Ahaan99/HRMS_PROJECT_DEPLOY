import { db } from "../../config/db.js";

/* ------------------------------------------------------------------ */
/* Table bootstrap                                                      */
/* ------------------------------------------------------------------ */
const ensureTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS job_board_posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      department VARCHAR(100) NULL,
      location VARCHAR(120) NULL,
      job_type ENUM('Full-time','Part-time','Contract','Internship') DEFAULT 'Full-time',
      salary_range VARCHAR(80) NULL,
      description TEXT NULL,
      keywords VARCHAR(500) NULL,
      status ENUM('OPEN','CLOSED') DEFAULT 'OPEN',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS job_applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      job_post_id INT NOT NULL,
      applicant_name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NULL,
      phone VARCHAR(40) NULL,
      resume_text MEDIUMTEXT NULL,
      parsed_skills VARCHAR(600) NULL,
      parsed_experience VARCHAR(120) NULL,
      parsed_education VARCHAR(300) NULL,
      ats_score INT DEFAULT 0,
      status ENUM('NEW','SHORTLISTED','REJECTED','CONVERTED') DEFAULT 'NEW',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_post (job_post_id)
    )
  `);
};
ensureTables().catch((e) => console.error("jobBoard init:", e.message));

/* ------------------------------------------------------------------ */
/* Resume parsing + ATS scoring                                         */
/* ------------------------------------------------------------------ */
const SKILL_BANK = [
  "javascript","typescript","react","node","express","mysql","mongodb","python",
  "java","php","laravel","angular","vue","next.js","html","css","tailwind",
  "aws","azure","docker","kubernetes","git","figma","photoshop","excel",
  "recruitment","sourcing","payroll","onboarding","sales","marketing","seo",
  "accounting","tally","communication","leadership","testing","selenium","api",
];

export const parseResume = (text = "") => {
  const t = text.toLowerCase();
  const emails = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || [];
  const phones = text.match(/(\+?\d[\d\s-]{8,14}\d)/g) || [];
  const skills = SKILL_BANK.filter((s) => t.includes(s));
  const expMatch =
    t.match(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\s*(?:of)?\s*experience/) ||
    t.match(/experience\s*[:-]?\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/);
  const eduKeywords = ["b.tech","btech","b.e","bsc","b.sc","bca","mca","mba","m.tech","bcom","b.com","phd","diploma","graduate","bachelor","master"];
  const education = eduKeywords.filter((e) => t.includes(e));
  return {
    email: emails[0] || null,
    phone: phones[0]?.replace(/\s+/g, " ").trim() || null,
    skills,
    experienceYears: expMatch ? parseFloat(expMatch[1]) : null,
    education: [...new Set(education)],
  };
};

export const atsScore = (parsed, keywords = "") => {
  const kw = keywords
    .split(/[,;]+/)
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
  let score = 0;
  /* skills matched against job keywords: up to 60 */
  if (kw.length) {
    const matched = kw.filter(
      (k) =>
        parsed.skills.includes(k) ||
        (parsed._raw || "").includes(k),
    );
    score += Math.round((matched.length / kw.length) * 60);
  } else {
    score += Math.min(parsed.skills.length * 6, 40);
  }
  /* experience: up to 25 */
  if (parsed.experienceYears != null)
    score += Math.min(Math.round(parsed.experienceYears * 5), 25);
  /* education: up to 10, contact info: 5 */
  if (parsed.education.length) score += 10;
  if (parsed.email || parsed.phone) score += 5;
  return Math.min(score, 100);
};

/* ------------------------------------------------------------------ */
/* PUBLIC endpoints (no auth) — the job board                           */
/* ------------------------------------------------------------------ */

/* GET /public/jobs */
export const publicJobs = async (_req, res) => {
  const [rows] = await db.query(
    `SELECT id, title, department, location, job_type, salary_range, description, created_at
     FROM job_board_posts WHERE status = 'OPEN' ORDER BY id DESC`,
  );
  res.json({ success: true, data: rows });
};

/* POST /public/apply { job_post_id, name, email, phone, resume_text } */
export const publicApply = async (req, res) => {
  try {
    const { job_post_id, name, email, phone, resume_text } = req.body;
    if (!job_post_id || !name?.trim())
      return res
        .status(400)
        .json({ success: false, message: "job_post_id and name are required" });

    const [[post]] = await db.query(
      "SELECT * FROM job_board_posts WHERE id = ? AND status = 'OPEN'",
      [job_post_id],
    );
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Job not found or closed" });

    const parsed = parseResume(resume_text || "");
    parsed._raw = (resume_text || "").toLowerCase();
    const score = atsScore(parsed, post.keywords || "");

    const [r] = await db.query(
      `INSERT INTO job_applications
        (job_post_id, applicant_name, email, phone, resume_text,
         parsed_skills, parsed_experience, parsed_education, ats_score)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        job_post_id,
        name.trim(),
        email || parsed.email,
        phone || parsed.phone,
        resume_text || null,
        parsed.skills.join(", ") || null,
        parsed.experienceYears != null ? `${parsed.experienceYears} years` : null,
        parsed.education.join(", ") || null,
        score,
      ],
    );
    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      id: r.insertId,
      ats_score: score,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ------------------------------------------------------------------ */
/* ADMIN endpoints                                                      */
/* ------------------------------------------------------------------ */

/* GET /posts */
export const listPosts = async (_req, res) => {
  const [rows] = await db.query(
    `SELECT p.*, (SELECT COUNT(*) FROM job_applications a WHERE a.job_post_id = p.id) AS applications
     FROM job_board_posts p ORDER BY p.id DESC`,
  );
  res.json({ success: true, data: rows });
};

/* POST /posts */
export const createPost = async (req, res) => {
  const { title, department, location, job_type, salary_range, description, keywords } =
    req.body;
  if (!title?.trim())
    return res.status(400).json({ success: false, message: "title is required" });
  const [r] = await db.query(
    `INSERT INTO job_board_posts (title, department, location, job_type, salary_range, description, keywords)
     VALUES (?,?,?,?,?,?,?)`,
    [title.trim(), department || null, location || null, job_type || "Full-time",
     salary_range || null, description || null, keywords || null],
  );
  res.status(201).json({ success: true, id: r.insertId, message: "Job posted" });
};

/* PATCH /posts/:id  { status } */
export const updatePost = async (req, res) => {
  const { status } = req.body;
  if (!["OPEN", "CLOSED"].includes(status))
    return res.status(400).json({ success: false, message: "Invalid status" });
  await db.query("UPDATE job_board_posts SET status = ? WHERE id = ?", [
    status,
    req.params.id,
  ]);
  res.json({ success: true, message: "Job " + status.toLowerCase() });
};

/* GET /applications?post_id= */
export const listApplications = async (req, res) => {
  const { post_id } = req.query;
  const where = post_id ? "WHERE a.job_post_id = ?" : "";
  const [rows] = await db.query(
    `SELECT a.*, p.title AS job_title
     FROM job_applications a
     JOIN job_board_posts p ON p.id = a.job_post_id
     ${where} ORDER BY a.ats_score DESC, a.id DESC`,
    post_id ? [post_id] : [],
  );
  res.json({ success: true, data: rows });
};

/* PATCH /applications/:id  { status } — shortlist / reject / convert */
export const decideApplication = async (req, res) => {
  const { status } = req.body;
  if (!["SHORTLISTED", "REJECTED", "CONVERTED", "NEW"].includes(status))
    return res.status(400).json({ success: false, message: "Invalid status" });

  const [[app]] = await db.query(
    "SELECT * FROM job_applications WHERE id = ?",
    [req.params.id],
  );
  if (!app)
    return res.status(404).json({ success: false, message: "Application not found" });

  /* Convert into the main candidates table */
  if (status === "CONVERTED") {
    try {
      await db.query(
        `INSERT INTO candidates (name, email, phone) VALUES (?,?,?)`,
        [app.applicant_name, app.email, app.phone],
      );
    } catch (e) {
      console.error("[jobBoard] convert:", e.message);
    }
  }

  await db.query("UPDATE job_applications SET status = ? WHERE id = ?", [
    status,
    req.params.id,
  ]);
  res.json({ success: true, message: "Application " + status.toLowerCase() });
};
