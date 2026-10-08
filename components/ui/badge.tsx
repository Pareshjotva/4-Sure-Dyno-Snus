import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-white/8 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white",
        className
      )}
      {...props}
    />
  );
}
