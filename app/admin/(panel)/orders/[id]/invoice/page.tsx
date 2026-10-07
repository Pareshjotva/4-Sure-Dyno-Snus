import { InvoiceDocument } from "@/components/orders/invoice-document";
import { requireSession } from "@/lib/auth";
import { getOrderById, getOrders, getPricing, getSite, getUserById } from "@/lib/db";
import { buildInvoice } from "@/lib/invoice";
import { invoicePaymentEmail } from "@/lib/site";
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

export default async function AdminInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession("admin");
  if (!session) redirect("/admin/login");
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const [user, pricing, orders, site] = await Promise.all([
    getUserById(order.userId),
    getPricing(order.province),
    getOrders(),
    getSite(),
  ]);

  return (
    <InvoiceDocument
      invoice={buildInvoice(order, user, pricing, orders)}
      orderId={order.id}
      canEdit
      backHref="/admin/orders"
      backLabel="Back to orders"
      contact={{
        email: invoicePaymentEmail(site.email, site.secondaryEmail),
        phone: site.phone,
      }}
    />
  );
}
