
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from database import get_db
from auth_api import get_current_user
from models import Customer, Appointment, Invoice
from schemas import CustomerCreate, CustomerResponse


router = APIRouter(
    prefix="/api/customers",
    tags=["Khách hàng"],
    dependencies=[Depends(get_current_user)]
)


# ==============================
# LẤY DANH SÁCH KHÁCH HÀNG
# ==============================

@router.get("", response_model=list[CustomerResponse])
def get_customers(db: Session = Depends(get_db)):
    return db.scalars(
        select(Customer).order_by(Customer.id.desc())
    ).all()


# ==============================
# LẤY CHI TIẾT KHÁCH HÀNG
# ==============================

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db)
):
    customer = db.get(Customer, customer_id)

    if customer is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy khách hàng"
        )

    return customer


# ==============================
# THÊM KHÁCH HÀNG
# ==============================

@router.post(
    "",
    response_model=CustomerResponse,
    status_code=201
)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db)
):
    existing = db.scalar(
        select(Customer).where(
            Customer.phone == data.phone
        )
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Số điện thoại đã tồn tại"
        )

    customer = Customer(**data.model_dump())

    try:
        db.add(customer)
        db.commit()
        db.refresh(customer)
        return customer

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Dữ liệu khách hàng bị trùng hoặc không hợp lệ"
        )

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Không thể lưu khách hàng"
        )


# ==============================
# CẬP NHẬT KHÁCH HÀNG
# ==============================

@router.put(
    "/{customer_id}",
    response_model=CustomerResponse
)
def update_customer(
    customer_id: int,
    data: CustomerCreate,
    db: Session = Depends(get_db)
):
    customer = db.get(Customer, customer_id)

    if customer is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy khách hàng"
        )

    existing = db.scalar(
        select(Customer).where(
            Customer.phone == data.phone,
            Customer.id != customer_id
        )
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Số điện thoại đã được sử dụng"
        )

    for field, value in data.model_dump().items():
        setattr(customer, field, value)

    try:
        db.commit()
        db.refresh(customer)
        return customer

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Dữ liệu cập nhật bị trùng hoặc không hợp lệ"
        )

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Không thể cập nhật khách hàng"
        )


# ==============================
# XÓA KHÁCH HÀNG
# ==============================

@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db)
):
    customer = db.get(Customer, customer_id)

    if customer is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy khách hàng"
        )

    has_appointment = db.scalar(
        select(Appointment.id).where(
            Appointment.customer_id == customer_id
        )
    )

    has_invoice = db.scalar(
        select(Invoice.id).where(
            Invoice.customer_id == customer_id
        )
    )

    if has_appointment is not None or has_invoice is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                "Không thể xóa khách hàng đã có "
                "lịch hẹn hoặc hóa đơn"
            )
        )

    try:
        db.delete(customer)
        db.commit()

        return {
            "message": "Xóa khách hàng thành công"
        }

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Không thể xóa vì khách hàng đang được sử dụng"
        )

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Không thể xóa khách hàng"
        )
