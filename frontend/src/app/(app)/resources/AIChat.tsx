"use client";

import { useState } from "react";

import { frontendRouteFetch } from "@/lib/api/client";

interface Props {
  onResult?: (data: any[]) => void;
  isAdmin?: boolean;
  onUse?: (name: string) => void;
}

export default function AIChat({ onResult, isAdmin, onUse }: Props) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    { text: string; sender: "user" | "bot" }[]
  >([]);
  const [suggestedResults, setSuggestedResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const suggestions = [
    "meeting room for 20 people",
    "computer lab with 30 PCs",
    "seminar room near Engineering Block for 15",
  ];

  const sendMessage = async (customMsg?: string) => {
    const query = customMsg || message;
    if (!query.trim()) return;

    // add user message
    setMessages((prev) => [...prev, { text: query, sender: "user" }]);
    setMessage("");
    setLoading(true);

    try {
      const res = await frontendRouteFetch("/api/ai/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        const txt = await res.text();
        // include status for easier debugging
        let msg = `AI request failed (${res.status} ${res.statusText})`;
        try {
          const j = JSON.parse(txt);
          msg = j.message || txt || msg;
        } catch (_) {
          msg = txt || msg;
        }
        throw new Error(msg);
      }

      const data = await res.json();

      // Normalize response shapes to an array of results
      let results: any[] = [];
      if (Array.isArray(data)) results = data;
      else if (Array.isArray(data.resources)) results = data.resources;
      else if (Array.isArray(data.content)) results = data.content;
      else if (Array.isArray(data.data)) results = data.data;
      else if (Array.isArray(data.items)) results = data.items;
      else results = [];

      // store structured suggestions for UI
      setSuggestedResults(results);

      // send to parent
      if (onResult) onResult(results);

      // show bot message summarizing results
      setMessages((prev) => [
        ...prev,
        {
          text:
            results.length > 0
              ? `I found ${results.length} suggestion(s). See below and tap Use to apply.`
              : "I couldn't find any matching resources. Try widening location or lowering capacity.",
          sender: "bot",
        },
      ]);

    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { text: "⚠️ Something went wrong", sender: "bot" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSuggestedResults([]);
    setMessage("");
    setLoading(false);
    if (onResult) onResult([]);
  };

  return (
    <div style={styles.container}>
      {/* header is provided by the page wrapper */}

      {/* INPUT */}
      <div style={styles.inputRow}>
        <input
          type="text"
          placeholder="Ask AI: e.g. 'meeting room for 20 people'"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={styles.input}
        />

        <button onClick={() => sendMessage()} style={styles.askBtn}>
          Ask
        </button>

        <button onClick={clearChat} style={styles.clearBtn}>
          Clear
        </button>
      </div>

      {/* SUGGESTIONS */}
      <div style={styles.suggestions}>
        {suggestions.map((s, i) => (
          <span key={i} style={styles.chip} onClick={() => sendMessage(s)}>
            {s}
          </span>
        ))}
      </div>

      {/* CHAT */}
      <div style={styles.chatBox}>
        {messages.length === 0 && (
          <div style={styles.botMsg}>
            Hi — I can help find rooms, labs, and equipment.
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={msg.sender === "user" ? styles.userMsg : styles.botMsg}
          >
            {msg.text}
          </div>
        ))}

        {/* Render structured suggestion cards when present */}
        {suggestedResults.length > 0 && (
          <div style={styles.resultsGrid}>
            {suggestedResults.map((r: any, idx: number) => (
              <div key={idx} style={styles.resultCard}>
                <div style={styles.resultTitle}>{r.name || r.categoryName || "Resource"}</div>
                <div style={styles.resultMeta}>
                  {r.locationName ? `${r.locationName}` : "Unknown location"}
                  {r.capacity ? ` • capacity ${r.capacity}` : ""}
                </div>
                <div style={styles.resultActions}>
                  <button
                    style={styles.useBtn}
                    onClick={() => {
                      const name = r.name || r.categoryName || "";
                      if (onUse) onUse(name);
                      // apply as a user-visible action
                      setMessages((m) => [...m, { text: `Using: ${name}`, sender: "user" }]);
                    }}
                  >
                    Use
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && <div style={styles.botMsg}>Thinking...</div>}
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    marginBottom: "20px",
  },

  header: {
    fontSize: "18px",
    fontWeight: "600",
  },

  sub: {
    fontSize: "13px",
    color: "#6b7280",
    marginTop: "4px",
  },

  inputRow: {
    display: "flex",
    gap: "10px",
    marginTop: "12px",
  },

  input: {
    flex: 1,
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ddd",
  },

  askBtn: {
    background: "#10b981",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  clearBtn: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  suggestions: {
    marginTop: "10px",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  chip: {
    background: "#f1f5f9",
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    cursor: "pointer",
    border: "1px solid #e5e7eb",
  },

  chatBox: {
    marginTop: "15px",
    maxHeight: "250px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  resultsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginTop: 8,
  },

  resultCard: {
    background: "#ffffff",
    border: "1px solid #eef2ff",
    padding: 12,
    borderRadius: 10,
    boxShadow: "0 6px 18px rgba(15,23,42,0.03)",
  },

  resultTitle: {
    fontWeight: 600,
    marginBottom: 6,
  },

  resultMeta: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
  },

  resultActions: {
    display: "flex",
    gap: 8,
  },

  userMsg: {
    alignSelf: "flex-end",
    background: "#6366f1",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "14px",
    maxWidth: "70%",
  },

  botMsg: {
    alignSelf: "flex-start",
    background: "#f3f4f6",
    padding: "10px 14px",
    borderRadius: "14px",
    maxWidth: "70%",
  },

  useBtn: {
    marginTop: "5px",
    padding: "5px 10px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
};
