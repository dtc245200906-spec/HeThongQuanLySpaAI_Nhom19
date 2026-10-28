
import { useEffect, useState } from "react";
import {
  UsersRound,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Save,
  X,
} from "lucide-react";

const API = "http://127.0.0.1:8001/api/employees";

const authHeaders = (json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${sessionStorage.getItem("spa_access_token") || ""}`,
});

const emptyForm = {
  full_name: "",
  phone: "",
  position: "",
  specialty: "",
  status: "active",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #dce5dc",
  borderRadius: 10,
  background: "#fff",
  color: "#284437",
  fontSize: 14,
  boxSizing: "border-box",
  marginTop: 7,
};

const buttonStyle = {
  border: "none",
  borderRadius: 10,
  padding: "11px 16px",
  background: "#557e62",
  color: "#fff",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  fontWeight: 600,
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadEmployees = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."
            : "Không thể tải danh sách nhân viên."
        );
      }

      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      setError(err.message || "Không thể kết nối Backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const openAddForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (employee) => {
    setEditingId(employee.id);
    setForm({
      full_name: employee.full_name,
      phone: employee.phone,
      position: employee.position,
      specialty: employee.specialty || "",
      status: employee.status,
    });

    setError("");
    setSuccess("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.full_name.trim() ||
      !form.phone.trim() ||
      !form.position.trim()
    ) {
      setError("Vui lòng nhập đầy đủ họ tên, số điện thoại và chức vụ.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      position: form.position.trim(),
      specialty: form.specialty.trim() || null,
      status: form.status,
    };

    const wasEditing = editingId !== null;

    try {
      const response = await fetch(
        wasEditing ? `${API}/${editingId}` : API,
        {
          method: wasEditing ? "PUT" : "POST",
          headers: authHeaders(true),
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          response.status === 403
            ? "Bạn không có quyền thực hiện thao tác này."
            : typeof data.detail === "string"
              ? data.detail
              : "Không thể lưu thông tin nhân viên."
        );
      }

      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });

      await loadEmployees();

      setSuccess(
        wasEditing
          ? "Đã cập nhật nhân viên thành công!"
          : "Đã thêm nhân viên thành công!"
      );
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi lưu nhân viên.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (employee) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa nhân viên "${employee.full_name}"?`
    );

    if (!confirmed) return;

    setDeletingId(employee.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/${employee.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          response.status === 403
            ? "Chỉ quản trị viên mới có quyền xóa nhân viên."
            : "Không thể xóa nhân viên."
        );
      }

      await loadEmployees();
      setSuccess("Đã xóa nhân viên thành công!");
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi xóa nhân viên.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="dashboard">
      <div className="section-heading">
        <div>
          <h2>Quản lý nhân viên Spa</h2>
          <p>Quản lý thông tin, chức vụ và chuyên môn nhân viên.</p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={loadEmployees}
            style={{
              ...buttonStyle,
              background: "#e7eee7",
              color: "#41654b",
            }}
          >
            <RefreshCw size={16} />
            Làm mới
          </button>

          <button onClick={openAddForm} style={buttonStyle}>
            <Plus size={17} />
            Thêm nhân viên
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: 14,
            background: "#fff0ee",
            color: "#ad3d35",
            borderRadius: 10,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: 14,
            background: "#e8f4e9",
            color: "#347858",
            borderRadius: 10,
            marginBottom: 16,
          }}
        >
          {success}
        </div>
      )}

      {showForm && (
        <div
          className="panel"
          style={{ padding: 24, marginBottom: 22 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <h3>
              {editingId !== null
                ? "Chỉnh sửa nhân viên"
                : "Thêm nhân viên mới"}
            </h3>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
              aria-label="Đóng"
            >
              <X size={22} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(230px, 1fr))",
                gap: 18,
              }}
            >
              <label>
                <span>Họ và tên *</span>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="VD: Nguyễn Thị Hương"
                  required
                  minLength={2}
                  maxLength={100}
                  style={inputStyle}
                />
              </label>

              <label>
                <span>Số điện thoại *</span>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="VD: 0912345678"
                  required
                  minLength={9}
                  maxLength={20}
                  style={inputStyle}
                />
              </label>

              <label>
                <span>Chức vụ *</span>
                <select
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                >
                  <option value="">-- Chọn chức vụ --</option>
                  <option value="Quản lý Spa">Quản lý Spa</option>
                  <option value="Kỹ thuật viên">Kỹ thuật viên</option>
                  <option value="Chuyên viên chăm sóc da">
                    Chuyên viên chăm sóc da
                  </option>
                  <option value="Chuyên viên massage">
                    Chuyên viên massage
                  </option>
                  <option value="Lễ tân">Lễ tân</option>
                  <option value="Tư vấn viên">Tư vấn viên</option>
                </select>
              </label>

              <label>
                <span>Chuyên môn</span>
                <input
                  name="specialty"
                  value={form.specialty}
                  onChange={handleChange}
                  placeholder="VD: Massage, chăm sóc da"
                  maxLength={150}
                  style={inputStyle}
                />
              </label>

              <label>
                <span>Trạng thái</span>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="active">Đang làm việc</option>
                  <option value="inactive">Tạm nghỉ</option>
                </select>
              </label>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 24,
              }}
            >
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  ...buttonStyle,
                  background: "#edf1ec",
                  color: "#4c6254",
                }}
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{
                  ...buttonStyle,
                  opacity: saving ? 0.65 : 1,
                }}
              >
                <Save size={17} />
                {saving
                  ? "Đang lưu..."
                  : editingId !== null
                    ? "Lưu thay đổi"
                    : "Lưu nhân viên"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="panel" style={{ padding: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div>
            <h3>Danh sách nhân viên</h3>
            <p style={{ color: "#87968b", marginTop: 6 }}>
              Dữ liệu được lưu trong hệ thống Spa AI
            </p>
          </div>

          <span
            style={{
              padding: "8px 13px",
              borderRadius: 20,
              background: "#e8f1e9",
              color: "#41654b",
              fontWeight: 600,
            }}
          >
            {employees.length} nhân viên
          </span>
        </div>

        {loading ? (
          <p>Đang tải danh sách nhân viên...</p>
        ) : employees.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "45px 15px",
              color: "#8b9b90",
            }}
          >
            <UsersRound size={42} style={{ marginBottom: 12 }} />
            <h3>Chưa có nhân viên nào</h3>
            <p>Nhấn "Thêm nhân viên" để tạo hồ sơ đầu tiên.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>MÃ NV</th>
                  <th>HỌ TÊN</th>
                  <th>SỐ ĐIỆN THOẠI</th>
                  <th>CHỨC VỤ</th>
                  <th>CHUYÊN MÔN</th>
                  <th>TRẠNG THÁI</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>#{employee.id}</td>
                    <td>
                      <strong>{employee.full_name}</strong>
                    </td>
                    <td>{employee.phone}</td>
                    <td>{employee.position}</td>
                    <td>{employee.specialty || "Chưa cập nhật"}</td>

                    <td>
                      <span
                        style={{
                          color:
                            employee.status === "active"
                              ? "#347858"
                              : "#b7791f",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {employee.status === "active"
                          ? "Đang làm việc"
                          : "Tạm nghỉ"}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => openEditForm(employee)}
                          style={{
                            ...buttonStyle,
                            padding: "8px 10px",
                          }}
                        >
                          <Pencil size={15} />
                          Sửa
                        </button>

                        <button
                          onClick={() => handleDelete(employee)}
                          disabled={deletingId === employee.id}
                          style={{
                            ...buttonStyle,
                            background: "#fff0ee",
                            color: "#b54747",
                            padding: "8px 10px",
                          }}
                        >
                          <Trash2 size={15} />
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
