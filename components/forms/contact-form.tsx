"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FieldErrors } from "@/lib/form-errors";
import { contactSchema } from "@/lib/form-schemas";
import { FormEvent, useState } from "react";

function issuesToFields(issues: { path: PropertyKey[]; message: string }[]) {
  const next: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !next[key]) next[key] = issue.message;
  }
  return next;
}

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const parsed = contactSchema.safeParse(data);
    if (!parsed.success) {
      setStatus("error");
      setErrors(issuesToFields(parsed.error.issues));
      return;
    }

    setStatus("loading");
    setErrors({});

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.fieldErrors) {
          setStatus("error");
          setErrors(json.fieldErrors);
          return;
        }
        throw new Error(json.error || "Unable to send the inquiry. Try again.");
      }
      setStatus("ok");
      setMessage("Thanks — our team will follow up shortly.");
      form.reset();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Unable to send the inquiry. Try again.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="surface space-y-4 rounded-2xl p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
            Full name
          </label>
          <Input name="name" placeholder="Your name" />
          <FieldError message={errors.name} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
            Email
          </label>
          <Input name="email" type="email" placeholder="you@store.com" />
          <FieldError message={errors.email} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
            Phone
          </label>
          <Input name="phone" placeholder="Optional" />
          <FieldError message={errors.phone} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
            Company
          </label>
          <Input name="company" placeholder="Store / business name" />
          <FieldError message={errors.company} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
          Province
        </label>
        <Select name="province" defaultValue="BC">
          <option value="BC">British Columbia</option>
          <option value="AB">Alberta</option>
          <option value="ON">Ontario</option>
          <option value="Other">Other</option>
        </Select>
        <FieldError message={errors.province} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
          Message
        </label>
        <Textarea
          name="message"
          placeholder="Tell us about your store, licence status, and product interest."
        />
        <FieldError message={errors.message} />
      </div>
      <Button type="submit" disabled={status === "loading"} className="w-full sm:w-auto">
        {status === "loading" ? "Sending…" : "Send inquiry"}
      </Button>
      {message && (
        <p
          className={`text-sm ${status === "ok" ? "text-cyan" : "text-warn-red"}`}
          role={status === "ok" ? "status" : "alert"}
        >
          {message}
        </p>
      )}
    </form>
  );
}
