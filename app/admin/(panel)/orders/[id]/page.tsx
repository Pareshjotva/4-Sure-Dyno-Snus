import { AdminOrderEditForm } from "@/components/admin/order-edit-form";
import { requireSession } from "@/lib/auth";
import { getOrderById, getPricing, getProducts } from "@/lib/db";
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

  const [products, pricing] = await Promise.all([
    getProducts(false),
    getPricing(order.province),
  ]);
  const pricingPtt = Object.fromEntries(
    pricing.map((row) => [row.productId, row.ptt])
  );

  return (
    <AdminOrderEditForm
      order={order}
      products={products}
      pricingPtt={pricingPtt}
    />
  );
}
