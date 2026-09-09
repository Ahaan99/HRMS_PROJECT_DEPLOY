import crypto from "crypto";
import { db } from "../../config/db.js";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "phi3";

const askOllama = async (system, user) => {
  try {
    const r = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!r.ok) throw new Error("Ollama " + r.status);
    const data = await r.json();
    return data?.message?.content?.trim() || null;
  } catch (e) {
    console.error("[aiRecruit] Ollama unavailable:", e.message);
    return null;
  }
};

/* ---------------- Question bank fallback ---------------- */
const QUESTION_BANK = [
  "Walk me through your most challenging project and your specific contribution.",
  "How do you prioritize tasks when everything feels urgent?",
  "Describe a time you disagreed with a teammate. How was it resolved?",
  "What do you do when you're stuck on a problem you can't solve alone?",
  "Why do you want this role, and what makes you a strong fit for it?",
];

const roleQuestions = (jobTitle) => [
  `What attracted you to this ${jobTitle} position?`,
  `Describe your hands-on experience most relevant to a ${jobTitle} role.`,
  ...QUESTION_BANK.slice(0, 3),
];

/* ================= INTERVIEWS ================= */

export const createInterview = async (req, res) => {
  try {
    const { candidate_name, candidate_email, job_title } = req.body;
    if (!candidate_name?.trim() || !job_title?.trim())
      return res
        .status(400)
        .json({ success: false, message: "candidate_name and job_title are required" });

    let questions = null;
    const raw = await askOllama(
      "You are an expert technical recruiter. Reply ONLY with a JSON array of exactly 5 interview question strings. No markdown, no numbering, no extra text.",
      `Generate 5 interview questions for a "${job_title}" role. Mix technical and behavioral.`,
    );
    if (raw) {
      try {
        const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
        if (Array.isArray(parsed) && parsed.length >= 3)
          questions = parsed.slice(0, 5).map(String);
      } catch {
        /* fall through to bank */
      }
    }
    if (!questions) questions = roleQuestions(job_title.trim());

    const token = crypto.randomBytes(20).toString("hex");
    const [r] = await db.query(
      `INSERT INTO ai_interviews (token, candidate_name, candidate_email, job_title, questions)
       VALUES (?,?,?,?,?)`,
      [
        token,
        candidate_name.trim(),
        candidate_email?.trim() || null,
        job_title.trim(),
        JSON.stringify(questions),
      ],
    );
    res.json({
      success: true,
      id: r.insertId,
      token,
      questions,
      ai_generated: !!raw,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const listInterviews = async (_req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM ai_interviews ORDER BY created_at DESC LIMIT 200",
    );
    res.json({ success: true, interviews: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* Public: candidate loads interview by token */
export const getInterviewByToken = async (req, res) => {
  try {
    const [[iv]] = await db.query(
      "SELECT id, candidate_name, job_title, questions, status FROM ai_interviews WHERE token = ?",
      [req.params.token],
    );
    if (!iv) return res.status(404).json({ success: false, message: "Interview not found" });
    if (["Completed", "Evaluated"].includes(iv.status))
      return res.status(410).json({ success: false, message: "Interview already submitted" });
    res.json({ success: true, interview: iv });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* Heuristic scoring when AI is unavailable */
const heuristicEvaluation = (questions, answers) => {
  const per = questions.map((q, i) => {
    const a = (answers[i] || "").trim();
    const words = a.split(/\s+/).filter(Boolean).length;
    let score = 0;
    if (words >= 10) score += 4;
    else if (words >= 4) score += 2;
    if (words >= 40) score += 3;
    else if (words >= 20) score += 2;
    if (/for example|e\.g\.|instance|specifically|result|achiev|improv|led|built|designed/i.test(a))
      score += 3;
    return {
      question: q,
      score: Math.min(10, score),
      feedback:
        words < 4
          ? "Answer too brief to evaluate."
          : "Scored on depth, length, and concrete examples (heuristic mode).",
    };
  });
  const overall = per.reduce((s, p) => s + p.score, 0) / (per.length || 1);
  return {
    mode: "heuristic",
    per_question: per,
    overall: Number(overall.toFixed(2)),
    summary:
      "Automated heuristic evaluation (AI model offline). Review answers manually for a final decision.",
  };
};

/* Public: candidate submits answers -> evaluated immediately */
export const submitAnswers = async (req, res) => {
  try {
    const { answers } = req.body;
    const [[iv]] = await db.query("SELECT * FROM ai_interviews WHERE token = ?", [
      req.params.token,
    ]);
    if (!iv) return res.status(404).json({ success: false, message: "Interview not found" });
    if (["Completed", "Evaluated"].includes(iv.status))
      return res.status(410).json({ success: false, message: "Already submitted" });

    const questions =
      typeof iv.questions === "string" ? JSON.parse(iv.questions) : iv.questions;
    if (!Array.isArray(answers) || answers.length !== questions.length)
      return res
        .status(400)
        .json({ success: false, message: `Expected ${questions.length} answers` });

    let evaluation = null;
    const raw = await askOllama(
      'You are a strict interview evaluator. Reply ONLY with JSON: {"per_question":[{"question":"...","score":0-10,"feedback":"..."}],"overall":0-10,"summary":"..."} No markdown.',
      `Role: ${iv.job_title}\n` +
        questions.map((q, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i]}`).join("\n"),
    );
    if (raw) {
      try {
        const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
        if (parsed?.per_question && typeof parsed.overall === "number")
          evaluation = { mode: "ai", ...parsed };
      } catch {
        /* fall through */
      }
    }
    if (!evaluation) evaluation = heuristicEvaluation(questions, answers);

    await db.query(
      `UPDATE ai_interviews SET answers = ?, evaluation = ?, score = ?,
       status = 'Evaluated', completed_at = NOW() WHERE id = ?`,
      [JSON.stringify(answers), JSON.stringify(evaluation), evaluation.overall, iv.id],
    );

    await db.query(
      `INSERT INTO notifications (audience, type, title, body, link)
       VALUES ('ADMIN', 'interview', ?, ?, '/dashboard/ai-recruit')`,
      [
        `Interview completed: ${iv.candidate_name}`,
        `${iv.job_title} — scored ${evaluation.overall}/10 (${evaluation.mode})`,
      ],
    );

    res.json({ success: true, message: "Answers submitted. Thank you!" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

/* ================= ATS RESUME PARSING ================= */

const SKILL_DICT = [
  "javascript","typescript","react","node","node.js","express","next.js","vue","angular",
  "python","django","flask","java","spring","c++","c#",".net","php","laravel","ruby",
  "sql","mysql","postgresql","mongodb","redis","graphql","rest","api",
  "aws","azure","gcp","docker","kubernetes","terraform","ci/cd","git","linux",
  "html","css","tailwind","sass","figma","ui/ux",
  "excel","tally","sap","payroll","recruitment","onboarding","hr","communication",
  "leadership","project management","agile","scrum","testing","selenium","jest",
  "machine learning","data analysis","power bi","tableau",
];

const parseResumeText = (text) => {
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0] || null;
  const phone =
    text.match(/(\+?\d{1,3}[-\s]?)?\(?\d{3,5}\)?[-\s]?\d{3,5}[-\s]?\d{3,5}/)?.[0]?.trim() ||
    null;
  const lower = text.toLowerCase();
  const skills = [...new Set(SKILL_DICT.filter((s) => lower.includes(s)))];
  const expMatch = lower.match(/(\d{1,2}(?:\.\d)?)\+?\s*(?:years?|yrs?)/);
  const experience_years = expMatch ? Number(expMatch[1]) : null;
  const eduMatch = text.match(
    /(b\.?tech|m\.?tech|b\.?e\b|m\.?e\b|bca|mca|b\.?sc|m\.?sc|mba|bba|ph\.?d|bachelor[^\n,.]*|master[^\n,.]*)/i,
  );
  const nameLine =
    text
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l && !l.includes("@") && l.length < 60 && /^[A-Za-z .]+$/.test(l)) || null;
  return {
    candidate_name: nameLine,
    email,
    phone,
    skills,
    experience_years,
    education: eduMatch ? eduMatch[0] : null,
  };
};

/* ---------------- ATS analysis engine ---------------- */

const SECTION_PATTERNS = {
  summary: /\b(summary|objective|profile|about me)\b/i,
  experience: /\b(experience|employment|work history|career)\b/i,
  education: /\b(education|academic|qualification)\b/i,
  skills: /\b(skills|technologies|tech stack|competencies)\b/i,
  projects: /\b(projects?)\b/i,
  certifications: /\b(certifications?|certificates?|courses?)\b/i,
};

const ACTION_VERBS =
  /\b(built|developed|designed|led|managed|created|implemented|launched|improved|optimized|reduced|increased|delivered|automated|migrated|architected|mentored|achieved|streamlined|spearheaded)\b/gi;

const atsAnalyze = (text, keywords) => {
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const lines = text.split("\n").map((l) => l.trim());
  const breakdown = [];
  const suggestions = [];

  /* 1. Contact info — 15 pts */
  let contact = 0;
  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.]+/.test(text);
  const phoneMatch = text.match(/\+?\d[\d\s()./-]{7,18}\d/g) || [];
  const hasPhone = phoneMatch.some((m) => {
    const digits = m.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 13;
  });
  const hasLinkedin = /linkedin\.com|github\.com|portfolio/i.test(text);
  if (hasEmail) contact += 6;
  else suggestions.push("Add an email address — ATS systems require it to contact you.");
  if (hasPhone) contact += 6;
  else suggestions.push("Add a phone number in a standard format.");
  if (hasLinkedin) contact += 3;
  else suggestions.push("Add a LinkedIn or GitHub/portfolio link to strengthen your profile.");
  breakdown.push({
    category: "Contact Info",
    score: contact,
    max: 15,
    details: [
      hasEmail ? "Email found" : "Email missing",
      hasPhone ? "Phone found" : "Phone missing",
      hasLinkedin ? "Profile link found" : "No LinkedIn/GitHub link",
    ],
  });

  /* 2. Sections — 25 pts */
  const found = Object.entries(SECTION_PATTERNS).filter(([, re]) => re.test(text));
  const foundNames = found.map(([n]) => n);
  const core = ["experience", "education", "skills"];
  let sections = 0;
  core.forEach((s) => {
    if (foundNames.includes(s)) sections += 6;
    else
      suggestions.push(
        `Add a clear "${s[0].toUpperCase() + s.slice(1)}" section heading — ATS parsers look for it.`,
      );
  });
  ["summary", "projects", "certifications"].forEach((s) => {
    if (foundNames.includes(s)) sections += 7 / 3;
  });
  sections = Math.min(25, Math.round(sections));
  breakdown.push({
    category: "Resume Sections",
    score: sections,
    max: 25,
    details: foundNames.length
      ? [`Detected: ${foundNames.join(", ")}`]
      : ["No standard section headings detected"],
  });

  /* 3. Content quality — 25 pts */
  let quality = 0;
  const verbs = [...new Set((text.match(ACTION_VERBS) || []).map((v) => v.toLowerCase()))];
  const numbers = (text.match(/\d+(\.\d+)?%|\b\d{2,}\b/g) || []).length;
  const bullets = lines.filter((l) => /^[•\-*▪●]/.test(l)).length;
  const hasDates = /\b(20\d{2}|19\d{2})\b/.test(text);
  if (verbs.length >= 8) quality += 8;
  else if (verbs.length >= 4) quality += 5;
  else if (verbs.length >= 1) quality += 2;
  else suggestions.push("Use strong action verbs (built, led, improved…) to describe your work.");
  if (numbers >= 5) quality += 7;
  else if (numbers >= 2) quality += 4;
  else suggestions.push("Quantify achievements with numbers (e.g. 'reduced load time by 40%').");
  if (bullets >= 5) quality += 6;
  else if (bullets >= 1) quality += 3;
  else
    suggestions.push(
      "Use bullet points — dense paragraphs are hard for ATS and recruiters to scan.",
    );
  if (hasDates) quality += 4;
  else suggestions.push("Include employment dates (years) for each role.");
  breakdown.push({
    category: "Content Quality",
    score: Math.min(25, quality),
    max: 25,
    details: [
      `${verbs.length} action verbs`,
      `${numbers} quantified figures`,
      `${bullets} bullet points`,
      hasDates ? "Dates present" : "No dates found",
    ],
  });

  /* 4. Length & readability — 15 pts */
  let length = 0;
  if (words.length >= 250 && words.length <= 1000) length += 10;
  else if (words.length >= 120) {
    length += 6;
    suggestions.push("Aim for 300–900 words — concise but complete.");
  } else suggestions.push("Resume is too short — add detail about roles and achievements.");
  const longParas = lines.filter((l) => l.split(/\s+/).length > 60).length;
  if (longParas === 0) length += 5;
  else suggestions.push("Break up very long paragraphs into bullets.");
  breakdown.push({
    category: "Length & Format",
    score: Math.min(15, length),
    max: 15,
    details: [
      `${words.length} words`,
      longParas ? `${longParas} overlong paragraphs` : "Good paragraph sizing",
    ],
  });

  /* 5. Keyword match — 20 pts */
  let matched = [];
  let missing = [];
  let kw = 0;
  if (keywords.length) {
    matched = keywords.filter((k) => lower.includes(k));
    missing = keywords.filter((k) => !lower.includes(k));
    kw = Math.round((matched.length / keywords.length) * 20);
    if (missing.length)
      suggestions.push(`Add missing job keywords where truthful: ${missing.join(", ")}.`);
    breakdown.push({
      category: "Keyword Match",
      score: kw,
      max: 20,
      details: [`${matched.length}/${keywords.length} job keywords found`],
    });
  } else {
    const skillsFound = SKILL_DICT.filter((s) => lower.includes(s)).length;
    kw = Math.min(20, skillsFound * 2);
    breakdown.push({
      category: "Skill Coverage",
      score: kw,
      max: 20,
      details: [`${skillsFound} recognized skills (no job keywords provided)`],
    });
  }

  const ats_score = breakdown.reduce((s, b) => s + b.score, 0);
  return { ats_score, breakdown, suggestions, matched, missing };
};

const extractTextFromFile = async (file) => {
  const ext = (file.originalname.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") {
    const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");
    const data = await pdfParse(file.buffer);
    return data.text || "";
  }
  if (ext === "docx") {
    const { default: mammoth } = await import("mammoth");
    const r = await mammoth.extractRawText({ buffer: file.buffer });
    return r.value || "";
  }
  if (ext === "txt" || ext === "md") return file.buffer.toString("utf8");
  throw new Error("Unsupported file type. Upload PDF, DOCX, or TXT.");
};

const runScreening = async ({ resume_text, job_title, job_keywords, file_name }) => {
  const parsed = parseResumeText(resume_text);
  const keywords = (job_keywords || "")
    .split(/[,\n]/)
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  const analysis = atsAnalyze(resume_text, keywords);
  const match_score = keywords.length
    ? Number(((analysis.matched.length / keywords.length) * 100).toFixed(1))
    : null;

  const [r] = await db.query(
    `INSERT INTO resume_screenings
     (candidate_name, email, phone, skills, experience_years, education,
      match_score, matched_keywords, missing_keywords, job_title, resume_excerpt,
      ats_score, ats_breakdown, suggestions, file_name)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      parsed.candidate_name,
      parsed.email,
      parsed.phone,
      JSON.stringify(parsed.skills),
      parsed.experience_years,
      parsed.education,
      match_score,
      JSON.stringify(analysis.matched),
      JSON.stringify(analysis.missing),
      job_title?.trim() || null,
      resume_text.slice(0, 1500),
      analysis.ats_score,
      JSON.stringify(analysis.breakdown),
      JSON.stringify(analysis.suggestions),
      file_name || null,
    ],
  );

  return {
    id: r.insertId,
    parsed,
    ats_score: analysis.ats_score,
    breakdown: analysis.breakdown,
    suggestions: analysis.suggestions,
    match_score,
    matched_keywords: analysis.matched,
    missing_keywords: analysis.missing,
  };
};

export const screenResume = async (req, res) => {
  try {
    const { resume_text, job_title, job_keywords } = req.body;
    if (!resume_text?.trim() || resume_text.trim().length < 40)
      return res
        .status(400)
        .json({ success: false, message: "resume_text (min 40 chars) is required" });
    const result = await runScreening({ resume_text, job_title, job_keywords });
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const screenResumeUpload = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ success: false, message: "Resume file is required" });
    const resume_text = await extractTextFromFile(req.file);
    if (!resume_text.trim() || resume_text.trim().length < 40)
      return res.status(400).json({
        success: false,
        message: "Could not extract enough text — the file may be image-based/scanned.",
      });
    const { job_title, job_keywords } = req.body;
    const result = await runScreening({
      resume_text,
      job_title,
      job_keywords,
      file_name: req.file.originalname,
    });
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

export const listScreenings = async (_req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM resume_screenings ORDER BY created_at DESC LIMIT 200",
    );
    res.json({ success: true, screenings: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
