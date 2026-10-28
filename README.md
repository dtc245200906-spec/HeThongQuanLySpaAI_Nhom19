
# HỆ THỐNG QUẢN LÝ SPA VÀ CHĂM SÓC SẮC ĐẸP CÓ TÍCH HỢP AI

**Nhóm thực hiện:** Nhóm 19  
**Môn học:** Ứng dụng Trí tuệ nhân tạo

## 1. Giới thiệu

Dự án xây dựng hệ thống quản lý Spa và chăm sóc sắc đẹp, hỗ trợ quản lý khách hàng, dịch vụ, lịch hẹn, nhân viên, hóa đơn, thống kê doanh thu và tư vấn dịch vụ bằng trí tuệ nhân tạo.

## 2. Công nghệ sử dụng

- Backend: Python, FastAPI, SQLAlchemy
- Frontend: React, Vite
- Cơ sở dữ liệu: SQLite
- AI: Ollama, mô hình qwen3:0.6b
- Xác thực và phân quyền: JWT, Admin/Nhân viên

## 3. Chức năng chính

- Đăng nhập và phân quyền tài khoản
- Quản lý khách hàng
- Quản lý dịch vụ
- Quản lý lịch hẹn
- Quản lý nhân viên
- Quản lý hóa đơn
- Thống kê doanh thu từ dữ liệu thực tế
- AI gợi ý dịch vụ Spa theo nhu cầu khách hàng
- Tư vấn dự phòng từ SQLite khi Ollama không phản hồi

## 4. Cấu trúc dự án

    HeThongQuanLySpa_AI_Nhom19/
    ├── backend/
    │   ├── main.py
    │   ├── database.py
    │   ├── models.py
    │   ├── schemas.py
    │   ├── ai_api.py
    │   ├── ai_prompts.py
    │   └── requirements.txt
    ├── frontend/
    │   ├── src/
    │   ├── package.json
    │   └── package-lock.json
    ├── docs/
    └── README.md

## 5. Cài đặt Backend

Yêu cầu Python và các thư viện trong `backend/requirements.txt`.

Tại thư mục gốc dự án, chạy:

    cd backend
    python -m venv .venv
    .\.venv\Scripts\python.exe -m pip install -r requirements.txt

Cấu hình biến môi trường `JWT_SECRET_KEY` bằng một giá trị bí mật đủ mạnh trước khi chạy.

Khởi tạo cơ sở dữ liệu cho lần cài đặt mới:

    .\.venv\Scripts\python.exe init_db.py

Chạy Backend:

    .\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8001

Địa chỉ API: http://127.0.0.1:8001

Tài liệu Swagger: http://127.0.0.1:8001/docs

## 6. Cài đặt Frontend

Mở terminal mới tại thư mục gốc dự án:

    cd frontend
    npm ci
    npm run dev

Truy cập: http://localhost:5173

## 7. Cài đặt AI

Cài đặt Ollama và tải mô hình:

    ollama pull qwen3:0.6b

Đảm bảo Ollama hoạt động tại:

http://127.0.0.1:11434

Nếu Ollama không phản hồi, hệ thống sử dụng dữ liệu SQLite để đưa ra gợi ý dự phòng.

## 8. Cơ sở dữ liệu

Hệ thống sử dụng SQLite để lưu trữ thông tin khách hàng, dịch vụ, lịch hẹn, nhân viên, hóa đơn và tài khoản.

Cần chuẩn bị tài khoản quản trị và dữ liệu mẫu trước khi trình diễn hệ thống trên máy mới.

## 9. Bảo mật và giới hạn AI

- API được bảo vệ bằng JWT.
- Hệ thống hỗ trợ vai trò Admin và Nhân viên.
- Không công khai file `.env` hoặc khóa bí mật.
- Hạn chế gửi thông tin cá nhân tới mô hình AI.
- AI chỉ hỗ trợ gợi ý dịch vụ, không thay thế chẩn đoán y tế.

## 10. Kiểm thử

Đã kiểm tra các chức năng quản lý chính, thống kê doanh thu và tư vấn AI.

Đã kiểm tra tình huống Ollama ngừng hoạt động: hệ thống trả về kết quả dự phòng từ SQLite.

Sau khi khởi động lại Ollama, hệ thống tiếp tục tư vấn bằng mô hình AI.

## 11. Tài liệu minh chứng

Ảnh minh chứng và tài liệu kiểm thử được lưu trong thư mục `docs/`.
