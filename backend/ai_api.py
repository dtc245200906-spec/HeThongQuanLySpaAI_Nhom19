
import os
import re
import json
import logging
import unicodedata
from urllib import request, error

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import get_db
from models import Service, User
from auth_api import get_current_user
from ai_prompts import SYSTEM_PROMPT, build_user_prompt


load_dotenv(
    os.path.join(os.path.dirname(__file__), ".env")
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/ai",
    tags=["Trợ lý AI Spa"]
)

OLLAMA_URL = os.getenv(
    "OLLAMA_URL",
    "http://127.0.0.1:11434/api/chat"
)

OLLAMA_MODEL = os.getenv(
    "OLLAMA_MODEL",
    "qwen3:0.6b"
)


# ======================================
# SCHEMA
# ======================================

class AIRequest(BaseModel):
    message: str = Field(
        min_length=3,
        max_length=1000
    )


class ServiceSuggestion(BaseModel):
    id: int
    name: str
    category: str
    description: str | None
    price: float
    duration_minutes: int
    score: int


class AIResponse(BaseModel):
    reply: str
    suggestions: list[ServiceSuggestion]


# ======================================
# BẢO VỆ THÔNG TIN CÁ NHÂN
# ======================================

def mask_personal_information(message: str) -> str:
    """
    Ẩn email và số điện thoại trước khi
    chuyển câu hỏi đến mô hình Ollama.

    Không thay đổi dữ liệu trong SQLite.
    """

    # Ẩn địa chỉ email.
    message = re.sub(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        "[EMAIL_DA_AN]",
        message
    )

    # Ẩn số điện thoại Việt Nam phổ biến,
    # bao gồm +84, 84 hoặc số bắt đầu bằng 0.
    phone_pattern = (
        r"(?<!\w)"
        r"(?:\+84|84|0)"
        r"(?:[\s.\-]?\d){9}"
        r"(?!\d)"
    )

    message = re.sub(
        phone_pattern,
        "[SO_DIEN_THOAI_DA_AN]",
        message
    )

    return message


# ======================================
# XỬ LÝ TIẾNG VIỆT
# ======================================

def normalize(text: str) -> str:
    text = unicodedata.normalize(
        "NFD",
        str(text).lower()
    )

    text = "".join(
        char for char in text
        if unicodedata.category(char) != "Mn"
    )

    text = text.replace("đ", "d")

    return re.sub(
        r"[^a-z0-9\s]",
        " ",
        text
    )


def contains_phrase(
    text: str,
    phrase: str
) -> bool:
    return (
        f" {normalize(phrase)} "
        in f" {normalize(text)} "
    )


# ======================================
# NHÓM DỊCH VỤ
# ======================================

SERVICE_GROUPS = {
    "massage": {
        "query": [
            "massage",
            "masse",
            "massa",
            "mat xa",
            "xoa bop",
            "dau moi",
            "vai gay",
            "co vai gay",
            "thu gian",
            "toan than"
        ],
        "service": [
            "massage",
            "masse",
            "massa",
            "mat xa",
            "xoa bop",
            "body massage"
        ]
    },
    "skin": {
        "query": [
            "cham soc da",
            "da mat",
            "mun",
            "duong da",
            "lam sach da",
            "facial",
            "tham mun",
            "nam da"
        ],
        "service": [
            "cham soc da",
            "da mat",
            "duong da",
            "facial",
            "lam sach da"
        ]
    },
    "hair": {
        "query": [
            "cham soc toc",
            "duong toc",
            "goi dau",
            "toc"
        ],
        "service": [
            "cham soc toc",
            "duong toc",
            "goi dau",
            "toc"
        ]
    },
    "body": {
        "query": [
            "cham soc co the",
            "duong the",
            "tay te bao chet",
            "body"
        ],
        "service": [
            "cham soc co the",
            "duong the",
            "tay te bao chet",
            "body"
        ]
    }
}


# ======================================
# NHẬN DIỆN NHU CẦU
# ======================================

def detect_query_groups(
    message: str
) -> set[str]:
    result = set()

    for group, config in SERVICE_GROUPS.items():
        if any(
            contains_phrase(message, word)
            for word in config["query"]
        ):
            result.add(group)

    return result


def detect_service_groups(
    service: Service
) -> set[str]:
    name_category = (
        f"{service.name} {service.category}"
    )

    result = set()

    for group, config in SERVICE_GROUPS.items():
        if any(
            contains_phrase(name_category, word)
            for word in config["service"]
        ):
            result.add(group)

    return result


# ======================================
# CẢNH BÁO TÌNH TRẠNG DA
# ======================================

def check_skin_safety(
    message: str
) -> str | None:
    serious_conditions = [
        "mun viem nang",
        "mun boc nang",
        "kich ung nghiem trong",
        "di ung nang",
        "nhiem trung da",
        "viem da nang",
        "da sung do",
        "da chay mau",
        "da loet"
    ]

    if any(
        contains_phrase(message, condition)
        for condition in serious_conditions
    ):
        return (
            "Với tình trạng da bạn mô tả, "
            "bạn nên tham khảo bác sĩ da liễu "
            "để được đánh giá trước khi sử dụng "
            "các dịch vụ chăm sóc da tại Spa. "
            "Hệ thống chưa thể xác định liệu trình "
            "nào an toàn và phù hợp cho tình trạng này."
        )

    return None


# ======================================
# CHẤM ĐIỂM DỊCH VỤ
# ======================================

