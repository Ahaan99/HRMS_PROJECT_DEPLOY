import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function CreateInvoice() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    client_name: "",
    client_address: "",
    client_gstin: "",
    invoice_date: "",
    description: "",
    hsn: "",
    quantity: 1,
    rate: 0,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const amount = form.quantity * form.rate;
      const cgst = amount * 0.09;
      const sgst = amount * 0.09;

      const payload = {
        invoice_no: "INV-" + Date.now(),
        client_name: form.client_name,
        client_address: form.client_address,
        client_gstin: form.client_gstin,
        invoice_date: form.invoice_date,
        taxable_amount: amount,
        cgst,
        sgst,
        total_amount: amount + cgst + sgst,
        items: [
          {
            description: form.description,
            hsn_sac: form.hsn,
            gst_rate: 18,
            quantity: form.quantity,
            rate: form.rate,
            amount,
          },
        ],
      };

      const token = localStorage.getItem("hrms_client_Token");

      const res = await axios.post(`${BASE_URL}/client/invoices`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate(`/invoice/${res.data.invoice.invoiceId}`);
    } catch (err) {
      console.error("Create invoice error:", err);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-semibold mb-6">Create Invoice</h1>

      <div className="grid gap-4">
        <input
          name="client_name"
          placeholder="Client Name"
          className="border p-2"
          onChange={handleChange}
        />

        <input
          name="client_address"
          placeholder="Client Address"
          className="border p-2"
          onChange={handleChange}
        />

        <input
          name="client_gstin"
          placeholder="Client GSTIN"
          className="border p-2"
          onChange={handleChange}
        />

        <input
          name="invoice_date"
          type="date"
          className="border p-2"
          onChange={handleChange}
        />

        <input
          name="description"
          placeholder="Service Description"
          className="border p-2"
          onChange={handleChange}
        />

        <input
          name="hsn"
          placeholder="HSN/SAC"
          className="border p-2"
          onChange={handleChange}
        />

        <input
          name="quantity"
          type="number"
          placeholder="Quantity"
          className="border p-2"
          onChange={handleChange}
        />

        <input
          name="rate"
          type="number"
          placeholder="Rate"
          className="border p-2"
          onChange={handleChange}
        />

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white py-2 rounded"
        >
          Generate Invoice
        </button>
      </div>
    </div>
  );
}
