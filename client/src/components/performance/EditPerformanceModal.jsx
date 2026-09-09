import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";

export default function EditPerformanceModal({ open, onClose, performance, form, setForm, onSubmit, employeeOptions }) {
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRatingClick = (rating) => {
    setForm((prev) => ({ ...prev, rating }));
  };

  const getRatingStyle = (r, current) => {
    const rating = Number(current || 0);
    if (r <= rating) return "bg-green-500 border-green-600 text-white";
    if (r - 0.5 <= rating) return "bg-yellow-400 border-yellow-500 text-white";
    return "bg-gray-100 border-gray-300 text-gray-400";
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Performance Record" size="lg">
      <form onSubmit={onSubmit} className="space-y-5">
        <Select
          label="Employee"
          required
          value={form.employeeId}
          onChange={(e) => handleChange("employeeId", Number(e.target.value))}
          options={employeeOptions}
          disabled
        />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRatingClick(r)}
                className={`w-10 h-10 rounded-lg border-2 font-bold transition-all ${getRatingStyle(r, form.rating)} ${
                  Number(form.rating) === r ? "scale-110 shadow-md" : "hover:scale-105"
                }`}
              >
                {r}
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500">
              {form.rating >= 4 ? "Excellent" : form.rating === 3 ? "Good" : "Poor"}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <div
                  key={r}
                  className={`w-3 h-3 rounded-full ${
                    r <= Number(form.rating) ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Review / Comments
          </label>
          <textarea
            value={form.review}
            onChange={(e) => handleChange("review", e.target.value)}
            placeholder="Enter performance review or comments..."
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-black resize-none"
          />
        </div>

        <Input
          label="Review Date"
          type="date"
          required
          value={form.reviewDate}
          onChange={(e) => handleChange("reviewDate", e.target.value)}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-black text-white hover:bg-gray-900 font-semibold transition"
          >
            Update Performance
          </button>
        </div>
      </form>
    </Modal>
  );
}
