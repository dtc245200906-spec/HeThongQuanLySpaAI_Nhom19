
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Save,
  Clock3,
} from "lucide-react";

const API = "http://127.0.0.1:8001";

const authHeaders = (json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${sessionStorage.getItem("spa_access_token") || ""}`,
});

const emptyForm = {
  customer_id: "",
  service_id: "",
  appointment_time: "",
  staff_name: "",
  status: "pending",
  notes: "",
};

const statusLabels = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

const statusColors = {
  pending: "#b7791f",
  confirmed: "#347858",
  completed: "#2563a6",
  cancelled: "#b54747",
};

const formatDate = (value) => {
  if (!value) return "—";
  const [date, time] = value.split("T");
  if (!date || !time) return value;
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year} ${time.slice(0, 5)}`;
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

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const responses = await Promise.all([
        fetch(`${API}/api/appointments`, { headers: authHeaders() }),
        fetch(`${API}/api/customers`, { headers: authHeaders() }),
        fetch(`${API}/api/services`, { headers: authHeaders() }),
        fetch(`${API}/api/employees`, { headers: authHeaders() }),
      ]);

      if (responses.some((response) => !response.ok)) {
        throw new Error("Không thể tải dữ liệu từ Backend.");
      }

      const [
        appointmentData,
        customerData,
        serviceData,
        employeeData,
      ] = await Promise.all(
        responses.map((response) => response.json())
      );

      setAppointments(appointmentData);
      setCustomers(customerData);
      setServices(serviceData);
      setEmployees(employeeData);
    } catch (err) {
      setError(err.message || "Không thể kết nối Backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (appointment) => {
    setEditingId(appointment.id);
    setForm({
      customer_id: String(appointment.customer_id),
      service_id: String(appointment.service_id),
      appointment_time:
        appointment.appointment_time?.slice(0, 16) || "",
      staff_name: appointment.staff_name || "",
      status: appointment.status,
      notes: appointment.notes || "",
    });
    setError("");
    setSuccess("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
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
      !form.customer_id ||
      !form.service_id ||
      !form.appointment_time
    ) {
      setError("Vui lòng chọn khách hàng, dịch vụ và thời gian.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const wasEditing = editingId !== null;
    const payload = {
      customer_id: Number(form.customer_id),
      service_id: Number(form.service_id),
      appointment_time: form.appointment_time,
      staff_name: form.staff_name.trim() || null,
      status: form.status,
      notes: form.notes.trim() || null,
    };

    try {
      const url = wasEditing
        ? `${API}/api/appointments/${editingId}`
        : `${API}/api/appointments`;

      const response = await fetch(url, {
        method: wasEditing ? "PUT" : "POST",
        headers: authHeaders(true),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(
          typeof detail.detail === "string"
            ? detail.detail
            : "Không thể lưu lịch hẹn. Vui lòng kiểm tra thông tin."
        );
      }

      closeForm();
      await loadData();
      setSuccess(
        wasEditing
          ? "Đã cập nhật lịch hẹn thành công!"
          : "Đã đặt lịch hẹn thành công!"
      );
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi lưu lịch hẹn.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (appointment) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa lịch hẹn #${appointment.id}?`
    );
    if (!confirmed) return;

    setDeletingId(appointment.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API}/api/appointments/${appointment.id}`,
        { method: "DELETE", headers: authHeaders() }
      );

      if (!response.ok) {
        throw new Error("Không thể xóa lịch hẹn.");
      }

      await loadData();
      setSuccess("Đã xóa lịch hẹn thành công!");
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi xóa lịch hẹn.");
    } finally {
      setDeletingId(null);
    }
  };

  const getCustomerName = (id) =>
    customers.find((item) => item.id === id)?.full_name ||
    `Khách hàng #${id}`;

  const getServiceName = (id) =>
    services.find((item) => item.id === id)?.name ||
    `Dịch vụ #${id}`;

  return (
    <div className="dashboard">
      <div className="section-heading">
        <div>
          <h2>Quản lý lịch hẹn Spa</h2>
          <p>
            Đặt lịch, quản lý khách hàng và theo dõi lịch chăm sóc
            sắc đẹp.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={loadData}
            style={{
              ...buttonStyle,
              background: "#e7eee7",
              color: "#41654b",
            }}
          >
            <RefreshCw size={16} />
            Làm mới
          </button>

          <button
            type="button"
            onClick={openAddForm}
            style={buttonStyle}
          >
            <Plus size={17} />
            Đặt lịch mới
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
                ? "Chỉnh sửa lịch hẹn"
                : "Đặt lịch hẹn mới"}
            </h3>

            <button
              type="button"
              onClick={closeForm}
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
              {/* Khách hàng */}
              <label>
                <span>Khách hàng *</span>
                <select
                  name="customer_id"
                  value={form.customer_id}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                >
                  <option value="">-- Chọn khách hàng --</option>

                  {customers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.full_name} - {customer.phone}
                    </option>
                  ))}
                </select>
              </label>

              {/* Dịch vụ */}
              <label>
                <span>Dịch vụ *</span>
                <select
                  name="service_id"
                  value={form.service_id}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                >
                  <option value="">-- Chọn dịch vụ --</option>

                  {services
                    .filter(
                      (service) =>
                        service.status === "active" ||
                        String(service.id) === form.service_id
                    )
                    .map((service) => (
                      <option
                        key={service.id}
                        value={service.id}
                      >
                        {service.name}
                      </option>
                    ))}
                </select>
              </label>

              {/* Ngày giờ */}
              <label>
                <span>Ngày và giờ hẹn *</span>
                <input
                  type="datetime-local"
                  name="appointment_time"
                  value={form.appointment_time}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </label>

              {/* Nhân viên lấy từ database */}
              <label>
                <span>Nhân viên phụ trách</span>
                <select
                  name="staff_name"
                  value={form.staff_name}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">-- Chọn nhân viên --</option>

                  {form.staff_name &&
                    !employees.some(
                      (employee) =>
                        employee.full_name === form.staff_name
                    ) && (
                      <option value={form.staff_name}>
                        {form.staff_name} (nhân viên cũ)
                      </option>
                    )}

                  {employees
                    .filter(
                      (employee) =>
                        employee.status === "active" ||
                        employee.full_name === form.staff_name
                    )
                    .map((employee) => (
                      <option
                        key={employee.id}
                        value={employee.full_name}
                      >
                        {employee.full_name} - {employee.position}
                      </option>
                    ))}
                </select>
              </label>

              {/* Trạng thái */}
              <label>
                <span>Trạng thái</span>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="pending">Chờ xác nhận</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </label>

              {/* Ghi chú */}
              <label>
                <span>Ghi chú</span>
                <input
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Nhập ghi chú lịch hẹn"
                  style={inputStyle}
                />
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
                onClick={closeForm}
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
                    : "Xác nhận đặt lịch"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danh sách lịch hẹn */}
      <div className="panel" style={{ padding: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div>
            <h3>Danh sách lịch hẹn</h3>
            <p style={{ color: "#87968b", marginTop: 6 }}>
              Dữ liệu lấy trực tiếp từ cơ sở dữ liệu Spa AI
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
            {appointments.length} lịch hẹn
          </span>
        </div>

        {loading ? (
          <p>Đang tải dữ liệu lịch hẹn...</p>
        ) : appointments.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "45px 15px",
              color: "#8b9b90",
            }}
          >
            <CalendarDays
              size={42}
              style={{ marginBottom: 12 }}
            />
            <h3>Chưa có lịch hẹn nào</h3>
            <p>Nhấn "Đặt lịch mới" để tạo lịch hẹn đầu tiên.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>MÃ LỊCH</th>
                  <th>KHÁCH HÀNG</th>
                  <th>DỊCH VỤ</th>
                  <th>NGÀY GIỜ</th>
                  <th>NHÂN VIÊN</th>
                  <th>TRẠNG THÁI</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>#{appointment.id}</td>

                    <td>
                      <strong>
                        {getCustomerName(
                          appointment.customer_id
                        )}
                      </strong>
                    </td>

                    <td>
                      {getServiceName(appointment.service_id)}
                    </td>

                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Clock3 size={15} />
                        {formatDate(
                          appointment.appointment_time
                        )}
                      </span>
                    </td>

                    <td>
                      {appointment.staff_name || "Chưa phân công"}
                    </td>

                    <td>
                      <span
                        style={{
                          color:
                            statusColors[appointment.status] ||
                            "#555",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {statusLabels[appointment.status] ||
                          appointment.status}
                      </span>
                    </td>

                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(appointment)
                          }
                          style={{
                            ...buttonStyle,
                            padding: "8px 10px",
                          }}
                        >
                          <Pencil size={15} />
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(appointment)
                          }
                          disabled={
                            deletingId === appointment.id
                          }
                          style={{
                            ...buttonStyle,
                            background: "#fff0ee",
                            color: "#b54747",
                            padding: "8px 10px",
                            opacity:
                              deletingId === appointment.id
                                ? 0.6
                                : 1,
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
