from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.db.models.transaction import Transaction
from app.db.models.product import Product
from app.core.deps import get_current_user, require_admin

router = APIRouter(prefix="/transactions", tags=["Transactions"])


def serialize(t: Transaction) -> dict:
    return {
        "id": t.id,
        "type": t.type,
        "sku": t.sku,
        "product": t.product_name,
        "qty": t.qty,
        "value": t.value,
        "warehouse": t.warehouse,
        "note": t.note,
        "user": t.user_name,
        "date": t.created_at.strftime("%Y-%m-%d") if t.created_at else None,
    }


@router.get("")
def list_transactions(
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Transaction)
    if type:
        q = q.filter(Transaction.type == type)
    txns = q.order_by(Transaction.id.desc()).all()
    return [serialize(t) for t in txns]


@router.post("")
def create_transaction(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    txn = Transaction(
        type=payload.get("type"),
        sku=payload.get("sku"),
        product_name=payload.get("product"),
        qty=payload.get("qty", 0),
        value=payload.get("value", 0),
        warehouse=payload.get("warehouse"),
        note=payload.get("note"),
        product_id=payload.get("product_id"),
        user_id=current_user.id,
        user_name=f"{current_user.first_name} {current_user.last_name}",
    )
    db.add(txn)

    # Adjust live product stock if SKU matches an existing product
    product = db.query(Product).filter(Product.sku == txn.sku).first()
    if product:
        if txn.type == "IN":
            product.stock += txn.qty
        elif txn.type == "OUT":
            product.stock = max(0, product.stock - txn.qty)

    db.commit()
    db.refresh(txn)
    return serialize(txn)


@router.get("/summary")
def transaction_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    txns = db.query(Transaction).all()
    total_in = sum(t.value for t in txns if t.type == "IN")
    total_out = sum(t.value for t in txns if t.type == "OUT")
    return {
        "total_transactions": len(txns),
        "stock_in_count": len([t for t in txns if t.type == "IN"]),
        "stock_out_count": len([t for t in txns if t.type == "OUT"]),
        "transfer_count": len([t for t in txns if t.type == "TRF"]),
        "total_value_in": total_in,
        "total_value_out": total_out,
    }


@router.put("/{txn_id}")
def update_transaction(
    txn_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    old_type, old_qty, old_sku = txn.type, txn.qty, txn.sku

    txn.type         = payload.get("type", txn.type)
    txn.sku          = payload.get("sku", txn.sku)
    txn.product_name = payload.get("product", txn.product_name)
    txn.qty          = payload.get("qty", txn.qty)
    txn.value        = payload.get("value", txn.value)
    txn.warehouse    = payload.get("warehouse", txn.warehouse)
    txn.note         = payload.get("note", txn.note)

    # Revert old stock effect, then apply new one
    old_product = db.query(Product).filter(Product.sku == old_sku).first()
    if old_product:
        if old_type == "IN":
            old_product.stock = max(0, old_product.stock - old_qty)
        elif old_type == "OUT":
            old_product.stock += old_qty

    new_product = db.query(Product).filter(Product.sku == txn.sku).first()
    if new_product:
        if txn.type == "IN":
            new_product.stock += txn.qty
        elif txn.type == "OUT":
            new_product.stock = max(0, new_product.stock - txn.qty)

    db.commit()
    db.refresh(txn)
    return serialize(txn)


@router.delete("/{txn_id}")
def delete_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Revert the stock effect this transaction originally caused
    product = db.query(Product).filter(Product.sku == txn.sku).first()
    if product:
        if txn.type == "IN":
            product.stock = max(0, product.stock - txn.qty)
        elif txn.type == "OUT":
            product.stock += txn.qty

    db.delete(txn)
    db.commit()
    return {"message": "Transaction deleted"}