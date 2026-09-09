/* ------------------------------------------------------------------ */
/* Recruweb Official Payment Structure & Service Commercials           */
/* (Client Edition, effective August 2026)                             */
/*                                                                     */
/* This catalog is the single source of truth for predefined plans.   */
/* The admin UI fetches it via GET /super-admin/proposals/catalog and  */
/* uses it to auto-fill proposals; nothing has to be re-typed.         */
/* NOTE: rupee sign is written as \u20B9 to avoid encoding issues.     */
/* ------------------------------------------------------------------ */

const RS = "\u20B9";

export const UNIVERSAL_TERMS = [
  `1. Token amount of ${RS}5,000 is payable at agreement signing (where applicable) and is fully adjustable against the final invoice.`,
  "2. Standard agreement period: 11 months.",
  "3. Recruitment invoices are payable within 7 days of candidate joining. Subscription invoices are payable monthly in advance unless otherwise agreed.",
  "4. Replacement support as per the selected plan, subject to the candidate leaving within the covered period and client payments being clear.",
  "5. Vacancy closure commitment: within 7 working days (recruitment plans).",
  "6. Prices are subject to GST and applicable statutory taxes.",
  "7. Bulk hiring, multi-location deployment, long-term outsourcing and enterprise contracts are eligible for customized commercial discussion.",
].join("\n");

/*
 * Each plan:
 *  id             stable identifier
 *  section        "A" (service-based) | "B" (product / SaaS)
 *  category       display group
 *  name           plan name
 *  feeText        human-readable fee (covers %CTC / days-of-salary models)
 *  mrp            market price per unit (null when not fixed-numeric)
 *  mrpText        human-readable MRP when not numeric
 *  offer          our offer price per unit (null when variable, e.g. % CTC)
 *  unit           pricing unit label
 *  tokenAmount    token payable at signing (0 = none)
 *  agreementMonths / replacementMonths / freeHrmsMonths
 *  closureDays    vacancy closure commitment (recruitment)
 *  included       list of included / free services (shown in proposal)
 *  benefits       client benefits bullets
 *  itemDescription  default line-item description
 */
