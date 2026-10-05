import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan focus:ring-2 focus:ring-cyan/25",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
