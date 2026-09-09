import * as query from "./work.query.js";

// ASSIGNMENTS
export const getAssignments = () => query.getAssignments();

export const createAssignment = (data, user) => {
  const payload = {
    title: data.title,
    description: data.description,

    assigned_to: data.assignedTo,
    assigned_to_name: data.assignedToName,

    department: data.department,
    department_id: data.departmentId,

    priority: data.priority,
    status: data.status,

    due_date: data.dueDate ? data.dueDate : null,
    progress: data.progress || 0,

    created_by: user?.name || "Admin",
  };

  return query.createAssignment(payload);
};

export const updateAssignment = async (id, data) => {
  // get existing record first
  const [existing] = await query.getAssignmentById(id);

  if (!existing) throw new Error("Assignment not found");

  const payload = {
    title: data.title ?? existing.title,
    description: data.description ?? existing.description,

    assigned_to: data.assignedTo ?? existing.assigned_to,
    assigned_to_name: data.assignedToName ?? existing.assigned_to_name,

    department: data.department ?? existing.department,
    department_id: data.departmentId ?? existing.department_id,

    priority: data.priority ?? existing.priority,
    status: data.status ?? existing.status,

    due_date: data.dueDate ?? existing.due_date,
    progress: data.progress ?? existing.progress,
  };

  return query.updateAssignment(id, payload);
};

export const deleteAssignment = (id) => query.deleteAssignment(id);

export const getAssignmentStats = () => query.getAssignmentStats();

// EOD
export const getEODReports = () => query.getEODReports();

export const createEOD = (data) => {
  const payload = {
    employee_id: Number(data.employeeId),
    employee_name: data.employeeName,
    department: data.department || "",
    department_id: data.departmentId,

    report_date: data.date,

    tasks_completed: data.tasksCompleted,
    tasks_in_progress: data.tasksInProgress,
    blockers: data.blockers,
    tomorrow_plan: data.tomorrowPlan,
    notes: data.notes,

    status: data.status || "submitted",
  };

  return query.createEOD(payload);
};

export const updateEOD = (id, data) => query.updateEOD(id, data);

export const getEODStats = () => query.getEODStats();

export const getPendingEOD = () => query.getPendingEOD();

export const approveEOD = (id, data, user) =>
  query.approveEOD(id, {
    ...data,
    approved_by: user?.name || "Admin",
  });

export const getDepartments = () => {
  return query.getDepartments();
};

export const getEmployees = () => {
  return query.getEmployees();
};

export const rejectEOD = (id, user) =>
  query.rejectEOD(id, {
    rejected_by: user?.name || "Admin",
  });
  
export const deleteEOD = (id) => query.deleteEOD(id);