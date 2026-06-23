import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from google import genai
from google.genai import types

from app.db.database import get_db
from app.db.models.product import Product
from app.db.models.supplier import Supplier
from app.db.models.user import User
from app.core.deps import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

# ── LLM client (Google Gemini — free tier, no credit card) ─────────────────
# Get a free key at https://aistudio.google.com -> "Get API Key"
# Add it to your .env (project root, same level as where you run uvicorn from)
# as: GEMINI_API_KEY=your_key_here
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY) if API_KEY else None

MODEL = "gemini-2.5-flash"  # generous free tier, 1M context, good reasoning


def build_context(db: Session, is_admin: bool) -> str:
    """Pull live inventory data and turn it into a compact text block the LLM can reason over.
    is_admin controls whether sensitive data (user accounts) is included at all —
    if it's not in the context, the LLM has no way to reveal it, regardless of phrasing."""
    products = db.query(Product).all()
    suppliers = db.query(Supplier).all()
    users = db.query(User).all() if is_admin else []

    if not products:
        return "INVENTORY DATA: No products currently in the database."

    low_stock = [p for p in products if p.stock <= p.reorder_point]
    critical = [p for p in products if p.stock <= p.reorder_point * 0.5]
    total_value = sum(p.stock * p.price for p in products)

    warehouse_totals = {}
    for p in products:
        w = p.warehouse or "Unassigned"
        warehouse_totals[w] = warehouse_totals.get(w, 0) + p.stock

    lines = []
    summary = f"SUMMARY: {len(products)} SKUs tracked, total stock value ₹{total_value:,.0f}, {len(suppliers)} suppliers on file."
    if is_admin:
        summary += f" {len(users)} registered users."
    lines.append(summary)

    lines.append("\nPRODUCTS (sku | name | stock | reorder_point | price | warehouse):")
    for p in products[:200]:  # cap to keep prompt size sane
        lines.append(f"- {p.sku} | {p.name} | stock={p.stock} | reorder_point={p.reorder_point} | price=₹{p.price} | warehouse={p.warehouse or 'Unassigned'}")

    if low_stock:
        lines.append(f"\nLOW STOCK ({len(low_stock)} items at or below reorder point):")
        for p in low_stock[:30]:
            lines.append(f"- {p.sku} ({p.name}): {p.stock} left, reorder point {p.reorder_point}")

    if critical:
        lines.append(f"\nCRITICAL STOCKOUT RISK ({len(critical)} items at <=50% of reorder point):")
        for p in critical[:30]:
            lines.append(f"- {p.sku} ({p.name}): only {p.stock} left")

    if warehouse_totals:
        lines.append("\nWAREHOUSE STOCK TOTALS:")
        for w, total in sorted(warehouse_totals.items(), key=lambda x: x[1]):
            lines.append(f"- {w}: {total} units")

    if suppliers:
        lines.append("\nSUPPLIERS (name | rating | on_time_percent):")
        for s in suppliers[:50]:
            lines.append(f"- {s.name} | {s.rating}★ | {s.on_time_percent}% on-time")

    if users:
        active = [u for u in users if u.is_active]
        role_counts = {}
        for u in users:
            r = u.role or "unassigned"
            role_counts[r] = role_counts.get(r, 0) + 1
        lines.append(f"\nUSERS: {len(users)} total, {len(active)} active, {len(users) - len(active)} inactive.")
        lines.append("User roles breakdown: " + ", ".join(f"{r}: {c}" for r, c in role_counts.items()))
        lines.append("User list (name | role | active):")
        for u in users[:100]:
            name = f"{u.first_name or ''} {u.last_name or ''}".strip() or "(no name set)"
            lines.append(f"- {name} | {u.role or 'unassigned'} | {'active' if u.is_active else 'inactive'}")

    return "\n".join(lines)


def call_llm(message: str, history: list, context: str) -> str:
    if client is None:
        return ("⚠ AI backend is not configured yet — add GEMINI_API_KEY to your .env "
                "(get one free at https://aistudio.google.com) and wire it into your settings module.")

    system_prompt = (
        "You are InventIQ, an inventory management assistant. Answer the user's question "
        "using ONLY the inventory data provided below. Be specific, cite real SKUs/numbers "
        "from the data, and keep answers concise and actionable. If the data doesn't contain "
        "what's needed to answer, say you don't have access to that information — do not "
        "guess, and do not hint that restricted data might exist elsewhere.\n\n"
        f"{context}"
    )

    # Gemini uses 'user' / 'model' roles (not 'assistant') and a list of "contents"
    contents = []
    for h in history:
        if not h.get("content"):
            continue
        role = "model" if h.get("role") == "assistant" else "user"
        contents.append(types.Content(role=role, parts=[types.Part(text=h["content"])]))
    contents.append(types.Content(role="user", parts=[types.Part(text=message)]))

    try:
        resp = client.models.generate_content(
            model=MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                max_output_tokens=600,
            ),
        )
        return (resp.text or "").strip() or "I couldn't generate a response. Please try rephrasing."
    except Exception as e:
        return f"⚠ AI request failed: {str(e)}"


@router.post("/chat")
def ai_chat(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    message = payload.get("message", "")
    history = payload.get("history", [])

    is_admin = (getattr(current_user, "role", "") or "").lower() == "admin"
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