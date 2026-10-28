from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# API quản lý Spa
from customer_api import router as customer_router
from service_api import router as service_router
from appointment_api import router as appointment_router
from employee_api import router as employee_router
from invoice_api import router as invoice_router

# API đăng nhập và phân quyền
from auth_api import router as auth_router
from ai_api import router as ai_router


# ======================================
# KHỞI TẠO FASTAPI
# ======================================

app = FastAPI(
    title="Hệ thống quản lý Spa và chăm sóc sắc đẹp có tích hợp AI",
    description="Backend API - Nhóm 19",
    version="1.0.0"
)


# ======================================
# CẤU HÌNH CORS
# ======================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ======================================
# KẾT NỐI CÁC API
# ======================================

# Quản lý khách hàng
app.include_router(customer_router)

# Quản lý dịch vụ
app.include_router(service_router)

# Quản lý lịch hẹn
app.include_router(appointment_router)

# Quản lý nhân viên
app.include_router(employee_router)

# Quản lý hóa đơn
app.include_router(invoice_router)

# Đăng nhập và phân quyền
app.include_router(auth_router)
# AI gợi ý dịch vụ Spa
app.include_router(ai_router)


# ======================================
# TRANG CHỦ BACKEND
# ======================================

@app.get("/")
def trang_chu():
    return {
        "message": "Hệ thống quản lý Spa và chăm sóc sắc đẹp có tích hợp AI",
        "group": "Nhóm 19",
        "version": "1.0.0",
        "status": "running"
    }


# ======================================
# KIỂM TRA HOẠT ĐỘNG HỆ THỐNG
# ======================================

@app.get("/api/health")
def kiem_tra_he_thong():
    return {
        "status": "ok",
        "message": "Backend Spa AI đang hoạt động"
    }