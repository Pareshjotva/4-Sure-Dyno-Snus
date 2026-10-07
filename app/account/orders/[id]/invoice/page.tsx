import { InvoiceDocument } from "@/components/orders/invoice-document";
import { requireSession } from "@/lib/auth";
import { getOrderById, getOrders, getPricing, getUserById } from "@/lib/db";
import { buildInvoice } from "@/lib/invoice";
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
  if (!order) return { title: "Invoice" };
  const orders = await getOrders();
  const invoice = buildInvoice(order, null, [], orders);
  return { title: `Invoice ${invoice.number}` };
}

export default async function RetailerInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession("retailer");
  if (!session) redirect("/login");
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order || order.userId !== session.id) notFound();

  const [user, pricing, orders] = await Promise.all([
    getUserById(order.userId),
    getPricing(order.province),
    getOrders(),
  ]);

  return (
    <InvoiceDocument
      invoice={buildInvoice(order, user, pricing, orders)}
      backHref="/account/orders"
      backLabel="Back to orders"
    />
  );
}
