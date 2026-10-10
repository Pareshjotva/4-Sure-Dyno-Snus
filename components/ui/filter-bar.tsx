"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function matchesQuery(query: string, ...parts: Array<string | number | undefined | null>) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return parts
    .filter((part) => part !== undefined && part !== null)
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export function FilterBar({
  query,
  onQuery,
  placeholder = "Search",
  status = "",
  onStatus,
  statuses,
}: {
  query: string;
  onQuery: (value: string) => void;
  placeholder?: string;
  status?: string;
  onStatus?: (value: string) => void;
  statuses?: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Input
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        placeholder={placeholder}
        className="max-w-sm"
        aria-label={placeholder}
      />
      {statuses && onStatus && (
        <Select
          value={status}
          onChange={(event) => onStatus(event.target.value)}
          className="max-w-56"
          aria-label="Status"
        >
          <option value="">All statuses</option>
          {statuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}
