"use client";

import { Button } from "@/components/ui/button";
import { confirmAction } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function AdminProfileForm({
  signInEmail,
  name,
  companyName,
  phone,
  address,
  website,
  emails,
}: {
  signInEmail: string;
  name: string;
  companyName: string;
  phone: string;
  address: string;
  website: string;
  emails: string[];
}) {
  const router = useRouter();
  const [contactName, setContactName] = useState(name);
  const [company, setCompany] = useState(companyName);
  const [phoneValue, setPhoneValue] = useState(phone);
  const [addressValue, setAddressValue] = useState(address);
  const [websiteValue, setWebsiteValue] = useState(website);
  const [emailValues, setEmailValues] = useState(emails.length ? emails : [""]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateEmail(index: number, value: string) {
    setEmailValues((current) =>
      current.map((email, emailIndex) => (emailIndex === index ? value : email))
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const ok = await confirmAction("Save admin profile changes?", {
      confirmLabel: "Yes, save",
    });
    if (!ok) return;
    setSaving(true);
    setMessage("");
    setError("");
    const res = await fetch("/api/admin/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: contactName,
        companyName: company,
        phone: phoneValue,
        address: addressValue,
        website: websiteValue,
        emails: emailValues.map((email) => email.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || "Could not save the profile.");
      return;
    }
    setMessage("Saved. The website contact details now use this information.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-2xl space-y-6">
      <div className="surface space-y-4 rounded-2xl p-5">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70">
            Sign-in email
          </label>
          <Input value={signInEmail} readOnly />
          <p className="mt-1 text-xs text-white/45">
            This is the email used to sign in. It is not shown as a public contact.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70">
            Contact name
          </label>
          <Input
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
            placeholder="Name shown on the website"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70">
            Company
          </label>
          <Input
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70">
            Phone
          </label>
          <Input
            value={phoneValue}
            onChange={(event) => setPhoneValue(event.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70">
            Address
          </label>
          <Textarea
            value={addressValue}
            onChange={(event) => setAddressValue(event.target.value)}
            rows={3}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/70">
            Website
          </label>
          <Input
            value={websiteValue}
            onChange={(event) => setWebsiteValue(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-white/70">
            Public emails
          </label>
          {emailValues.map((email, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(event) => updateEmail(index, event.target.value)}
                placeholder="name@company.com"
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setEmailValues((current) => current.filter((_, i) => i !== index))
                }
                disabled={emailValues.length <= 1}
              >
                Remove
              </Button>
            </div>
          ))}
          {emailValues.length < 4 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEmailValues((current) => [...current, ""])}
            >
              Add email
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-warn-red" role="alert">
          {error}
        </p>
      )}
      {message && <p className="text-sm text-cyan">{message}</p>}

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
