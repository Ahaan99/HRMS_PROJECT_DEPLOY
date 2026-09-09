import { useState, useEffect } from "react";
import { Clock, Save, Plus, Trash2, Edit2, Sun, Moon, SunMoon } from "lucide-react";
import toast from "react-hot-toast";

export default function ShiftTimings({ onSave, initialShifts = [] }) {
  const [shifts, setShifts] = useState(initialShifts);

  useEffect(() => {
    setShifts(initialShifts);
  }, [initialShifts]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    checkInStart: "09:00",
    checkInEnd: "10:00",
    checkOutStart: "17:00",
    checkOutEnd: "18:00",
    graceMinutes: 15,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "graceMinutes" ? parseInt(value) || 0 : value,
    }));
  };

  const getShiftIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes("morning") || lower.includes("day") || lower.includes("general")) {
      return <Sun className="w-5 h-5 text-amber-500" />;
    }
    if (lower.includes("evening") || lower.includes("night")) {
      return <Moon className="w-5 h-5 text-indigo-500" />;
    }
    return <SunMoon className="w-5 h-5 text-blue-500" />;
  };

  const handleAdd = () => {
    if (!formData.name) {
      toast.error("Please enter a shift name");
      return;
    }

    const newShift = {
      id: Date.now(),
      ...formData,
    };

    setShifts((prev) => [...prev, newShift]);
    resetForm();
    toast.success("Shift timing added");
  };

  const handleEdit = (shift) => {
    setEditingId(shift.id);
    setFormData({
      name: shift.name,
      checkInStart: shift.checkInStart,
      checkInEnd: shift.checkInEnd,
      checkOutStart: shift.checkOutStart,
      checkOutEnd: shift.checkOutEnd,
      graceMinutes: shift.graceMinutes,
    });
  };

  const handleUpdate = () => {
    if (!formData.name) {
      toast.error("Please enter a shift name");
      return;
    }

    setShifts((prev) =>
      prev.map((s) =>
        s.id === editingId ? { ...s, ...formData } : s
      )
    );
    resetForm();
    toast.success("Shift timing updated");
  };

  const handleDelete = (id) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
    toast.success("Shift timing deleted");
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      name: "",
      checkInStart: "09:00",
      checkInEnd: "10:00",
      checkOutStart: "17:00",
      checkOutEnd: "18:00",
      graceMinutes: 15,
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await onSave?.(shifts);
      toast.success("Shift timings saved successfully");
    } catch {
      /* the page-level handler already shows the error toast */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Clock className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Shift Timings</h3>
            <p className="text-sm text-gray-500">Set login and logout times for shifts</p>
          </div>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Shift
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-4">
            {editingId ? "Edit Shift Timing" : "Add New Shift Timing"}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shift Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., General Shift"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Login Start Time
              </label>
              <input
                type="time"
                name="checkInStart"
                value={formData.checkInStart}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Login End Time
              </label>
              <input
                type="time"
                name="checkInEnd"
                value={formData.checkInEnd}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logout Start Time
              </label>
              <input
                type="time"
                name="checkOutStart"
                value={formData.checkOutStart}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logout End Time
              </label>
              <input
                type="time"
                name="checkOutEnd"
                value={formData.checkOutEnd}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grace Period (minutes)
              </label>
              <input
                type="number"
                name="graceMinutes"
                value={formData.graceMinutes}
                onChange={handleInputChange}
                min="0"
                max="60"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Save className="w-4 h-4" />
              {editingId ? "Update" : "Add"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {shifts.length === 0 && !isAdding ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No shift timings configured</p>
            <p className="text-sm">Add shifts to set work hours</p>
          </div>
        ) : (
          shifts.map((shift) => (
            <div
              key={shift.id}
              className="p-4 bg-gray-50 rounded-xl border border-gray-100"
            >
              {editingId === shift.id ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <input
                      type="time"
                      name="checkInStart"
                      value={formData.checkInStart}
                      onChange={handleInputChange}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <input
                      type="time"
                      name="checkInEnd"
                      value={formData.checkInEnd}
                      onChange={handleInputChange}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <input
                      type="time"
                      name="checkOutStart"
                      value={formData.checkOutStart}
                      onChange={handleInputChange}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <input
                      type="time"
                      name="checkOutEnd"
                      value={formData.checkOutEnd}
                      onChange={handleInputChange}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      name="graceMinutes"
                      value={formData.graceMinutes}
                      onChange={handleInputChange}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={resetForm}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdate}
                      className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Update
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg">
                    {getShiftIcon(shift.name)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{shift.name}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className="text-emerald-500 font-medium">Login:</span>
                        <span>{shift.checkInStart} - {shift.checkInEnd}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-red-500 font-medium">Logout:</span>
                        <span>{shift.checkOutStart} - {shift.checkOutEnd}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Grace:</span>
                        <span>{shift.graceMinutes} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(shift)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(shift.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {shifts.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition font-medium"
          >
            {saving ? "Saving..." : (
              <>
                <Save className="w-5 h-5" />
                Save All Shift Timings
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
