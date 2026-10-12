"use client";

import {
  BulkArchiveBar,
  ListSelectCheckbox,
  TrashAction,
  TrashBinButton,
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
import { blogSchema } from "@/lib/form-schemas";
import type { Blog } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type Draft = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  published: boolean;
  image: string;
  imageTwo: string;
};

const emptyDraft = (): Draft => ({
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  published: true,
  image: "/images/dyno-extreme.jpg",
  imageTwo: "/images/dyno-blast.jpg",
});

function toDraft(blog: Blog): Draft {
  return {
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    body: blog.body,
    published: blog.published,
    image: blog.image || "",
    imageTwo: blog.imageTwo || "",
  };
}

export function AdminBlogsClient({ blogs }: { blogs: Blog[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(blogs);
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
  const listPool = rows.filter((blog) => (bin ? blog.trashedAt : !blog.trashedAt));
  const listVisible = listPool.filter(
    (blog) =>
      (!status || (status === "published" ? blog.published : !blog.published)) &&
      matchesQuery(query, blog.title, blog.excerpt)
  );
  const visibleIds = useMemo(
    () => listVisible.map((blog) => blog.id),
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

  function openEdit(blog: Blog) {
    setMode("edit");
    setEditingId(blog.id);
    setDraft(toDraft(blog));
    setMessage("");
    setError("");
    setFieldErrors({});
  }

  function backToList(next?: Blog[]) {
    if (next) setRows(next);
    setMode("list");
    setEditingId(null);
    setDraft(emptyDraft());
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const parsed = blogSchema.safeParse(draft);
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
      mode === "create" ? "Create this blog post?" : "Save blog post changes?",
      { confirmLabel: mode === "create" ? "Yes, create" : "Yes, save" }
    );
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(
        mode === "create" ? "/api/admin/blogs" : `/api/admin/blogs/${editingId}`,
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
        throw new Error(json.error || "Unable to save the blog post.");
      }
      const next =
        mode === "create"
          ? [json.blog, ...rows]
          : rows.map((row) => (row.id === editingId ? json.blog : row));
      setRows(next);
      setMessage(mode === "create" ? "Blog post created" : "Blog post updated");
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
      !(await confirmAction("Archive this blog post?", {
        danger: true,
        confirmLabel: "Yes, archive",
      }))
    ) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await setTrash("blog", id, restore);
    } catch {
      setBusy(false);
      setError(restore ? "Could not restore the post." : "Could not archive the post.");
      return;
    }
    setBusy(false);
    const stamp = restore ? null : new Date().toISOString();
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, trashedAt: stamp } : row)));
    setMessage(restore ? "Blog post restored" : "Blog post archived");
    selection.removeIds([id]);
    router.refresh();
  }

  async function onBulk(restore: boolean) {
    const ids = selection.selectedVisible;
    if (!ids.length) return;
    const ok = await confirmAction(
      restore
        ? `Restore ${ids.length} selected post${ids.length === 1 ? "" : "s"}?`
        : `Archive ${ids.length} selected post${ids.length === 1 ? "" : "s"}?`,
      {
        danger: !restore,
        confirmLabel: restore ? "Yes, restore" : "Yes, archive",
      }
    );
    if (!ok) return;
    setBulkBusy(true);
    setError("");
    try {
      await setTrashMany("blog", ids, restore);
    } catch {
      setBulkBusy(false);
      setError(restore ? "Could not restore posts." : "Could not archive posts.");
      return;
    }
    setBulkBusy(false);
    const stamp = restore ? null : new Date().toISOString();
    setRows((prev) =>
      prev.map((row) => (ids.includes(row.id) ? { ...row, trashedAt: stamp } : row))
    );
    setMessage(restore ? "Posts restored" : "Posts archived");
    selection.removeIds(ids);
    router.refresh();
  }

  if (mode === "list") {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-ink">
            {listPool.length} post{listPool.length === 1 ? "" : "s"}
            {bin ? " archived" : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <TrashBinButton
              open={bin}
              count={rows.filter((blog) => blog.trashedAt).length}
              onToggle={() => {
                setBin((current) => !current);
                selection.clear();
              }}
            />
            {!bin && (
              <Button onClick={openCreate}>
                <Plus size={16} /> Add blog
              </Button>
            )}
          </div>
        </div>
        {message && <p className="text-sm text-cyan">{message}</p>}
        {error && <p className="text-sm text-warn-red">{error}</p>}
        <FilterBar
          query={query}
          onQuery={setQuery}
          placeholder="Search posts"
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
            onRestore={() => onBulk(true)}
            onClear={selection.clear}
          />
        </div>
        <div className="space-y-3">
          {listVisible.map((blog) => (
            <article
              key={blog.id}
              className="surface flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"
            >
              <div className="flex min-w-0 items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-white/30 bg-black accent-cyan"
                  checked={selection.selected.includes(blog.id)}
                  onChange={() => selection.toggle(blog.id)}
                  aria-label={`Select ${blog.title}`}
                />
                <div>
                  <p className="font-semibold text-white">{blog.title}</p>
                  <p className="mt-1 text-xs text-white/60">
                    {formatDate(blog.createdAt)} · {blog.published ? "Published" : "Draft"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {!bin && (
                  <Button size="sm" variant="outline" onClick={() => openEdit(blog)}>
                    <Pencil size={14} /> Edit
                  </Button>
                )}
                <TrashAction
                  trashed={Boolean(blog.trashedAt)}
                  busy={busy}
                  onTrash={() => onTrash(blog.id)}
                  onRestore={() => onTrash(blog.id, true)}
                />
              </div>
            </article>
          ))}
          {listVisible.length === 0 && (
            <p className="text-sm text-slate-ink">
              {listPool.length === 0
                ? bin
                  ? "Archive is empty."
                  : "No blog posts yet."
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
          {mode === "create" ? "Add blog" : "Edit blog"}
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
          Published — show on the blogs page
        </label>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
            Title
          </label>
          <Input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
          <FieldError message={fieldErrors.title} />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
            Slug
          </label>
          <Input
            value={draft.slug}
            placeholder="auto from title if empty"
            onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
          />
          <FieldError message={fieldErrors.slug} />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
            Excerpt
          </label>
          <Textarea
            value={draft.excerpt}
            onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))}
          />
          <FieldError message={fieldErrors.excerpt} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
              Image 1
            </label>
            <Input
              value={draft.image}
              onChange={(e) => setDraft((d) => ({ ...d, image: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
              Image 2
            </label>
            <Input
              value={draft.imageTwo}
              onChange={(e) => setDraft((d) => ({ ...d, imageTwo: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
            Post
          </label>
          <Textarea
            className="min-h-56"
            value={draft.body}
            onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
          />
          <FieldError message={fieldErrors.body} />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : mode === "create" ? "Create post" : "Save post"}
        </Button>
      </div>
    </form>
  );
}
