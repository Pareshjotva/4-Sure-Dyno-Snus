"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FieldErrors } from "@/lib/form-errors";
import { productSchema } from "@/lib/form-schemas";
import type { Product } from "@/lib/types";
import { Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Draft = {
  name: string;
  shortName: string;
  slug: string;
  tagline: string;
  description: string;
  flavour: string;
  nicotinePerPortionMg: number;
  nicotinePerGramMg: number;
  pouchesPerPack: string;
  packSize: string;
  format: string;
  origin: string;
  active: boolean;
  image: string;
  overviewImage: string;
};

const DEFAULT_IMAGE = "/images/dyno-extreme.jpg";
const DEFAULT_OVERVIEW = "/images/extreme-overview.jpg";

const emptyDraft = (): Draft => ({
  name: "",
  shortName: "",
  slug: "",
  tagline: "",
  description: "",
  flavour: "",
  nicotinePerPortionMg: 0,
  nicotinePerGramMg: 0,
  pouchesPerPack: "Approx. 73–75 slim pouches",
  packSize: "50 g resealable soft pack",
  format: "Slim pouch",
  origin: "Produced in Norway",
  active: true,
  image: DEFAULT_IMAGE,
  overviewImage: DEFAULT_OVERVIEW,
});

function toDraft(product: Product): Draft {
  return {
    name: product.name,
    shortName: product.shortName,
    slug: product.slug,
    tagline: product.tagline,
    description: product.description,
    flavour: product.flavour,
    nicotinePerPortionMg: product.nicotinePerPortionMg,
    nicotinePerGramMg: product.nicotinePerGramMg,
    pouchesPerPack: product.pouchesPerPack,
    packSize: product.packSize,
    format: product.format,
    origin: product.origin,
    active: product.active,
    image: product.image,
    overviewImage: product.overviewImage,
  };
}

export function AdminProductsClient({ products }: { products: Product[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(products);
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

  function openEdit(product: Product) {
    setMode("edit");
    setEditingId(product.id);
    setDraft(toDraft(product));
    setMessage("");
    setError("");
    setFieldErrors({});
  }

  function backToList(next?: Product[]) {
    if (next) setRows(next);
    setMode("list");
    setEditingId(null);
    setDraft(emptyDraft());
  }

  async function refreshList() {
    router.refresh();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const parsed = productSchema.safeParse(draft);
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
      if (mode === "create") {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
        const json = await res.json();
        if (!res.ok) {
          if (json.fieldErrors) {
            setFieldErrors(json.fieldErrors);
            return;
          }
          throw new Error(json.error || "Unable to create the product. Try again.");
        }
        setRows((prev) => [...prev, json.product]);
        setMessage("Product created");
        backToList([...rows, json.product]);
      } else if (mode === "edit" && editingId) {
        const res = await fetch(`/api/admin/products/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
        const json = await res.json();
        if (!res.ok) {
          if (json.fieldErrors) {
            setFieldErrors(json.fieldErrors);
            return;
          }
          throw new Error(json.error || "Unable to update the product. Try again.");
        }
        const next = rows.map((p) => (p.id === editingId ? json.product : p));
        setRows(next);
        setMessage("Product updated");
        backToList(next);
      }
      await refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this product permanently?")) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setError("Delete failed");
      return;
    }
    const next = rows.filter((p) => p.id !== id);
    setRows(next);
    setMessage("Product deleted");
    if (editingId === id) backToList(next);
    await refreshList();
  }

  async function uploadPhoto(field: "image" | "overviewImage", file: File) {
    setBusy(true);
    setError("");
    if (!editingId && draft[field].startsWith("/uploads/products/")) {
      await fetch(
        `/api/admin/products/upload?path=${encodeURIComponent(draft[field])}`,
        { method: "DELETE" }
      );
    }
    const form = new FormData();
    form.append("field", field);
    form.append("file", file);
    const url = editingId
      ? `/api/admin/products/${editingId}/image`
      : "/api/admin/products/upload";
    const res = await fetch(url, { method: "POST", body: form });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Upload failed");
      return;
    }
    setDraft((d) => ({ ...d, [field]: json.path }));
    if (editingId && json.product) {
      setRows((prev) =>
        prev.map((p) => (p.id === editingId ? json.product : p))
      );
      await refreshList();
    }
    setMessage(
      editingId
        ? `${field === "image" ? "Main" : "Overview"} photo updated`
        : `${field === "image" ? "Main" : "Overview"} photo ready. Save the product to keep it.`
    );
  }

  async function deletePhoto(field: "image" | "overviewImage") {
    if (!confirm("Remove this product photo?")) return;
    if (!editingId) {
      const current = draft[field];
      if (current.startsWith("/uploads/products/")) {
        await fetch(
          `/api/admin/products/upload?path=${encodeURIComponent(current)}`,
          { method: "DELETE" }
        );
      }
      setDraft((d) => ({
        ...d,
        [field]: field === "image" ? DEFAULT_IMAGE : DEFAULT_OVERVIEW,
      }));
      setMessage("Photo removed");
      return;
    }
    setBusy(true);
    const res = await fetch(
      `/api/admin/products/${editingId}/image?field=${field}`,
      { method: "DELETE" }
    );
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Could not remove photo");
      return;
    }
    setDraft((d) => ({ ...d, [field]: json.product[field] }));
    setRows((prev) =>
      prev.map((p) => (p.id === editingId ? json.product : p))
    );
    setMessage("Photo removed");
    await refreshList();
  }

  if (mode === "list") {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-ink">
            {rows.length} product{rows.length === 1 ? "" : "s"} in catalogue
          </p>
          <Button onClick={openCreate}>
            <Plus size={16} /> Add product
          </Button>
        </div>
        {message && <p className="text-sm text-cyan">{message}</p>}
        {error && <p className="text-sm text-warn-red">{error}</p>}

        {rows.length === 0 ? (
          <p className="surface rounded-2xl px-4 py-10 text-center text-sm text-slate-ink">
            No products yet. Add your first SKU.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((product) => (
              <article
                key={product.id}
                className="surface flex h-full flex-col rounded-2xl p-4"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-black">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
                  />
                </div>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{product.name}</p>
                    <p className="text-xs text-white/45">{product.slug}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold uppercase ${
                      product.active
                        ? "bg-cyan/20 text-cyan"
                        : "bg-white/10 text-white/50"
                    }`}
                  >
                    {product.active ? "Active" : "Hidden"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/75">
                  {product.nicotinePerPortionMg} mg / portion
                  <br />
                  {product.nicotinePerGramMg} mg / g
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(product)}
                  >
                    <Pencil size={14} /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => onDelete(product.id)}
                    disabled={busy}
                  >
                    <Trash2 size={14} /> Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-white">
          {mode === "create" ? "Add product" : "Edit product"}
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => backToList()}
        >
          <X size={14} /> Back to listing
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["image", "Main photo"],
            ["overviewImage", "Overview photo"],
          ] as const
        ).map(([field, label]) => (
          <div key={field} className="surface rounded-xl p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan">
              {label}
            </p>
            <div className="relative mb-3 aspect-video overflow-hidden rounded-lg bg-black">
              <Image
                src={draft[field]}
                alt={label}
                fill
                className="object-cover"
                sizes="400px"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm text-white hover:border-cyan">
                <Upload size={14} />
                Upload
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPhoto(field, file);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={() => deletePhoto(field)}
                disabled={busy}
              >
                <Trash2 size={14} /> Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="surface space-y-4 rounded-2xl p-5">
        <label className="flex items-center gap-2 text-sm text-white">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(e) =>
              setDraft((d) => ({ ...d, active: e.target.checked }))
            }
          />
          Active on site
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
              Name
            </label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
            <FieldError message={fieldErrors.name} />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
              Short name
            </label>
            <Input
              value={draft.shortName}
              onChange={(e) =>
                setDraft((d) => ({ ...d, shortName: e.target.value }))
              }
            />
            <FieldError message={fieldErrors.shortName} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
            Slug
          </label>
          <Input
            placeholder="auto from name if empty"
            value={draft.slug}
            onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
          />
          <FieldError message={fieldErrors.slug} />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
            Tagline
          </label>
            <Input
            value={draft.tagline}
            onChange={(e) =>
              setDraft((d) => ({ ...d, tagline: e.target.value }))
            }
          />
          <FieldError message={fieldErrors.tagline} />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
            Description
          </label>
          <Textarea
            value={draft.description}
            onChange={(e) =>
              setDraft((d) => ({ ...d, description: e.target.value }))
            }
          />
          <FieldError message={fieldErrors.description} />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
            Flavour
          </label>
          <Input
            value={draft.flavour}
            onChange={(e) =>
              setDraft((d) => ({ ...d, flavour: e.target.value }))
            }
          />
          <FieldError message={fieldErrors.flavour} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
              Nicotine / portion (mg)
            </label>
            <Input
              type="number"
              value={draft.nicotinePerPortionMg}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  nicotinePerPortionMg: Number(e.target.value),
                }))
              }
            />
            <FieldError message={fieldErrors.nicotinePerPortionMg} />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
              Nicotine / gram (mg)
            </label>
            <Input
              type="number"
              value={draft.nicotinePerGramMg}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  nicotinePerGramMg: Number(e.target.value),
                }))
              }
            />
            <FieldError message={fieldErrors.nicotinePerGramMg} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
              Pouches / pack
            </label>
            <Input
              value={draft.pouchesPerPack}
              onChange={(e) =>
                setDraft((d) => ({ ...d, pouchesPerPack: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-white/50">
              Pack size
            </label>
            <Input
              value={draft.packSize}
              onChange={(e) =>
                setDraft((d) => ({ ...d, packSize: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-warn-red">{error}</p>}
      {message && <p className="text-sm text-cyan">{message}</p>}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}>
          {busy
            ? "Saving…"
            : mode === "create"
              ? "Create product"
              : "Update product"}
        </Button>
        {mode === "edit" && editingId && (
          <Button
            type="button"
            variant="danger"
            disabled={busy}
            onClick={() => onDelete(editingId)}
          >
            <Trash2 size={14} /> Delete product
          </Button>
        )}
      </div>
    </form>
  );
}
