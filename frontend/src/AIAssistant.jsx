
import { useState } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  MessageCircle,
  Clock3,
  Wallet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8001";

const formatMoney = (value) =>
  new Intl.NumberFormat("vi-VN").format(value) + " đ";

// Ẩn thông tin cá nhân khi hiển thị kết quả tư vấn
const maskPersonalInformation = (text) => {
  return text
    .replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
      "[EMAIL ĐÃ ẨN]"
    )
    .replace(
      /(?<!\w)(?:\+84|84|0)(?:[\s.-]?\d){9}(?!\d)/g,
      "[SỐ ĐIỆN THOẠI ĐÃ ẨN]"
    );
};

const suggestions = [
  "Tôi muốn massage thư giãn toàn thân",
  "Tôi bị mụn, cần chăm sóc da",
  "Tôi muốn chăm sóc tóc",
  "Tôi muốn tìm dịch vụ thư giãn",
];

export default function AIAssistant() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");

  const askAI = async (question) => {
    const content = question.trim();

    if (!content || loading) return;

    setLoading(true);
    setError("");
    setReply("");
    setServices([]);
    setLastQuestion(content);

    try {
      const token = sessionStorage.getItem("spa_access_token");

      if (!token) {
        throw new Error(
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
        );
      }

      const response = await fetch(
        `${API_URL}/api/ai/recommend`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: content,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : `Không thể tư vấn (HTTP ${response.status}).`
        );
      }

      setReply(data.reply || "Chưa có câu trả lời.");
      setServices(
        Array.isArray(data.suggestions)
          ? data.suggestions
          : []
      );
      setMessage("");
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
    <div
      className="dashboard"
      style={{ maxWidth: 1100, margin: "0 auto" }}
    >
      <section
        className="welcome-banner"
        style={{ marginBottom: 24 }}
      >
        <div>
          <div className="welcome-label">
            <Sparkles size={16} />
            SPA AI ASSISTANT
          </div>

          <h1>Trợ lý tư vấn Spa</h1>

          <p>
            Nhập nhu cầu của khách hàng để hệ thống phân tích
            và gợi ý các dịch vụ phù hợp đang có tại Spa.
          </p>

          <span className="banner-note">
            <CheckCircle2 size={16} />
            Kết nối dữ liệu dịch vụ thực tế
          </span>
        </div>

        <div className="banner-decoration">
          <Sparkles size={90} strokeWidth={1} />
        </div>
      </section>

      <section
        className="panel"
        style={{ padding: 26, marginBottom: 24 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: "#e6f0e8",
              color: "#547a60",
              display: "grid",
              placeItems: "center",
            }}
          >
            <MessageCircle size={24} />
          </div>

          <div>
            <h3 style={{ margin: 0 }}>
              Bạn muốn tư vấn dịch vụ gì?
            </h3>
            <p
              style={{
                margin: "5px 0 0",
                color: "#77847a",
                fontSize: 14,
              }}
            >
              Mô tả nhu cầu để nhận gợi ý phù hợp
            </p>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            askAI(message);
          }}
        >
          <textarea
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            placeholder="Ví dụ: Tôi thường xuyên căng thẳng và muốn massage thư giãn toàn thân..."
            rows={4}
            maxLength={1000}
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid #d8e4da",
              borderRadius: 12,
              padding: 16,
              fontSize: 15,
              fontFamily: "inherit",
              lineHeight: 1.7,
              resize: "vertical",
              outlineColor: "#648873",
              background: "#fcfdfb",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginTop: 14,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                color: "#8b968e",
                fontSize: 13,
              }}
            >
              {message.length}/1000 ký tự
            </span>

            <button
              type="submit"
              disabled={loading || message.trim().length < 3}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                border: 0,
                borderRadius: 10,
                background: "#648873",
                color: "#fff",
                padding: "12px 22px",
                fontWeight: 600,
                fontSize: 14,
                cursor: loading ? "wait" : "pointer",
                opacity:
                  loading || message.trim().length < 3
                    ? 0.6
                    : 1,
              }}
            >
              {loading ? (
                <Loader2 size={18} />
              ) : (
                <Send size={18} />
              )}
              {loading ? "Đang phân tích..." : "Nhận tư vấn"}
            </button>
          </div>
        </form>

        <div style={{ marginTop: 24 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#526958",
              marginBottom: 12,
            }}
          >
            Gợi ý câu hỏi
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {suggestions.map((question) => (
              <button
                key={question}
                type="button"
                disabled={loading}
                onClick={() => {
                  setMessage(question);
                  askAI(question);
                }}
                style={{
                  padding: "10px 14px",
                  background: "#f4f8f4",
                  border: "1px solid #dfe9e0",
                  borderRadius: 20,
                  color: "#54705b",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <section
          className="panel"
          style={{
            padding: 20,
            marginBottom: 24,
            color: "#a43737",
            background: "#fff6f5",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        </section>
      )}

      {loading && (
        <section
          className="panel"
          style={{
            padding: 28,
            textAlign: "center",
            color: "#648873",
          }}
        >
          <Loader2 size={28} />
          <p>Đang tìm dịch vụ phù hợp với nhu cầu...</p>
        </section>
      )}

      {!loading && reply && (
        <>
          <section
            className="panel"
            style={{ padding: 26, marginBottom: 24 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
                color: "#4f775b",
              }}
            >
              <Sparkles size={22} />
              <h3 style={{ margin: 0 }}>
                Kết quả tư vấn
              </h3>
            </div>

            <p
              style={{
                color: "#7b877d",
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              Nhu cầu: {maskPersonalInformation(lastQuestion)}
            </p>

            <p
              style={{
                fontSize: 15,
                lineHeight: 1.8,
                color: "#34483a",
                margin: 0,
              }}
            >
              {reply}
            </p>
          </section>

          {services.length > 0 && (
            <section>
              <div
                className="section-heading"
                style={{ marginBottom: 16 }}
              >
                <div>
                  <h2>Dịch vụ được đề xuất</h2>
                  <p>
                    Danh sách lấy từ cơ sở dữ liệu Spa
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 18,
                }}
              >
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="panel"
                    style={{ padding: 22 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        color: "#648873",
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 12,
                      }}
                    >
                      <Sparkles size={16} />
                      {service.category}
                    </div>

                    <h3
                      style={{
                        margin: "0 0 12px",
                        color: "#304a38",
                      }}
                    >
                      {service.name}
                    </h3>

                    <p
                      style={{
                        fontSize: 14,
                        lineHeight: 1.7,
                        color: "#7a857d",
                        minHeight: 48,
                      }}
                    >
                      {service.description ||
                        "Dịch vụ chăm sóc tại Spa."}
                    </p>

                    <div
                      style={{
                        borderTop: "1px solid #edf0eb",
                        paddingTop: 15,
                        marginTop: 15,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          color: "#54735d",
                          fontWeight: 700,
                        }}
                      >
                        <Wallet size={16} />
                        {formatMoney(service.price)}
                      </span>

                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          color: "#7d887f",
                          fontSize: 13,
                        }}
                      >
                        <Clock3 size={16} />
                        {service.duration_minutes} phút
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
