
import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  X,
  RefreshCw,
  Save,
  Mail,
  Phone,
} from "lucide-react";

import "./Customers.css";

const API_URL = "http://127.0.0.1:8001/api/customers";

const initialForm = {
  full_name: "",
  phone: "",
  email: "",
  date_of_birth: "",
  care_needs: "",
  notes: "",
};

function getAuthHeaders(includeJson = false) {
  const token = sessionStorage.getItem("spa_access_token");

  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...initialForm });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCustomers() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng xuất và đăng nhập lại."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "Tài khoản không có quyền xem danh sách khách hàng."
          );
        }

        throw new Error("Không thể tải danh sách khách hàng.");
      }

      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      setError(err.message || "Không kết nối được máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function openForm() {
    setForm({ ...initialForm });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          date_of_birth: form.date_of_birth || null,
          care_needs: form.care_needs.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          throw new Error(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "Tài khoản không có quyền thêm khách hàng."
          );
        }

        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : response.status === 409
              ? "Số điện thoại đã tồn tại."
              : "Không thể thêm khách hàng. Vui lòng kiểm tra thông tin."
        );
      }

      setShowForm(false);
      setForm({ ...initialForm });

      await loadCustomers();

      setSuccess("Đã thêm khách hàng thành công!");
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi lưu khách hàng.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = customers.filter((customer) => {
    const keyword = search.toLowerCase().trim();

    return (
      customer.full_name?.toLowerCase().includes(keyword) ||
      customer.phone?.includes(keyword) ||
      customer.email?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="customers-page">
      <div className="customers-heading">
        <div>
          <span className="customers-eyebrow">
            QUẢN LÝ SPA
          </span>

          <h1>Khách hàng</h1>

          <p>
            Quản lý hồ sơ và nhu cầu chăm sóc của khách hàng.
          </p>
        </div>

        <button
          type="button"
          className="customers-add"
          onClick={openForm}
        >
          <Plus size={18} />
          Thêm khách hàng
        </button>
      </div>

      <div className="customers-summary">
        <div className="customers-summary-icon">
          <Users size={26} />
        </div>

        <div>
          <span>Tổng số khách hàng</span>
          <strong>{customers.length}</strong>
          <small>Dữ liệu thực từ hệ thống Spa AI</small>
        </div>
      </div>

      {success && (
        <div className="customers-success">
          {success}
        </div>
      )}

      {error && !showForm && (
        <div className="customers-error">
          {error}
        </div>
      )}

      <div className="customers-panel">
        <div className="customers-toolbar">
          <div>
            <h2>Danh sách khách hàng</h2>
            <p>Thông tin được đồng bộ từ cơ sở dữ liệu.</p>
          </div>

          <button
            type="button"
            className="customers-refresh"
            onClick={loadCustomers}
            title="Tải lại danh sách"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        <div className="customers-search">
          <Search size={18} />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên, số điện thoại, email..."
          />
        </div>

        <div className="customers-table-wrap">
          <table className="customers-table">
            <thead>
              <tr>
                <th>KHÁCH HÀNG</th>
                <th>SỐ ĐIỆN THOẠI</th>
                <th>EMAIL</th>
                <th>NHU CẦU CHĂM SÓC</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="customers-empty"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="customers-empty"
                  >
                    Không tìm thấy khách hàng nào.
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="customers-person">
                        <span className="customers-avatar">
                          {customer.full_name
                            ?.charAt(0)
                            .toUpperCase()}
                        </span>

                        <div>
                          <strong>
                            {customer.full_name}
                          </strong>

                          <small>
                            KH-
                            {String(customer.id).padStart(
                              4,
                              "0"
                            )}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="customers-cell-icon">
                        <Phone size={14} />
                        {customer.phone}
                      </span>
                    </td>

                    <td>
                      {customer.email ? (
                        <span className="customers-cell-icon">
                          <Mail size={14} />
                          {customer.email}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td>
                      {customer.care_needs ||
                        "Chưa cập nhật"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div
          className="customers-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <div
            className="customers-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customers-modal-title"
          >
            <div className="customers-modal-header">
              <div>
                <span className="customers-modal-eyebrow">
                  HỒ SƠ KHÁCH HÀNG
                </span>

                <h2 id="customers-modal-title">
                  Thêm khách hàng mới
                </h2>

                <p>
                  Điền thông tin để tạo hồ sơ chăm sóc
                  sắc đẹp.
                </p>
              </div>

              <button
                type="button"
                className="customers-close"
                onClick={closeForm}
                aria-label="Đóng cửa sổ"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="customers-form-grid">
                <label className="customers-field">
                  <span>
                    Họ và tên <b>*</b>
                  </span>

                  <input
                    name="full_name"
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Ví dụ: Nguyễn Thị Mai"
                  />
                </label>

                <label className="customers-field">
                  <span>
                    Số điện thoại <b>*</b>
                  </span>

                  <input
                    name="phone"
                    type="tel"
                    required
                    minLength={9}
                    maxLength={20}
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Ví dụ: 0912345678"
                  />
                </label>

                <label className="customers-field">
                  <span>Email</span>

                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="example@gmail.com"
                  />
                </label>

                <label className="customers-field">
                  <span>Ngày sinh</span>

                  <input
                    name="date_of_birth"
                    type="date"
                    value={form.date_of_birth}
                    onChange={handleChange}
                  />
                </label>

                <label className="customers-field customers-field-full">
                  <span>Nhu cầu chăm sóc</span>

                  <textarea
                    name="care_needs"
                    rows={3}
                    value={form.care_needs}
                    onChange={handleChange}
                    placeholder="Chăm sóc da, massage thư giãn, điều trị..."
                  />
                </label>

                <label className="customers-field customers-field-full">
                  <span>Ghi chú</span>

                  <textarea
                    name="notes"
                    rows={3}
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Thông tin bổ sung về khách hàng..."
                  />
                </label>
              </div>

              {error && (
                <div className="customers-error customers-form-error">
                  {error}
                </div>
              )}

              <div className="customers-form-actions">
                <button
                  type="button"
                  className="customers-cancel"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="customers-add"
                  disabled={saving}
                >
                  <Save size={17} />

                  {saving
                    ? "Đang lưu..."
                    : "Lưu khách hàng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
