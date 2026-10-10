import { AdminOrderEditForm } from "@/components/admin/order-edit-form";
import { requireSession } from "@/lib/auth";
import { getOrderById, getPricing, getProducts, getUserById } from "@/lib/db";
import { profileStatus, PROFILE_STATUS_LABEL } from "@/lib/profile-status";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const order = await getOrderById(id);
  return { title: order ? `Order ${order.orderNumber}` : "Order" };
}

export default async function AdminOrderEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession("admin");
  if (!session) redirect("/admin/login");
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const [products, pricing, customer] = await Promise.all([
    getProducts(false),
    getPricing(order.province),
    getUserById(order.userId),
  ]);
  const verification = customer
    ? profileStatus(customer)
    : order.profileVerificationStatus;
  const pricingPtt = Object.fromEntries(
    pricing.map((row) => [row.productId, row.ptt])
  );

  return (
    <div>
      {verification && verification !== "verified" && (
        <p className="mb-4 rounded-xl border border-warn-yellow/40 bg-warn-yellow/10 px-4 py-3 text-sm font-semibold text-warn-yellow">
          Pending Profile Verification — this customer&apos;s profile and license
          have not been verified ({PROFILE_STATUS_LABEL[verification]}).
        </p>
      )}
      <AdminOrderEditForm
        order={order}
        products={products}
        pricingPtt={pricingPtt}
      />
    </div>
  );
}
