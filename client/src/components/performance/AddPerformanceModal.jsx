import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";

export default function AddPerformanceModal({ open, onClose, form, setForm, onSubmit, employeeOptions }) {
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRatingClick = (rating) => {
    setForm((prev) => ({ ...prev, rating }));
  };

  const getRatingStyle = (r, current) => {
    const rating = Number(current || 0);
    if (r <= rating)
      return "bg-gradient-to-br from-violet-600 to-indigo-600 border-transparent text-white shadow-md shadow-indigo-600/25";
    return "bg-white border-gray-200 text-gray-400 hover:border-violet-300 hover:text-violet-600";
  };

  const ratingLabel =
    form.rating >= 4 ? "Excellent" : Number(form.rating) === 3 ? "Good" : "Poor";
  const ratingLabelColor =
    form.rating >= 4
      ? "text-emerald-600"
      : Number(form.rating) === 3
        ? "text-amber-600"
        : "text-rose-600";

  return (
    <Modal open={open} onClose={onClose} title="Add Performance Record" size="lg">
      <form onSubmit={onSubmit} className="space-y-5">
        <Select
          label="Employee"
          required
          value={form.employeeId}
          onChange={(e) => handleChange("employeeId", Number(e.target.value))}
          options={employeeOptions}
        />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Rating <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRatingClick(r)}
                className={`w-10 h-10 rounded-xl border font-bold transition-all ${getRatingStyle(r, form.rating)} ${
                  Number(form.rating) === r ? "scale-110" : "hover:scale-105"
                }`}
              >
                {r}
              </button>
            ))}
            <span className={`ml-2 text-sm font-semibold ${ratingLabelColor}`}>
              {ratingLabel}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <div
                  key={r}
                  className={`h-1.5 w-6 rounded-full transition-colors ${
                    r <= Number(form.rating)
                      ? "bg-gradient-to-r from-violet-500 to-indigo-500"
                      : "bg-gray-200"
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
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 resize-none transition"
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
            className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold shadow-sm hover:border-gray-300 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/35 transition"
          >
            Add Performance
          </button>
        </div>
      </form>
    </Modal>
  );
}
