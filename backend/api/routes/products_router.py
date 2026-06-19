from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date as _date

from backend.core.database import get_db
from backend.models.models import ProductSale
from backend.schemas.schemas import ProductSaleCreate, ProductSaleResponse

router = APIRouter(prefix="/products", tags=["products"])

@router.post("/sales", response_model=ProductSaleResponse, status_code=status.HTTP_201_CREATED)
def log_product_sale(sale: ProductSaleCreate, db: Session = Depends(get_db)):
    db_sale = ProductSale(
        product_name=sale.product_name,
        quantity=sale.quantity,
        date=sale.date,
        time_sold=sale.time_sold,
        amount_paid=sale.amount_paid,
        payment_method=sale.payment_method
    )
    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)
    return db_sale

@router.get("/sales/history", response_model=List[ProductSaleResponse])
def get_product_sales(date: Optional[_date] = None, db: Session = Depends(get_db)):
    query = db.query(ProductSale).order_by(ProductSale.date.desc(), ProductSale.id.desc())
    if date:
        query = query.filter(ProductSale.date == date)
    return query.all()

@router.delete("/sales/{sale_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_sale(sale_id: int, db: Session = Depends(get_db)):
    db_sale = db.query(ProductSale).filter(ProductSale.id == sale_id).first()
    if not db_sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product sale not found"
        )
    db.delete(db_sale)
    db.commit()
    return
