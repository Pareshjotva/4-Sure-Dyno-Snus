import { cn } from "@/lib/utils";
import { SelectHTMLAttributes, forwardRef } from "react";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-11 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-white outline-none transition focus:border-cyan focus:ring-2 focus:ring-cyan/25",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
