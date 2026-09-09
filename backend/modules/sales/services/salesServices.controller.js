import {
  fetchAdminServices,
  createAdminServiceItem,
  updateAdminServiceItem,
  deleteAdminServiceItem,
} from "./salesServices.service.js";

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

    const RS = "\u20B9"; // rupee symbol

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        * { box-sizing: border-box; }

        body {
          margin: 0;
          font-family: 'Segoe UI', Arial, sans-serif;
          background: #eef2ff;
        }

        .container {
          padding: 36px;
        }

        .card {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #4f46e5 0%, #4338ca 55%, #7e22ce 100%);
          border-radius: 28px;
          padding: 40px;
          color: #ffffff;
          box-shadow: 0 25px 60px rgba(67, 56, 202, 0.35);
        }

        .circle {
          position: absolute;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.08);
        }

        .circle-1 { width: 220px; height: 220px; top: -70px; right: -70px; }
        .circle-2 { width: 140px; height: 140px; bottom: -40px; left: -40px; }

        .inner { position: relative; }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .brand-mark {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 700;
        }

        .company {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .subtitle {
          font-size: 12px;
          color: #c7d2fe;
          margin-top: 2px;
        }

        .date-chip {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 9999px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 500;
        }

        .title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.01em;
          margin-bottom: 24px;
        }

        .price-box {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .row + .row { margin-top: 14px; }

        .label {
          font-size: 13px;
          color: #c7d2fe;
        }

        .mrp {
          text-decoration: line-through;
          color: #a5b4fc;
          font-size: 17px;
        }

        .offer-label {
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
        }

        .offer {
          font-size: 34px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #6ee7b7;
        }

        .details {
          font-size: 14px;
          line-height: 1.5;
        }

        .details p {
          margin: 0 0 10px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: #a5b4fc;
          flex-shrink: 0;
        }

        .desc {
          margin-top: 22px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 16px 18px;
          font-size: 13px;
          line-height: 1.6;
          color: #e0e7ff;
        }

        .footer {
          text-align: center;
          font-size: 11px;
          margin-top: 28px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          color: #c7d2fe;
        }
      </style>
    </head>

    <body>
      <div class="container">
        <div class="card">
          <div class="circle circle-1"></div>
          <div class="circle circle-2"></div>

          <div class="inner">
            <div class="header">
              <div class="brand">
                <div class="brand-mark">R</div>
                <div>
                  <div class="company">Recruweb Resources</div>
                  <div class="subtitle">Premium Services</div>
                </div>
              </div>
              <div class="date-chip">${new Date().toLocaleDateString("en-GB")}</div>
            </div>

            <div class="title">
              ${service.service_name} — Plan ${service.plan_name}
            </div>

            <div class="price-box">
              <div class="row">
                <span class="label">MRP</span>
                <span class="mrp">${RS}${service.mrp}</span>
              </div>

              <div class="row">
                <span class="offer-label">Offer Price</span>
                <span class="offer">${RS}${service.pricing_value}</span>
              </div>
            </div>

            <div class="details">
              <p><span class="dot"></span>Replacement: ${service.replacement_months} months</p>
              <p><span class="dot"></span>Token: ${RS}${service.token_amount}</p>
              <p><span class="dot"></span>Payment: ${service.payment_terms}</p>
            </div>

            ${
              service.description
                ? `<div class="desc">${service.description}</div>`
                : ""
            }

            <div class="footer">
              Designed for premium client experience
            </div>
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
      height: "700px",

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
