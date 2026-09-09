import {
  fetchAdminServices,
  createAdminServiceItem,
  updateAdminServiceItem,
  deleteAdminServiceItem,
} from "./admin.services.service.js";

import puppeteer from "puppeteer";
import { db } from "../../../config/db.js";

// GET
export const getAllAdminServices = async (req, res) => {
  const data = await fetchAdminServices();
  res.json(data);
};

// CREATE
export const createAdminService = async (req, res) => {
  const newItem = await createAdminServiceItem(req.body);
  res.json(newItem);
};

// UPDATE
export const updateAdminService = async (req, res) => {
  const { id } = req.params;
  const updated = await updateAdminServiceItem(id, req.body);
  res.json(updated);
};

// DELETE
export const deleteAdminService = async (req, res) => {
  const { id } = req.params;
  await deleteAdminServiceItem(id);
  res.json({ message: "Deleted" });
};

export const generateServicePDF = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(`SELECT * FROM admin_services WHERE id = ?`, [
      id,
    ]);

    if (!rows.length) {
      return res.status(404).send("Service not found");
    }

    const service = rows[0];

    const html = `
    <html>
    <head>
      <style>
        body {
          margin: 0;
          font-family: 'Segoe UI', sans-serif;
          background: linear-gradient(135deg,#bfdbfe,#a7f3d0,#d9f99d);
        }

        .container {
          padding: 40px;
        }

        .card {
          background: linear-gradient(135deg,#d9f99d,#a7f3d0,#bfdbfe);
          border-radius: 25px;
          padding: 30px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.15);
        }

        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 25px;
        }

        .company {
          font-size: 26px;
          font-weight: 600;
        }

        .subtitle {
          font-size: 12px;
          color: #666;
        }

        .title {
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .price-box {
          background: rgba(255,255,255,0.7);
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .mrp {
          text-decoration: line-through;
          color: #999;
        }

        .offer {
          font-size: 26px;
          font-weight: bold;
          color: #16a34a;
        }

        .details {
          font-size: 14px;
          color: #444;
          margin-top: 10px;
        }

        .desc {
          margin-top: 15px;
          font-size: 14px;
          color: #333;
        }

        .footer {
          text-align: center;
          font-size: 11px;
          margin-top: 20px;
          color: #777;
        }
      </style>
    </head>

    <body>
      <div class="container">
        <div class="card">

          <div class="header">
            <div>
              <div class="company">Recruweb Resources</div>
              <div class="subtitle">Premium Services</div>
            </div>
            <div class="subtitle">${new Date().toLocaleDateString()}</div>
          </div>

          <div class="title">
            ${service.service_name} — ${service.plan_name}
          </div>

          <div class="price-box">
            <div class="row">
              <span>MRP</span>
              <span class="mrp">₹${service.mrp}</span>
            </div>

            <div class="row">
              <span>Offer Price</span>
              <span class="offer">₹${service.pricing_value}</span>
            </div>
          </div>

          <div class="details">
            <p>🔁 Replacement: ${service.replacement_months} months</p>
            <p>💰 Token: ₹${service.token_amount}</p>
            <p>📅 Payment: ${service.payment_terms}</p>
          </div>

          <div class="desc">
            ${service.description || ""}
          </div>

          <div class="footer">
            Designed for premium client experience
          </div>

        </div>
      </div>
    </body>
    </html>
    `;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      printBackground: true,

      width: "900px", 
      height: "600px", 
      
      margin: {
        top: "0px",
        bottom: "0px",
        left: "0px",
        right: "0px",
      },
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=service.pdf",
    });

    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).send("PDF generation failed");
  }
};
