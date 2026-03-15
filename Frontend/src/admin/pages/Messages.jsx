import { useEffect, useState } from "react";
import { messageStore } from "../../services/messageStore";

function formatMessageDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      try {
        setLoading(true);
        setError("");
        const items = await messageStore.list();

        if (active) {
          setMessages(items);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMessages();

    return () => {
      active = false;
    };
  }, []);

  async function handleStatusChange(id, status) {
    try {
      setError("");
      const updated = await messageStore.updateStatus(id, status);
      setMessages((current) => current.map((item) => (item.id === id ? updated : item)));
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  async function handleDelete(id) {
    try {
      setError("");
      await messageStore.remove(id);
      setMessages((current) => current.filter((item) => item.id !== id));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <h3>Messages</h3>
          <p>Customer messages submitted from the website contact form.</p>
        </div>
      </div>

      {loading ? <p>Loading messages...</p> : null}
      <div className="admin-messages-grid">
        {messages.length ? (
          messages.map((item) => (
            <article key={item.id} className="admin-message-card">
              <div className="admin-message-head">
                <div className="admin-table-title">
                  <strong>{item.name}</strong>
                  <span>{item.email}</span>
                </div>
                <span className={`admin-badge ${item.status}`}>{item.status}</span>
              </div>

              <p className="admin-message-date">{formatMessageDate(item.createdAt)}</p>
              <p className="admin-message-body">{item.message}</p>

              <label className="admin-message-status">
                <span>Status</span>
                <div className="admin-message-status-row">
                  <select
                    className="admin-select"
                    value={item.status}
                    onChange={(event) => handleStatusChange(item.id, event.target.value)}
                  >
                    <option value="new">new</option>
                    <option value="read">read</option>
                  </select>
                  <button
                    type="button"
                    className="admin-icon-btn danger"
                    aria-label={`Delete message from ${item.name}`}
                    title="Delete"
                    onClick={() => handleDelete(item.id)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 7h2v7h-2v-7zm4 0h2v7h-2v-7zM7 10h2v7H7v-7zm1 10h8a2 2 0 0 0 2-2V8H6v10a2 2 0 0 0 2 2z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                </div>
              </label>
            </article>
          ))
        ) : (
          <p>No customer messages yet.</p>
        )}
      </div>
    </section>
  );
}
