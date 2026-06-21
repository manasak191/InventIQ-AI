# InventIQ AI – Intelligent Inventory Management System

## Overview

InventIQ AI is an AI-powered Inventory Management System designed to help businesses manage inventory efficiently through real-time stock monitoring, user authentication, role-based access control, and intelligent inventory insights.

The system provides separate dashboards for Admins and Users, secure authentication using OTP verification, and a modern responsive user interface.

---

## Features

### Authentication System

* User Registration
* Admin Registration
* Email OTP Verification
* Login Authentication
* Forgot Password Functionality
* Role-Based Access Control
* JWT Token Authentication

### User Dashboard

* Inventory Overview
* Stock Monitoring
* Inventory Statistics
* User-Friendly Interface

### Admin Dashboard

* Manage Users
* Inventory Management
* Analytics Overview
* Administrative Controls

### Security Features

* Password Hashing using bcrypt
* Email Verification
* Protected Routes
* JWT Authentication

---

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Framer Motion
* React Toastify

### Backend

* FastAPI
* SQLAlchemy
* PostgreSQL
* Passlib (bcrypt)
* Uvicorn

### Database

* PostgreSQL

---

## Project Structure

```text
AI_Inventory_Management_System
│
├── backend
│   ├── app
│   │   ├── api
│   │   ├── core
│   │   ├── db
│   │   ├── services
│   │   └── schemas
│   ├── main.py
│   └── requirements.txt
│
├── frontend
│   ├── src
│   │   ├── api
│   │   ├── components
│   │   ├── context
│   │   ├── pages
│   │   └── App.tsx
│   └── package.json
│
└── README.md
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/your-username/AI_Inventory_Management_System.git
cd AI_Inventory_Management_System
```

---

## Backend Setup

### Create Virtual Environment

```bash
cd backend
python -m venv venv
```

### Activate Virtual Environment

Windows:

```bash
venv\Scripts\activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Backend Server

```bash
uvicorn main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

Swagger Documentation:

```text
http://127.0.0.1:8000/docs
```

---

## Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Run Frontend:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## Authentication Flow

1. Register User/Admin
2. Receive OTP via Email
3. Verify Email
4. Login
5. Access Dashboard

---

## Future Enhancements

* AI Demand Forecasting
* Low Stock Alerts
* Supplier Management
* Purchase Order Automation
* Inventory Reports
* Data Visualization Dashboards
* Multi-Warehouse Support

---