def calculate_score(
    message: str,
    service: Service
) -> int:
    query_groups = detect_query_groups(message)
    service_groups = detect_service_groups(service)

    if query_groups and not (
        query_groups & service_groups
    ):
        return 0

    query = normalize(message)

    content = normalize(
        f"{service.name} "
        f"{service.category} "
        f"{service.description or ''}"
    )

    query_words = {
        word
        for word in query.split()
        if len(word) >= 3
    }

    content_words = set(content.split())

    score = len(
        query_words & content_words
    ) * 2

    matching_groups = (
        query_groups & service_groups
    )

    score += len(matching_groups) * 100

    for group in matching_groups:
        for keyword in SERVICE_GROUPS[group]["service"]:
            if contains_phrase(
                f"{service.name} {service.category}",
                keyword
            ):
                score += 20
                break

    return score


# ======================================
# GỢI Ý DỊCH VỤ
# ======================================

def get_suggestions(
    message: str,
    services: list[Service]
) -> list[ServiceSuggestion]:
    ranked = sorted(
        (
            (
                calculate_score(message, service),
                service
            )
            for service in services
        ),
        key=lambda item: item[0],
        reverse=True
    )

    suggestions = []

    for score, service in ranked:
        if score <= 0:
            continue

        suggestions.append(
            ServiceSuggestion(
                id=service.id,
                name=service.name,
                category=service.category,
                description=service.description,
                price=float(service.price),
                duration_minutes=service.duration_minutes,
                score=score
            )
        )

        if len(suggestions) == 1:
            break

    return suggestions


# ======================================
# ĐỊNH DẠNG GIÁ
# ======================================

def format_price(
    price: float
) -> str:
    return (
        f"{price:,.0f}"
        .replace(",", ".")
        + " VNĐ"
    )


# ======================================
# TRẢ LỜI DỰ PHÒNG
# ======================================

def fallback_reply(
    suggestions: list[ServiceSuggestion]
) -> str:
    if not suggestions:
        return (
            "Hiện Spa chưa tìm thấy dịch vụ phù hợp "
            "với nhu cầu bạn mô tả. "
            "Bạn hãy cho biết rõ hơn loại dịch vụ "
            "mình đang quan tâm."
        )

    service = suggestions[0]

    return (
        "AI cục bộ hiện chưa phản hồi. "
        "Dựa trên dữ liệu Spa, dịch vụ phù hợp là "
        f"{service.name}. "
        f"Giá: {format_price(service.price)}. "
        f"Thời gian: {service.duration_minutes} phút. "
        "Đây là kết quả dự phòng từ SQLite."
    )


# ======================================
# GỌI MÔ HÌNH OLLAMA
# ======================================

def generate_ollama_reply(
    message: str,
    service: ServiceSuggestion
) -> str | None:
    service_data = [
        {
            "id": service.id,
            "name": service.name,
            "category": service.category,
            "description": service.description,
            "price": service.price,
            "duration_minutes": service.duration_minutes
        }
    ]

    # Chỉ chuyển nội dung đã ẩn thông tin cá nhân.
    safe_message = mask_personal_information(
        message
    )

    prompt = build_user_prompt(
        safe_message,
        service_data
    )

    payload = {
        "model": OLLAMA_MODEL,
        "stream": False,
        "think": False,
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "options": {
            "temperature": 0.2,
            "num_predict": 180
        }
    }

    body = json.dumps(
        payload,
        ensure_ascii=False
    ).encode("utf-8")

    http_request = request.Request(
        OLLAMA_URL,
        data=body,
        headers={
            "Content-Type": "application/json"
        },
        method="POST"
    )

    try:
        with request.urlopen(
            http_request,
            timeout=60
        ) as response:
            result = json.loads(
                response.read().decode("utf-8")
            )

        reply = (
            result.get("message", {})
            .get("content", "")
            .strip()
        )

        return reply or None

    except (
        error.URLError,
        TimeoutError,
        OSError,
        ValueError,
        KeyError
    ) as exc:
        logger.warning(
            "Ollama unavailable: %s - %s",
            type(exc).__name__,
            str(exc)[:300]
        )
        return None


# ======================================
# GHÉP CÂU TRẢ LỜI CUỐI
# ======================================

def build_final_reply(
    service: ServiceSuggestion,
    ai_explanation: str | None
) -> str:
    reply = (
        f"Dịch vụ phù hợp: {service.name}. "
        f"Giá: {format_price(service.price)}. "
        f"Thời gian: {service.duration_minutes} phút."
    )

    if ai_explanation:
        explanation = ai_explanation.strip()

        explanation = re.sub(
            r"\s+",
            " ",
            explanation
        )

        # Không dùng lời giải thích chứa số,
        # tránh AI tự tạo giá và thời gian.
        if (
            len(explanation) <= 300
            and not re.search(r"\d", explanation)
        ):
            reply += (
                " Tư vấn AI: " + explanation
            )

    return reply


# ======================================
# API TƯ VẤN AI
# ======================================

@router.post(
    "/recommend",
    response_model=AIResponse
)
def recommend_services(
    data: AIRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    safety_warning = check_skin_safety(
        data.message
    )

    if safety_warning:
        return AIResponse(
            reply=safety_warning,
            suggestions=[]
        )

    services = db.scalars(
        select(Service).where(
            Service.status == "active"
        )
    ).all()

    if not services:
        return AIResponse(
            reply=(
                "Hiện Spa chưa có dịch vụ "
                "đang hoạt động."
            ),
            suggestions=[]
        )

    suggestions = get_suggestions(
        data.message,
        services
    )

    if not suggestions:
        return AIResponse(
            reply=fallback_reply([]),
            suggestions=[]
        )

    selected_service = suggestions[0]

    ai_explanation = generate_ollama_reply(
        data.message,
        selected_service
    )

    if ai_explanation is None:
        reply = fallback_reply(suggestions)
    else:
        reply = build_final_reply(
            selected_service,
            ai_explanation
        )

    return AIResponse(
        reply=reply,
        suggestions=suggestions
    )