export const PLAN_CATALOG = [
  /* ---------------- Section A: Recruitment ---------------- */
  {
    id: "recruitment_plan_a",
    section: "A",
    category: "Recruitment Service Plans",
    name: "Plan A - Premium Recruitment Partnership",
    feeText: "8.33% of Annual CTC (equivalent to 1 month candidate salary)",
    mrp: null,
    mrpText: "Standard market rate",
    offer: null,
    unit: "per hire (8.33% of Annual CTC)",
    tokenAmount: 5000,
    agreementMonths: 11,
    replacementMonths: 4,
    freeHrmsMonths: 4,
    closureDays: 7,
    included: [
      "Vacancy closure within 7 working days",
      "4 months FREE replacement",
      `Token ${RS}5,000 adjusted in final recruitment invoice`,
      "Balance fee payable within 7 days of candidate joining",
      "FREE HRMS access for 4 months",
    ],
    benefits: [
      "Fast hiring",
      "Extended replacement security",
      "HRMS included",
      "Negotiable for bulk hiring",
    ],
    itemDescription:
      "Recruitment fee: 8.33% of Annual CTC (1 month candidate salary). Replacement: 4 months FREE. Closure within 7 working days. FREE HRMS for 4 months.",
  },
  {
    id: "recruitment_plan_b",
    section: "A",
    category: "Recruitment Service Plans",
    name: "Plan B - Standard Recruitment Partnership",
    feeText: "20 days candidate salary",
    mrp: null,
    mrpText: "25 days salary (market standard)",
    offer: null,
    unit: "per hire (20 days candidate salary)",
    tokenAmount: 5000,
    agreementMonths: 11,
    replacementMonths: 3,
    freeHrmsMonths: 3,
    closureDays: 7,
    included: [
      "Vacancy closure within 7 working days",
      "3 months FREE replacement",
      `Token ${RS}5,000 (adjustable)`,
      "Balance payable within 7 days of joining",
      "FREE HRMS access for 3 months",
    ],
    benefits: ["Reduced hiring cost", "Free replacement support", "HRMS included"],
    itemDescription:
      "Recruitment fee: 20 days candidate salary (market standard 25 days). Replacement: 3 months FREE. Closure within 7 working days. FREE HRMS for 3 months.",
  },
  {
    id: "recruitment_plan_c",
    section: "A",
    category: "Recruitment Service Plans",
    name: "Plan C - Startup Recruitment Partnership",
    feeText: "15 days candidate salary",
    mrp: null,
    mrpText: "25 days salary (market standard)",
    offer: null,
    unit: "per hire (15 days candidate salary)",
    tokenAmount: 5000,
    agreementMonths: 11,
    replacementMonths: 2,
    freeHrmsMonths: 2,
    closureDays: 7,
    included: [
      "Vacancy closure within 7 working days",
      "2 months FREE replacement",
      `Token ${RS}5,000 (adjustable)`,
      "Balance payable within 7 days of joining",
      "FREE HRMS access for 2 months",
    ],
    benefits: ["Lowest recruitment fee", "Startup-friendly model", "HRMS included"],
    itemDescription:
      "Recruitment fee: 15 days candidate salary (market standard 25 days). Replacement: 2 months FREE. Closure within 7 working days. FREE HRMS for 2 months.",
  },
  {
    id: "hr_outsourcing_enterprise",
    section: "A",
    category: "HR Outsourcing",
    name: "Enterprise HR Outsourcing (11-Month Contract)",
    feeText:
      "Monthly service charge on total employee salary value (X amount) as per agreed manpower scope",
    mrp: null,
    mrpText: null,
    offer: null,
    unit: "per month (on agreed salary value)",
    tokenAmount: 5000,
    agreementMonths: 11,
    replacementMonths: 11,
    freeHrmsMonths: 11,
    closureDays: null,
    included: [
      "Payroll Processing",
      "Attendance Management",
      "PF & ESIC Compliance",
      "HRMS Software",
      "Operational HR Support",
      "Employee Documentation",
      "Offer & Joining Management",
      "Exit Management",
      "Basic HR Audit Support",
    ],
    benefits: ["11 months FREE replacement", "All-in-one HR operations"],
    itemDescription:
      "Enterprise HR Outsourcing, 11-month contract. Monthly charge on total employee salary value as per agreed manpower scope. 11 months FREE replacement. Includes payroll, attendance, PF & ESIC compliance, HRMS, HR support, documentation, joining & exit management, basic HR audit support.",
  },

  /* ---------------- Section B: HR Technology Plans ---------------- */
  {
    id: "hr_tech_starter",
    section: "B",
    category: "HR Technology Subscription Plans",
    name: "HR Technology Starter Plan",
    feeText: `${RS}5,000/month (MRP ${RS}10,000/month)`,
    mrp: 10000,
    mrpText: null,
    offer: 5000,
    unit: "per month",
    tokenAmount: 5000,
    agreementMonths: 11,
    replacementMonths: null,
    freeHrmsMonths: null,
    closureDays: null,
    included: [
      "Hiring support for 5 candidates during 11 months",
      "Free replacement support",
      "Payroll support",
      "Compliance support",
      "HRMS access",
      "Operational HR support",
    ],
    benefits: ["50% below MRP", "HRMS + hiring support included"],
    itemDescription:
      "HR Technology Starter Plan, 11-month agreement. Includes hiring support for 5 candidates, replacement support, payroll, compliance, HRMS access and operational HR support.",
  },
  {
    id: "hr_tech_growth",
    section: "B",
    category: "HR Technology Subscription Plans",
    name: "HR Technology Growth Plan",
    feeText: `${RS}11,000/month (MRP ${RS}15,000/month)`,
    mrp: 15000,
    mrpText: null,
    offer: 11000,
    unit: "per month",
    tokenAmount: 5000,
    agreementMonths: 11,
    replacementMonths: null,
    freeHrmsMonths: null,
    closureDays: null,
    included: [
      "Hiring support for 15 candidates during 11 months",
      "Free replacement support",
      "Payroll support",
      "Compliance support",
      "HRMS access",
      "Operational HR support",
    ],
    benefits: ["Hiring support for 15 candidates", "Full HR tech stack"],
    itemDescription:
      "HR Technology Growth Plan, 11-month agreement. Includes hiring support for 15 candidates, replacement support, payroll, compliance, HRMS access and operational HR support.",
  },
  {
    id: "hr_tech_enterprise",
    section: "B",
    category: "HR Technology Subscription Plans",
    name: "HR Technology Enterprise Plan",
    feeText: `${RS}16,000/month (MRP ${RS}20,000/month)`,
    mrp: 20000,
    mrpText: null,
    offer: 16000,
    unit: "per month",
    tokenAmount: 5000,
    agreementMonths: 11,
    replacementMonths: null,
    freeHrmsMonths: null,
    closureDays: null,
    included: [
      "Unlimited hiring support during 11 months",
      "Unlimited replacement support",
      "Payroll support",
      "Compliance support",
      "HRMS access",
      "Operational HR support",
    ],
    benefits: ["Unlimited hiring & replacement support"],
    itemDescription:
      "HR Technology Enterprise Plan, 11-month agreement. Unlimited hiring and replacement support plus payroll, compliance, HRMS access and operational HR support.",
  },

  /* ---------------- Section B: Individual Products ---------------- */
  {
    id: "ai_attendance",
    section: "B",
    category: "Individual Products",
    name: "AI Automated Attendance System",
    feeText: `${RS}99 per employee/month (MRP ${RS}499)`,
    mrp: 499,
    mrpText: null,
    offer: 99,
    unit: "per employee/month",
    tokenAmount: 5000,
    agreementMonths: 11,
    replacementMonths: null,
    freeHrmsMonths: null,
    closureDays: null,
    included: [
      "Geo-tagging",
      "Geo-fencing",
      "Mobile attendance",
      "Shift management",
      "Real-time attendance reports",
    ],
    benefits: ["80% below MRP"],
    itemDescription:
      "AI Automated Attendance System, 11-month agreement. Geo-tagging, geo-fencing, mobile attendance, shift management, real-time reports.",
  },
  {
    id: "ai_interview",
    section: "B",
    category: "Individual Products",
    name: "AI Candidate Interview System",
    feeText: `${RS}99 per week (MRP ${RS}299 per candidate)`,
    mrp: null,
    mrpText: `${RS}299 per candidate`,
    offer: 99,
    unit: "per week",
    tokenAmount: 5000,
    agreementMonths: 11,
    replacementMonths: null,
    freeHrmsMonths: null,
    closureDays: null,
    included: [
      "AI screening",
      "AI scoring",
      "Interview reports",
      "HR recommendation engine",
    ],
    benefits: ["Flat weekly pricing regardless of candidate volume"],
    itemDescription:
      "AI Candidate Interview System, 11-month agreement. AI screening, AI scoring, interview reports and HR recommendation engine.",
  },
  {
    id: "evs_portal",
    section: "B",
    category: "Individual Products",
    name: "Employee Verification Portal",
    feeText: `${RS}999/month unlimited verifications (MRP ${RS}1,000 per employee)`,
    mrp: null,
    mrpText: `${RS}1,000 per employee`,
    offer: 999,
    unit: "per month (unlimited verifications)",
    tokenAmount: 0,
    agreementMonths: 11,
    replacementMonths: null,
    freeHrmsMonths: null,
    closureDays: null,
    included: [
      "Document verification",
      "ID verification",
      "Employment verification",
      "Background workflow",
    ],
    benefits: ["Unlimited verifications at a flat monthly price"],
    itemDescription:
      "Employee Verification Portal, 11-month agreement. Unlimited document, ID and employment verifications with full background workflow.",
  },
  {
    id: "hrms_standalone",
    section: "B",
    category: "Individual Products",
    name: "Standalone HRMS Subscription",
    feeText: `${RS}299 per employee/month (MRP ${RS}1,000)`,
    mrp: 1000,
    mrpText: null,
    offer: 299,
    unit: "per employee/month",
    tokenAmount: 0,
    agreementMonths: 11,
    replacementMonths: null,
    freeHrmsMonths: null,
    closureDays: null,
    included: [
      "Attendance",
      "Leave management",
      "Payroll support",
      "Employee database",
      "Offer letters",
      "Experience letters",
      "Reports & analytics",
      "HR support desk",
    ],
    benefits: ["70% below MRP"],
    itemDescription:
      "Standalone HRMS Subscription, 11-month agreement. Attendance, leave, payroll support, employee database, offer & experience letters, reports & analytics, HR support desk.",
  },
];

export const findPlan = (id) => PLAN_CATALOG.find((p) => p.id === id) || null;
