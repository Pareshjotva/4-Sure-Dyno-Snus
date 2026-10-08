import { AdminProductsClient } from "@/components/admin/products-client";
import { requireSession } from "@/lib/auth";
import { getProducts } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AdminProductsPage() {
  const session = await requireSession("admin");
  if (!session) redirect("/admin/login");
  const products = await getProducts(false);

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Products</h1>
      <p className="mt-2 text-sm text-slate-ink">
        List, add, edit, and delete Dyno catalogue items — including product
        photos.
      </p>
      <div className="mt-6">
        <AdminProductsClient products={products} />
      </div>
    </div>
  );
}
