import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-mist px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-navy",
        className
      )}
      {...props}
    />
  );
}
