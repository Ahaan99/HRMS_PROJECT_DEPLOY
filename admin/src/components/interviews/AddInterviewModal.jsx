import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Toggle from "../ui/Toggle";

export default function AddInterviewModal({
  open,
  onClose,
  form,
  setForm,
  onSubmit,
  modeOptions,
  roundOptions,
  statusOptions,
}) {
  return (
    <Modal open={open} title="Schedule Interview" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Interview ID"
          value={form.interviewId}
          onChange={(e) =>
            setForm((p) => ({ ...p, interviewId: e.target.value }))
          }
          placeholder="INT1001 (optional)"
        />

        <Input
          label="Candidate Name"
          value={form.candidateName}
          onChange={(e) =>
            setForm((p) => ({ ...p, candidateName: e.target.value }))
          }
          placeholder="Candidate name"
        />

        <Input
          label="Candidate Email"
          value={form.candidateEmail}
          onChange={(e) =>
            setForm((p) => ({ ...p, candidateEmail: e.target.value }))
          }
          placeholder="candidate@gmail.com"
          type="email"
        />

        <Input
          label="Interviewer Name"
          value={form.interviewerName}
          onChange={(e) =>
            setForm((p) => ({ ...p, interviewerName: e.target.value }))
          }
          placeholder="Interviewer name"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Interview Date"
            value={form.interviewDate}
            onChange={(e) =>
              setForm((p) => ({ ...p, interviewDate: e.target.value }))
            }
            type="date"
          />

          <Input
            label="Interview Time"
            value={form.interviewTime}
            onChange={(e) =>
              setForm((p) => ({ ...p, interviewTime: e.target.value }))
            }
            type="time"
          />
        </div>

        <Select
          label="Mode"
          value={form.modeId}
          onChange={(e) =>
            setForm((p) => ({ ...p, modeId: Number(e.target.value) }))
          }
          options={modeOptions}
        />

        <Select
          label="Round"
          value={form.roundId}
          onChange={(e) =>
            setForm((p) => ({ ...p, roundId: Number(e.target.value) }))
          }
          options={roundOptions}
        />

        <Select
          label="Status"
          value={form.statusId}
          onChange={(e) =>
            setForm((p) => ({ ...p, statusId: Number(e.target.value) }))
          }
          options={statusOptions}
        />

        <Toggle
          label="Active Interview"
          desc="Inactive interview will not appear in main schedule."
          value={form.isActive}
          onChange={(val) => setForm((p) => ({ ...p, isActive: val }))}
        />

        <div className="pt-2 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition font-semibold"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-black text-white hover:bg-gray-900 transition font-semibold"
          >
            Schedule
          </button>
        </div>
      </form>
    </Modal>
  );
}
