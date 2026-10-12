"use client";

import { Button } from "@/components/ui/button";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

export type TrashKind =
  | "product"
  | "blog"
  | "faq"
  | "order"
  | "retailer"
  | "lead"
  | "wholesale";

export async function setTrash(kind: TrashKind, id: string, restore = false) {
  const res = await fetch("/api/admin/trash", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, id, restore }),
  });
  if (!res.ok) throw new Error("Could not update archive");
}

export async function setTrashMany(
  kind: TrashKind,
  ids: string[],
  restore = false
) {
  const res = await fetch("/api/admin/trash", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, ids, restore }),
  });
  if (!res.ok) throw new Error("Could not update archive");
}

export async function purgeTrash(kind: TrashKind, id: string) {
  const res = await fetch("/api/admin/trash", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, id, permanent: true }),
  });
  if (!res.ok) throw new Error("Could not permanently delete");
}

export async function purgeTrashMany(kind: TrashKind, ids: string[]) {
  const res = await fetch("/api/admin/trash", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, ids, permanent: true }),
  });
  if (!res.ok) throw new Error("Could not permanently delete");
}

export function TrashBinButton({
  open,
  count,
  onToggle,
}: {
  open: boolean;
  count: number;
  onToggle: () => void;
}) {
  return (
    <Button type="button" variant={open ? "primary" : "outline"} onClick={onToggle}>
      <Archive size={16} />
      {open ? "Back to list" : `Archive (${count})`}
    </Button>
  );
}

export function TrashAction({
  trashed,
  busy,
  onTrash,
  onRestore,
  onPurge,
}: {
  trashed: boolean;
  busy?: boolean;
  onTrash: () => void;
  onRestore: () => void;
  onPurge: () => void;
}) {
  return (
    <>
      {trashed ? (
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onRestore}>
          <ArchiveRestore size={14} /> Restore
        </Button>
      ) : (
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onTrash}>
          <Archive size={14} /> Archive
        </Button>
      )}
      <Button type="button" size="sm" variant="danger" disabled={busy} onClick={onPurge}>
        <Trash2 size={14} /> Delete permanently
      </Button>
    </>
  );
}

export function useListSelection(visibleIds: string[]) {
  const [selected, setSelected] = useState<string[]>([]);

  const visibleSet = useMemo(() => new Set(visibleIds), [visibleIds]);
  const selectedVisible = selected.filter((id) => visibleSet.has(id));
  const allVisibleSelected =
    visibleIds.length > 0 && selectedVisible.length === visibleIds.length;

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function toggleAllVisible() {
    setSelected((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleSet.has(id));
      }
      const merged = new Set(current);
      visibleIds.forEach((id) => merged.add(id));
      return [...merged];
    });
  }

  function clear() {
    setSelected([]);
  }

  function removeIds(ids: string[]) {
    const drop = new Set(ids);
    setSelected((current) => current.filter((id) => !drop.has(id)));
  }

  return {
    selected,
    selectedVisible,
    allVisibleSelected,
    toggle,
    toggleAllVisible,
    clear,
    removeIds,
    setSelected,
  };
}

export function ListSelectCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white/80">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-white/30 bg-black accent-cyan"
        aria-label={label}
      />
      <span className="sr-only sm:not-sr-only sm:inline">{label}</span>
    </label>
  );
}

export function BulkArchiveBar({
  count,
  archivedView,
  busy,
  onArchive,
  onRestore,
  onPurge,
  onClear,
}: {
  count: number;
  archivedView: boolean;
  busy?: boolean;
  onArchive: () => void;
  onRestore: () => void;
  onPurge: () => void;
  onClear: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-cyan/30 bg-cyan/10 px-3 py-2 text-sm text-white">
      <span className="font-semibold">{count} selected</span>
      {archivedView ? (
        <Button type="button" size="sm" disabled={busy} onClick={onRestore}>
          <ArchiveRestore size={14} /> Restore selected
        </Button>
      ) : (
        <Button type="button" size="sm" disabled={busy} onClick={onArchive}>
          <Archive size={14} /> Archive selected
        </Button>
      )}
      <Button type="button" size="sm" variant="danger" disabled={busy} onClick={onPurge}>
        <Trash2 size={14} /> Delete permanently
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
