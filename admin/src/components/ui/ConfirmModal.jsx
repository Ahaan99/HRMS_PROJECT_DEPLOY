import Modal from "./Modal";

export default function ConfirmModal({
  open,
  onClose,
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Yes, Delete",
  cancelText = "Cancel",
  onConfirm,
  danger = true,
}) {
  return (
    <Modal open={open} title={title} onClose={onClose} width="max-w-md">
      <div className="space-y-5">
        <p className="text-gray-600 text-sm leading-relaxed">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition font-semibold"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-semibold transition text-white ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-black hover:bg-gray-900"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
