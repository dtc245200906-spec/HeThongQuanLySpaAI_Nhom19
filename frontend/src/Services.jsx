
import { useEffect, useState } from "react";
import {
  Scissors,
  RefreshCw,
  Plus,
  X,
  Save,
  Pencil,
  Trash2,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8001/api/services";

const emptyForm = {
  name: "",
  category: "",
  description: "",
  price: "",
  duration_minutes: "",
  status: "active",
};

function getAuthHeaders(includeJson = false) {
  const token = sessionStorage.getItem("spa_access_token");

  return {
    ...(includeJson
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };
}

async function getApiError(response, fallback) {
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (response.status === 403) {
    return "Tài khoản không có quyền thực hiện thao tác này.";
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }

  return fallback;
}

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadServices() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          await getApiError(
            response,
            "Không thể tải danh sách dịch vụ."
          )
        );
      }

      const data = await response.json();
      setServices(data);
    } catch (err) {
      setError(err.message || "Không kết nối được máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN").format(Number(price)) + " đ";

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function openForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setFormError("");
    setSuccess("");
    setShowForm(true);
  }

  function editService(service) {
    setEditingId(service.id);

    setForm({
      name: service.name,
      category: service.category,
      description: service.description || "",
      price: String(service.price),
      duration_minutes: String(service.duration_minutes),
      status: service.status,
    });

    setFormError("");
    setSuccess("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setFormError("");
    setSuccess("");

    if (
      form.name.trim().length < 2 ||
      form.category.trim().length < 2
    ) {
      setFormError(
        "Tên dịch vụ và danh mục phải có ít nhất 2 ký tự."
      );
      return;
    }

    if (
      form.price === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) < 0
    ) {
      setFormError("Vui lòng nhập giá dịch vụ hợp lệ.");
      return;
    }

    if (
      form.duration_minutes === "" ||
      !Number.isInteger(Number(form.duration_minutes)) ||
      Number(form.duration_minutes) <= 0
    ) {
      setFormError(
        "Thời gian phải là số phút lớn hơn 0."
      );
      return;
    }

    setSaving(true);

    try {
      const isEditing = editingId !== null;

      const url = isEditing
        ? `${API_URL}/${editingId}`
        : API_URL;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category.trim(),
          description: form.description.trim() || null,
          price: form.price,
          duration_minutes: Number(form.duration_minutes),
          status: form.status,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getApiError(
            response,
            "Không thể lưu dịch vụ. Vui lòng kiểm tra dữ liệu."
          )
        );
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });

      await loadServices();

      setSuccess(
        isEditing
          ? "Đã cập nhật dịch vụ Spa thành công!"
          : "Đã thêm dịch vụ Spa thành công!"
      );
    } catch (err) {
      setFormError(err.message || "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteService(service) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa dịch vụ "${service.name}" không?\n\nDữ liệu đã xóa sẽ không thể khôi phục bằng chức năng này.`
    );

    if (!confirmed) return;

    setDeletingId(service.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/${service.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          await getApiError(
            response,
            "Không thể xóa dịch vụ."
          )
        );
      }

      if (editingId === service.id) {
        closeForm();
      }

      await loadServices();
      setSuccess("Đã xóa dịch vụ Spa thành công!");
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra.");
    } finally {
      setDeletingId(null);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #dce6dc",
    borderRadius: "10px",
    fontSize: "14px",
    background: "#fff",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "7px",
    fontWeight: 600,
    color: "#365747",
  };

  const primaryButtonStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 18px",
    background: "#5f8b70",
    color: "white",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
  };

  const actionButtonStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "8px 11px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  };

  return (
    <div className="dashboard">
      <div className="section-heading">
        <div>
          <h2>Quản lý dịch vụ Spa</h2>
          <p>
            Danh sách dịch vụ được lấy trực tiếp từ cơ sở dữ liệu
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <button
            className="text-button"
            onClick={loadServices}
            type="button"
          >
            <RefreshCw size={17} />
            Làm mới
          </button>

          <button
            type="button"
            onClick={openForm}
            style={primaryButtonStyle}
          >
            <Plus size={18} />
            Thêm dịch vụ
          </button>
        </div>
      </div>

      {success && (
        <div
          role="status"
          style={{
            padding: 14,
            marginBottom: 18,
            background: "#eaf5e9",
            color: "#326b42",
            borderRadius: 10,
          }}
        >
          {success}
        </div>
      )}

      {showForm && (
        <section
          className="panel"
          style={{ marginBottom: 24 }}
        >
          <div className="panel-heading">
            <div>
              <h3>
                {editingId !== null
                  ? "Chỉnh sửa dịch vụ Spa"
                  : "Thêm dịch vụ Spa mới"}
              </h3>

              <p>
                {editingId !== null
                  ? "Cập nhật thông tin dịch vụ hiện có"
                  : "Nhập thông tin dịch vụ cần quản lý"}
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              aria-label="Đóng biểu mẫu"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <X size={22} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 18,
                marginBottom: 18,
              }}
            >
              <div>
                <label
                  htmlFor="service-name"
                  style={labelStyle}
                >
                  Tên dịch vụ *
                </label>

                <input
                  id="service-name"
                  name="name"
                  value={form.name}
                  onChange={updateForm}
                  placeholder="Ví dụ: Massage thư giãn"
                  minLength={2}
                  maxLength={150}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  htmlFor="service-category"
                  style={labelStyle}
                >
                  Danh mục *
                </label>

                <input
                  id="service-category"
                  name="category"
                  value={form.category}
                  onChange={updateForm}
                  placeholder="Ví dụ: Massage"
                  minLength={2}
                  maxLength={100}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  htmlFor="service-price"
                  style={labelStyle}
                >
                  Giá dịch vụ (VNĐ) *
                </label>

                <input
                  id="service-price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={updateForm}
                  placeholder="Ví dụ: 350000"
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  htmlFor="service-duration"
                  style={labelStyle}
                >
                  Thời gian (phút) *
                </label>

                <input
                  id="service-duration"
                  name="duration_minutes"
                  type="number"
                  min="1"
                  step="1"
                  value={form.duration_minutes}
                  onChange={updateForm}
                  placeholder="Ví dụ: 60"
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  htmlFor="service-status"
                  style={labelStyle}
                >
                  Trạng thái
                </label>

                <select
                  id="service-status"
                  name="status"
                  value={form.status}
                  onChange={updateForm}
                  style={inputStyle}
                >
                  <option value="active">
                    Đang hoạt động
                  </option>
                  <option value="inactive">
                    Tạm ngừng
                  </option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="service-description"
                style={labelStyle}
              >
                Mô tả dịch vụ
              </label>

              <textarea
                id="service-description"
                name="description"
                value={form.description}
                onChange={updateForm}
                placeholder="Nhập mô tả về dịch vụ Spa..."
                rows={3}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                }}
              />
            </div>

            {formError && (
              <p
                role="alert"
                style={{
                  color: "#c0392b",
                  marginBottom: 16,
                }}
              >
                {formError}
              </p>
            )}

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <button
                type="submit"
                disabled={saving}
                style={{
                  ...primaryButtonStyle,
                  cursor: saving ? "wait" : "pointer",
                }}
              >
                <Save size={18} />

                {saving
                  ? "Đang lưu..."
                  : editingId !== null
                    ? "Lưu thay đổi"
                    : "Lưu dịch vụ"}
              </button>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                style={{
                  padding: "12px 20px",
                  border: "1px solid #dce6dc",
                  borderRadius: 10,
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>
              <Scissors
                size={20}
                style={{ marginRight: 8 }}
              />
              Danh sách dịch vụ
            </h3>

            <p>Tổng số: {services.length} dịch vụ</p>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            style={{
              padding: 16,
              color: "#c0392b",
            }}
          >
            {error}
          </p>
        )}

        {loading ? (
          <p style={{ padding: 20 }}>
            Đang tải dữ liệu...
          </p>
        ) : services.length === 0 ? (
          <p style={{ padding: 20 }}>
            Chưa có dịch vụ nào.
          </p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>TÊN DỊCH VỤ</th>
                  <th>DANH MỤC</th>
                  <th>GIÁ</th>
                  <th>THỜI GIAN</th>
                  <th>TRẠNG THÁI</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>

              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <strong>{service.name}</strong>
                    </td>

                    <td>{service.category}</td>

                    <td>
                      {formatPrice(service.price)}
                    </td>

                    <td>
                      {service.duration_minutes} phút
                    </td>

                    <td>
                      <span
                        className={`status ${
                          service.status === "active"
                            ? "status-green"
                            : "status-orange"
                        }`}
                      >
                        {service.status === "active"
                          ? "Đang hoạt động"
                          : "Tạm ngừng"}
                      </span>
                    </td>

                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            editService(service)
                          }
                          style={{
                            ...actionButtonStyle,
                            color: "#426e52",
                            background: "#edf5ee",
                            border:
                              "1px solid #d8e8da",
                          }}
                        >
                          <Pencil size={15} />
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteService(service)
                          }
                          disabled={
                            deletingId !== null
                          }
                          style={{
                            ...actionButtonStyle,
                            color: "#b64a4a",
                            background: "#fff1f1",
                            border:
                              "1px solid #f2d4d4",
                            opacity:
                              deletingId !== null
                                ? 0.6
                                : 1,
                          }}
                        >
                          <Trash2 size={15} />

                          {deletingId === service.id
                            ? "Đang xóa..."
                            : "Xóa"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Services;
