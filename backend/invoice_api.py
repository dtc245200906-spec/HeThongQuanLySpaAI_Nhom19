
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import Invoice, Customer, Service
from schemas import InvoiceCreate, InvoiceResponse
from auth_api import get_current_user, require_admin


router = APIRouter(
    prefix="/api/invoices",
    tags=["Hóa đơn Spa"],
    dependencies=[Depends(get_current_user)]
)


def validate_invoice(data: InvoiceCreate, db: Session):
    customer = db.get(Customer, data.customer_id)
    if customer is None:
        raise HTTPException(
            status_code=404,
            detail="Khách hàng không tồn tại"
        )

    service = db.get(Service, data.service_id)
    if service is None:
        raise HTTPException(
            status_code=404,
            detail="Dịch vụ không tồn tại"
        )

    return service


@router.get("", response_model=list[InvoiceResponse])
def get_invoices(db: Session = Depends(get_db)):
    return db.scalars(
        select(Invoice).order_by(Invoice.id.desc())
    ).all()


@router.post(
    "",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED
)
def create_invoice(
    data: InvoiceCreate,
    db: Session = Depends(get_db)
):
    service = validate_invoice(data, db)

    invoice_data = data.model_dump()

    # Tổng tiền lấy từ giá dịch vụ trong CSDL.
    invoice_data["total_amount"] = service.price

    invoice = Invoice(**invoice_data)

    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    return invoice


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db)
):
    invoice = db.get(Invoice, invoice_id)

    if invoice is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy hóa đơn"
        )

    return invoice


@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: int,
    data: InvoiceCreate,
    db: Session = Depends(get_db)
):
    invoice = db.get(Invoice, invoice_id)

    if invoice is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy hóa đơn"
        )

    service = validate_invoice(data, db)

    invoice_data = data.model_dump()
    invoice_data["total_amount"] = service.price

    for key, value in invoice_data.items():
        setattr(invoice, key, value)

    db.commit()
    db.refresh(invoice)

    return invoice


@router.delete(
    "/{invoice_id}",
    dependencies=[Depends(require_admin)]
)
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db)
):
    invoice = db.get(Invoice, invoice_id)

    if invoice is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy hóa đơn"
        )

    db.delete(invoice)
    db.commit()

    return {
        "message": "Đã xóa hóa đơn thành công"
    }
