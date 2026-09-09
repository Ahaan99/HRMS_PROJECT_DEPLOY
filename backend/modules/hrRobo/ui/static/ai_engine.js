/* ═══════════════════════════════════════════════════════════════
   ARDHNARISHWAR AI INTERVIEW ENGINE (add-on module)
   Features: AI Screening Questionnaire · Automated Scoring ·
   Skill Assessment Reports · HR Recommendation Engine ·
   Offline Robot Interviewer (no-LLM fallback) · Exports
   Loaded AFTER the main inline script; wraps existing globals.
   ═══════════════════════════════════════════════════════════════ */

/* ── 1. QUESTION BANKS ─────────────────────────────────────── */
const AIQ_BANK = {
  aptitude: [
    { q: "If 5 machines make 5 widgets in 5 minutes, how long do 100 machines take to make 100 widgets?", o: ["5 minutes", "100 minutes", "20 minutes", "1 minute"], a: 0 },
    { q: "Which number comes next: 2, 6, 12, 20, 30, ... ?", o: ["36", "40", "42", "44"], a: 2 },
    { q: "A project deadline moves up by 2 weeks. What should you do FIRST?", o: ["Work overtime silently", "Re-prioritize scope with stakeholders", "Ignore the change", "Blame the planning team"], a: 1 },
    { q: "RENT is coded as SFOU. How is FLAT coded?", o: ["GMBU", "GNBU", "EKZS", "GMBV"], a: 0 },
    { q: "A team member repeatedly misses standup. Best first action?", o: ["Escalate to HR", "Talk to them privately to understand why", "Publicly call them out", "Remove them from the project"], a: 1 },
    { q: "What is 15% of 240?", o: ["32", "34", "36", "38"], a: 2 },
    { q: "You find a critical bug in production on Friday evening. You should:", o: ["Leave it for Monday", "Assess impact, hotfix or rollback, inform the team", "Delete the error logs", "Blame QA"], a: 1 },
    { q: "Pointing to a photo, Ram says 'She is the daughter of my grandfather's only son'. Who is she to Ram?", o: ["Mother", "Cousin", "Sister", "Aunt"], a: 2 },
  ],
  Engineering: [
    { q: "Which HTTP status code means 'Unauthorized'?", o: ["400", "401", "403", "404"], a: 1, skill: "REST APIs" },
    { q: "In React, which hook is used for side effects?", o: ["useState", "useMemo", "useEffect", "useRef"], a: 2, skill: "React" },
    { q: "Which SQL clause filters grouped rows?", o: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"], a: 1, skill: "SQL" },
    { q: "What does Docker primarily provide?", o: ["Virtual machines", "Containerization", "Load balancing", "DNS routing"], a: 1, skill: "Docker" },
    { q: "Node.js is best described as:", o: ["A browser", "A JavaScript runtime on V8", "A database", "A CSS framework"], a: 1, skill: "Node.js" },
    { q: "Which data structure gives O(1) average lookup?", o: ["Array", "Linked List", "Hash Map", "Binary Tree"], a: 2, skill: "DSA" },
    { q: "What is the purpose of an index in a database?", o: ["Store backups", "Speed up reads", "Encrypt data", "Compress tables"], a: 1, skill: "SQL" },
    { q: "Git command to combine another branch into yours:", o: ["git push", "git merge", "git clone", "git status"], a: 1, skill: "Git" },
  ],
  "AI/ML": [
    { q: "Which is a supervised learning task?", o: ["Clustering", "Spam classification", "Dimensionality reduction", "Association mining"], a: 1, skill: "Machine Learning" },
    { q: "Overfitting means the model:", o: ["Performs well on train, poorly on test", "Performs poorly everywhere", "Is too small", "Has too little data... always"], a: 0, skill: "Machine Learning" },
    { q: "Pandas function to read a CSV:", o: ["pd.open()", "pd.read_csv()", "pd.load()", "pd.csv()"], a: 1, skill: "Pandas" },
    { q: "Which library is used for deep learning?", o: ["NumPy", "Matplotlib", "TensorFlow", "Requests"], a: 2, skill: "TensorFlow" },
    { q: "Precision is defined as:", o: ["TP/(TP+FN)", "TP/(TP+FP)", "TN/(TN+FP)", "(TP+TN)/All"], a: 1, skill: "Statistics" },
    { q: "Train/test split is used to:", o: ["Speed training", "Estimate generalization", "Reduce dataset size", "Clean data"], a: 1, skill: "Machine Learning" },
    { q: "Which activation outputs between 0 and 1?", o: ["ReLU", "Tanh", "Sigmoid", "Linear"], a: 2, skill: "Deep Learning" },
    { q: "SQL or NoSQL: best for flexible document schemas?", o: ["MySQL", "PostgreSQL", "MongoDB", "Oracle"], a: 2, skill: "MongoDB" },
  ],
  Design: [
    { q: "Primary purpose of a design system:", o: ["Decoration", "Consistency and reusability", "Faster internet", "SEO"], a: 1, skill: "Design Systems" },
    { q: "In Figma, 'Auto Layout' is used to:", o: ["Animate frames", "Create responsive resizable frames", "Export PNGs", "Add comments"], a: 1, skill: "Figma" },
    { q: "Which contrast ratio meets WCAG AA for body text?", o: ["1.5:1", "2:1", "3:1", "4.5:1"], a: 3, skill: "UI/UX" },
    { q: "A low-fidelity early sketch of a screen is called a:", o: ["Mockup", "Wireframe", "Prototype", "Render"], a: 1, skill: "Wireframing" },
    { q: "Best method to validate a new flow with users:", o: ["Ship and pray", "Usability testing", "Ask the CEO", "Copy competitors"], a: 1, skill: "UX Design" },
    { q: "Whitespace in UI design:", o: ["Is wasted space", "Improves readability and hierarchy", "Slows loading", "Is only for print"], a: 1, skill: "UI Design" },
    { q: "The '8pt grid' refers to:", o: ["Icon set", "Spacing system in multiples of 8", "Font family", "Color palette"], a: 1, skill: "UI Design" },
    { q: "A clickable simulation of the final product is a:", o: ["Wireframe", "Moodboard", "Prototype", "Sitemap"], a: 2, skill: "Prototyping" },
  ],
  Product: [
    { q: "MVP stands for:", o: ["Most Valuable Product", "Minimum Viable Product", "Maximum Value Proposition", "Minor Version Patch"], a: 1, skill: "Product Management" },
    { q: "Which framework prioritizes features by Reach, Impact, Confidence, Effort?", o: ["MoSCoW", "RICE", "KANO", "SWOT"], a: 1, skill: "Product Management" },
    { q: "A/B testing is used to:", o: ["Test servers", "Compare two variants with real users", "Debug code", "Train models"], a: 1, skill: "A/B Testing" },
    { q: "North Star metric should be:", o: ["Revenue only", "A single metric capturing core user value", "Number of features", "Team size"], a: 1, skill: "Product Management" },
    { q: "In Scrum, the sprint backlog is owned by:", o: ["Product Owner", "Scrum Master", "Development Team", "CEO"], a: 2, skill: "Scrum" },
    { q: "Churn rate measures:", o: ["New signups", "Users who stop using product", "Server errors", "Ad spend"], a: 1, skill: "Product Management" },
    { q: "User story format is typically:", o: ["Given/When/Then", "As a [user], I want [goal], so that [benefit]", "If/Else", "Who/What/Why"], a: 1, skill: "Agile" },
    { q: "A roadmap primarily communicates:", o: ["Exact dates guaranteed", "Direction and priorities over time", "Salaries", "Server architecture"], a: 1, skill: "Product Roadmap" },
  ],
};
const AIQ_DEPT_MAP = { "Engineering": "Engineering", "AI/ML": "AI/ML", "Design": "Design", "Product": "Product" };

/* ── skill knowledge base for the resume/role-aware interviewer ── */
const AI_SKILL_ALIASES = { 'react': 'React', 'reactjs': 'React', 'next.js': 'Next.js', 'nextjs': 'Next.js', 'angular': 'Angular', 'vue': 'Vue.js', 'html': 'HTML', 'css': 'CSS', 'tailwind': 'Tailwind CSS', 'javascript': 'JavaScript', 'typescript': 'TypeScript', 'node': 'Node.js', 'node.js': 'Node.js', 'nodejs': 'Node.js', 'express': 'Express', 'django': 'Django', 'flask': 'Flask', 'fastapi': 'FastAPI', 'spring': 'Spring Boot', 'python': 'Python', 'java': 'Java', 'c++': 'C++', 'golang': 'Go', 'php': 'PHP', 'sql': 'SQL', 'mysql': 'MySQL', 'postgresql': 'PostgreSQL', 'postgres': 'PostgreSQL', 'mongodb': 'MongoDB', 'redis': 'Redis', 'docker': 'Docker', 'kubernetes': 'Kubernetes', 'aws': 'AWS', 'azure': 'Azure', 'gcp': 'GCP', 'git': 'Git', 'ci/cd': 'CI/CD', 'machine learning': 'Machine Learning', 'ml': 'Machine Learning', 'deep learning': 'Deep Learning', 'nlp': 'NLP', 'tensorflow': 'TensorFlow', 'pytorch': 'PyTorch', 'pandas': 'Pandas', 'numpy': 'NumPy', 'xgboost': 'XGBoost', 'figma': 'Figma', 'prototyping': 'Prototyping', 'wireframing': 'Wireframing', 'ui/ux': 'UI/UX', 'design systems': 'Design Systems', 'design system': 'Design Systems', 'agile': 'Agile', 'scrum': 'Scrum', 'jira': 'Jira', 'product management': 'Product Management', 'a/b testing': 'A/B Testing', 'microservices': 'Microservices', 'graphql': 'GraphQL', 'rest': 'REST APIs' };
const AI_SKILL_CAT = { 'React': 'frontend', 'Next.js': 'frontend', 'Angular': 'frontend', 'Vue.js': 'frontend', 'HTML': 'frontend', 'CSS': 'frontend', 'Tailwind CSS': 'frontend', 'JavaScript': 'frontend', 'TypeScript': 'frontend', 'Node.js': 'backend', 'Express': 'backend', 'Django': 'backend', 'Flask': 'backend', 'FastAPI': 'backend', 'Spring Boot': 'backend', 'Python': 'backend', 'Java': 'backend', 'C++': 'backend', 'Go': 'backend', 'PHP': 'backend', 'Microservices': 'backend', 'GraphQL': 'backend', 'REST APIs': 'backend', 'SQL': 'database', 'MySQL': 'database', 'PostgreSQL': 'database', 'MongoDB': 'database', 'Redis': 'database', 'Docker': 'devops', 'Kubernetes': 'devops', 'AWS': 'devops', 'Azure': 'devops', 'GCP': 'devops', 'Git': 'devops', 'CI/CD': 'devops', 'Machine Learning': 'ml', 'Deep Learning': 'ml', 'NLP': 'ml', 'TensorFlow': 'ml', 'PyTorch': 'ml', 'Pandas': 'ml', 'NumPy': 'ml', 'XGBoost': 'ml', 'Figma': 'design', 'Prototyping': 'design', 'Wireframing': 'design', 'UI/UX': 'design', 'Design Systems': 'design', 'Agile': 'pm', 'Scrum': 'pm', 'Jira': 'pm', 'Product Management': 'pm', 'A/B Testing': 'pm' };

/* seniority-tiered technical questions per skill category */
const AI_TECH_Q = {
  frontend: {
    fresher: ["I see {skill} on your resume. Explain what happens step by step when a user clicks a button in a {skill} app — from the click to the screen updating.", "With {skill}, how do you make a page work well on both mobile and desktop? Tell me what you actually did in your project."],
    mid: ["In your {skill} work, tell me about a performance problem you found — how did you detect it, and what exactly did you change to fix it?", "How do you manage state in a growing {skill} application? Walk me through the choice you made in a real project and why."],
    senior: ["At {exp} years of experience, how would you architect a large {skill} codebase for a team of 10 developers — folder structure, state, testing, and code review standards?", "Tell me about the hardest production incident you handled in a {skill} app. What was the root cause and what guardrail did you add afterwards?"]
  },
  backend: {
    fresher: ["You listed {skill}. Explain how you would design a simple login API with it — the route, validation, and how you would store the password safely.", "In {skill}, what is the difference between synchronous and asynchronous handling? Where did you use async in your project?"],
    mid: ["Describe a real API you built with {skill}. How did you handle errors, validation, and what did you do when a downstream service was slow?", "With {skill}, how did you debug the slowest endpoint you ever had? Tell me the exact steps and the final fix."],
    senior: ["How would you scale a {skill} service from 100 to 100,000 requests per minute? Walk me through caching, queueing, and database strategy from a real experience.", "Tell me about a time you had to refactor a legacy {skill} system without downtime. How did you plan the migration?"]
  },
  database: {
    fresher: ["You mention {skill}. Explain the difference between a primary key and an index, and when you added an index in your own project.", "Write me through — verbally — a {skill} query to find the top 5 customers by total order value. How would you approach it?"],
    mid: ["Tell me about the largest table you worked with in {skill}. What did you do when queries on it became slow?", "In {skill}, how do you handle a transaction that must update multiple tables safely? Give a real example from your work."],
    senior: ["How did you design the schema for your most complex project on {skill}? Tell me about normalization decisions, partitioning, and one trade-off you regret.", "Describe a data migration you led on {skill} in production. How did you guarantee zero data loss?"]
  },
  devops: {
    fresher: ["I see {skill} listed. What problem does it solve, and describe how you used it in your own project setup.", "Explain your Git workflow in your last project — branches, reviews, and what you do when there is a merge conflict."],
    mid: ["Walk me through your CI/CD pipeline with {skill} in a real project — stages, what fails the build, and deployment strategy.", "Tell me about a deployment that went wrong involving {skill}. How did you detect it and roll back?"],
    senior: ["How would you design infrastructure with {skill} for a product needing 99.9% uptime — environments, monitoring, alerting, and disaster recovery from your real experience?", "Tell me about a cost or reliability optimization you drove with {skill}. What metrics improved and by how much?"]
  },
  ml: {
    fresher: ["You listed {skill}. Explain your favorite project using it — what was the dataset, what did you predict, and how did you check accuracy?", "In {skill}, what is overfitting, and what did you actually do in a project when you saw it?"],
    mid: ["Walk me through the full pipeline of a real {skill} project — data cleaning, feature engineering, model choice, and how you evaluated it beyond plain accuracy.", "Tell me about a time your {skill} model performed well in training but badly on real data. What was the cause and the fix?"],
    senior: ["How did you take a {skill} model to production? Tell me about serving, monitoring drift, retraining strategy, and one failure you learned from.", "At {exp} years, how do you decide between a simple model and deep learning for a business problem? Give a real decision you made with {skill} and its outcome."]
  },
  design: {
    fresher: ["I see {skill} on your profile. Walk me through your design process for one screen you are proud of — from requirement to final handoff.", "How do you decide spacing, font sizes, and colors in {skill} so the design looks consistent? What system did you follow?"],
    mid: ["Tell me about a time user testing changed your {skill} design. What did users struggle with and what did you redesign?", "How do you hand off {skill} designs to developers? Tell me about a real conflict with a developer and how you resolved it."],
    senior: ["How did you build or maintain a design system in {skill} for multiple products? Tokens, components, versioning — from real experience.", "Tell me about a design decision you defended with data. What was the metric and the business result?"]
  },
  pm: {
    fresher: ["You listed {skill}. Explain how you would prioritize 10 feature requests with capacity for only 3 — what framework and what information do you need?", "Describe how a sprint works in {skill} from planning to retro, from your actual experience."],
    mid: ["Tell me about a feature you shipped using {skill} that failed or underperformed. How did you find out and what did you do next?", "How do you say no to a powerful stakeholder? Give me a real example with the outcome."],
    senior: ["Walk me through a product strategy you owned — market, metrics, roadmap trade-offs, and how {skill} practices helped or hurt.", "Tell me about the hardest prioritization call of your career. What did you sacrifice and was it right?"]
  },
  generic: {
    fresher: ["Tell me about a real project where you used {skill}. What was your exact contribution?", "How did you learn {skill}, and what is the most recent thing you learned in it?"],
    mid: ["What was the most difficult problem you solved using {skill}, and how did you approach it?", "How do you keep your {skill} knowledge current? Give one recent thing you applied."],
    senior: ["Tell me about the biggest impact you delivered using {skill} — numbers if possible.", "How have you mentored others in {skill}? Give a specific example."]
  }
};
const OFFLINE_BEHAVIORAL = [
  "Tell me about a time you disagreed with a teammate or manager. How did you handle it and what was the outcome?",
  "Describe a situation where you had a tight deadline and multiple priorities. How did you decide what to do first?",
  "Tell me about a mistake you made at work or in a project. What did you learn from it?",
];
const OFFLINE_SITUATIONAL = {
  Engineering: "Imagine production goes down one hour after your deployment and the client is calling. Walk me through exactly what you do in the first 30 minutes.",
  "AI/ML": "Your model's predictions suddenly degrade in production and business metrics drop. Walk me through how you would diagnose and fix it.",
  Design: "A client rejects your design one day before launch saying it 'doesn't feel right'. What exactly do you do?",
  Product: "Engineering says your top-priority feature needs 3 months; sales promised it in 3 weeks. Walk me through how you resolve this.",
  default: "Imagine your solution fails one day before delivery to a client. Walk me through exactly what you would do."
};

/* extract canonical skills from any free text (job description, answers) */
function aiExtractSkillsFrom(text) {
  if (!text) return [];
  const low = ' ' + String(text).toLowerCase() + ' ';
  const out = [], seen = new Set();
  const multi = Object.keys(AI_SKILL_ALIASES).filter(k => k.includes(' ') || k.includes('/') || k.includes('.')).sort((a, b) => b.length - a.length);
  for (const k of multi) if (low.includes(k)) { const c = AI_SKILL_ALIASES[k]; if (!seen.has(c)) { seen.add(c); out.push(c); } }
  const tokens = new Set(low.split(/[^a-z0-9#+.]+/));
  for (const k in AI_SKILL_ALIASES) {
    if (k.includes(' ') || k.includes('/')) continue;
    const c = AI_SKILL_ALIASES[k];
    if (!seen.has(c) && tokens.has(k)) { seen.add(c); out.push(c); }
  }
  return out;
}
function aiRoleRequirements(pos) {
  if (!pos) return [];
  return aiExtractSkillsFrom((pos.title || '') + ' ' + (pos.department || '') + ' ' + (pos.description || ''));
}
function aiTierFor(exp) { return exp >= 4 ? 'senior' : exp >= 1 ? 'mid' : 'fresher'; }
function aiTechQ(skill, tier, exp, dept) {
  let cat = AI_SKILL_CAT[skill] || 'generic';
  /* role-context override: same skill, different flavor per department */
  if (dept === 'AI/ML' && (cat === 'backend' || skill === 'SQL')) cat = 'ml';
  if (dept === 'Design' && cat === 'frontend') cat = 'design';
  if (dept === 'Product' && cat === 'generic') cat = 'pm';
  const bank = (AI_TECH_Q[cat] || AI_TECH_Q.generic)[tier] || AI_TECH_Q.generic.mid;
  const t = bank[Math.floor(Math.random() * bank.length)];
  return t.replaceAll('{skill}', skill).replaceAll('{exp}', String(exp));
}

/* ── 2. ANSWER SCORER (mirrors brain/nlp_engine.score_answer) ── */
function aiScoreAnswer(answer, keywords) {
  if (!answer || !answer.trim()) return 0;
  const words = answer.trim().split(/\s+/); const n = words.length;
  let len = n < 5 ? 10 : n < 15 ? 25 : n < 40 ? 40 : 50;
  let kw = 15;
  if (keywords && keywords.length) {
    const low = answer.toLowerCase();
    const hits = keywords.filter(k => low.includes(String(k).toLowerCase())).length;
    kw = Math.min(30, hits * 10);
  }
  let st = 0;
  if (/[.!?].+[.!?]/.test(answer)) st += 7;
  if (/\b(for example|jaise|instance|project|maine|i built|i led|i worked|humne)\b/i.test(answer)) st += 7;
  if (/\d/.test(answer)) st += 6;
  return Math.min(100, len + kw + st);
}

/* session-scoped scoring state */
let AI_SESSION = null;
function aiResetSession(cand) {
  AI_SESSION = { candidate_id: cand ? cand.id : 0, answers: [], skills: (cand && cand.skills) || [], started_at: new Date().toISOString() };
}

/* ── 3. HR RECOMMENDATION ENGINE ──────────────────────────── */
function aiRecommend(candId) {
  const cands = DB.get('candidates', []);
  const cand = cands.find(c => c.id === candId) || {};
  const screening = DB.get('screenings', []).find(s => s.candidate_id === candId);
  const report = DB.get('ai_reports', []).find(r => r.candidate_id === candId);
  const comps = [];
  if (screening) comps.push({ name: 'Screening Questionnaire', w: 0.20, v: screening.percent });
  if (cand.ai_score) comps.push({ name: 'Resume & Skill Match', w: 0.20, v: cand.ai_score });
  if (report && report.interview_score != null) comps.push({ name: 'AI Interview Performance', w: 0.45, v: report.interview_score });
  if (report && report.communication != null) comps.push({ name: 'Communication', w: 0.15, v: report.communication });
  if (!comps.length) return null;
  const totW = comps.reduce((s, c) => s + c.w, 0);
  const composite = Math.round(comps.reduce((s, c) => s + c.v * (c.w / totW), 0));
  let verdict, cls, emoji;
  if (report && report.incomplete) {
    /* too few real answers captured (echo/noise/mic issues) —
       do NOT fail the candidate; the session needs a redo */
    verdict = 'INCOMPLETE — RE-INTERVIEW NEEDED'; cls = 'amber'; emoji = '⚠️';
  }
  else if (composite >= 80) { verdict = 'STRONG HIRE'; cls = 'green'; emoji = '🏆'; }
  else if (composite >= 65) { verdict = 'HIRE'; cls = 'green'; emoji = '✅'; }
  else if (composite >= 50) { verdict = 'CONSIDER / HOLD'; cls = 'amber'; emoji = '🤔'; }
  else { verdict = 'NOT RECOMMENDED'; cls = 'red'; emoji = '❌'; }
  const reasons = [];
  if (report && report.incomplete) reasons.push(`Only ${report.meaningful_answers || 0} meaningful answers captured — session likely hit mic/echo issues, schedule a re-interview`);
  comps.forEach(c => {
    const tag = c.v >= 75 ? 'Strong' : c.v >= 55 ? 'Decent' : 'Weak';
    reasons.push(`${tag} ${c.name.toLowerCase()} (${Math.round(c.v)}%)`);
  });
  if (cand.experience_years >= 3) reasons.push(`Solid experience: ${cand.experience_years} years`);
  else if (cand.experience_years === 0) reasons.push('Fresher — consider trainee/junior track');
  return { composite, verdict, cls, emoji, components: comps, reasons };
}

/* ── 4. SKILL ASSESSMENT REPORT GENERATOR ─────────────────── */
function aiGenerateReport() {
  if (!AI_SESSION || !AI_SESSION.answers.length) return null;
  const s = AI_SESSION;
  const scores = s.answers.map(a => a.score);
  const interview_score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const avgWords = Math.round(s.answers.reduce((a, x) => a + x.words, 0) / s.answers.length);
  const communication = Math.min(100, Math.round(avgWords < 6 ? 25 : avgWords < 14 ? 50 : avgWords < 30 ? 75 : 90));
  const skill_scores = (s.skills || []).slice(0, 8).map(sk => {
    const rel = s.answers.filter(a => a.text.toLowerCase().includes(String(sk).toLowerCase()));
    const v = rel.length ? Math.round(rel.reduce((a, b) => a + b.score, 0) / rel.length) : Math.max(30, interview_score - 12);
    return { skill: sk, score: Math.min(100, v) };
  });
  /* meaningful = a real spoken answer, not echo/noise fragments */
  const meaningful = s.answers.filter(a => a.words >= 6).length;
  const report = {
    candidate_id: s.candidate_id, generated_at: new Date().toISOString(),
    interview_score, communication, answers_count: s.answers.length,
    meaningful_answers: meaningful, incomplete: meaningful < 5,
    avg_answer_words: avgWords, skill_scores,
    duration_sec: Math.round((Date.now() - new Date(s.started_at).getTime()) / 1000),
  };
  const all = DB.get('ai_reports', []).filter(r => r.candidate_id !== s.candidate_id);
  all.push(report); DB.set('ai_reports', all);
  return report;
}

/* ── 5. AI SCREENING QUESTIONNAIRE (candidate) ────────────── */
let SCR = null;
function aiStartScreening() {
  if (!currentCandidate) { showNotif('❌ Login as candidate first', true); return; }
  const done = DB.get('screenings', []).find(x => x.candidate_id === currentCandidate.id);
  if (done) { aiRenderScreeningDone(done); return; }
  const positions = DB.get('positions', []);
  const pos = positions.find(p => p.id === currentCandidate.position_id) || {};
  const dept = AIQ_DEPT_MAP[pos.department] || 'Engineering';
  const pick = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
  const qs = [...pick(AIQ_BANK.aptitude, 4), ...pick(AIQ_BANK[dept] || AIQ_BANK.Engineering, 6)];
  SCR = { qs, i: 0, correct: 0, picks: [], timer: null, tleft: 25 };
  aiRenderScreeningQ();
}
function aiRenderScreeningQ() {
  const el = document.getElementById('screening-content');
  const { qs, i } = SCR; const q = qs[i];
  clearInterval(SCR.timer); SCR.tleft = 25;
  el.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div style="font-size:12px;color:var(--text3);font-weight:700">QUESTION ${i + 1} / ${qs.length}</div>
        <div id="scr-timer" style="font-size:13px;font-weight:800;color:var(--green)">⏱ 25s</div>
      </div>
      <div style="height:6px;background:var(--bg3);border-radius:3px;margin-bottom:18px"><div style="height:6px;border-radius:3px;background:var(--accent);width:${Math.round(i / qs.length * 100)}%"></div></div>
      <div style="font-size:15px;font-weight:700;color:var(--text);line-height:1.6;margin-bottom:16px">${q.q}</div>
      ${q.o.map((o, k) => `<div class="scr-opt" onclick="aiPickOption(${k})" style="border:1px solid var(--border2);border-radius:10px;padding:12px 14px;margin-bottom:8px;cursor:pointer;font-size:13px;color:var(--text2);transition:.15s" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border2)'"><b style="color:var(--accent);margin-right:8px">${String.fromCharCode(65 + k)}.</b>${o}</div>`).join('')}
      <div style="font-size:11px;color:var(--text3);margin-top:10px">Auto-skips when the timer ends. Each question has exactly one correct answer.</div>
    </div>`;
  SCR.timer = setInterval(() => {
    SCR.tleft--; const t = document.getElementById('scr-timer');
    if (t) { t.textContent = '⏱ ' + SCR.tleft + 's'; t.style.color = SCR.tleft <= 7 ? 'var(--red)' : 'var(--green)'; }
    if (SCR.tleft <= 0) aiPickOption(-1);
  }, 1000);
}
function aiPickOption(k) {
  clearInterval(SCR.timer);
  const q = SCR.qs[SCR.i];
  const ok = k === q.a;
  if (ok) SCR.correct++;
  SCR.picks.push({ q: q.q, picked: k, correct: q.a, ok, skill: q.skill || 'Aptitude' });
  SCR.i++;
  if (SCR.i < SCR.qs.length) { aiRenderScreeningQ(); }
  else {
    const pct = Math.round(SCR.correct / SCR.qs.length * 100);
    const rec = { candidate_id: currentCandidate.id, candidate_name: currentCandidate.name, total: SCR.qs.length, correct: SCR.correct, percent: pct, taken_at: new Date().toISOString(), detail: SCR.picks };
    const all = DB.get('screenings', []).filter(x => x.candidate_id !== currentCandidate.id);
    all.push(rec); DB.set('screenings', all);
    // status upgrade if passed and still pending
    if (pct >= 60) {
      const cands = DB.get('candidates', []); const ci = cands.findIndex(c => c.id === currentCandidate.id);
      if (ci >= 0 && cands[ci].status === 'pending') { cands[ci].status = 'shortlisted'; DB.set('candidates', cands); currentCandidate = cands[ci]; }
    }
    aiRenderScreeningDone(rec);
    showNotif(pct >= 60 ? '🎉 Screening PASSED! You are now shortlisted.' : '📋 Screening submitted.');
  }
}
function aiRenderScreeningDone(rec) {
  const el = document.getElementById('screening-content');
  const pass = rec.percent >= 60;
  const bySkill = {};
  (rec.detail || []).forEach(d => { const k = d.skill || 'General'; bySkill[k] = bySkill[k] || { t: 0, c: 0 }; bySkill[k].t++; if (d.ok) bySkill[k].c++; });
  el.innerHTML = `
    <div class="card"><div class="result-card">
      <div class="result-icon">${pass ? '🎉' : '📋'}</div>
      <div class="result-status" style="color:${pass ? 'var(--green)' : 'var(--amber)'}">${pass ? 'SCREENING PASSED' : 'SCREENING COMPLETED'}</div>
      <div class="result-score" style="color:${pass ? 'var(--green)' : 'var(--amber)'};margin-top:10px">${rec.percent}%</div>
      <div class="result-sub">${rec.correct} / ${rec.total} correct · Taken ${new Date(rec.taken_at).toLocaleString()}</div>
      ${pass ? '<div style="font-size:12px;color:var(--green);margin-top:10px">You are shortlisted — check My Schedule for your AI Robot Interview.</div>' : '<div style="font-size:12px;color:var(--text3);margin-top:10px">HR will review your application. Score 60%+ auto-shortlists.</div>'}
    </div></div>
    <div class="card"><div class="card-h"><div class="card-t">Section Breakdown</div></div>
      ${Object.entries(bySkill).map(([k, v]) => {
        const p = Math.round(v.c / v.t * 100);
        return `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text2);margin-bottom:4px"><span>${k}</span><span style="font-weight:700;color:${p >= 60 ? 'var(--green)' : 'var(--amber)'}">${v.c}/${v.t}</span></div><div style="height:7px;background:var(--bg3);border-radius:4px"><div style="height:7px;border-radius:4px;background:${p >= 60 ? 'var(--green)' : 'var(--amber)'};width:${p}%"></div></div></div>`;
      }).join('')}
    </div>`;
}

/* ── 6. OFFLINE ROBOT INTERVIEWER (LLM fallback) ──────────── */
let OFFLINE_IV = null;
let OFFLINE_DONE = false;
function aiOfflineNext(candName, position, skills, userMsg) {
  if (OFFLINE_DONE) return 'The interview has already been completed. Our HR team will contact you with the results. Thank you!';
  if (!OFFLINE_IV) {
    /* ── build a personalized plan from resume + actual role ── */
    const cId = parseInt((document.getElementById('iv-cand-id') || {}).value || 0);
    const cand = DB.get('candidates', []).find(c => c.id === cId) || {};
    const pos = DB.get('positions', []).find(p => p.id === cand.position_id) || {};
    const exp = cand.experience_years || 0;
    const tier = aiTierFor(exp);
    const resumeSkills = (skills && skills.length ? skills : (cand.skills || [])).map(String);
    const required = aiRoleRequirements(pos);
    const haveLow = resumeSkills.map(s => s.toLowerCase());
    const matched = required.filter(r => haveLow.includes(r.toLowerCase()));
    const gaps = required.filter(r => !haveLow.includes(r.toLowerCase()));
    const extras = resumeSkills.filter(s => !required.some(r => r.toLowerCase() === s.toLowerCase()));

    const plan = [];
    const expLabel = exp >= 4 ? 'a senior professional with ' + exp + ' years of experience' : exp >= 1 ? 'a professional with ' + exp + ' years of experience' : 'a fresher';

    /* ── STAGE 2: Job-description awareness (standard opener) ── */
    plan.push({ phase: 'Role Understanding', q: `Thank you for the introduction, ${candName}. Before we go further — have you read the job description for this ${position} position? In your own words, what do you understand this role's main responsibilities to be, and why do you think you are a good fit?` });

    /* ── STAGE 3: Motivation ── */
    plan.push({ phase: 'Motivation', q: `Good. And tell me — why do you want to join our company specifically, and why are you ${exp >= 1 ? 'looking for a change from your current position' : 'choosing this field to start your career'}?` });

    /* ── STAGE 4: Resume walkthrough ── */
    plan.push({ phase: 'Resume Walkthrough', q: `Now let's walk through your resume. As ${expLabel}, tell me about the ONE project you are most proud of — what was the problem, which technologies did you use, and what was YOUR exact contribution?` });

    /* ── STAGE 5: Technical — role-required skills the resume has ── */
    const deepSkills = (matched.length ? matched : resumeSkills).slice(0, 4);
    deepSkills.forEach(sk => plan.push({ phase: 'Technical — ' + sk, q: aiTechQ(sk, tier, exp, pos.department), skill: sk }));

    /* ── STAGE 6: Gap probing — role needs it, resume doesn't show it ── */
    gaps.slice(0, 2).forEach(g => plan.push({ phase: 'Skill Gap — ' + g, q: `Now an honest one — the job description for ${position} mentions ${g}, but I don't see it on your resume. Have you had ANY exposure to ${g}? If not, tell me realistically how you would get productive in it within your first month.`, skill: g }));

    /* transferable extra skill */
    if (extras.length) { const ex = extras[0]; plan.push({ phase: 'Technical — ' + ex, q: `You also bring ${ex}, which is beyond this role's core needs. Give me one concrete example of how ${ex} could add value to our ${pos.department || ''} team.`, skill: ex }); }

    /* ── STAGE 7: Behavioral (STAR) ── */
    plan.push({ phase: 'Behavioral (STAR)', q: `Now a behavioral question. Please answer in STAR format — Situation, Task, Action, Result. ` + OFFLINE_BEHAVIORAL[Math.floor(Math.random() * OFFLINE_BEHAVIORAL.length)] });

    /* ── STAGE 8: Situational judgment ── */
    plan.push({ phase: 'Situational', q: OFFLINE_SITUATIONAL[pos.department] || OFFLINE_SITUATIONAL.default });

    /* ── STAGE 9: HR round ── */
    plan.push({ phase: 'HR Round', q: `We are in the final stage now. Two quick HR questions — what is your notice period or availability to join, and what are your salary expectations for this ${position} role? (The band is ${pos.salary || 'as per company standards'}.)` });

    /* ── STAGE 10: Candidate's questions + close ── */
    plan.push({ phase: 'Your Questions', q: 'That completes my questions. Now it is your turn — do you have any questions for us about the role, the team, or the company?' });
    plan.push({ phase: 'End', q: `Thank you ${candName}, it was wonderful talking to you! Our HR team will review your complete interview report and share the next steps with you soon. All the best!` });

    OFFLINE_IV = { plan, i: 0, followups: 0, probed: new Set(deepSkills.map(s => s.toLowerCase())), lastSkill: null };

    /* ── STAGE 1: Opening — protocol + self-introduction ── */
    return `Hello ${candName}, welcome! I am the Ardhnarishvar AI Interview Robot, and I will be conducting your interview today for the ${position} position${pos.department ? ' in our ' + pos.department + ' team' : ''}. ` +
      `Here is how this will work: I have studied your resume and the job description, and I will take you through a structured interview — your introduction, your understanding of the role, your projects, technical questions on ${deepSkills.slice(0, 3).join(', ') || 'your skills'}, a behavioral round, and a short HR round. Answer naturally and take your time. ` +
      `Let us begin with the classic first question — please introduce yourself: your background, your education, and a brief overview of your experience.`;
  }

  /* ── HONESTY GUARD: never fake an acknowledgment ──
     If the candidate gave no real answer (empty or under 3 words),
     do NOT say "thank you for sharing", do NOT advance —
     politely re-ask the SAME question and wait. */
  const answerWords = userMsg ? userMsg.trim().split(/\s+/).filter(Boolean).length : 0;
  if (answerWords < 5) {
    /* No real answer — applies to EVERY question including the first
       (introduction). Re-ask the same question; never acknowledge, never advance. */
    const cur = OFFLINE_IV.i > 0 ? OFFLINE_IV.plan[OFFLINE_IV.i - 1] : null;
    const askAgain = cur ? cur.q
      : 'Please introduce yourself: your background, your education, and a brief overview of your experience.';
    const repeats = [
      'Sorry, I did not hear a complete answer. No rush — take your time. Let me repeat the question: ',
      'I could not catch a full answer. Please answer when you are ready: ',
      'Take your time. Whenever you are ready, here is the question again: '
    ];
    return repeats[Math.floor(Math.random() * repeats.length)] + askAgain;
  }

  const acks = ['Great, thank you for sharing that.', 'Interesting — noted!', 'Achha, samajh gaya.', 'Good answer, thank you.', 'Noted, that gives me good context.'];
  const ack = acks[Math.floor(Math.random() * acks.length)];

  /* ── ADAPTIVE FOLLOW-UP: react to what the candidate actually said ── */
  if (userMsg && OFFLINE_IV.followups < 2 && OFFLINE_IV.i > 0 && OFFLINE_IV.i < OFFLINE_IV.plan.length - 2) {
    const words = userMsg.trim().split(/\s+/).length;
    if (words >= 4 && words < 8 && !OFFLINE_IV.briefAsked) {
      OFFLINE_IV.briefAsked = true; OFFLINE_IV.followups++;
      return `Okay — could you walk me through that a bit more? A concrete example of what you specifically did would help me understand.`;
    }
    if (words >= 8) {
      const mentioned = aiExtractSkillsFrom(userMsg).filter(s => !OFFLINE_IV.probed.has(s.toLowerCase()));
      if (mentioned.length) {
        const t = mentioned[0]; OFFLINE_IV.probed.add(t.toLowerCase()); OFFLINE_IV.followups++;
        const phaseEl = document.getElementById('iv-phase'); if (phaseEl) phaseEl.textContent = 'Phase: Follow-up — ' + t;
        return `${ack} You just mentioned ${t} — that caught my attention. How exactly did you use ${t} there, and what would break if it was removed from your solution?`;
      }
      const num = userMsg.match(/(\d+(?:\.\d+)?)\s*(%|x|times|users|ms|seconds|requests|rows|million|k\b)/i);
      if (num && !OFFLINE_IV.numAsked) {
        OFFLINE_IV.numAsked = true; OFFLINE_IV.followups++;
        return `${ack} You mentioned "${num[0]}" — that's a solid result. Out of curiosity, how did you measure it, and what was the baseline before?`;
      }
    }
  }

  if (OFFLINE_IV.i < OFFLINE_IV.plan.length) {
    const step = OFFLINE_IV.plan[OFFLINE_IV.i++];
    const phaseEl = document.getElementById('iv-phase');
    if (phaseEl) phaseEl.textContent = 'Phase: ' + step.phase;
    OFFLINE_IV.lastSkill = step.skill || null;
    return ack + ' ' + step.q;
  }
  return 'Thank you! The interview is complete. All the best!';
}

/* wrap callClaude with offline fallback.
   Once the server LLM fails, remember it for the whole session so
   every turn goes straight to the offline robot (no 500 spam, no lag). */
let AI_LLM_OFFLINE = false;
const _origCallClaude = callClaude;
callClaude = async function (sys, msg, history = []) {
  const offline = () => {
    const name = (document.getElementById('iv-cname') || {}).textContent || 'Candidate';
    const role = (document.getElementById('iv-job-role') || {}).value || 'this';
    const cand = DB.get('candidates', []).find(c => c.id === parseInt((document.getElementById('iv-cand-id') || {}).value || 0)) || {};
    return aiOfflineNext(name, cand.position_title || role, cand.skills || [], msg);
  };
  if (AI_LLM_OFFLINE) return offline();
  const resp = await _origCallClaude(sys, msg, history);
  if (typeof resp === 'string' && resp.startsWith('⚠️')) {
    AI_LLM_OFFLINE = true;
    console.log('[offline robot] server LLM unavailable — using built-in interviewer for the rest of this session');
    return offline();
  }
  return resp;
};

/* wrap buildSys: make the online LLM interviewer role + resume aware too */
const _origBuildSys = buildSys;
buildSys = function (name, role, lang, rs) {
  let sys = _origBuildSys(name, role, lang, rs);
  try {
    const cId = parseInt((document.getElementById('iv-cand-id') || {}).value || 0);
    const cand = DB.get('candidates', []).find(c => c.id === cId) || {};
    const pos = DB.get('positions', []).find(p => p.id === cand.position_id) || {};
    const required = aiRoleRequirements(pos);
    if (required.length || pos.description) {
      const haveLow = (cand.skills || []).map(s => String(s).toLowerCase());
      const gaps = required.filter(r => !haveLow.includes(r.toLowerCase()));
      sys += '\n\nROLE CONTEXT (use it — this must be a role-specific interview):'
        + '\nJob: ' + (pos.title || role) + ' · Dept: ' + (pos.department || '-') + ' · Requires min ' + (pos.exp_min || 0) + 'y'
        + (pos.description ? '\nJob description: ' + pos.description : '')
        + (required.length ? '\nRole-required skills: ' + required.join(', ') : '')
        + (gaps.length ? '\nSKILL GAPS (role needs, resume lacks): ' + gaps.join(', ') + ' — ask honestly about exposure to each gap and how they would ramp up in month one.' : '')
        + '\nDifficulty: calibrate to ' + aiTierFor(cand.experience_years || 0) + ' level (' + (cand.experience_years || 0) + 'y experience).'
        + '\nADAPTIVE RULE: before moving to the next planned question, ask ONE short follow-up digging into a specific technology, project, or number the candidate just mentioned. Never ignore their answer. If an answer is under 10 words, push for a concrete example.'
        + '\nMANDATORY STAGE SEQUENCE (one question per turn, in this order):'
        + '\n1. Self-introduction (background, education, experience overview)'
        + '\n2. Role understanding — ask if they read the job description and what they understand the role to be'
        + '\n3. Motivation — why this company, why change / why this field'
        + '\n4. Resume walkthrough — their proudest project, technologies, exact contribution'
        + '\n5. Technical questions on role-required skills from their resume'
        + '\n6. Skill-gap questions on required skills missing from their resume'
        + '\n7. One behavioral question (ask for STAR format)'
        + '\n8. One situational judgment question relevant to the department'
        + '\n9. HR round — notice period and salary expectations'
        + '\n10. Invite THEIR questions, then close politely.';
    }
  } catch (e) { console.error('buildSys enrich', e); }
  return sys;
};

/* ── 7. HOOKS: scoring during interview, report at end ────── */
const _origStartLive = startLiveInterview;
startLiveInterview = async function () {
  OFFLINE_IV = null; OFFLINE_DONE = false; AI_LLM_OFFLINE = false;
  const cId = parseInt((document.getElementById('iv-cand-id') || {}).value || 0);
  const cand = DB.get('candidates', []).find(c => c.id === cId);
  aiResetSession(cand || { id: cId });
  return _origStartLive();
};

const _origSendAnswer = sendInterviewAnswer;
sendInterviewAnswer = async function () {
  const inp = document.getElementById('candidate-input');
  const msg = inp ? inp.value.trim() : '';
  if (msg && AI_SESSION) {
    const score = aiScoreAnswer(msg, AI_SESSION.skills);
    AI_SESSION.answers.push({ text: msg, score, words: msg.split(/\s+/).length, at: new Date().toISOString() });
  }
  return _origSendAnswer();
};

const _origEndInterview = endInterview;
endInterview = async function () {
  try { if (AI_SESSION && AI_SESSION.answers.length) aiGenerateReport(); } catch (e) { console.error('report gen', e); }
  OFFLINE_IV = null; OFFLINE_DONE = true;
  return _origEndInterview();
};

/* ── 8. REPORT RENDERING (candidate + admin shared) ───────── */
function aiReportHTML(candId, forAdmin) {
  const report = DB.get('ai_reports', []).find(r => r.candidate_id === candId);
  const rec = aiRecommend(candId);
  if (!report && !rec) return '';
  const bar = (label, v, color) => `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text2);margin-bottom:4px"><span>${label}</span><span style="font-weight:700;color:${color}">${Math.round(v)}%</span></div><div style="height:7px;background:var(--bg3);border-radius:4px"><div style="height:7px;border-radius:4px;background:${color};width:${Math.min(100, Math.round(v))}%"></div></div></div>`;
  const col = v => v >= 75 ? 'var(--green)' : v >= 50 ? 'var(--amber)' : 'var(--red)';
  let html = '';
  if (rec && forAdmin) {
    html += `<div class="card" style="border:1px solid var(--${rec.cls === 'green' ? 'green' : rec.cls === 'amber' ? 'amber' : 'red'})"><div class="card-h"><div class="card-t">${rec.emoji} HR Recommendation Engine</div><div style="font-size:18px;font-weight:800;color:var(--${rec.cls === 'green' ? 'green' : rec.cls === 'amber' ? 'amber' : 'red'})">${rec.verdict} · ${rec.composite}%</div></div>
      ${rec.components.map(c => bar(c.name + ` (weight ${Math.round(c.w * 100)}%)`, c.v, col(c.v))).join('')}
      <div style="font-size:12px;color:var(--text2);margin-top:8px;line-height:1.9">${rec.reasons.map(r => '• ' + r).join('<br>')}</div></div>`;
  }
  if (report) {
    html += `<div class="card"><div class="card-h"><div class="card-t">🧠 AI Skill Assessment Report</div><div style="font-size:11px;color:var(--text3)">${new Date(report.generated_at).toLocaleString()}</div></div>
      <div class="g2" style="margin-bottom:12px">
        <div style="text-align:center;background:var(--bg2);border-radius:10px;padding:14px"><div style="font-size:26px;font-weight:800;color:${col(report.interview_score)}">${report.interview_score}%</div><div style="font-size:11px;color:var(--text3)">Interview Performance</div></div>
        <div style="text-align:center;background:var(--bg2);border-radius:10px;padding:14px"><div style="font-size:26px;font-weight:800;color:${col(report.communication)}">${report.communication}%</div><div style="font-size:11px;color:var(--text3)">Communication</div></div>
      </div>
      ${report.skill_scores.map(s => bar(s.skill, s.score, col(s.score))).join('')}
      <div style="font-size:11px;color:var(--text3);margin-top:8px">${report.answers_count} answers analyzed · avg ${report.avg_answer_words} words/answer · duration ${Math.floor(report.duration_sec / 60)}m ${report.duration_sec % 60}s</div>
      <button class="btn-sm" style="margin-top:12px" onclick="aiPrintReport(${candId})">🖨️ Download / Print Report (PDF)</button></div>`;
  }
  return html;
}

function aiPrintReport(candId) {
  const cand = DB.get('candidates', []).find(c => c.id === candId) || {};
  const report = DB.get('ai_reports', []).find(r => r.candidate_id === candId);
  const scr = DB.get('screenings', []).find(s => s.candidate_id === candId);
  const rec = aiRecommend(candId);
  const w = window.open('', '_blank');
  const bar = (l, v) => `<tr><td style="padding:6px 10px;border:1px solid #ddd">${l}</td><td style="padding:6px 10px;border:1px solid #ddd;font-weight:700">${Math.round(v)}%</td></tr>`;
  w.document.write(`<html><head><title>AI Interview Report — ${cand.name || candId}</title></head>
  <body style="font-family:Arial,Helvetica,sans-serif;color:#1f2430;margin:36px">
    <div style="background:#2D1B4E;color:#fff;padding:20px 26px;border-radius:8px">
      <div style="font-size:20px;font-weight:800">ARDHNARISHWAR</div>
      <div style="font-size:12px;opacity:.85">AI Robot Interview — Skill Assessment & Recommendation Report</div>
    </div>
    <h2 style="margin-top:26px">${cand.name || 'Candidate #' + candId}</h2>
    <p style="font-size:13px;color:#555">${cand.position_title || ''} · ${cand.experience_years || 0} years experience · ${cand.email || ''}</p>
    ${rec ? `<div style="border:2px solid ${rec.composite >= 65 ? '#16a34a' : rec.composite >= 50 ? '#d97706' : '#dc2626'};border-radius:8px;padding:14px 18px;margin:16px 0"><b style="font-size:16px">HR RECOMMENDATION: ${rec.verdict} (${rec.composite}%)</b><br><span style="font-size:12px;color:#555">${rec.reasons.join(' · ')}</span></div>` : ''}
    <table style="border-collapse:collapse;width:100%;font-size:13px;margin-top:10px">
      ${scr ? bar('AI Screening Questionnaire', scr.percent) : ''}
      ${cand.ai_score ? bar('Resume & Skill Match', cand.ai_score) : ''}
      ${report ? bar('Interview Performance', report.interview_score) + bar('Communication', report.communication) : ''}
      ${report ? report.skill_scores.map(s => bar('Skill — ' + s.skill, s.score)).join('') : ''}
    </table>
    <p style="font-size:11px;color:#888;margin-top:26px">System-generated by ARDHNARISHWAR AI Interview Robot · ${new Date().toLocaleString()} · Confidential</p>
    <script>window.onload=()=>window.print()<\/script>
  </body></html>`);
  w.document.close();
}

/* ── 9. ADMIN: CSV EXPORT ─────────────────────────────────── */
function aiExportCSV() {
  const cands = DB.get('candidates', []);
  const scrs = DB.get('screenings', []);
  const reps = DB.get('ai_reports', []);
  const rows = [['ID', 'Name', 'Email', 'Phone', 'Position', 'Experience(y)', 'Skills', 'Status', 'Resume Score', 'Screening %', 'Interview %', 'Communication %', 'Recommendation', 'Composite %']];
  cands.forEach(c => {
    const s = scrs.find(x => x.candidate_id === c.id);
    const r = reps.find(x => x.candidate_id === c.id);
    const rec = aiRecommend(c.id);
    rows.push([c.id, c.name, c.email, c.phone || '', c.position_title || '', c.experience_years || 0, (c.skills || []).join('; '), c.status, c.ai_score || '', s ? s.percent : '', r ? r.interview_score : '', r ? r.communication : '', rec ? rec.verdict : '', rec ? rec.composite : '']);
  });
  const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'ai_interview_candidates_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  showNotif('📥 CSV exported!');
}

/* ── 10. PANELS + NAV INJECTION ───────────────────────────── */
function aiInjectPanels() {
  const host = document.getElementById('panel-dashboard') ? document.getElementById('panel-dashboard').parentElement : null;
  if (!host) return;
  if (!document.getElementById('panel-screening')) {
    const d = document.createElement('div');
    d.className = 'panel'; d.id = 'panel-screening';
    d.innerHTML = `<div id="screening-content"><div class="card"><div class="result-card"><div class="result-icon">🧠</div><div class="result-status" style="color:var(--accent)">AI Screening Questionnaire</div><div class="result-sub" style="margin:10px 0 16px">10 timed questions (aptitude + your domain). Score 60%+ to get auto-shortlisted for the AI Robot Interview.<br>You can attempt only once — be ready before you start!</div><button class="btn-sm green" onclick="aiStartScreening()">🚀 Start Screening Test</button></div></div></div>`;
    host.appendChild(d);
  }
  if (!document.getElementById('panel-ai-reports')) {
    const d = document.createElement('div');
    d.className = 'panel'; d.id = 'panel-ai-reports';
    d.innerHTML = `<div id="ai-reports-content"></div>`;
    host.appendChild(d);
  }
}

function aiLoadAdminReports() {
  const el = document.getElementById('ai-reports-content');
  if (!el) return;
  const cands = DB.get('candidates', []);
  const scrs = DB.get('screenings', []);
  const reps = DB.get('ai_reports', []);
  const withData = cands.filter(c => scrs.some(s => s.candidate_id === c.id) || reps.some(r => r.candidate_id === c.id));
  let html = `<div class="card"><div class="card-h"><div class="card-t">🏆 AI Reports & Recommendations</div><div><button class="btn-sm" onclick="aiExportCSV()">📥 Export All (CSV)</button></div></div>`;
  if (!withData.length) {
    html += `<div style="font-size:13px;color:var(--text3);padding:20px;text-align:center">No AI data yet. Reports appear after candidates complete the screening test or robot interview.</div></div>`;
    el.innerHTML = html; return;
  }
  html += `<table class="tbl"><thead><tr><th>Candidate</th><th>Position</th><th>Screening</th><th>Interview</th><th>Recommendation</th><th></th></tr></thead><tbody>`;
  withData.forEach(c => {
    const s = scrs.find(x => x.candidate_id === c.id);
    const r = reps.find(x => x.candidate_id === c.id);
    const rec = aiRecommend(c.id);
    const vcol = rec ? (rec.composite >= 65 ? 'var(--green)' : rec.composite >= 50 ? 'var(--amber)' : 'var(--red)') : 'var(--text3)';
    html += `<tr><td><b>${c.name}</b><br><span style="font-size:11px;color:var(--text3)">#${c.id}</span></td><td style="font-size:12px">${c.position_title || '-'}</td><td>${s ? s.percent + '%' : '—'}</td><td>${r ? r.interview_score + '%' : '—'}</td><td style="color:${vcol};font-weight:700;font-size:12px">${rec ? rec.emoji + ' ' + rec.verdict + ' (' + rec.composite + '%)' : '—'}</td><td><button class="btn-sm" onclick="aiShowAdminReport(${c.id})">View</button></td></tr>`;
  });
  html += `</tbody></table></div><div id="ai-report-detail"></div>`;
  el.innerHTML = html;
}
function aiShowAdminReport(candId) {
  const d = document.getElementById('ai-report-detail');
  const c = DB.get('candidates', []).find(x => x.id === candId) || {};
  d.innerHTML = `<div class="card" style="margin-top:4px"><div class="card-h"><div class="card-t">👤 ${c.name || 'Candidate #' + candId} — Full AI Assessment</div></div></div>` + aiReportHTML(candId, true);
  d.scrollIntoView({ behavior: 'smooth' });
}

/* wrap nav builders */
const _origBuildAdminNav = buildAdminNav;
buildAdminNav = function () {
  _origBuildAdminNav();
  const nav = document.getElementById('main-nav');
  const results = [...nav.querySelectorAll('.nav-item')].find(n => (n.getAttribute('onclick') || '').includes('results-admin'));
  const item = document.createElement('div');
  item.className = 'nav-item'; item.setAttribute('onclick', "showPanel('ai-reports')");
  item.innerHTML = '🏆 AI Reports & Reco';
  if (results && results.nextSibling) results.parentNode.insertBefore(item, results.nextSibling);
  else nav.appendChild(item);
};
const _origBuildCandNav = buildCandidateNav;
buildCandidateNav = function (cand) {
  _origBuildCandNav(cand);
  const nav = document.getElementById('main-nav');
  const profile = [...nav.querySelectorAll('.nav-item')].find(n => (n.getAttribute('onclick') || '').includes('cand-profile'));
  const item = document.createElement('div');
  item.className = 'nav-item'; item.setAttribute('onclick', "showPanel('screening')");
  item.innerHTML = '🧠 AI Screening Test';
  if (profile && profile.nextSibling) profile.parentNode.insertBefore(item, profile.nextSibling);
  else nav.appendChild(item);
};

/* wrap showPanel for new panels + titles */
const _origShowPanel = showPanel;
showPanel = function (id) {
  aiInjectPanels();
  _origShowPanel(id);
  const titles = { 'screening': '🧠 AI Screening Questionnaire', 'ai-reports': '🏆 AI Reports & HR Recommendations' };
  if (titles[id]) document.getElementById('panel-title').textContent = titles[id];
  if (id === 'screening' && currentCandidate) {
    const done = DB.get('screenings', []).find(x => x.candidate_id === currentCandidate.id);
    if (done) aiRenderScreeningDone(done);
  }
  if (id === 'ai-reports') aiLoadAdminReports();
};

/* wrap candidate result to include AI report */
const _origLoadCandResult = loadCandResult;
loadCandResult = function () {
  _origLoadCandResult();
  if (!currentCandidate) return;
  const el = document.getElementById('cand-result-content');
  const extra = aiReportHTML(currentCandidate.id, false);
  if (el && extra) {
    const wrap = document.createElement('div');
    wrap.innerHTML = extra;
    el.appendChild(wrap);
  }
};

/* init after main script bootstrapping */
aiInjectPanels();
console.log('%c🤖 ARDHNARISHWAR AI Interview Engine loaded', 'color:#7c5cff;font-weight:bold');
