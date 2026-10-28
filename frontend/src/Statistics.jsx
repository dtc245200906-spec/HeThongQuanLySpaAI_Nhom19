
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Users,
  CalendarDays,
  Receipt,
  Wallet,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

const API = "http://127.0.0.1:8001/api";

const COLORS = [
  "#2e7d53",
  "#81b29a",
  "#e9c46a",
  "#e76f51",
  "#7895b2",
  "#b8a0d2",
];

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("vi-VN") + " ₫";

function StatCard({ title, value, icon: Icon }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e4ebe5",
        borderRadius: 16,
        padding: 22,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div>
        <p style={{ margin: 0, color: "#748478", fontSize: 14 }}>
          {title}
        </p>
        <h2
          style={{
            margin: "10px 0 0",
            fontSize: 25,
            color: "#276b49",
          }}
        >
          {value}
        </h2>
      </div>
      <div
        style={{
          background: "#eaf4ed",
          padding: 14,
          borderRadius: 14,
          color: "#28734c",
        }}
      >
        <Icon size={25} />
      </div>
    </div>
  );
}

export default function Statistics() {
  const [customers, setCustomers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const endpoints = [
        "/customers",
        "/appointments",
        "/services",
        "/invoices",
      ];

      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          const token = sessionStorage.getItem("spa_access_token");
          const response = await fetch(API + endpoint, {
            headers: {
              Authorization: `Bearer ${token || ""}`,
            },
          });

          if (!response.ok) {
            throw new Error(
              response.status === 401
                ? "Phiên đăng nhập đã hết hạn."
                : `Không tải được dữ liệu ${endpoint} (${response.status})`
            );
          }

          const data = await response.json();
          if (!Array.isArray(data)) {
            throw new Error(`Dữ liệu ${endpoint} không đúng định dạng`);
          }
          return data;
        })
      );

      setCustomers(results[0]);
      setAppointments(results[1]);
      setServices(results[2]);
      setInvoices(results[3]);
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu thống kê.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const paidInvoices = useMemo(
    () => invoices.filter((item) => item.status === "paid"),
    [invoices]
  );

  const totalRevenue = useMemo(
    () =>
      paidInvoices.reduce(
        (sum, item) => sum + Number(item.total_amount || 0),
        0
      ),
    [paidInvoices]
  );

  const revenueByDay = useMemo(() => {
    const grouped = {};

    paidInvoices.forEach((invoice) => {
      if (!invoice.created_at) return;

      const date = new Date(invoice.created_at);
      if (Number.isNaN(date.getTime())) return;

      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      grouped[key] =
        (grouped[key] || 0) + Number(invoice.total_amount || 0);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({
        date: date.split("-").reverse().join("/"),
        revenue,
      }));
  }, [paidInvoices]);

  const serviceStats = useMemo(() => {
    const counts = {};

    invoices.forEach((invoice) => {
      const service = services.find(
        (item) => item.id === invoice.service_id
      );

      const name =
        service?.name ||
        service?.service_name ||
        `Dịch vụ #${invoice.service_id}`;

      counts[name] = (counts[name] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [invoices, services]);

  const paymentStats = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "paid").length;
    const unpaid = invoices.filter((i) => i.status === "unpaid").length;

    return [
      { name: "Đã thanh toán", value: paid },
      { name: "Chưa thanh toán", value: unpaid },
    ].filter((item) => item.value > 0);
  }, [invoices]);

  const panelStyle = {
    background: "#fff",
    border: "1px solid #e4ebe5",
    borderRadius: 16,
    padding: 22,
  };

  return (
    <div style={{ padding: 24, color: "#263a2c" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 27 }}>
            Thống kê & Báo cáo
          </h1>
          <p style={{ color: "#78867b", marginTop: 8 }}>
            Phân tích hoạt động kinh doanh Spa từ dữ liệu thực tế
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#28734c",
            color: "#fff",
            border: 0,
            borderRadius: 10,
            padding: "12px 17px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={17} />
          {loading ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#fff0ed",
            color: "#ae3d31",
            padding: 14,
            borderRadius: 10,
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {loading && <p>Đang tải dữ liệu thống kê...</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          title="Tổng doanh thu đã thu"
          value={formatMoney(totalRevenue)}
          icon={Wallet}
        />
        <StatCard
          title="Tổng khách hàng"
          value={customers.length}
          icon={Users}
        />
        <StatCard
          title="Tổng lịch hẹn"
          value={appointments.length}
          icon={CalendarDays}
        />
        <StatCard
          title="Tổng hóa đơn"
          value={invoices.length}
          icon={Receipt}
        />
        <StatCard
          title="Dịch vụ đang quản lý"
          value={services.length}
          icon={BarChart3}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 350px), 1fr))",
          gap: 20,
          marginBottom: 22,
        }}
      >
        <div style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>Doanh thu theo ngày</h3>
          <p style={{ color: "#849087", fontSize: 13 }}>
            Chỉ tính hóa đơn đã thanh toán
          </p>

          {revenueByDay.length === 0 ? (
            <p style={{ padding: 45, textAlign: "center" }}>
              Chưa có dữ liệu doanh thu theo ngày.
            </p>
          ) : (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByDay}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis dataKey="date" />
                  <YAxis
                    tickFormatter={(value) =>
                      `${value / 1000000}tr`
                    }
                  />
                  <Tooltip
                    formatter={(value) => [
                      formatMoney(value),
                      "Doanh thu",
                    ]}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#38865b"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>
            Tình trạng thanh toán
          </h3>
          <p style={{ color: "#849087", fontSize: 13 }}>
            Tỷ lệ hóa đơn đã thanh toán và chưa thanh toán
          </p>

          {paymentStats.length === 0 ? (
            <p style={{ padding: 45, textAlign: "center" }}>
              Chưa có hóa đơn để thống kê.
            </p>
          ) : (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentStats}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {paymentStats.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div style={panelStyle}>
        <h3 style={{ marginTop: 0 }}>
          Thống kê dịch vụ theo hóa đơn
        </h3>
        <p style={{ color: "#849087", fontSize: 13 }}>
          Số lần dịch vụ xuất hiện trong hóa đơn
        </p>

        {serviceStats.length === 0 ? (
          <p style={{ padding: 25, textAlign: "center" }}>
            Chưa có dữ liệu dịch vụ.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ background: "#f1f7f2" }}>
                  <th style={{ padding: 13 }}>Dịch vụ</th>
                  <th style={{ padding: 13 }}>Số hóa đơn</th>
                </tr>
              </thead>
              <tbody>
                {serviceStats.map((item) => (
                  <tr
                    key={item.name}
                    style={{
                      borderBottom: "1px solid #edf1ed",
                    }}
                  >
                    <td style={{ padding: 13 }}>{item.name}</td>
                    <td style={{ padding: 13 }}>{item.value}</td>
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
