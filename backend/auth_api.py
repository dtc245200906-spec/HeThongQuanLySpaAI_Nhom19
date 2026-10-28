
import os
from datetime import datetime, timedelta, timezone

import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from database import get_db
from models import User


router = APIRouter(
    prefix="/api/auth",
    tags=["Đăng nhập và phân quyền"]
)

password_hash = PasswordHash.recommended()
security = HTTPBearer(auto_error=False)

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ======================================
# SCHEMA
# ======================================

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str


class UserCreate(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=50
    )
    password: str = Field(
        min_length=8,
        max_length=128
    )
    full_name: str = Field(
        min_length=2,
        max_length=100
    )
    role: str = Field(
        default="staff",
        pattern="^(admin|staff)$"
    )


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    is_active: int


# ======================================
# MẬT KHẨU
# ======================================

def hash_password(password: str):
    return password_hash.hash(password)


def verify_password(
    password: str,
    hashed_password: str
):
    return password_hash.verify(
        password,
        hashed_password
    )


# ======================================
# KIỂM TRA CẤU HÌNH JWT
# ======================================

def get_secret_key():
    if not SECRET_KEY:
        raise HTTPException(
            status_code=503,
            detail="Máy chủ chưa cấu hình JWT_SECRET_KEY"
        )

    return SECRET_KEY


# ======================================
# TẠO JWT TOKEN
# ======================================

def create_access_token(user: User):
    secret_key = get_secret_key()

    now = datetime.now(timezone.utc)

    expire = now + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user.id),
        "role": user.role,
        "iat": now,
        "exp": expire
    }

    return jwt.encode(
        payload,
        secret_key,
        algorithm=ALGORITHM
    )


# ======================================
# LẤY NGƯỜI DÙNG ĐANG ĐĂNG NHẬP
# ======================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        security
    ),
    db: Session = Depends(get_db)
):
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bạn chưa đăng nhập",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    if credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phương thức xác thực không hợp lệ",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    secret_key = get_secret_key()

    try:
        payload = jwt.decode(
            credentials.credentials,
            secret_key,
            algorithms=[ALGORITHM],
            options={
                "require": ["sub", "iat", "exp"]
            }
        )

        user_id = int(payload["sub"])

        if user_id <= 0:
            raise ValueError(
                "ID tài khoản không hợp lệ"
            )

    except (
        InvalidTokenError,
        KeyError,
        ValueError,
        TypeError
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ hoặc đã hết hạn",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    user = db.get(User, user_id)

    if user is None or user.is_active != 1:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản không tồn tại hoặc đã bị khóa",
            headers={
                "WWW-Authenticate": "Bearer"
            }
        )

    return user


# ======================================
# PHÂN QUYỀN ADMIN
# ======================================

def require_admin(
    current_user: User = Depends(
        get_current_user
    )
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ quản trị viên mới được thực hiện"
        )

    return current_user


# ======================================
# ĐĂNG NHẬP
# ======================================

@router.post(
    "/login",
    response_model=TokenResponse
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    user = db.scalar(
        select(User).where(
            User.username == data.username.strip()
        )
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc mật khẩu không đúng"
        )

    try:
        password_valid = verify_password(
            data.password,
            user.password_hash
        )
    except (ValueError, TypeError):
        password_valid = False

    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc mật khẩu không đúng"
        )

    if user.is_active != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản đã bị khóa"
        )

    token = create_access_token(user)

    return TokenResponse(
        access_token=token,
        role=user.role,
        full_name=user.full_name
    )


# ======================================
# XEM THÔNG TIN TÀI KHOẢN
# ======================================

@router.get(
    "/me",
    response_model=UserResponse
)
def get_my_profile(
    current_user: User = Depends(
        get_current_user
    )
):
    return current_user


# ======================================
# ADMIN TẠO TÀI KHOẢN
# ======================================

@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def create_user(
    data: UserCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    username = data.username.strip()

    if len(username) < 3:
        raise HTTPException(
            status_code=422,
            detail="Tên đăng nhập phải có ít nhất 3 ký tự"
        )

    existing = db.scalar(
        select(User).where(
            User.username == username
        )
    )

    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail="Tên đăng nhập đã tồn tại"
        )

    user = User(
        username=username,
        password_hash=hash_password(
            data.password
        ),
        full_name=data.full_name.strip(),
        role=data.role,
        is_active=1
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="Tên đăng nhập đã tồn tại"
        )

    except SQLAlchemyError:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Không thể tạo tài khoản"
        )


# ======================================
# ADMIN XEM DANH SÁCH TÀI KHOẢN
# ======================================

@router.get(
    "/users",
    response_model=list[UserResponse]
)
def list_users(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.scalars(
        select(User).order_by(
            User.id.desc()
        )
    ).all()
