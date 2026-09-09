export const detectIntent = (message) => {
  const text = message.toLowerCase().trim();

  if (text.match(/^(hi|hello|hey|greetings|namaste|good morning|good afternoon|good evening)[\s!?.]*$/))
    return "GREETING";

  if (text.match(/attendance|present|absent|check.?in|check.?out|who.*came|who.*present|meri.*attendance|my.*attendance|late|punch|log in|log out|daily.*report|kaun.*aaya/))
    return "ATTENDANCE";

  if (text.match(/salary|payroll|payslip|ctc|wages|earning|deduction|net pay|gross|bonus|incentive|meri.*salary|my.*salary|kitni.*salary|payment/))
    return "SALARY";

  if (text.match(/\bleave\b|vacation|holiday|day.?off|time.?off|sick.*leave|casual.*leave|earned.*leave|approved.*leave|leave.*balance|kitne.*leave|my.*leave|leave.*apply|leave.*status|pending.*leave/))
    return "LEAVE";

  if (text.match(/eod|end of day|daily report|eod.*report|report.*submit|aaj.*kya kiya|what.*done.*today/))
    return "EOD";

  if (text.match(/work.*assign|assign.*work|my.*task|task.*assign|work.*list|kya.*karna|assigned.*to me|my.*work/))
    return "WORK_ASSIGNMENT";

  if (text.match(/target|kpi|goal|mera.*target|my.*target|kitna.*achieve|achievement|assigned.*target/))
    return "TARGET";

  if (text.match(/performance|rating|appraisal|review|feedback|score|ranking|evaluation|assessment/))
    return "PERFORMANCE";

  if (text.match(/invoice|bill|payment.*due|due.*date|invoice.*status|pending.*invoice|client.*invoice/))
    return "INVOICE";

  if (text.match(/lead|prospect|new.*lead|my.*lead|lead.*status|lead.*assign/))
    return "LEAD";

  if (text.match(/candidate|interview|hiring|recruitment|applicant|vacancy|onboard|joining|new.*hire|offer.*letter|resume|shortlist/))
    return "CANDIDATE";

  if (text.match(/complaint|grievance|issue.*raise|complaint.*status/))
    return "COMPLAINT";

  if (text.match(/policy|rule|regulation|guideline|work.*policy|company.*policy/))
    return "POLICY";

  if (text.match(/employee.*detail|employee.*info|all.*employee|show.*employee|employee.*list|who is|tell me about|staff|team.*member|my.*profile|mera.*profile|my.*detail|my.*info|profile|designation/))
    return "EMPLOYEE_INFO";

  if (text.match(/client.*detail|client.*info|all.*client|show.*client|client.*list|my.*client|assigned.*client|customer/))
    return "CLIENT_INFO";

  if (text.match(/sales|revenue|deal|pipeline|conversion|sales.*report|sales.*call/))
    return "SALES";

  if (text.match(/how many|total|count|kitne|kitni|stats|statistics|overview|summary|headcount|number of/))
    return "COMPANY_STATS";

  return "GENERAL";
};

export const extractName = (message) => {
  const patterns = [
    /(?:about|of|for|details? of|info (?:of|about)|who is|show me|tell me about|attendance of|salary of|leave of|performance of)\s+([A-Za-z][a-z]+(?: [A-Za-z][a-z]+)*)/i,
    /([A-Za-z][a-z]+(?: [A-Za-z][a-z]+)*)\s+(?:details?|information|info|attendance|salary|leave|performance|profile)/i,
    /(?:attendance|salary|leave|details?|info|profile|performance)\s+(?:of|for)\s+([A-Za-z][a-z]+(?: [A-Za-z][a-z]+)*)/i,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1].length > 2) return match[1];
  }
  return null;
};
