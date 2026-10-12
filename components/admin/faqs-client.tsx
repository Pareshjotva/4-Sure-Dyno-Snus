"use client";

import {
  BulkArchiveBar,
  ListSelectCheckbox,
  TrashAction,
  TrashBinButton,
  purgeTrash,
  purgeTrashMany,
  setTrash,
  setTrashMany,
  useListSelection,
} from "@/components/admin/trash-bin";
import { confirmAction } from "@/components/ui/confirm-dialog";
import { FilterBar, matchesQuery } from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FieldErrors } from "@/lib/form-errors";
import { faqSchema } from "@/lib/form-schemas";
import type { Faq } from "@/lib/types";
import { Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

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
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [bin, setBin] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const listPool = rows.filter((faq) => (bin ? faq.trashedAt : !faq.trashedAt));
  const listVisible = listPool.filter(
    (faq) =>
      (!status || (status === "published" ? faq.published : !faq.published)) &&
      matchesQuery(query, faq.question, faq.answer)
  );
  const visibleIds = useMemo(
    () => listVisible.map((faq) => faq.id),
    [listVisible]
  );
  const selection = useListSelection(visibleIds);

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
    const ok = await confirmAction(
      mode === "create" ? "Create this FAQ?" : "Save FAQ changes?",
      { confirmLabel: mode === "create" ? "Yes, create" : "Yes, save" }
    );
    if (!ok) return;
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

  async function onTrash(id: string, restore = false) {
    if (
      !restore &&
      !(await confirmAction("Archive this question?", {
        danger: true,
        confirmLabel: "Yes, archive",
      }))
    ) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await setTrash("faq", id, restore);
    } catch {
      setBusy(false);
      setError(restore ? "Could not restore the question." : "Could not archive the question.");
      return;
    }
    setBusy(false);
    const stamp = restore ? null : new Date().toISOString();
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, trashedAt: stamp } : row)));
    setMessage(restore ? "Question restored" : "Question archived");
    selection.removeIds([id]);
    router.refresh();
  }

  async function onBulk(restore: boolean) {
    const ids = selection.selectedVisible;
    if (!ids.length) return;
    const ok = await confirmAction(
      restore
        ? `Restore ${ids.length} selected question${ids.length === 1 ? "" : "s"}?`
        : `Archive ${ids.length} selected question${ids.length === 1 ? "" : "s"}?`,
      {
        danger: !restore,
        confirmLabel: restore ? "Yes, restore" : "Yes, archive",
      }
    );
    if (!ok) return;
    setBulkBusy(true);
    setError("");
    try {
      await setTrashMany("faq", ids, restore);
    } catch {
      setBulkBusy(false);
      setError(restore ? "Could not restore questions." : "Could not archive questions.");
      return;
    }
    setBulkBusy(false);
    const stamp = restore ? null : new Date().toISOString();
    setRows((prev) =>
      prev.map((row) => (ids.includes(row.id) ? { ...row, trashedAt: stamp } : row))
    );
    setMessage(restore ? "Questions restored" : "Questions archived");
    selection.removeIds(ids);
    router.refresh();
  }
  async function onPurge(id: string) {
    if (
      !(await confirmAction(
        "Permanently delete this question? This cannot be undone.",
        { danger: true, confirmLabel: "Yes, delete forever" }
      ))
    ) {
      return;
    }
    setBusy(true);
    try {
      await purgeTrash("faq", id);
    } catch {
      setBusy(false);
      return;
    }
    setBusy(false);
    setRows((prev) => prev.filter((row) => row.id !== id));
    selection.removeIds([id]);
    router.refresh();
  }

  async function onBulkPurge() {
    const ids = selection.selectedVisible;
    if (!ids.length) return;
    const ok = await confirmAction(
      `Permanently delete ${ids.length} selected question${ids.length === 1 ? "" : "s"}? This cannot be undone.`,
      { danger: true, confirmLabel: "Yes, delete forever" }
    );
    if (!ok) return;
    setBulkBusy(true);
    try {
      await purgeTrashMany("faq", ids);
    } catch {
      setBulkBusy(false);
      return;
    }
    setBulkBusy(false);
    setRows((prev) => prev.filter((row) => !ids.includes(row.id)));
    selection.removeIds(ids);
    router.refresh();
  }

  if (mode === "list") {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-ink">
            {listPool.length} question{listPool.length === 1 ? "" : "s"}
            {bin ? " archived" : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <TrashBinButton
              open={bin}
              count={rows.filter((faq) => faq.trashedAt).length}
              onToggle={() => {
                setBin((current) => !current);
                selection.clear();
              }}
            />
            {!bin && (
              <Button onClick={openCreate}>
                <Plus size={16} /> Add FAQ
              </Button>
            )}
          </div>
        </div>
        {message && <p className="text-sm text-cyan">{message}</p>}
        {error && <p className="text-sm text-warn-red">{error}</p>}
        <FilterBar
          query={query}
          onQuery={setQuery}
          placeholder="Search questions"
          status={status}
          onStatus={setStatus}
          statuses={[
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ListSelectCheckbox
            checked={selection.allVisibleSelected}
            onChange={selection.toggleAllVisible}
            label="Select all"
          />
          <BulkArchiveBar
            count={selection.selectedVisible.length}
            archivedView={bin}
            busy={bulkBusy || busy}
            onArchive={() => onBulk(false)}
          onPurge={onBulkPurge}
            onRestore={() => onBulk(true)}
            onClear={selection.clear}
          />
        </div>
        <div className="space-y-3">
          {listVisible.map((faq) => (
            <article
              key={faq.id}
              className="surface flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"
            >
              <div className="flex min-w-0 items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-white/30 bg-black accent-cyan"
                  checked={selection.selected.includes(faq.id)}
                  onChange={() => selection.toggle(faq.id)}
                  aria-label={`Select ${faq.question}`}
                />
                <div>
                  <p className="font-semibold text-white">{faq.question}</p>
                  <p className="mt-1 text-xs text-white/60">
                    Order {faq.sortOrder} · {faq.published ? "Published" : "Draft"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {!bin && (
                  <Button size="sm" variant="outline" onClick={() => openEdit(faq)}>
                    <Pencil size={14} /> Edit
                  </Button>
                )}
                <TrashAction
                  trashed={Boolean(faq.trashedAt)}
                  busy={busy}
                  onTrash={() => onTrash(faq.id)}
                  onRestore={() => onTrash(faq.id, true)}
                  onPurge={() => onPurge(faq.id)}
                />
              </div>
            </article>
          ))}
          {listVisible.length === 0 && (
            <p className="text-sm text-slate-ink">
              {listPool.length === 0
                ? bin
                  ? "Archive is empty."
                  : "No questions yet."
                : "Nothing matches this filter."}
            </p>
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
