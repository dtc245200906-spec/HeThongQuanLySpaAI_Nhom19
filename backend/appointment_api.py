from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from auth_api import get_current_user
from models import Appointment, Customer, Service
from schemas import AppointmentCreate, AppointmentResponse


router = APIRouter(
    prefix="/api/appointments",
    tags=["Lịch hẹn Spa"],
    dependencies=[Depends(get_current_user)]
)


@router.get("", response_model=list[AppointmentResponse])
def get_appointments(db: Session = Depends(get_db)):
    return db.scalars(
        select(Appointment).order_by(Appointment.id.desc())
    ).all()


@router.post(
    "",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED
)
def create_appointment(
    data: AppointmentCreate,
    db: Session = Depends(get_db)
):
    if db.get(Customer, data.customer_id) is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy khách hàng"
        )

    if db.get(Service, data.service_id) is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy dịch vụ"
        )

    appointment = Appointment(**data.model_dump())

    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return appointment


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db)
):
    appointment = db.get(Appointment, appointment_id)

    if appointment is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lịch hẹn"
        )

    return appointment


@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    data: AppointmentCreate,
    db: Session = Depends(get_db)
):
    appointment = db.get(Appointment, appointment_id)

    if appointment is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lịch hẹn"
        )

    if db.get(Customer, data.customer_id) is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy khách hàng"
        )

    if db.get(Service, data.service_id) is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy dịch vụ"
        )

    for key, value in data.model_dump().items():
        setattr(appointment, key, value)

    db.commit()
    db.refresh(appointment)

    return appointment


@router.delete("/{appointment_id}")
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db)
):
    appointment = db.get(Appointment, appointment_id)

    if appointment is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lịch hẹn"
        )

    db.delete(appointment)
    db.commit()

    return {"message": "Đã xóa lịch hẹn thành công"}