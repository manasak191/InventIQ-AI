from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routers import (
    auth, products, suppliers, transactions,
    notifications, orders, reports, dashboard,
    users, ai, forgot_password, warehouse
)
from app.db.database import create_tables

app = FastAPI(title="InventIQ AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_tables()

app.include_router(auth.router)
app.include_router(forgot_password.router)
app.include_router(products.router)
app.include_router(suppliers.router)
app.include_router(transactions.router)
app.include_router(notifications.router)
app.include_router(orders.router)
app.include_router(reports.router)
app.include_router(dashboard.router)
app.include_router(users.router)
app.include_router(ai.router)
app.include_router(warehouse.router)

@app.get("/")
def root():
    return {"message": "InventIQ API Running"}
