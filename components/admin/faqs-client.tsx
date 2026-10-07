"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FieldErrors } from "@/lib/form-errors";
import { faqSchema } from "@/lib/form-schemas";
import type { Faq } from "@/lib/types";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Draft = {
  question: string;
  answer: string;
  published: boolean;
  sortOrder: string;
};

const emptyDraft = (): Draft => ({
  question: "",
  answer: "",
  published: true,
  sortOrder: "",
});

function toDraft(faq: Faq): Draft {
  return {
    question: faq.question,
    answer: faq.answer,
    published: faq.published,
    sortOrder: String(faq.sortOrder ?? ""),
  };
}

export function AdminFaqsClient({ faqs }: { faqs: Faq[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(faqs);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function openCreate() {
    setMode("create");
    setEditingId(null);
    setDraft(emptyDraft());
    setMessage("");
    setError("");
    setFieldErrors({});
  }

  function openEdit(faq: Faq) {
    setMode("edit");
    setEditingId(faq.id);
    setDraft(toDraft(faq));
    setMessage("");
    setError("");
    setFieldErrors({});
  }

  function backToList(next?: Faq[]) {
    if (next) setRows(next);
    setMode("list");
    setEditingId(null);
    setDraft(emptyDraft());
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const payload = {
      question: draft.question,
      answer: draft.answer,
      published: draft.published,
      sortOrder: draft.sortOrder.trim() === "" ? undefined : Number(draft.sortOrder),
    };
    const parsed = faqSchema.safeParse(payload);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});
    setBusy(true);
    try {
      const res = await fetch(
        mode === "create" ? "/api/admin/faqs" : `/api/admin/faqs/${editingId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        if (json.fieldErrors) {
          setFieldErrors(json.fieldErrors);
          return;
        }
        throw new Error(json.error || "Unable to save the FAQ.");
      }
      const next =
        mode === "create"
          ? [...rows, json.faq].sort((a, b) => a.sortOrder - b.sortOrder)
          : rows
              .map((row) => (row.id === editingId ? json.faq : row))
              .sort((a, b) => a.sortOrder - b.sortOrder);
      setRows(next);
      setMessage(mode === "create" ? "FAQ created" : "FAQ updated");
      backToList(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this FAQ?")) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setError("Delete failed");
      return;
    }
    setRows((prev) => prev.filter((row) => row.id !== id));
    setMessage("FAQ deleted");
    router.refresh();
  }

  if (mode === "list") {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-ink">
            {rows.length} question{rows.length === 1 ? "" : "s"}
          </p>
          <Button onClick={openCreate}>
            <Plus size={16} /> Add FAQ
          </Button>
        </div>
        {message && <p className="text-sm text-cyan">{message}</p>}
        {error && <p className="text-sm text-warn-red">{error}</p>}
        <div className="space-y-3">
          {rows.map((faq) => (
            <article
              key={faq.id}
              className="surface flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"
            >
              <div>
                <p className="font-semibold text-white">{faq.question}</p>
                <p className="mt-1 text-xs text-white/60">
                  Order {faq.sortOrder} · {faq.published ? "Published" : "Draft"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(faq)}>
                  <Pencil size={14} /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => onDelete(faq.id)}
                  disabled={busy}
                >
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            </article>
          ))}
          {rows.length === 0 && (
            <p className="text-sm text-slate-ink">No questions yet.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-white">
          {mode === "create" ? "Add FAQ" : "Edit FAQ"}
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={() => backToList()}>
          <X size={14} /> Back to listing
        </Button>
      </div>
      {error && <p className="text-sm text-warn-red">{error}</p>}
      <div className="surface space-y-4 rounded-2xl p-5">
        <label className="flex items-center gap-2 text-sm text-white">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(e) =>
              setDraft((d) => ({ ...d, published: e.target.checked }))
            }
          />
          Published — show on the FAQ page
        </label>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
            Question
          </label>
          <Input
            value={draft.question}
            onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
          />
          <FieldError message={fieldErrors.question} />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
            Answer
          </label>
          <Textarea
            className="min-h-40"
            value={draft.answer}
            onChange={(e) => setDraft((d) => ({ ...d, answer: e.target.value }))}
          />
          <FieldError message={fieldErrors.answer} />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
            Sort order
          </label>
          <Input
            inputMode="numeric"
            value={draft.sortOrder}
            placeholder="Leave blank to add at the end"
            onChange={(e) => setDraft((d) => ({ ...d, sortOrder: e.target.value }))}
          />
          <FieldError message={fieldErrors.sortOrder} />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : mode === "create" ? "Create FAQ" : "Save FAQ"}
        </Button>
      </div>
    </form>
  );
}
