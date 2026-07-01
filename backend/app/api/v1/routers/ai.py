import os
import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from groq import Groq, RateLimitError, APIStatusError

from app.db.database import get_db
from app.db.models.product import Product
from app.db.models.supplier import Supplier
from app.db.models.user import User
from app.db.models.transaction import Transaction
from app.core.deps import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

# ── LLM client (Groq — free tier, fast inference, no training on your data) ─
# Get a free key at https://console.groq.com -> API Keys -> Create Key
# Add it to your .env (same folder you run uvicorn from) as: GROQ_API_KEY=...
load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=API_KEY) if API_KEY else None

MODEL = "llama-3.3-70b-versatile"  # strong reasoning, generous free tier

# ── Admin-only topics ───────────────────────────────────────────────────────
# Staff dashboard only has: product, transactions, notifications, overview.
# Anything matching these keywords is restricted to admin and is blocked
# BEFORE the LLM is ever called — no API cost, no chance of leaking via phrasing.
RESTRICTED_TOPICS = {
    "Suppliers": ["supplier", "vendor"],
    "Warehouse": ["warehouse", "capacity"],
    "Reports": ["report", "analytics"],
    "Users": ["user list", "users", "user account", "staff list", "employee list", "how many user"],
    "Settings": ["setting", "configuration", "config"],
}


def get_restricted_topic(message: str) -> Optional[str]:
    """Returns the matched admin-only section name if the message touches it, else None."""
    msg = message.lower()
    for topic, keywords in RESTRICTED_TOPICS.items():
        if any(k in msg for k in keywords):
            return topic
    return None


def build_context(db: Session, is_admin: bool,current_user=None) -> str:
    """Pull live inventory data and turn it into a compact text block the LLM can reason over.
    is_admin controls whether sensitive data (user accounts) is included at all —
    if it's not in the context, the LLM has no way to reveal it, regardless of phrasing."""
    
    products     = db.query(Product).all()
    suppliers    = db.query(Supplier).all()
    transactions = db.query(Transaction).order_by(Transaction.id.desc()).all()

    # Users data — admin sees all users summary, user sees ONLY their own info
    if is_admin:
        users = db.query(User).all()
    else:
        users = []  # never include other users' data for regular users

    if not products:
        return "INVENTORY DATA: No products currently in the database."

    low_stock     = [p for p in products if p.stock <= p.reorder_point]
    critical      = [p for p in products if p.stock <= p.reorder_point * 0.5]
    total_value   = sum(p.stock * p.price for p in products)

    warehouse_totals = {}
    for p in products:
        w = p.warehouse or "Unassigned"
        warehouse_totals[w] = warehouse_totals.get(w, 0) + p.stock

    lines = []

    # ── Summary line — user version never mentions other users ──
    if is_admin:
        all_users = db.query(User).all()
        summary = (
            f"SUMMARY: {len(products)} SKUs tracked, total stock value "
            f"₹{total_value:,.0f}, {len(suppliers)} suppliers, "
            f"{len(all_users)} registered users."
        )
    else:
        summary = (
            f"SUMMARY: {len(products)} SKUs tracked, total stock value "
            f"₹{total_value:,.0f}, {len(suppliers)} suppliers."
        )
    lines.append(summary)

    # ── Current user info (for non-admin only their own profile) ──
    if not is_admin and current_user:
        name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip()
        lines.append(
            f"\nCURRENT USER: {name} | role={current_user.role} | "
            f"email={current_user.email} | active={current_user.is_active}"
        )
        # Only show THIS user's transactions
        my_txns = [t for t in transactions if t.user_id == current_user.id]
        lines.append(
            f"MY TRANSACTIONS: {len(my_txns)} total — "
            f"{len([t for t in my_txns if t.type == 'IN'])} IN, "
            f"{len([t for t in my_txns if t.type == 'OUT'])} OUT"
        )

    lines.append("\nPRODUCTS (sku | name | stock | reorder_point | price | warehouse):")
    for p in products[:200]:
        lines.append(
            f"- {p.sku} | {p.name} | stock={p.stock} | "
            f"reorder_point={p.reorder_point} | price=₹{p.price} | "
            f"warehouse={p.warehouse or 'Unassigned'}"
        )

    if low_stock:
        lines.append(f"\nLOW STOCK ({len(low_stock)} items at or below reorder point):")
        for p in low_stock[:30]:
            lines.append(f"- {p.sku} ({p.name}): {p.stock} left, reorder point {p.reorder_point}")

    if critical:
        lines.append(f"\nCRITICAL STOCKOUT RISK ({len(critical)} items):")
        for p in critical[:30]:
            lines.append(f"- {p.sku} ({p.name}): only {p.stock} left")

    if warehouse_totals:
        lines.append("\nWAREHOUSE STOCK TOTALS:")
        for w, total in sorted(warehouse_totals.items(), key=lambda x: x[1]):
            lines.append(f"- {w}: {total} units")

    if suppliers:
        lines.append("\nSUPPLIERS (name | category | email | status | rating | on_time_percent | orders):")
        for s in suppliers[:50]:
            rating   = getattr(s, 'rating', 'N/A')
            on_time  = getattr(s, 'on_time_percent', 'N/A')
            category = getattr(s, 'category', 'N/A')
            email    = getattr(s, 'email', 'N/A')
            status   = getattr(s, 'status', 'active')
            orders   = getattr(s, 'orders', 0)
            lines.append(
                f"- {s.name} | category={category} | email={email} | "
                f"status={status} | rating={rating}★ | on_time={on_time}% | orders={orders}"
            )

    # ── Transactions — admin sees all, user sees only their own ──
    if is_admin:
        if transactions:
            total_in  = sum(t.value or 0 for t in transactions if t.type == "IN")
            total_out = sum(t.value or 0 for t in transactions if t.type == "OUT")
            lines.append(
                f"\nTRANSACTIONS SUMMARY: {len(transactions)} total — "
                f"{len([t for t in transactions if t.type == 'IN'])} IN (₹{total_in:,.0f}), "
                f"{len([t for t in transactions if t.type == 'OUT'])} OUT (₹{total_out:,.0f})"
            )
            lines.append("\nRECENT TRANSACTIONS (date | type | sku | product | qty | value | warehouse | by):")
            for t in transactions[:50]:
                date = t.created_at.strftime("%Y-%m-%d") if t.created_at else "unknown"
                lines.append(
                    f"- {date} | {t.type} | {t.sku} | {t.product_name} | "
                    f"qty={t.qty} | ₹{t.value:,.0f} | "
                    f"{t.warehouse or 'Unassigned'} | {t.user_name or 'unknown'}"
                )
    else:
        # User only sees their own transactions
        if current_user:
            my_txns = [t for t in transactions if t.user_id == current_user.id]
            if my_txns:
                lines.append(f"\nMY RECENT TRANSACTIONS:")
                for t in my_txns[:20]:
                    date = t.created_at.strftime("%Y-%m-%d") if t.created_at else "unknown"
                    lines.append(
                        f"- {date} | {t.type} | {t.sku} | {t.product_name} | "
                        f"qty={t.qty} | ₹{t.value:,.0f} | {t.warehouse or 'Unassigned'}"
                    )

    # ── Users — admin only, never shown to regular users ──
    if is_admin and users:
        active      = [u for u in users if u.is_active]
        role_counts = {}
        for u in users:
            r = u.role or "unassigned"
            role_counts[r] = role_counts.get(r, 0) + 1
        lines.append(
            f"\nUSERS: {len(users)} total, {len(active)} active. "
            f"Roles: {', '.join(f'{r}: {c}' for r, c in role_counts.items())}"
        )
        lines.append("USER LIST (name | role | active):")
        for u in users[:100]:
            name = f"{u.first_name or ''} {u.last_name or ''}".strip() or "(no name)"
            lines.append(f"- {name} | {u.role or 'unassigned'} | {'active' if u.is_active else 'inactive'}")

    return "\n".join(lines)


