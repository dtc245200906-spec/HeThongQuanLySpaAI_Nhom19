
from decimal import Decimal
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    Integer,
    String,
    Text,
    Numeric,
    ForeignKey,
)
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


# ==============================
# BẢNG KHÁCH HÀNG
# ==============================

class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )

    full_name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )

    phone: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False
    )

    email: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )

    date_of_birth: Mapped[str | None] = mapped_column(
        String(10), nullable=True
    )

    care_needs: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    notes: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )


# ==============================
# BẢNG DỊCH VỤ SPA
# ==============================

class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )

    name: Mapped[str] = mapped_column(
        String(150), nullable=False
    )

    category: Mapped[str] = mapped_column(
        String(100), nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False
    )

    duration_minutes: Mapped[int] = mapped_column(
        Integer, nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20), default="active", nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )


# ==============================
# BẢNG LỊCH HẸN SPA
# ==============================

class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )

    customer_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("customers.id"),
        nullable=False
    )

    service_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("services.id"),
        nullable=False
    )

    appointment_time: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    staff_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        nullable=False
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )


# ==============================
# BẢNG NHÂN VIÊN
# ==============================

class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )

    full_name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )

    phone: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False
    )

    position: Mapped[str] = mapped_column(
        String(100), nullable=False
    )

    specialty: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(20), default="active", nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )


# ==============================
# BẢNG HÓA ĐƠN
# ==============================

class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )

    customer_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("customers.id"),
        nullable=False
    )

    service_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("services.id"),
        nullable=False
    )

    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False
    )

    payment_method: Mapped[str] = mapped_column(
        String(30), default="cash", nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30), default="unpaid", nullable=False
    )

    notes: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )


# ==============================
# BẢNG TÀI KHOẢN ĐĂNG NHẬP
# ==============================

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )

    username: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False
    )

    password_hash: Mapped[str] = mapped_column(
        String(255), nullable=False
    )

    role: Mapped[str] = mapped_column(
        String(20), default="staff", nullable=False
    )

    full_name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )

    is_active: Mapped[int] = mapped_column(
        Integer, default=1, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
