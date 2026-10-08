"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FieldErrors } from "@/lib/form-errors";
import { blogSchema } from "@/lib/form-schemas";
import type { Blog } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

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

  async function onDelete(id: string) {
    if (!confirm("Delete this blog post?")) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setError("Delete failed");
      return;
    }
    setRows((prev) => prev.filter((row) => row.id !== id));
    setMessage("Blog post deleted");
    router.refresh();
  }

  if (mode === "list") {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-ink">
            {rows.length} post{rows.length === 1 ? "" : "s"}
          </p>
          <Button onClick={openCreate}>
            <Plus size={16} /> Add blog
          </Button>
        </div>
        {message && <p className="text-sm text-cyan">{message}</p>}
        {error && <p className="text-sm text-warn-red">{error}</p>}
        <div className="space-y-3">
          {rows.map((blog) => (
            <article
              key={blog.id}
              className="surface flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"
            >
              <div>
                <p className="font-semibold text-navy">{blog.title}</p>
                <p className="mt-1 text-xs text-navy/60">
                  {formatDate(blog.createdAt)} · {blog.published ? "Published" : "Draft"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(blog)}>
                  <Pencil size={14} /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => onDelete(blog.id)}
                  disabled={busy}
                >
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            </article>
          ))}
          {rows.length === 0 && (
            <p className="text-sm text-slate-ink">No blog posts yet.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-navy">
          {mode === "create" ? "Add blog" : "Edit blog"}
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={() => backToList()}>
          <X size={14} /> Back to listing
        </Button>
      </div>
      {error && <p className="text-sm text-warn-red">{error}</p>}
      <div className="surface space-y-4 rounded-2xl p-5">
        <label className="flex items-center gap-2 text-sm text-navy">
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
          <label className="mb-1 block text-xs uppercase tracking-wide text-navy/50">
            Title
          </label>
          <Input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
          <FieldError message={fieldErrors.title} />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-navy/50">
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
          <label className="mb-1 block text-xs uppercase tracking-wide text-navy/50">
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
            <label className="mb-1 block text-xs uppercase tracking-wide text-navy/50">
              Image 1
            </label>
            <Input
              value={draft.image}
              onChange={(e) => setDraft((d) => ({ ...d, image: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-navy/50">
              Image 2
            </label>
            <Input
              value={draft.imageTwo}
              onChange={(e) => setDraft((d) => ({ ...d, imageTwo: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-navy/50">
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
