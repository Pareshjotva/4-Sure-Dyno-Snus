import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes, forwardRef } from "react";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-28 w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan focus:ring-2 focus:ring-cyan/25",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
