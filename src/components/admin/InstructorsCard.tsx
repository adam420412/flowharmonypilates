import { useEffect, useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Instructor = {
  id: string;
  full_name: string;
  bio: string | null;
  avatar_url: string | null;
  is_active: boolean;
  sort_order: number;
};

const empty: Omit<Instructor, "id"> = {
  full_name: "",
  bio: "",
  avatar_url: "",
  is_active: true,
  sort_order: 0,
};

export function InstructorsCard() {
  const [rows, setRows] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newRow, setNewRow] = useState(empty);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("instructors")
      .select("id,full_name,bio,avatar_url,is_active,sort_order")
      .order("sort_order");
    if (error) toast.error("Błąd pobierania");
    setRows((data ?? []) as Instructor[]);
    setLoading(false);
  }

  async function save(row: Instructor) {
    setSaving(row.id);
    const { error } = await supabase
      .from("instructors")
      .update({
        full_name: row.full_name,
        bio: row.bio,
        avatar_url: row.avatar_url,
        is_active: row.is_active,
        sort_order: row.sort_order,
      })
      .eq("id", row.id);
    setSaving(null);
    if (error) toast.error("Nie udało się zapisać");
    else toast.success("Zapisano");
  }

  async function create() {
    if (!newRow.full_name) {
      toast.error("Imię i nazwisko wymagane");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("instructors").insert(newRow);
    setCreating(false);
    if (error) toast.error("Nie udało się utworzyć");
    else {
      toast.success("Dodano instruktorkę");
      setNewRow(empty);
      void load();
    }
  }

  async function remove(id: string) {
    if (!confirm("Usunąć tę instruktorkę?")) return;
    const { error } = await supabase.from("instructors").delete().eq("id", id);
    if (error) toast.error("Nie udało się usunąć (sprawdź powiązane zajęcia)");
    else {
      toast.success("Usunięto");
      void load();
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border bg-background p-6">
        <h3 className="font-display text-xl">Dodaj instruktorkę</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Input label="Imię i nazwisko" value={newRow.full_name} onChange={(v) => setNewRow({ ...newRow, full_name: v })} />
          <Input
            label="URL zdjęcia"
            value={newRow.avatar_url ?? ""}
            onChange={(v) => setNewRow({ ...newRow, avatar_url: v })}
          />
          <Input
            label="Kolejność"
            type="number"
            value={String(newRow.sort_order)}
            onChange={(v) => setNewRow({ ...newRow, sort_order: Number(v) })}
          />
          <div className="flex items-end">
            <button
              onClick={create}
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs uppercase tracking-widest text-cream hover:bg-terracotta disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Dodaj
            </button>
          </div>
          <div className="md:col-span-4">
            <Textarea
              label="Bio"
              value={newRow.bio ?? ""}
              onChange={(v) => setNewRow({ ...newRow, bio: v })}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-sm text-foreground/80">
          <Loader2 className="h-4 w-4 animate-spin" /> Ładowanie…
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-background p-4">
              <div className="grid gap-3 md:grid-cols-4">
                <Input
                  label="Imię i nazwisko"
                  value={r.full_name}
                  onChange={(v) => updateRow(setRows, r.id, { full_name: v })}
                />
                <Input
                  label="URL zdjęcia"
                  value={r.avatar_url ?? ""}
                  onChange={(v) => updateRow(setRows, r.id, { avatar_url: v })}
                />
                <Input
                  label="Kolejność"
                  type="number"
                  value={String(r.sort_order)}
                  onChange={(v) => updateRow(setRows, r.id, { sort_order: Number(v) })}
                />
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={r.is_active}
                      onChange={(e) => updateRow(setRows, r.id, { is_active: e.target.checked })}
                    />
                    Aktywna
                  </label>
                </div>
                <div className="md:col-span-4">
                  <Textarea
                    label="Bio"
                    value={r.bio ?? ""}
                    onChange={(v) => updateRow(setRows, r.id, { bio: v })}
                  />
                </div>
                <div className="md:col-span-4 flex justify-end gap-2">
                  <button
                    onClick={() => remove(r.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-foreground/20 px-3 py-1.5 text-xs hover:bg-foreground/5"
                  >
                    <Trash2 className="h-3 w-3" /> Usuń
                  </button>
                  <button
                    onClick={() => save(r)}
                    disabled={saving === r.id}
                    className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs uppercase tracking-widest text-cream hover:bg-terracotta disabled:opacity-50"
                  >
                    {saving === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Zapisz
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function updateRow<T extends { id: string }>(
  setter: React.Dispatch<React.SetStateAction<T[]>>,
  id: string,
  patch: Partial<T>,
) {
  setter((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-widest text-foreground/60">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-widest text-foreground/60">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}
