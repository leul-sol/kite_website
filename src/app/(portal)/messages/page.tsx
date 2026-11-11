"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, type ChatThread, type ConversationSummary } from "@/services/api";
import styles from "./messages.module.css";

const time = (iso: string) => {
  const d = new Date(iso), now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

export default function MessagesPage() {
  const [list, setList] = useState<ConversationSummary[]>();
  const [active, setActive] = useState<string>();
  const [thread, setThread] = useState<ChatThread>();
  const [items, setItems] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    try { setList(await api.getConversations()); setError(""); }
    catch (cause) { setError((cause as Error).message); }
  }, []);

  const loadThread = useCallback(async (id: string) => {
    try {
      const next = await api.getConversation(id);
      setThread(prev => {
        if (prev?.id !== next.id || prev.messages.length !== next.messages.length) {
          setTimeout(() => end.current?.scrollIntoView({ block: "end" }), 0);
        }
        return next;
      });
    } catch (cause) { setError((cause as Error).message); }
  }, []);

  useEffect(() => { void loadList(); }, [loadList]);
  // Refresh every 10 seconds while the page is open.
  useEffect(() => {
    const timer = setInterval(() => { void loadList(); if (active) void loadThread(active); }, 10000);
    return () => clearInterval(timer);
  }, [active, loadList, loadThread]);

  // Show which listing a conversation is about, using the provider's own items.
  useEffect(() => {
    api.getListings().then(rows => setItems(Object.fromEntries(rows.map(r => [r.id, r.name])))).catch(() => undefined);
  }, []);

  async function open(id: string) {
    setActive(id); setNotice(""); setDraft("");
    await loadThread(id);
    void loadList();
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!thread || !body || sending) return;
    setSending(true); setError(""); setNotice("");
    try {
      const sent = await api.sendMessage(thread.id, body);
      setThread({ ...thread, messages: [...thread.messages, sent] });
      setDraft("");
      if (sent.contactHidden) setNotice("Contact details were hidden. Keep chatting and booking on Kite.");
      setTimeout(() => end.current?.scrollIntoView({ block: "end" }), 0);
      void loadList();
    } catch (cause) { setError((cause as Error).message); }
    finally { setSending(false); }
  }

  return <div className={`${styles.page} fade-in`}>
    <header>
      <h1 className="h1">Messages</h1>
      <p className="text-body">Customers can ask you questions before they book. Phone numbers, emails and links are hidden automatically, so keep bookings and payments on Kite.</p>
    </header>
    {error && <p role="alert" className={styles.error}>{error}</p>}

    <div className={styles.layout}>
      <aside className={`glass-card ${styles.list}`} aria-label="Conversations">
        {!list && !error && <p role="status" className={styles.muted}>Loading conversations…</p>}
        {list?.length === 0 && <div className={styles.empty}>
          <strong>No messages yet</strong>
          <p className={styles.muted}>When customers ask about your rentals, their messages appear here.</p>
        </div>}
        <ul>
          {list?.map(c => <li key={c.id}>
            <button className={`${styles.row} ${active === c.id ? styles.active : ""}`} onClick={() => void open(c.id)}>
              <span className={styles.avatar}>{c.otherName.slice(0, 1).toUpperCase()}</span>
              <span className={styles.rowText}>
                <span className={styles.rowTop}><strong>{c.otherName}</strong><small>{time(c.lastMessageAt)}</small></span>
                <span className={styles.preview}>{c.lastFromMe ? "You: " : ""}{c.lastMessage ?? ""}</span>
              </span>
              {c.unread > 0 && <span className={styles.badge} aria-label={`${c.unread} unread`}>{c.unread}</span>}
            </button>
          </li>)}
        </ul>
      </aside>

      <section className={`glass-card ${styles.thread}`} aria-label="Conversation">
        {!thread ? <div className={styles.empty}><p className={styles.muted}>Choose a conversation to read and reply.</p></div> : <>
          <div className={styles.threadHead}>
            <strong>{thread.otherName}</strong>
            {thread.itemId && <small className={styles.muted}>About: {items[thread.itemId] ?? "one of your listings"}</small>}
          </div>
          <div className={styles.messages}>
            {thread.messages.map(m => <div key={m.id} className={`${styles.bubble} ${m.mine ? styles.mine : styles.theirs}`}>
              <p>{m.body}</p>
              <small>{time(m.sentAt)}{m.mine && m.contactHidden ? " · contact details hidden" : ""}</small>
            </div>)}
            <div ref={end} />
          </div>
          {notice && <p role="status" className={styles.notice}>{notice}</p>}
          <form className={styles.composer} onSubmit={e => void send(e)}>
            <textarea aria-label="Reply" maxLength={2000} rows={2} placeholder="Write a reply" value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(e); } }} />
            <button className="btn-primary" disabled={sending || !draft.trim()}>{sending ? "Sending…" : "Send"}</button>
          </form>
        </>}
      </section>
    </div>
  </div>;
}
