"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { FieldErrors } from "@/lib/form-errors";
import { wholesaleInquirySchema } from "@/lib/form-schemas";
import { FormEvent, useState } from "react";

function issuesToFields(issues: { path: PropertyKey[]; message: string }[]) {
  const next: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !next[key]) next[key] = issue.message;
  }
  return next;
}

export function WholesaleInquiryForm({
  embedded = false,
  onSuccess,
}: {
  embedded?: boolean;
  onSuccess?: () => void;
}) {
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
    const parsed = wholesaleInquirySchema.safeParse(data);
    if (!parsed.success) {
      setStatus("error");
      setErrors(issuesToFields(parsed.error.issues));
      return;
    }

    setStatus("loading");
    setErrors({});

    try {
      const res = await fetch("/api/wholesale-inquiry", {
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
      setMessage("Thanks — your wholesale inquiry was sent. Our team will follow up.");
      form.reset();
      onSuccess?.();
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "Unable to send the inquiry. Try again."
      );
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={
        embedded ? "space-y-4" : "surface space-y-4 rounded-2xl p-6"
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
            Contact name
          </label>
          <Input name="name" placeholder="Your name" />
          <FieldError message={errors.name} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
            Business email
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
            Company / store
          </label>
          <Input name="company" placeholder="Legal business name" />
          <FieldError message={errors.company} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
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
            Licence number
          </label>
          <Input name="licenceNumber" placeholder="Optional" />
          <FieldError message={errors.licenceNumber} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
          Business address
        </label>
        <Input name="address" placeholder="Optional" />
        <FieldError message={errors.address} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy/70">
          What do you need?
        </label>
        <Textarea
          name="message"
          placeholder="Tell us about your store, product interest, and volume needs."
        />
        <FieldError message={errors.message} />
      </div>
      <Button type="submit" disabled={status === "loading"} className="w-full sm:w-auto">
        {status === "loading" ? "Sending…" : "Send wholesale inquiry"}
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
