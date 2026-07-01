# InventIQ AI — Full Stack Inventory Management System

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Edit .env with your PostgreSQL and Gmail credentials

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
API docs available at: http://localhost:8000/docs

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open: http://localhost:5173

---

## 📁 Project Structure

```
AI_Inventory_Management_System/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI app + all routers
│   │   ├── core/
│   │   │   ├── security.py             # JWT + bcrypt
│   │   │   ├── deps.py                 # Auth dependencies
│   │   │   └── config.py               # ENV config
│   │   ├── db/
│   │   │   ├── models/                 # SQLAlchemy models
│   │   │   │   ├── user.py
│   │   │   │   ├── product.py
│   │   │   │   ├── supplier.py
│   │   │   │   ├── transaction.py
│   │   │   │   ├── notification.py
│   │   │   │   └── order.py
│   │   │   └── database.py
│   │   ├── api/v1/
│   │   │   ├── routers/                # All API routes
│   │   │   │   ├── auth.py             # Register, login (JWT), OTP
│   │   │   │   ├── forgot_password.py  # Forgot/reset password
│   │   │   │   ├── products.py         # CRUD + low-stock + CSV export
│   │   │   │   ├── suppliers.py        # CRUD
│   │   │   │   ├── transactions.py     # IN/OUT/TRF + auto stock adjust
│   │   │   │   ├── notifications.py    # List + email alert
│   │   │   │   ├── orders.py           # Purchase orders
│   │   │   │   ├── reports.py          # Analytics
│   │   │   │   ├── dashboard.py        # KPIs
│   │   │   │   ├── users.py            # Admin user mgmt
│   │   │   │   └── ai.py               # AI chat (real DB)
│   │   │   └── schemas/                # Pydantic schemas
│   │   └── services/
│   │       ├── email_service.py        # OTP + low-stock alert emails
│   │       └── otp_service.py
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── App.jsx                     # Routing + AuthProvider
    │   ├── main.jsx
    │   ├── theme.js                    # Dark/Light tokens
    │   ├── api/
    │   │   ├── api.js                  # Axios + JWT interceptor
    │   │   ├── authService.js
    │   │   └── inventoryService.js     # All API calls
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── components/
    │   │   ├── Charts.js               # Line, Bar, Donut, Spark
    │   │   └── Layout.js               # Sidebar + Topbar
    │   └── pages/
    │       ├── LandingPage.jsx         # Public landing with animations
    │       ├── LoginPage.jsx           # Role tabs + forgot password
    │       ├── RegisterPage.jsx        # 3-step + OTP verify
    │       ├── AdminDashboard.jsx      # Admin shell + sidebar routing
    │       ├── UserDashboard.jsx       # User shell + sidebar routing
    │       ├── ProductsPage.jsx        # Full CRUD + CSV export
    │       ├── SuppliersPage.jsx       # Full CRUD + performance
    │       ├── TransactionsPage.jsx    # IN/OUT/TRF log
    │       ├── NotificationsPage.jsx   # Alerts + email trigger
    │       ├── ReportsPage.jsx         # Charts + AI insights
    │       └── AIAssistantPage.jsx     # Chat with real DB answers
    ├── package.json
    ├── vite.config.js
    └── index.html
```

---

## 🔑 Key Features

| Feature | Details |
|---|---|
| **JWT Auth** | Login returns token, stored in localStorage, sent on every request |
| **Role-based** | Admin vs User — different dashboards + protected routes |
| **OTP Email** | Registration sends 6-digit OTP via Gmail SMTP |
| **Low Stock Alert** | Auto-detects critical items → emails all admin accounts |
| **Stock Adjustment** | Creating IN/OUT transaction auto-updates product stock |
| **AI Assistant** | Answers from real DB — reorder advice, warehouse capacity, supplier ratings |
| **Dark/Light Mode** | Persisted toggle across all pages |
| **Separate Pages** | Each feature (Products, Suppliers, etc.) is its own dedicated page |

---

## ⚙️ Gmail Setup (for emails to work)
1. Go to Google Account → Security → 2-Step Verification → App Passwords
2. Create an app password for "Mail"
3. Put that 16-character password in `.env` as `EMAIL_PASSWORD`

---

## 🗄️ Database
Make sure PostgreSQL is running and create the database:
```sql
CREATE DATABASE inventiq;
```
Tables are created automatically on first startup.
