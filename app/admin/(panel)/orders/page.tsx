import { AdminOrdersClient } from "@/components/admin/orders-client";
import { requireSession } from "@/lib/auth";
import { getOrders, getProducts, getUsers } from "@/lib/db";
import { profileStatus, PROFILE_STATUS_LABEL } from "@/lib/profile-status";
import { redirect } from "next/navigation";

export default async function AdminOrdersPage() {
  const session = await requireSession("admin");
  if (!session) redirect("/admin/login");
  const [orders, products, users] = await Promise.all([
    getOrders(),
    getProducts(false),
    getUsers(),
  ]);
  const images = Object.fromEntries(
    products.map((product) => [product.id, product.image])
  );
  const byId = new Map(users.map((user) => [user.id, user]));
  const rows = orders.map((order) => {
    const user = byId.get(order.userId);
    const verificationStatus = user
      ? profileStatus(user)
      : order.profileVerificationStatus || "incomplete";
    return {
      ...order,
      profileVerificationStatus: verificationStatus,
      pendingProfileVerification: verificationStatus !== "verified",
      verificationLabel: PROFILE_STATUS_LABEL[verificationStatus],
    };
  });

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Orders</h1>
      <p className="mt-2 text-sm text-slate-ink">
        Update fulfillment status for retailer wholesale orders.
      </p>
      <div className="mt-6">
        <AdminOrdersClient orders={rows} images={images} />
      </div>
    </div>
  );
}
