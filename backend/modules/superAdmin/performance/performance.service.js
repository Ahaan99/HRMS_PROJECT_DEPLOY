import * as query from "./performance.query.js";

const calculate = (scores) => {
  const values = Object.values(scores);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  let status = "needs_improvement";
  if (avg >= 8) status = "excellent";
  else if (avg >= 6) status = "good";

  return { avg, status };
};

export const getAll = async (filters) => {
  return await query.getAll(filters);
};

export const create = async (data, user) => {
  const { avg, status } = calculate(data.scores);

  const payload = {
    employee_id: data.employeeId,
    employee_name: data.employeeName,

    department: data.department,
    department_id: data.departmentId,

    period: data.period,

    // 🔥 FLATTEN SCORES
    quality: data.scores?.quality || 0,
    productivity: data.scores?.productivity || 0,
    communication: data.scores?.communication || 0,
    teamwork: data.scores?.teamwork || 0,
    attendance: data.scores?.attendance || 0,
    initiative: data.scores?.initiative || 0,
    deadline: data.scores?.deadline || 0,
    adaptability: data.scores?.adaptability || 0,

    avg_score: avg,
    status,

    remarks: data.remarks,

    reviewed_by: user?.name || "Admin",
    reviewed_at: new Date(),
  };

  return await query.create(payload);
};

export const update = async (id, data) => {
  const { avg, status } = calculate(data.scores);

  const payload = {
    quality: data.scores?.quality || 0,
    productivity: data.scores?.productivity || 0,
    communication: data.scores?.communication || 0,
    teamwork: data.scores?.teamwork || 0,
    attendance: data.scores?.attendance || 0,
    initiative: data.scores?.initiative || 0,
    deadline: data.scores?.deadline || 0,
    adaptability: data.scores?.adaptability || 0,

    avg_score: avg,
    status,
    remarks: data.remarks,
    reviewed_at: new Date(),
  };

  return await query.update(id, payload);
};

export const remove = async (id) => {
  return await query.remove(id);
};

export const getStats = async () => {
  return await query.getStats();
};

export const getByEmployee = async (employeeId) => {
  return await query.getByEmployee(employeeId);
};

export const bulkUpdate = async (payload) => {
  return await query.bulkUpdate(payload);
};

export const exportReport = async (filters) => {
  return await query.exportCSV(filters);
};

export const getEmployees = async () => {
  return await query.getEmployees();
};