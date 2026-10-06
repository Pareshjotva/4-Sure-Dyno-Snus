import { z } from "zod";

export type FieldErrors = Record<string, string>;

export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    const name = typeof key === "string" || typeof key === "number" ? String(key) : "form";
    if (!fieldErrors[name]) fieldErrors[name] = issue.message;
  }
  return fieldErrors;
}

export function optionalText(min: number, message: string) {
  return z
    .string()
    .trim()
    .refine((value) => value.length === 0 || value.length >= min, message);
}
