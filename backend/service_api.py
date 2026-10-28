
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from auth_api import get_current_user
from models import Service
from schemas import ServiceCreate, ServiceResponse


router = APIRouter(
    prefix="/api/services",
    tags=["Dịch vụ"],
    dependencies=[Depends(get_current_user)]
)


@router.get("", response_model=list[ServiceResponse])
def get_services(db: Session = Depends(get_db)):
    return db.scalars(
        select(Service).order_by(Service.id.desc())
    ).all()


@router.post(
    "",
    response_model=ServiceResponse,
    status_code=status.HTTP_201_CREATED
)
def create_service(
    data: ServiceCreate,
    db: Session = Depends(get_db)
):
    service = Service(**data.model_dump())

    db.add(service)
    db.commit()
    db.refresh(service)

    return service


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(
    service_id: int,
    db: Session = Depends(get_db)
):
    service = db.get(Service, service_id)

    if service is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy dịch vụ"
        )

    return service


@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    data: ServiceCreate,
    db: Session = Depends(get_db)
):
    service = db.get(Service, service_id)

    if service is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy dịch vụ"
        )

    for key, value in data.model_dump().items():
        setattr(service, key, value)

    db.commit()
    db.refresh(service)

    return service


@router.delete("/{service_id}")
def delete_service(
    service_id: int,
    db: Session = Depends(get_db)
):
    service = db.get(Service, service_id)

    if service is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy dịch vụ"
        )

    try:
        db.delete(service)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                "Không thể xóa dịch vụ vì đã có lịch hẹn "
                "hoặc hóa đơn liên quan. "
                "Bạn có thể chuyển dịch vụ sang trạng thái ngừng hoạt động."
            )
        )

    return {"message": "Đã xóa dịch vụ thành công"}
