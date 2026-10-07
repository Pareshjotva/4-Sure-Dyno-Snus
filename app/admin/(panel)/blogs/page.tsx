import { AdminBlogsClient } from "@/components/admin/blogs-client";
import { requireSession } from "@/lib/auth";
import { getBlogs } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminBlogsPage() {
  const session = await requireSession("admin");
  if (!session) redirect("/admin/login");
  const blogs = await getBlogs(false);

  return (
    <div>
      <h1 className="font-display text-3xl text-white">Blogs</h1>
      <p className="mt-2 text-sm text-slate-ink">
        Add, edit, and publish posts. Published posts appear on the site and in
        the footer.
      </p>
      <div className="mt-6">
        <AdminBlogsClient blogs={blogs} />
      </div>
    </div>
  );
}
