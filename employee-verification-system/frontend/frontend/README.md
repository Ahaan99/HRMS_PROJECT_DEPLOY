# Employee Verification Portal

## Project Overview

Employee Verification Portal is a full-stack web application developed using React.js, FastAPI, and MySQL.

This system allows organizations to upload employee documents and verify them digitally through secure email-based verification workflows.

The project includes authentication, role-based access control, document management, dashboard analytics, reports export, and audit logging.

---

# Tech Stack

## Frontend

* React.js
* React Router DOM
* Axios
* React Toastify
* XLSX
* jsPDF

## Backend

* Python FastAPI
* SQLAlchemy
* JWT Authentication
* FastAPI Mail

## Database

* MySQL

---

# Features

## Authentication & Authorization

* Login / Logout
* JWT Authentication
* Role-Based Access Control (RBAC)

## Employee Management

* Add Employee
* Update Employee
* Delete Employee
* Employee Listing

## Document Management

* Upload Documents
* Document Status Tracking
* View Uploaded Documents

## Email Verification System

* Verification Email Sending
* Secure Token-Based Verification
* Verify / Reject Workflow

## Dashboard

* Total Employees
* Total Documents
* Verified Documents
* Pending Documents
* Rejected Documents
* Recent Activities

## Reports

* PDF Export
* Excel Export

## Audit Logs

* Document Uploaded
* Document Verified
* Document Rejected

---

# Folder Structure

employee-verification-system/

├── frontend/

├── backend/

└── README.md

---

# Backend Setup

## Step 1

Navigate to backend folder

```bash
cd backend
```

## Step 2

Install dependencies

```bash
pip install -r requirements.txt
```

## Step 3

Run FastAPI server

```bash
uvicorn app.main:app --reload
```

Backend will run on:

```bash
http://127.0.0.1:8000
```

---

# Frontend Setup

## Step 1

Navigate to frontend folder

```bash
cd frontend
```

## Step 2

Install dependencies

```bash
npm install
```

## Step 3

Run frontend

```bash
npm run dev
```

Frontend will run on:

```bash
http://localhost:5173
```

---

# API Documentation

Swagger UI available at:

```bash
http://127.0.0.1:8000/docs
```

---

# Demo Credentials

## Admin Login

Email:

```bash
admin@test.com
```

Password:

```bash
admin123
```

---

# Security Features

* JWT Authentication
* Protected Routes
* Role-Based Access
* Secure Verification Tokens

---

# Future Enhancements

* OCR Integration
* Email Reminder Scheduler
* Charts & Analytics
* Docker Deployment
* AWS Hosting

---

# Project Status

* Demo Ready ✅
* Internship Ready ✅
* Around 90–95% Complete ✅

---

# Developed By

Prashant Upadhyay
