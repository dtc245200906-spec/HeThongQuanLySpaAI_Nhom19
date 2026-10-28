
from decimal import Decimal
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ==============================
# KHÁCH HÀNG
# ==============================

class CustomerCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=9, max_length=20)
    email: str | None = None
    date_of_birth: str | None = None
    care_needs: str | None = None
    notes: str | None = None


class CustomerResponse(CustomerCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==============================
# DỊCH VỤ SPA
# ==============================

class ServiceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    category: str = Field(min_length=2, max_length=100)
    description: str | None = None
    price: Decimal = Field(
        ge=0,
        max_digits=12,
        decimal_places=2
    )
    duration_minutes: int = Field(gt=0)
    status: str = Field(
        default="active",
        pattern="^(active|inactive)$"
    )


class ServiceResponse(ServiceCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==============================
# LỊCH HẸN SPA
# ==============================

class AppointmentCreate(BaseModel):
    customer_id: int = Field(gt=0)
    service_id: int = Field(gt=0)
    appointment_time: datetime
    staff_name: str | None = Field(
        default=None,
        max_length=100
    )
    status: str = Field(
        default="pending",
        pattern="^(pending|confirmed|completed|cancelled)$"
    )
    notes: str | None = None


class AppointmentResponse(AppointmentCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==============================
# NHÂN VIÊN SPA
# ==============================

class EmployeeCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=9, max_length=20)
    position: str = Field(min_length=2, max_length=100)
    specialty: str | None = None
    status: str = Field(
        default="active",
        pattern="^(active|inactive)$"
    )


class EmployeeResponse(EmployeeCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ==============================
# HÓA ĐƠN SPA
# ==============================

class InvoiceCreate(BaseModel):
    customer_id: int = Field(gt=0)
    service_id: int = Field(gt=0)
    total_amount: Decimal = Field(
        ge=0,
        max_digits=12,
        decimal_places=2
    )
    payment_method: str = Field(
        default="cash",
        pattern="^(cash|bank_transfer)$"
    )
    status: str = Field(
        default="unpaid",
        pattern="^(unpaid|paid)$"
    )
    notes: str | None = None


class InvoiceResponse(InvoiceCreate):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
