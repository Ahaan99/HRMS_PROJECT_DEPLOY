import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import API from "../services/api";

function Documents() {

  const [documents, setDocuments] = useState([]);
  const [hrmsDocs, setHrmsDocs] = useState([]);

  const [employeeId, setEmployeeId] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchDocuments();
    API.get("/hrms-documents")
      .then((res) => setHrmsDocs(res.data.documents || []))
      .catch(() => {});
  }, []);

  // GET ALL DOCUMENTS
  const fetchDocuments = async () => {
    try {
      const res = await API.get("/documents");
      setDocuments(res.data);
    } catch (error) {
      console.log("Documents Fetch Error", error);
    }
  };

  // UPLOAD DOCUMENT
  const uploadDocument = async () => {
    if (!employeeId || !documentName || !file) {
      alert("Please fill all fields");
      return;
    }

    const formData = new FormData();
    formData.append("employee_id", employeeId);
    formData.append("document_name", documentName);
    formData.append("file", file);

    try {
      await API.post("/upload-document", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Document Uploaded Successfully");

      setEmployeeId("");
      setDocumentName("");
      setFile(null);

      fetchDocuments();
    } catch (error) {
      console.log(error);
      alert("Upload Failed");
    }
  };

  // VERIFY / REJECT
  const verifyDocument = async (id, status) => {
    try {
      await API.get(`/verify-document/${id}?status=${status}`);
      alert(`Document ${status}`);
      fetchDocuments();
    } catch (error) {
      console.log(error);
    }
  };

  // 📧 SEND EMAIL (NEW FEATURE)
  const sendVerificationEmail = async (id, email) => {
    try {
      await API.post(`/send-verification-email/${id}?email=${email}`);
      alert("Email sent successfully");
    } catch (error) {
      console.log(error);
      alert("Email failed");
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />

      <div className="content">

        <h2>Documents Management</h2>

        {/* UPLOAD FORM */}
        <div className="form-container">

          <input
            type="number"
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />

          <input
            type="text"
            placeholder="Document Name"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
          />

          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button onClick={uploadDocument}>
            Upload Document
          </button>

        </div>

        {/* TABLE */}
        <div className="table-wrap"><table>

          <thead>
            <tr>
              <th>ID</th>
              <th>Employee ID</th>
              <th>Document Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {documents.map((doc) => (
              <tr key={doc.id}>

                <td>{doc.id}</td>
                <td>{doc.employee_id}</td>
                <td>{doc.document_name}</td>

                <td>
                  <span className={
                    doc.status === "Verified"
                      ? "status verified"
                      : doc.status === "Rejected"
                        ? "status rejected"
                        : "status pending"
                  }>
                    {doc.status}
                  </span>
                </td>

                <td>

                  <button
                    className="btn-success" onClick={() => verifyDocument(doc.id, "Verified")}
                  >
                    Verify
                  </button>

                  <button
                    className="btn-danger" onClick={() => verifyDocument(doc.id, "Rejected")}
                  >
                    Reject
                  </button>

                  {/* EMAIL BUTTON */}
                  <button
                    onClick={() =>
                      sendVerificationEmail(doc.id, "test@example.com")
                    }
                  >
                    Send Email
                  </button>

                </td>

              </tr>
            ))}

          </tbody>

        </table></div>

        <h3>Documents from HRMS Admin Portal</h3>
        <p className="page-desc">
          Read-only view of documents uploaded and verified by the Super Admin
          in the main HRMS.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Document Type</th>
                <th>Status</th>
                <th>Verified By</th>
                <th>Remarks</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {hrmsDocs.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.employee_name}</td>
                  <td>{d.doc_type}</td>
                  <td>
                    <span
                      className={
                        "status " +
                        (d.status === "Verified"
                          ? "verified"
                          : d.status === "Rejected"
                            ? "rejected"
                            : "pending")
                      }
                    >
                      {d.status}
                    </span>
                  </td>
                  <td>{d.verified_by || "-"}</td>
                  <td>{d.remarks || "-"}</td>
                  <td style={{ color: "#6b7280" }}>
                    {d.created_at ? d.created_at.slice(0, 10) : "-"}
                  </td>
                </tr>
              ))}
              {hrmsDocs.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ color: "#6b7280" }}>
                    No documents in the HRMS admin portal yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </>
  );
}

export default Documents;