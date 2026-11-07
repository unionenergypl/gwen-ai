
import { useState } from "react";
import { sendEnquiryToN8n } from "../../services/gwenEnquiryService";
import "./GwenEnquiry.css";

export default function GwenEnquiry() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Temporary test identity.
  // Replace with authenticated user/session details later.
  const userId = "USER001";
  const sessionId = "SESSION001";

  async function handleSubmit(event) {
    event.preventDefault();

    if (!message.trim() || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await sendEnquiryToN8n(
        message.trim(),
        userId,
        sessionId
      );

      setResult(response);
      setMessage("");
    } catch (err) {
      setError(err.message || "Enquiry failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="gwen-enquiry">
      <div className="gwen-enquiry-header">
        <h2>Gwen Enquiry</h2>
        <p>Send a business enquiry to Gwen's workflow.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <label htmlFor="gwen-enquiry-message">
          Your enquiry
        </label>

        <textarea
          id="gwen-enquiry-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="e.g. What is the selling price of Product ABC?"
          rows={5}
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading || !message.trim()}
        >
          {loading ? "Sending..." : "Send Enquiry"}
        </button>
      </form>

      {result && (
        <div className="gwen-enquiry-success">
          <strong>Enquiry accepted</strong>
          <p>Request ID: {result.requestId}</p>
          <p>{result.message}</p>
        </div>
      )}

      {error && (
        <div className="gwen-enquiry-error">
          {error}
        </div>
      )}
    </section>
  );
}
