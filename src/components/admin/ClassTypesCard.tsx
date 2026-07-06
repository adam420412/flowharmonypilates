import { useEffect, useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ClassType = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  color: string;
  duration_minutes: number;
  is_active: boolean;
  sort_order: number;
  default_price_grosz: number | null;
};

const empty: Omit<ClassType, "id"> = {
  slug: "",
  name: "",
  description: "",
  color: "#C2725A",
  duration_minutes: 55,
  is_active: true,
  sort_order: 0,
  default_price_grosz: null,
};

export function ClassTypesCard() {
  const [rows, setRows] = useState<ClassType[]>([]);
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
      .from("class_types")
      .select("*")
      .order("sort_order");
    if (error) toast.error("Błąd pobierania typów");
    setRows((data ?? []) as ClassType[]);
    setLoading(false);
  }

  async function save(row: ClassType) {
    setSaving(row.id);
    const { error } = await supabase
      .from("class_types")
      .update({
        name: row.name,
        slug: row.slug,
        description: row.description,
        color: row.color,
        duration_minutes: row.duration_minutes,
        is_active: row.is_active,
        sort_order: row.sort_order,
        default_price_grosz: row.default_price_grosz,
      })
      .eq("id", row.id);
    setSaving(null);
    if (error) toast.error("Nie udało się zapisać");
    else toast.success("Zapisano");
  }

  async function create() {
    if (!newRow.name || !newRow.slug) {
      toast.error("Nazwa i slug są wymagane");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("class_types").insert(newRow);
    setCreating(false);
    if (error) toast.error("Nie udało się utworzyć");
    else {
      toast.success("Dodano typ zajęć");
      setNewRow(empty);
      void load();
    }
  }

  async function remove(id: string) {
    if (!confirm("Usunąć ten typ? Może być powiązany z istniejącymi zajęciami.")) return;
    const { error } = await supabase.from("class_types").delete().eq("id", id);
    if (error) toast.error("Nie udało się usunąć (sprawdź powiązane zajęcia)");
    else {
      toast.success("Usunięto");
      void load();
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-border bg-background p-6">
        <h3 className="font-display text-xl">Dodaj typ zajęć</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-6">
          <Input label="Slug" value={newRow.slug} onChange={(v) => setNewRow({ ...newRow, slug: v })} />
          <Input label="Nazwa" value={newRow.name} onChange={(v) => setNewRow({ ...newRow, name: v })} />
          <Input
            label="Czas (min)"
            type="number"
            value={String(newRow.duration_minutes)}
            onChange={(v) => setNewRow({ ...newRow, duration_minutes: Number(v) })}
          />
          <Input
            label="Kolor"
            type="color"
            value={newRow.color}
            onChange={(v) => setNewRow({ ...newRow, color: v })}
          />
          <Input
            label="Kolejność"
            type="number"
            value={String(newRow.sort_order)}
            onChange={(v) => setNewRow({ ...newRow, sort_order: Number(v) })}
          />
          <Input
            label="Domyślna cena (zł)"
            type="number"
            value={newRow.default_price_grosz != null ? String(newRow.default_price_grosz / 100) : ""}
            onChange={(v) => {
              const n = parseFloat(v.replace(",", "."));
              setNewRow({ ...newRow, default_price_grosz: isFinite(n) && n >= 0 ? Math.round(n * 100) : null });
            }}
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
          <div className="md:col-span-6">
            <Input
              label="Opis (opcjonalny)"
              value={newRow.description ?? ""}
              onChange={(v) => setNewRow({ ...newRow, description: v })}
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
              <div className="grid gap-3 md:grid-cols-6">
                <Input label="Slug" value={r.slug} onChange={(v) => updateRow(setRows, r.id, { slug: v })} />
                <Input label="Nazwa" value={r.name} onChange={(v) => updateRow(setRows, r.id, { name: v })} />
                <Input
                  label="Czas (min)"
                  type="number"
                  value={String(r.duration_minutes)}
                  onChange={(v) => updateRow(setRows, r.id, { duration_minutes: Number(v) })}
                />
                <Input
                  label="Kolor"
                  type="color"
                  value={r.color}
                  onChange={(v) => updateRow(setRows, r.id, { color: v })}
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
                    Aktywny
                  </label>
                </div>
                <div className="md:col-span-6">
                  <Input
                    label="Opis"
                    value={r.description ?? ""}
                    onChange={(v) => updateRow(setRows, r.id, { description: v })}
                  />
                </div>
                <div className="md:col-span-6 flex justify-end gap-2">
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
