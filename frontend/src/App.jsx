
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Sparkles,
  Scissors,
  UserRound,
  Receipt,
  BarChart3,
  Settings,
  Bell,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  Menu,
  X,
  LogOut,
  LockKeyhole,
  RefreshCw,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import "./App.css";
import Customers from "./Customers";
import Services from "./Services";
import Employees from "./Employees";
import Appointments from "./Appointments";
import Invoices from "./Invoices";
import Statistics from "./Statistics";
import AIAssistant from "./AIAssistant";

const API_URL = "http://127.0.0.1:8001";

const menuItems = [
  { label: "Tổng quan", icon: LayoutDashboard },
  { label: "Khách hàng", icon: Users },
  { label: "Lịch hẹn", icon: CalendarDays },
  { label: "Dịch vụ", icon: Scissors },
  { label: "Nhân viên", icon: UserRound },
  { label: "Hóa đơn", icon: Receipt },
  { label: "Thống kê", icon: BarChart3 },
  { label: "Trợ lý AI", icon: Sparkles },
  { label: "Cài đặt", icon: Settings },
];

const formatMoney = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value) || 0) + " đ";

const formatNumber = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value) || 0);

const formatDateTime = (value) => {
  if (!value) return "Chưa có";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const appointmentStatus = {
  pending: {
    label: "Chờ xác nhận",
    color: "orange",
  },
  confirmed: {
    label: "Đã xác nhận",
    color: "green",
  },
  completed: {
    label: "Hoàn thành",
    color: "blue",
  },
  cancelled: {
    label: "Đã hủy",
    color: "orange",
  },
};

const loginStyles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    background: "linear-gradient(135deg, #edf4ee, #faf7f0)",
    fontFamily: "inherit",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    boxSizing: "border-box",
    background: "#fff",
    borderRadius: 20,
    padding: "36px 32px",
    boxShadow: "0 18px 55px rgba(35,69,50,.12)",
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: "#e3eee5",
    color: "#4e795e",
    display: "grid",
    placeItems: "center",
    marginBottom: 16,
  },
  heading: {
    fontSize: 27,
    color: "#294a36",
    margin: "0 0 8px",
  },
  subtitle: {
    color: "#718074",
    margin: "0 0 28px",
    lineHeight: 1.6,
  },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    color: "#395345",
    marginBottom: 8,
  },
  input: {
    display: "block",
    boxSizing: "border-box",
    width: "100%",
    padding: "13px 14px",
    border: "1px solid #d8e2d8",
    borderRadius: 10,
    fontSize: 15,
    marginBottom: 18,
  },
  button: {
    width: "100%",
    padding: 14,
    border: 0,
    borderRadius: 10,
    background: "#648873",
    color: "white",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  },
  error: {
    color: "#a33232",
    background: "#fff0f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
};

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.access_token) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Tên đăng nhập hoặc mật khẩu không đúng."
        );
      }

      onLogin(data.access_token);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Không kết nối được Backend tại cổng 8001."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={loginStyles.page}>
      <form
        style={loginStyles.card}
        onSubmit={handleSubmit}
      >
        <div style={loginStyles.logo}>
          <LockKeyhole size={27} />
        </div>

        <h1 style={loginStyles.heading}>
          Đăng nhập SPA AI
        </h1>

        <p style={loginStyles.subtitle}>
          Hệ thống quản lý Spa và chăm sóc sắc đẹp
          <br />
          Nhóm 19
        </p>

        <label
          style={loginStyles.label}
          htmlFor="username"
        >
          Tên đăng nhập
        </label>

        <input
          id="username"
          style={loginStyles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          placeholder="Nhập tên đăng nhập"
          required
        />

        <label
          style={loginStyles.label}
          htmlFor="password"
        >
          Mật khẩu
        </label>

        <input
          id="password"
          type="password"
          style={loginStyles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Nhập mật khẩu"
          required
        />

        {error && (
          <div role="alert" style={loginStyles.error}>
            {error}
          </div>
        )}

        <button
          type="submit"
          style={loginStyles.button}
          disabled={loading}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}

function StatCard({
  title,
  value,
  detail,
  icon: Icon,
  tone,
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={23} />
      </div>

      <div className="stat-title">
        {title}
      </div>

      <div className="stat-value">
        {value}
      </div>

      <div className="stat-detail">
        {detail}
      </div>
    </div>
  );
}

function Dashboard({ token, onNavigate }) {
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      try {
        const endpoints = [
          "/api/customers",
          "/api/services",
          "/api/appointments",
          "/api/invoices",
        ];

        const responses = await Promise.all(
          endpoints.map((endpoint) =>
            fetch(`${API_URL}${endpoint}`, {
              headers,
              signal: controller.signal,
            })
          )
        );

        for (const response of responses) {
          if (!response.ok) {
            throw new Error(
              `Không tải được dữ liệu (HTTP ${response.status}).`
            );
          }
        }

        const results = await Promise.all(
          responses.map((response) => response.json())
        );

        if (results.some((item) => !Array.isArray(item))) {
          throw new Error(
            "Dữ liệu Backend trả về không đúng định dạng."
          );
        }

        if (!controller.signal.aborted) {
          setCustomers(results[0]);
          setServices(results[1]);
          setAppointments(results[2]);
          setInvoices(results[3]);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof TypeError
              ? "Không kết nối được Backend tại cổng 8001."
              : err.message
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => controller.abort();
  }, [token, refreshKey]);

  const paidInvoices = invoices.filter(
    (invoice) => invoice.status === "paid"
  );

  const unpaidInvoices = invoices.filter(
    (invoice) => invoice.status === "unpaid"
  );

  const totalRevenue = paidInvoices.reduce(
    (sum, invoice) =>
      sum + (Number(invoice.total_amount) || 0),
    0
  );

  const unpaidAmount = unpaidInvoices.reduce(
    (sum, invoice) =>
      sum + (Number(invoice.total_amount) || 0),
    0
  );

  const activeServices = services.filter(
    (service) => service.status === "active"
  );

  const recentAppointments = [...appointments]
    .sort((a, b) => {
      const aTime = new Date(a.appointment_time).getTime();
      const bTime = new Date(b.appointment_time).getTime();

      if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
        return (b.id || 0) - (a.id || 0);
      }

      return bTime - aTime;
    })
    .slice(0, 5);

  const customerMap = new Map(
    customers.map((customer) => [
      Number(customer.id),
      customer.full_name,
    ])
  );

  const serviceMap = new Map(
    services.map((service) => [
      Number(service.id),
      service.name,
    ])
  );

  const chartData = [
    {
      name: "Đã thanh toán",
      value: totalRevenue,
    },
    {
      name: "Chưa thanh toán",
      value: unpaidAmount,
    },
  ];

  return (
    <div className="dashboard">
      <section className="welcome-banner">
        <div>
          <div className="welcome-label">
            <Sparkles size={16} />
            SPA MANAGEMENT SYSTEM
          </div>

          <h1>Chào mừng trở lại!</h1>

          <p>
            Quản lý Spa hiệu quả hơn với hệ thống
            chăm sóc sắc đẹp tích hợp trí tuệ nhân tạo.
          </p>

          <span className="banner-note">
            <CheckCircle2 size={16} />
            Hệ thống đã sẵn sàng
          </span>
        </div>

        <div className="banner-decoration">
          <Sparkles
            size={90}
            strokeWidth={1}
          />
        </div>
      </section>

      <div className="section-heading">
        <div>
          <h2>Tổng quan hoạt động</h2>
          <p>
            Dữ liệu thực tế từ hệ thống quản lý Spa
          </p>
        </div>

        <button
          className="text-button"
          type="button"
          onClick={() =>
            setRefreshKey((value) => value + 1)
          }
          disabled={loading}
        >
          <RefreshCw size={16} />
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: 16,
            marginBottom: 20,
            borderRadius: 10,
            background: "#fff0f0",
            color: "#a33232",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="panel" style={{ padding: 30 }}>
          Đang tải dữ liệu tổng quan...
        </div>
      ) : error ? (
        <div className="panel" style={{ padding: 30 }}>
          Không thể hiển thị số liệu khi chưa kết nối
          được dữ liệu thực tế.
        </div>
      ) : (
        <>
          <section className="stats-grid">
            <StatCard
              title="Tổng doanh thu"
              value={formatMoney(totalRevenue)}
              detail="Tổng hóa đơn đã thanh toán"
              icon={Receipt}
              tone="sage"
            />

            <StatCard
              title="Khách hàng"
              value={formatNumber(customers.length)}
              detail="Tổng hồ sơ khách hàng"
              icon={Users}
              tone="peach"
            />

            <StatCard
              title="Lịch hẹn"
              value={formatNumber(appointments.length)}
              detail="Tổng số lịch hẹn"
              icon={CalendarDays}
              tone="lavender"
            />

            <StatCard
              title="Dịch vụ"
              value={formatNumber(activeServices.length)}
              detail="Dịch vụ đang hoạt động"
              icon={Scissors}
              tone="gold"
            />
          </section>

          <section className="dashboard-grid">
            <div className="panel revenue-panel">
              <div className="panel-heading">
                <div>
                  <h3>Thống kê hóa đơn</h3>
                  <p>
                    Giá trị hóa đơn theo trạng thái
                    thanh toán
                  </p>
                </div>

                <span className="panel-pill">
                  Dữ liệu thực
                </span>
              </div>

              <div className="chart-wrapper">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                      stroke="#eef0e9"
                    />

                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) =>
                        `${value / 1000000}tr`
                      }
                    />

                    <Tooltip
                      formatter={(value) => [
                        formatMoney(value),
                        "Giá trị hóa đơn",
                      ]}
                    />

                    <Bar
                      dataKey="value"
                      fill="#789a83"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel quick-panel">
              <div className="panel-heading">
                <div>
                  <h3>Truy cập nhanh</h3>
                  <p>
                    Quản lý công việc hằng ngày
                  </p>
                </div>
              </div>

              <div className="quick-actions">
                {[
                  {
                    label: "Quản lý khách hàng",
                    icon: Users,
                    page: "Khách hàng",
                  },
                  {
                    label: "Quản lý lịch hẹn",
                    icon: CalendarDays,
                    page: "Lịch hẹn",
                  },
                  {
                    label: "Danh sách dịch vụ",
                    icon: Scissors,
                    page: "Dịch vụ",
                  },
                  {
                    label: "Trợ lý AI",
                    icon: Sparkles,
                    page: "Trợ lý AI",
                  },
                ].map(
                  ({ label, icon: Icon, page }) => (
                    <button
                      key={label}
                      onClick={() => onNavigate(page)}
                    >
                      <span className="quick-icon">
                        <Icon size={20} />
                      </span>

                      <span>{label}</span>
                      <ArrowUpRight size={17} />
                    </button>
                  )
                )}
              </div>
            </div>
          </section>

          <section className="panel appointments-panel">
            <div className="panel-heading">
              <div>
                <h3>Lịch hẹn gần đây</h3>
                <p>
                  Danh sách lấy từ cơ sở dữ liệu
                </p>
              </div>

              <button
                className="text-button"
                onClick={() =>
                  onNavigate("Lịch hẹn")
                }
              >
                Xem tất cả
                <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>KHÁCH HÀNG</th>
                    <th>DỊCH VỤ</th>
                    <th>THỜI GIAN</th>
                    <th>TRẠNG THÁI</th>
                  </tr>
                </thead>

                <tbody>
                  {recentAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        Chưa có lịch hẹn nào.
                      </td>
                    </tr>
                  ) : (
                    recentAppointments.map((item) => {
                      const customerName =
                        customerMap.get(
                          Number(item.customer_id)
                        ) || "Khách hàng không xác định";

                      const serviceName =
                        serviceMap.get(
                          Number(item.service_id)
                        ) || "Dịch vụ không xác định";

                      const currentStatus =
                        appointmentStatus[item.status] || {
                          label: item.status || "Không rõ",
                          color: "orange",
                        };

                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="customer-cell">
                              <span className="customer-avatar">
                                {customerName
                                  .trim()
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>

                              <strong>
                                {customerName}
                              </strong>
                            </div>
                          </td>

                          <td>{serviceName}</td>

                          <td>
                            <span className="time-cell">
                              <Clock3 size={15} />
                              {formatDateTime(
                                item.appointment_time
                              )}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                `status status-${currentStatus.color}`
                              }
                            >
                              {currentStatus.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function App() {
  const [activeMenu, setActiveMenu] =
    useState("Tổng quan");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [token, setToken] = useState(
    () =>
      sessionStorage.getItem("spa_access_token") || ""
  );

  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setChecking(false);
      return;
    }

    let cancelled = false;

    setChecking(true);

    fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            "Phiên đăng nhập không hợp lệ"
          );
        }

        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          setUser(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          sessionStorage.removeItem(
            "spa_access_token"
          );
          setToken("");
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setChecking(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleLogin = (accessToken) => {
    sessionStorage.setItem(
      "spa_access_token",
      accessToken
    );

    setToken(accessToken);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(
      "spa_access_token"
    );

    setToken("");
    setUser(null);
    setActiveMenu("Tổng quan");
    setSidebarOpen(false);
  };

  const navigateTo = (page) => {
    setActiveMenu(page);
    setSidebarOpen(false);
  };

  if (checking) {
    return (
      <div style={loginStyles.page}>
        <p>Đang xác thực tài khoản...</p>
      </div>
    );
  }

  if (!token || !user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout">
      <aside
        className={
          `sidebar ${sidebarOpen ? "open" : ""}`
        }
      >
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={25} />
          </div>

          <div>
            <h2>SPA AI</h2>
            <span>Beauty Management</span>
          </div>

          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="menu-caption">
          QUẢN LÝ HỆ THỐNG
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(
            ({ label, icon: Icon }) => (
              <button
                key={label}
                className={
                  `nav-item ${
                    activeMenu === label
                      ? "active"
                      : ""
                  }`
                }
                onClick={() => navigateTo(label)}
              >
                <Icon size={19} />
                <span>{label}</span>

                {label === "Trợ lý AI" && (
                  <span className="ai-tag">
                    AI
                  </span>
                )}
              </button>
            )
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-promo">
            <Sparkles size={24} />
            <strong>Trợ lý Spa AI</strong>

            <p>
              Hỗ trợ chăm sóc khách hàng
              thông minh.
            </p>

            <button
              onClick={() =>
                navigateTo("Trợ lý AI")
              }
            >
              Khám phá AI
              <ArrowUpRight size={15} />
            </button>
          </div>

          <p className="sidebar-credit">
            Nhóm 19 • Đồ án AI
          </p>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-toggle"
              onClick={() =>
                setSidebarOpen(true)
              }
              aria-label="Mở menu"
            >
              <Menu size={23} />
            </button>

            <div className="breadcrumb">
              Hệ thống quản lý
              <span> / </span>
              {activeMenu}
            </div>
          </div>

          <div className="topbar-actions">
            <div className="profile">
              <div className="avatar">
                {user.role === "admin"
                  ? "AD"
                  : "NV"}
              </div>

              <div className="profile-info">
                <strong>
                  {user.full_name ||
                    user.username}
                </strong>

                <span>
                  {user.role === "admin"
                    ? "Quản trị viên"
                    : "Nhân viên"}
                </span>
              </div>

              <button
                className="icon-button"
                type="button"
                onClick={handleLogout}
                aria-label="Đăng xuất"
                title="Đăng xuất"
              >
                <LogOut size={19} />
              </button>
            </div>
          </div>
        </header>

        {activeMenu === "Tổng quan" ? (
          <Dashboard
            token={token}
            onNavigate={navigateTo}
          />
        ) : activeMenu === "Khách hàng" ? (
          <Customers />
        ) : activeMenu === "Dịch vụ" ? (
          <Services />
        ) : activeMenu === "Lịch hẹn" ? (
          <Appointments />
        ) : activeMenu === "Nhân viên" ? (
          <Employees />
        ) : activeMenu === "Hóa đơn" ? (
          <Invoices />
        ) : activeMenu === "Thống kê" ? (
          <Statistics />
        ) : activeMenu === "Trợ lý AI" ? (
          <AIAssistant />
        ) : (
          <div className="dashboard">
            <div className="section-heading">
              <div>
                <h2>{activeMenu}</h2>
                <p>
                  Chức năng chưa được triển khai.
                </p>
              </div>
            </div>

            <div className="panel placeholder-panel">
              <Settings size={42} />
              <h3>
                Chưa có nội dung cài đặt
              </h3>

              <button
                onClick={() =>
                  navigateTo("Tổng quan")
                }
              >
                Quay về tổng quan
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
