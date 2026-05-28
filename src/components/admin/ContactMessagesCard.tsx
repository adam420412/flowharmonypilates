import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, RefreshCw, Trash2, Check, Mail } from "lucide-react";
import {
  listContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
  type ContactMessage,
} from "@/lib/admin-messages.functions";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  new: { label: "Nowa", cls: "bg-terracotta/10 text-terracotta border-terracotta/30" },
  read: { label: "Przeczytana", cls: "bg-foreground/5 text-foreground/70 border-foreground/20" },
  replied: { label: "Odpowiedziana", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export function ContactMessagesCard() {
  const list = useServerFn(listContactMessages);
  const updateStatus = useServerFn(updateContactMessageStatus);
  const remove = useServerFn(deleteContactMessage);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await list();
      setMessages(res.messages);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się pobrać wiadomości");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function setStatus(id: string, status: "new" | "read" | "replied") {
    try {
      await updateStatus({ data: { id, status } });
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się zaktualizować");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Usunąć tę wiadomość na stałe?")) return;
    try {
      await remove({ data: { id } });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      toast.success("Wiadomość usunięta");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nie udało się usunąć");
    }
  }

  const newCount = messages.filter((m) => m.status === "new").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl">Wiadomości z formularza</h2>
          <p className="text-sm text-muted-foreground">
            {newCount > 0 ? `${newCount} nowe wiadomości do przeczytania.` : "Wszystkie odczytane."}
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-4 py-2 text-xs uppercase tracking-widest hover:bg-foreground/5"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Odśwież
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Ładowanie…
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-foreground/15 p-12 text-center text-muted-foreground">
          Brak wiadomości.
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => {
            const meta = STATUS_LABEL[m.status] ?? STATUS_LABEL.new;
            return (
              <div
                key={m.id}
                className="rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{m.name}</h3>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest ${meta.cls}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <a href={`mailto:${m.email}`} className="hover:text-terracotta">
                        {m.email}
                      </a>
                      {m.phone && (
                        <a href={`tel:${m.phone}`} className="hover:text-terracotta">
                          {m.phone}
                        </a>
                      )}
                      <span>{new Date(m.created_at).toLocaleString("pl-PL")}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {m.status !== "read" && (
                      <button
                        onClick={() => setStatus(m.id, "read")}
                        className="inline-flex items-center gap-1 rounded-full border border-foreground/20 px-3 py-1 text-[11px] uppercase tracking-widest hover:bg-foreground/5"
                        title="Oznacz jako przeczytaną"
                      >
                        <Check className="h-3 w-3" /> Przeczytana
                      </button>
                    )}
                    {m.status !== "replied" && (
                      <button
                        onClick={() => setStatus(m.id, "replied")}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-[11px] uppercase tracking-widest text-emerald-700 hover:bg-emerald-100"
                        title="Oznacz jako odpowiedzianą"
                      >
                        <Mail className="h-3 w-3" /> Odpowiedziana
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-destructive/30 px-3 py-1 text-[11px] uppercase tracking-widest text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" /> Usuń
                    </button>
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm text-foreground/85">{m.message}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
