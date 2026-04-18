"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type Message = {
  id: string;
  role: "user" | "ai";
  text: string;
  suggestions?: any[];
};

export default function AIChat({ isAdmin, onUse }: { isAdmin: boolean; onUse: (name: string) => void; }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const welcome = { id: "welcome-ai", role: "ai", text: "Hi — I can help find rooms, labs, and equipment. Try: \"meeting room for 20 people\" or \"computer lab with 30 PCs\"." } as Message;
  const [messages, setMessages] = useState<Message[]>([welcome]);

  const clearChat = () => setMessages([welcome]);

  const send = async () => {
    const q = input.trim();
    if (!q) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: q };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/ai/recommendations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      const aiText = data && data.length > 0 ? `I found ${data.length} suggestion(s). Tap Use to filter the list.` : "I couldn't find any matching resources. Try widening location or lowering capacity.";
      const aiMsg: Message = { id: Date.now().toString() + "-ai", role: "ai", text: aiText, suggestions: Array.isArray(data) ? data : [] };
      setMessages((m) => [...m, aiMsg]);
    } catch (err: any) {
      const errMsg: Message = { id: Date.now().toString() + "-err", role: "ai", text: `Error: ${err?.message || err}` };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12, marginTop: 10 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI: e.g. 'meeting room for 20 people'"
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
        />
        <button onClick={send} disabled={loading} style={{ padding: "10px 12px", borderRadius: 8, background: "#10b981", color: "#fff", border: "none" }}>
          {loading ? "Loading..." : "Ask"}
        </button>
        <button onClick={clearChat} disabled={messages.length === 0} style={{ padding: "10px 12px", borderRadius: 8, background: "#ef4444", color: "#fff", border: "none" }}>
          Clear
        </button>
      </div>

      {/* Quick examples */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        {[
          "meeting room for 20 people",
          "computer lab with 30 PCs",
          "seminar room near Engineering Block for 15"
        ].map((ex) => (
          <button key={ex} onClick={() => { setInput(ex); }} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff" }}>{ex}</button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Tip: include capacity and location for better results. Editing is restricted to admins.</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m) => (
          <div key={m.id} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: 560 }}>
            <div style={{ background: m.role === "user" ? "#eef2ff" : "#f8fafc", padding: 10, borderRadius: 8 }}>
              <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{m.text}</div>
            </div>

            {m.suggestions && m.suggestions.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", gap: 10, overflowX: "auto" }}>
                {m.suggestions.map((s: any) => (
                  <div key={s.id} style={{ minWidth: 260, background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <strong>{s.name} {s.resourceCode ? `(${s.resourceCode})` : ""}</strong>
                    <div style={{ fontSize: 13, marginTop: 6 }}>
                      <div>Category: {s.categoryName}</div>
                      <div>Location: {s.locationName}</div>
                      <div>Capacity: {s.capacity ?? 'N/A'}</div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      {isAdmin && <button onClick={() => router.push(`/resources/edit/${s.id}`)} style={{ marginRight: 8 }}>Open</button>}
                      <button onClick={() => { onUse(s.name || ""); window.scrollTo({ top: 400, behavior: 'smooth' }); }}>Use</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
