import csv
import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List

from app.services.audit_service import log_action
from app.core.deps import get_current_user, require_admin

from app.db.database import get_db
from app.db.models.product import Product
from app.core.deps import get_current_user
from app.api.v1.schemas.product_schema import ProductCreate, ProductUpdate, ProductOut

router = APIRouter(prefix="/inventory/products", tags=["Products"])


def serialize(p: Product) -> dict:
    return {
        "id": p.id,
        "sku": p.sku,
        "name": p.name,
        "category": p.category,
        "stock": p.stock,
        "reorder_point": p.reorder_point,
        "price": p.price,
        "warehouse": p.warehouse,
        "status": p.status,
    }


@router.get("")
def list_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    q = db.query(Product)
    if search:
        q = q.filter(Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%"))
    if category:
        q = q.filter(Product.category == category)
    products = q.order_by(Product.id.desc()).all()
    return [serialize(p) for p in products]


@router.get("/low-stock")
def low_stock_products(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    products = db.query(Product).all()
    low = [p for p in products if p.stock <= p.reorder_point]
    return [serialize(p) for p in low]


@router.get("/export")
def export_products_csv(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    products = db.query(Product).all()
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["SKU", "Name", "Category", "Stock", "Reorder Point", "Price", "Warehouse", "Status"])
    for p in products:
        writer.writerow([p.sku, p.name, p.category, p.stock, p.reorder_point, p.price, p.warehouse, p.status])
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=inventory.csv"},
    )


@router.get("/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize(p)


@router.post("")
def create_product(payload: ProductCreate, db: Session = Depends(get_db),
                    current_user=Depends(get_current_user)):
    new_product = Product(**payload.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
 
    # 👇 NEW: log it
    log_action(
        db, module="product", action="CREATE",
        record_id=new_product.id, record_label=new_product.name,
        user=current_user, detail=f"Created product (SKU: {new_product.sku})"
    )
 
    return new_product



@router.put("/{product_id}")
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db),
                    current_user=Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    old_stock = product.stock
 
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
 
    # 👇 NEW: log it
    log_action(
        db, module="product", action="UPDATE",
        record_id=product.id, record_label=product.name,
        user=current_user,
        detail=f"Updated product (stock {old_stock} → {product.stock})"
    )
 
    return product
 
 
@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db),
                    current_user=Depends(require_admin)):  # delete = admin only
    product = db.query(Product).filter(Product.id == product_id).first()
    label = product.name
 
    db.delete(product)
    db.commit()
 
    # 👇 NEW: log it
    log_action(
        db, module="product", action="DELETE",
        record_id=product_id, record_label=label,
        user=current_user, detail="Product permanently deleted"
    )
 
    return {"message": "Product deleted"}