
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from database import get_db
from auth_api import get_current_user, require_admin
from models import Employee, User
from schemas import EmployeeCreate, EmployeeResponse


router = APIRouter(
    prefix="/api/employees",
    tags=["Nhân viên Spa"],
    dependencies=[Depends(get_current_user)]
)


# ======================================
# LẤY DANH SÁCH NHÂN VIÊN
# Admin và Staff đều được xem
# ======================================

@router.get("", response_model=list[EmployeeResponse])
def get_employees(
    db: Session = Depends(get_db)
):
    return db.scalars(
        select(Employee).order_by(Employee.id.desc())
    ).all()


# ======================================
# THÊM NHÂN VIÊN
# Chỉ Admin được thực hiện
# ======================================

@router.post(
    "",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED
)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    employee = Employee(**data.model_dump())

    try:
        db.add(employee)
        db.commit()
        db.refresh(employee)
        return employee

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Số điện thoại nhân viên đã tồn tại"
        )

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Không thể thêm nhân viên"
        )


# ======================================
# XEM CHI TIẾT NHÂN VIÊN
# Admin và Staff đều được xem
# ======================================

@router.get(
    "/{employee_id}",
    response_model=EmployeeResponse
)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db)
):
    employee = db.get(Employee, employee_id)

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy nhân viên"
        )

    return employee


# ======================================
# CẬP NHẬT NHÂN VIÊN
# Chỉ Admin được thực hiện
# ======================================

@router.put(
    "/{employee_id}",
    response_model=EmployeeResponse
)
def update_employee(
    employee_id: int,
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    employee = db.get(Employee, employee_id)

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy nhân viên"
        )

    for key, value in data.model_dump().items():
        setattr(employee, key, value)

    try:
        db.commit()
        db.refresh(employee)
        return employee

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Số điện thoại nhân viên đã tồn tại"
        )

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Không thể cập nhật nhân viên"
        )


# ======================================
# XÓA NHÂN VIÊN
# Chỉ Admin được thực hiện
# ======================================

@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    employee = db.get(Employee, employee_id)

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy nhân viên"
        )

    try:
        db.delete(employee)
        db.commit()

        return {
            "message": "Đã xóa nhân viên thành công"
        }

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Không thể xóa nhân viên vì dữ liệu đang được sử dụng"
        )

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Không thể xóa nhân viên"
        )
