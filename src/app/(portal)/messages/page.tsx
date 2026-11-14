"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, MessageSquare, SendHorizonal, ShieldCheck } from "lucide-react";
import { api, type ChatThread, type ConversationSummary } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shell/PageHeader";
import { FormError } from "@/components/shell/fields";
import { cn } from "@/lib/utils";

const time = (iso: string) => {
  const d = new Date(iso), now = new Date();
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

function Avatar({ name, className }: { name: string; className?: string }) {
  return <span className={cn("grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary", className)}>{name.slice(0, 1).toUpperCase()}</span>;
}

/** /messages?c=<id> opens that conversation (notifications link here). */
export default function MessagesPage() {
  return <Suspense><MessagesView /></Suspense>;
}

function MessagesView() {
  const requested = useSearchParams().get("c");
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

  useEffect(() => {
    if (requested && /^[A-Za-z0-9-]{1,64}$/.test(requested)) void open(requested);
    // Only when the link changes; open() is recreated every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requested]);

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

  const showThread = !!active;
  return <div className="fade-in">
    <PageHeader title="Messages" description="Customers can ask questions before they book. Phone numbers, emails and links are hidden automatically." />
    {error && <div className="mb-4"><FormError>{error}</FormError></div>}

    <div className="grid h-[calc(100dvh-15rem)] min-h-[420px] overflow-hidden rounded-xl border bg-card shadow-xs md:grid-cols-[300px_1fr]">
      <aside aria-label="Conversations" className={cn("flex min-h-0 flex-col border-r", showThread && "hidden md:flex")}>
        <div className="border-b px-4 py-3 text-sm font-medium">Inbox</div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {!list && !error && <div role="status" className="space-y-1 p-2"><span className="sr-only">Loading conversations…</span>
            {[0, 1, 2].map(i => <div key={i} className="flex items-center gap-3 p-2"><Skeleton className="size-10 rounded-full" /><div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-3 w-40" /></div></div>)}</div>}
          {list?.length === 0 && <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <MessageSquare className="mb-2 size-6 text-muted-foreground" />
            <strong className="text-sm">No messages yet</strong>
            <p className="mt-1 text-xs text-muted-foreground">When customers ask about your rentals, their messages appear here.</p>
          </div>}
          <ul className="p-2">
            {list?.map(c => <li key={c.id}>
              <button onClick={() => void open(c.id)} className={cn("flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-accent", active === c.id && "bg-accent")}>
                <Avatar name={c.otherName} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <strong className={cn("truncate text-sm", c.unread > 0 ? "font-semibold" : "font-medium")}>{c.otherName}</strong>
                    <small className="shrink-0 text-[11px] text-muted-foreground">{time(c.lastMessageAt)}</small>
                  </span>
                  <span className={cn("block truncate text-xs", c.unread > 0 ? "text-foreground" : "text-muted-foreground")}>{c.lastFromMe ? "You: " : ""}{c.lastMessage ?? ""}</span>
                </span>
                {c.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground" aria-label={`${c.unread} unread`}>{c.unread}</span>}
              </button>
            </li>)}
          </ul>
        </div>
      </aside>

      <section aria-label="Conversation" className={cn("flex min-h-0 flex-col", !showThread && "hidden md:flex")}>
        {!thread ? <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-muted-foreground">
          <div className="mb-3 grid size-12 place-items-center rounded-full bg-primary/10 text-primary"><MessageSquare className="size-5" /></div>
          <p className="text-sm">Choose a conversation to read and reply.</p>
        </div> : <>
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Back to conversations" onClick={() => { setActive(undefined); setThread(undefined); }}><ArrowLeft className="size-4" /></Button>
            <Avatar name={thread.otherName} className="size-9" />
            <div className="min-w-0">
              <strong className="block truncate text-sm">{thread.otherName}</strong>
              {thread.itemId && <small className="block truncate text-xs text-muted-foreground">About: {items[thread.itemId] ?? "one of your listings"}</small>}
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-muted/30 p-4">
            {thread.messages.map(m => <div key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-xs", m.mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border bg-card")}>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <small className={cn("mt-0.5 block text-[10px]", m.mine ? "text-primary-foreground/70" : "text-muted-foreground")}>{time(m.sentAt)}{m.mine && m.contactHidden ? " · contact details hidden" : ""}</small>
              </div>
            </div>)}
            <div ref={end} />
          </div>
          {notice && <p role="status" className="flex items-center gap-2 border-t bg-warning/10 px-4 py-2 text-xs text-warning"><ShieldCheck className="size-3.5" />{notice}</p>}
          <form className="flex items-end gap-2 border-t p-3" onSubmit={e => void send(e)}>
            <textarea aria-label="Reply" maxLength={2000} rows={1} placeholder="Write a reply" value={draft}
              className="max-h-32 min-h-9 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(e); } }} />
            <Button size="icon" aria-label="Send" disabled={sending || !draft.trim()}><SendHorizonal className="size-4" /></Button>
          </form>
        </>}
      </section>
    </div>
  </div>;
}
