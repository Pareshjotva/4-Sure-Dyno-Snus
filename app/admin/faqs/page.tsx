import { AdminFaqsClient } from "@/components/admin/faqs-client";
import { requireSession } from "@/lib/auth";
import { getFaqs } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  const session = await requireSession("admin");
  if (!session) redirect("/login");
  const faqs = await getFaqs(false);

  return (
    <div>
      <h1 className="font-display text-3xl text-white">FAQ</h1>
      <p className="mt-2 text-sm text-slate-ink">
        Add and edit questions. Published items appear on the FAQ page.
      </p>
      <div className="mt-6">
        <AdminFaqsClient faqs={faqs} />
      </div>
    </div>
  );
}
