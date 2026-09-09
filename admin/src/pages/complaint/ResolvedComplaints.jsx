import ComplaintList from "./ComplaintList";

/* /complaints/resolved — same premium list, opened on the Resolved tab. */
export default function ResolvedComplaints() {
  return <ComplaintList initialStatus="resolved" />;
}
