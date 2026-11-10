
import { useRef, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { sendSalesMessage } from "./services/salesApi";
import "./GwenSales.css";

const INITIAL_MESSAGE = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! I'm Gwen. How can I help you today?",
};

const LANGUAGES = [
  { value: "auto", label: "Auto detect" },
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
  { value: "yue", label: "粵語" },
  { value: "nan", label: "福建話" },
];

function createSessionId() {
  const key = "gwen_sales_session_id";
  let id = sessionStorage.getItem(key);

  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }

  return id;
}

export default function GwenSales() {
  const { user, logout } = useAuth();

  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [draft, setDraft] = useState("");
  const [language, setLanguage] = useState("auto");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const sessionId = useRef(createSessionId());
  const messagesEndRef = useRef(null);

  function scrollToLatest() {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    });
  }

  async function handleSend(event) {
    event.preventDefault();

    const message = draft.trim();

    if (!message || sending) return;

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
      },
    ]);

    setDraft("");
    setError("");
    setSending(true);
    scrollToLatest();

    try {
      const result = await sendSalesMessage({
        message,
        sessionId: sessionId.current,
        language,
      });

      if (!result.success || typeof result.reply !== "string") {
        throw new Error("Invalid response from Gwen.");
      }

      setMessages((current) => [
        ...current,
        {
          id: result.requestId || crypto.randomUUID(),
          role: "assistant",
          content: result.reply,
        },
      ]);

      scrollToLatest();
    } catch (err) {
      setError(
        err.message || "Unable to connect to Gwen."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="gwen-sales">
      <header className="gs-header">
        <div className="gs-brand">
          <div className="gs-logo">G</div>
          <div>
            <strong>GWEN SALES</strong>
            <small>Enterprise AI Sales Assistant</small>
          </div>
        </div>

        <div className="gs-account">
          <span>
            {user?.email || user?.username || "Signed in"}
          </span>
          <button onClick={logout}>Sign out</button>
        </div>
      </header>

      <div className="gs-layout">

        {/* LEFT: COMMERCE WORKSPACE */}
        <aside className="gs-commerce">
          <h2>Commerce Workspace</h2>

          <section className="gs-panel">
            <h3>Products</h3>
            <p>Product catalogue and recommendations.</p>
            <span>Coming soon</span>
          </section>

          <section className="gs-panel">
            <h3>Shopping Cart</h3>
            <p>Your selected products and order summary.</p>
            <span>0 items</span>
          </section>

          <section className="gs-panel">
            <h3>Delivery Address</h3>
            <p>Delivery information and confirmation.</p>
            <span>Not set</span>
          </section>

          <section className="gs-panel">
            <h3>Payment</h3>
            <p>Payment QR and transaction status.</p>
            <span>Coming soon</span>
          </section>

          <div className="gs-note">
            Commerce integrations will be enabled
            in subsequent development phases.
          </div>
        </aside>

        {/* RIGHT: GWEN CONVERSATION */}
        <section className="gs-chat">

          <div className="gs-chat-header">
            <div className="gs-avatar">G</div>

            <div>
              <h2>Conversation with Gwen</h2>
              <small>Ready to assist</small>
            </div>

            <select
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value)
              }
              aria-label="Conversation language"
            >
              {LANGUAGES.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="gs-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`gs-message ${message.role}`}
              >
                <div className="gs-message-name">
                  {message.role === "assistant"
                    ? "Gwen"
                    : "You"}
                </div>

                <div className="gs-bubble">
                  {message.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="gs-message assistant">
                <div className="gs-message-name">Gwen</div>
                <div className="gs-bubble">
                  Gwen is thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="gs-input-area">
            {error && (
              <div className="gs-error">{error}</div>
            )}

            <form onSubmit={handleSend}>
              <textarea
                value={draft}
                onChange={(event) =>
                  setDraft(event.target.value)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    event.currentTarget.form.requestSubmit();
                  }
                }}
                placeholder="Type your message to Gwen..."
                rows={2}
                maxLength={5000}
              />

              <div className="gs-input-footer">
                <small>Enter to send · Shift + Enter for a new line</small>

                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </form>

            <small className="gs-disclaimer">
              Product, ordering and payment services
              are not connected yet.
            </small>
          </div>

        </section>
      </div>
    </main>
  );
}
