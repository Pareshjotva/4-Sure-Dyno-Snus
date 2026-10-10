import { ProgramRules } from "@/components/retailer/program-rules";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth";
import { getIncentives } from "@/lib/db";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Retailer Program",
};

export default async function AccountProgramPage() {
  const session = await requireSession("retailer");
  if (!session) redirect("/login");
  const incentives = await getIncentives();

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Retailer Program</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-ink">
        Volume discounts for your shop: hit a monthly pack threshold and the
        discount applies on the new order. This module is only the Retailer
        Program incentive tiers.
      </p>
      <div className="mt-6">
        <ProgramRules tiers={incentives} />
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/account/order/new">
          <Button>Place an order</Button>
        </Link>
        <Link href="/retailer">
          <Button variant="outline">Public program page</Button>
        </Link>
      </div>
    </div>
  );
}
