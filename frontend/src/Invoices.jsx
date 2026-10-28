
import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8001/api";

const initialForm = {
  customer_id: "",
  service_id: "",
  payment_method: "cash",
  status: "unpaid",
  notes: "",
};

const money = (value) =>
  Number(value || 0).toLocaleString("vi-VN") + " ₫";

const paymentLabel = (method) => {
  if (method === "cash") return "Tiền mặt";
  if (method === "bank_transfer" || method === "transfer") {
    return "Chuyển khoản";
  }
  return method || "Chưa xác định";
};

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  // Gửi yêu cầu API kèm JWT
  async function request(path, options = {}) {
    const token = sessionStorage.getItem("spa_access_token");

    const response = await fetch(API + path, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
      },
    });

    if (!response.ok) {
      let message =
        response.status === 401
          ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          : response.status === 403
            ? "Tài khoản không có quyền thực hiện thao tác này."
            : `Không thể xử lý yêu cầu (${response.status}).`;

      try {
        const data = await response.json();

        if (Array.isArray(data.detail)) {
          message = data.detail
            .map((item) => item.msg || "Dữ liệu không hợp lệ")
            .join("; ");
        } else if (typeof data.detail === "string") {
          message = data.detail;
        }
      } catch {
        // Giữ thông báo mặc định
      }

      throw new Error(message);
    }

    if (response.status === 204) return null;

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  // Tải danh sách hóa đơn, khách hàng, dịch vụ
  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [invoiceData, customerData, serviceData] =
        await Promise.all([
          request("/invoices"),
          request("/customers"),
          request("/services"),
        ]);

      setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
      setCustomers(Array.isArray(customerData) ? customerData : []);
      setServices(Array.isArray(serviceData) ? serviceData : []);
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function getCustomer(id) {
    const customer = customers.find(
      (item) => item.id === Number(id)
    );

    return customer?.full_name || `Khách hàng #${id}`;
  }

  function getService(id) {
    const service = services.find(
      (item) => item.id === Number(id)
    );

    return service?.name || `Dịch vụ #${id}`;
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...initialForm });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEdit(invoice) {
    setEditingId(invoice.id);

    setForm({
      customer_id: String(invoice.customer_id),
      service_id: String(invoice.service_id),

      // Đồng bộ giá trị với Backend
      payment_method:
        invoice.payment_method === "transfer"
          ? "bank_transfer"
          : invoice.payment_method || "cash",

      status: invoice.status || "unpaid",
      notes: invoice.notes || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm({ ...initialForm });
  }

  // Thêm hoặc cập nhật hóa đơn
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.customer_id || !form.service_id) {
      setError("Vui lòng chọn khách hàng và dịch vụ.");
      return;
    }

    const service = services.find(
      (item) => item.id === Number(form.service_id)
    );

    if (!service) {
      setError("Không tìm thấy dịch vụ đã chọn.");
      return;
    }

    const payload = {
      customer_id: Number(form.customer_id),
      service_id: Number(form.service_id),
      total_amount: Number(service.price || 0),

      // Backend chỉ chấp nhận cash hoặc bank_transfer
      payment_method: form.payment_method,

      status: form.status,
      notes: form.notes || null,
    };

    const isEditing = editingId !== null;

    setSaving(true);

    try {
      await request(
        isEditing ? `/invoices/${editingId}` : "/invoices",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      setShowForm(false);
      setEditingId(null);
      setForm({ ...initialForm });

      await loadData();

      setSuccess(
        isEditing
          ? "Cập nhật hóa đơn thành công!"
          : "Tạo hóa đơn thành công!"
      );
    } catch (err) {
      setError(err.message || "Không thể lưu hóa đơn.");
    } finally {
      setSaving(false);
    }
  }

  // Xóa hóa đơn
  async function handleDelete(id) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa hóa đơn HD${String(id).padStart(4, "0")}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await request(`/invoices/${id}`, {
        method: "DELETE",
      });

      await loadData();
      setSuccess("Đã xóa hóa đơn thành công!");
    } catch (err) {
      setError(err.message || "Không thể xóa hóa đơn.");
    }
  }

  // Tìm kiếm
  const filteredInvoices = invoices.filter((invoice) => {
    const text = [
      invoice.id,
      getCustomer(invoice.customer_id),
      getService(invoice.service_id),
      invoice.status,
      paymentLabel(invoice.payment_method),
    ]
      .join(" ")
      .toLowerCase();

    return text.includes(search.toLowerCase());
  });

  // Dịch vụ đang chọn
  const selectedService = services.find(
    (service) => service.id === Number(form.service_id)
  );

  // Doanh thu thực tế
  const totalRevenue = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce(
      (sum, invoice) =>
        sum + Number(invoice.total_amount || 0),
      0
    );

  const paidCount = invoices.filter(
    (invoice) => invoice.status === "paid"
  ).length;

  const unpaidCount = invoices.filter(
    (invoice) => invoice.status === "unpaid"
  ).length;

  const inputStyle = {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #d9e5dd",
    borderRadius: 9,
    fontSize: 14,
    background: "#fff",
    boxSizing: "border-box",
  };

  const buttonStyle = {
    border: "none",
    borderRadius: 9,
    padding: "10px 15px",
    cursor: "pointer",
    fontWeight: 600,
  };

  return (
    <div style={{ padding: 24, color: "#25382d" }}>
      {/* Tiêu đề */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 22,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 26 }}>
            Quản lý hóa đơn
          </h2>

          <p style={{ color: "#748478", marginTop: 7 }}>
            Theo dõi hóa đơn và tình trạng thanh toán tại Spa
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          style={{
            ...buttonStyle,
            background: "#24734b",
            color: "#fff",
          }}
        >
          + Tạo hóa đơn
        </button>
      </div>

      {/* Thống kê hóa đơn */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 22,
        }}
      >
        {[
          ["Tổng hóa đơn", invoices.length],
          ["Đã thanh toán", paidCount],
          ["Chưa thanh toán", unpaidCount],
          ["Doanh thu đã thu", money(totalRevenue)],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              background: "#fff",
              border: "1px solid #e5eee7",
              borderRadius: 14,
              padding: 19,
            }}
          >
            <div
              style={{
                color: "#748478",
                fontSize: 13,
              }}
            >
              {label}
            </div>

            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                marginTop: 8,
                color: "#246c47",
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <div
          style={{
            padding: 13,
            background: "#fff0ed",
            color: "#ad342a",
            borderRadius: 9,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* Thông báo thành công */}
      {success && (
        <div
          style={{
            padding: 13,
            background: "#e7f5ea",
            color: "#24734b",
            borderRadius: 9,
            marginBottom: 16,
          }}
        >
          {success}
        </div>
      )}

      {/* Danh sách hóa đơn */}
      <div
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 14,
          border: "1px solid #e5eee7",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <input
            placeholder="Tìm hóa đơn, khách hàng, dịch vụ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              ...inputStyle,
              maxWidth: 390,
            }}
          />

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            style={{
              ...buttonStyle,
              background: "#e8f3eb",
              color: "#246c47",
            }}
          >
            {loading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              minWidth: 750,
            }}
          >
            <thead>
              <tr style={{ background: "#f4f8f5" }}>
                {[
                  "Mã HĐ",
                  "Khách hàng",
                  "Dịch vụ",
                  "Tổng tiền",
                  "Thanh toán",
                  "Trạng thái",
                  "Thao tác",
                ].map((title) => (
                  <th
                    key={title}
                    style={{
                      padding: 13,
                      fontSize: 13,
                    }}
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  style={{
                    borderBottom: "1px solid #edf1ed",
                  }}
                >
                  <td style={{ padding: 13 }}>
                    HD{String(invoice.id).padStart(4, "0")}
                  </td>

                  <td style={{ padding: 13 }}>
                    {getCustomer(invoice.customer_id)}
                  </td>

                  <td style={{ padding: 13 }}>
                    {getService(invoice.service_id)}
                  </td>

                  <td
                    style={{
                      padding: 13,
                      fontWeight: 600,
                    }}
                  >
                    {money(invoice.total_amount)}
                  </td>

                  <td style={{ padding: 13 }}>
                    {paymentLabel(invoice.payment_method)}
                  </td>

                  <td style={{ padding: 13 }}>
                    <span
                      style={{
                        color:
                          invoice.status === "paid"
                            ? "#177245"
                            : "#a76c19",
                        fontWeight: 600,
                      }}
                    >
                      {invoice.status === "paid"
                        ? "Đã thanh toán"
                        : "Chưa thanh toán"}
                    </span>
                  </td>

                  <td
                    style={{
                      padding: 13,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => openEdit(invoice)}
                      style={{
                        ...buttonStyle,
                        background: "#e9f4ed",
                        color: "#226d45",
                        marginRight: 7,
                      }}
                    >
                      Sửa
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(invoice.id)}
                      style={{
                        ...buttonStyle,
                        background: "#fff0ee",
                        color: "#b43d32",
                      }}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filteredInvoices.length === 0 && (
            <p
              style={{
                textAlign: "center",
                padding: 28,
                color: "#829086",
              }}
            >
              Không tìm thấy hóa đơn.
            </p>
          )}

          {loading && <p>Đang tải dữ liệu hóa đơn...</p>}
        </div>
      </div>

      {/* Form tạo / sửa hóa đơn */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 15,
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 26,
              width: "100%",
              maxWidth: 470,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              {editingId !== null
                ? "Cập nhật hóa đơn"
                : "Tạo hóa đơn"}
            </h2>

            {/* Khách hàng */}
            <label>Khách hàng</label>

            <select
              required
              value={form.customer_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  customer_id: e.target.value,
                })
              }
              style={{
                ...inputStyle,
                margin: "8px 0 16px",
              }}
            >
              <option value="">-- Chọn khách hàng --</option>

              {customers.map((customer) => (
                <option
                  key={customer.id}
                  value={customer.id}
                >
                  {getCustomer(customer.id)}
                </option>
              ))}
            </select>

            {/* Dịch vụ */}
            <label>Dịch vụ</label>

            <select
              required
              value={form.service_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  service_id: e.target.value,
                })
              }
              style={{
                ...inputStyle,
                margin: "8px 0 16px",
              }}
            >
              <option value="">-- Chọn dịch vụ --</option>

              {services.map((service) => (
                <option
                  key={service.id}
                  value={service.id}
                >
                  {getService(service.id)}
                </option>
              ))}
            </select>

            {/* Tổng tiền */}
            <label>Tổng tiền</label>

            <div
              style={{
                padding: 13,
                background: "#f1f7f2",
                borderRadius: 9,
                fontWeight: 700,
                color: "#216b43",
                margin: "8px 0 16px",
              }}
            >
              {money(selectedService?.price)}
            </div>

            {/* Phương thức thanh toán */}
            <label>Phương thức thanh toán</label>

            <select
              value={form.payment_method}
              onChange={(e) =>
                setForm({
                  ...form,
                  payment_method: e.target.value,
                })
              }
              style={{
                ...inputStyle,
                margin: "8px 0 16px",
              }}
            >
              <option value="cash">Tiền mặt</option>

              <option value="bank_transfer">
                Chuyển khoản
              </option>
            </select>

            {/* Trạng thái */}
            <label>Trạng thái</label>

            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value,
                })
              }
              style={{
                ...inputStyle,
                margin: "8px 0 16px",
              }}
            >
              <option value="unpaid">Chưa thanh toán</option>
              <option value="paid">Đã thanh toán</option>
            </select>

            {/* Ghi chú */}
            <label>Ghi chú</label>

            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm({
                  ...form,
                  notes: e.target.value,
                })
              }
              rows={3}
              style={{
                ...inputStyle,
                margin: "8px 0 20px",
                resize: "vertical",
              }}
            />

            {/* Nút lưu */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
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
                  background: "#24734b",
                  color: "#fff",
                }}
              >
                {saving
                  ? "Đang lưu..."
                  : editingId !== null
                    ? "Lưu thay đổi"
                    : "Tạo hóa đơn"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
