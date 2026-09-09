import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

function VerifyDocument() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("");

  const verify = async () => {
    try {
      await API.get(`/verify-document/${id}?status=Verified`);
      setStatus("Verified Successfully");
    } catch (err) {
      console.log(err);
      setStatus("Verification Failed");
    }
  };

  const reject = async () => {
    try {
      await API.get(`/verify-document/${id}?status=Rejected`);
      setStatus("Rejected Successfully");
    } catch (err) {
      console.log(err);
      setStatus("Rejection Failed");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>

      <h2>Document Verification</h2>

      <p>Document ID: {id}</p>

      <button onClick={verify} style={{ margin: "10px", padding: "10px" }}>
        Verify
      </button>

      <button onClick={reject} style={{ margin: "10px", padding: "10px" }}>
        Reject
      </button>

      <p>{status}</p>

      <br />

      <button onClick={() => navigate("/")}>
        Go Back
      </button>

    </div>
  );
}

export default VerifyDocument;