def call_llm(message: str, history: list, context: str) -> str:
    if client is None:
        return ("⚠ AI backend is not configured yet — add GROQ_API_KEY to your .env "
                "(get one free at https://console.groq.com) and wire it into your settings module.")

    system_prompt = (
        "You are InventIQ, an inventory management assistant. Answer the user's question "
        "using ONLY the inventory data provided below. Be specific, cite real SKUs/numbers "
        "from the data, and keep answers concise and actionable. If the data doesn't contain "
        "what's needed to answer, say you don't have access to that information — do not "
        "guess, and do not hint that restricted data might exist elsewhere.\n\n"
        f"{context}"
    )

    # Groq uses plain OpenAI-style {role, content} dicts — 'assistant' role works as-is,
    # no role translation needed (unlike Gemini's 'model' role).
    messages = [{"role": "system", "content": system_prompt}]
    for h in history:
        if h.get("content"):
            messages.append({"role": h.get("role", "user"), "content": h["content"]})
    messages.append({"role": "user", "content": message})

    max_retries = 2
    for attempt in range(max_retries + 1):
        try:
            resp = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                max_completion_tokens=600,
            )
            text = (resp.choices[0].message.content or "").strip()
            return text or "I couldn't generate a response. Please try rephrasing."
        except RateLimitError:
            # Daily/per-minute quota hit — retrying instantly won't help.
            return ("⚠ The AI assistant has hit its free-tier rate limit. "
                    "Please wait a moment and try again, or upgrade your Groq plan for higher limits.")
        except APIStatusError as e:
            if e.status_code >= 500 and attempt < max_retries:
                time.sleep(1.5 * (attempt + 1))
                continue
            return "⚠ The AI service is temporarily unavailable. Please try again shortly."
        except Exception:
            return "⚠ AI request failed unexpectedly. Please try again, or check server logs for details."


@router.post("/chat")
def ai_chat(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    message = payload.get("message", "")
    history = payload.get("history", [])

    is_admin = (getattr(current_user, "role", "") or "").lower() == "admin"

    if not is_admin:
        restricted = get_restricted_topic(message)
        if restricted:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied: {restricted} information is restricted to admin accounts only.",
            )

    context = build_context(db, is_admin)
    reply = call_llm(message, history, context)
    return {"response": reply}


@router.get("/forecast/{sku_id}")
def ai_forecast(
    sku_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    product = db.query(Product).filter(Product.sku == sku_id).first()
    if not product:
        return {"message": "Product not found", "forecast": None}
    return {
        "sku": product.sku,
        "current_stock": product.stock,
        "message": "Forecasting requires more historical transaction data for this SKU.",
    }