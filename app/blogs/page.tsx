import { BlogList } from "@/components/blogs/blog-list";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { getBlogs } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blogs",
  description: "News and notes from 4Sure International and Dyno Snus.",
};

export default async function BlogsPage() {
  const blogs = await getBlogs(true);

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Badge>Blogs</Badge>
        <h1 className="mt-3 font-display text-4xl text-navy sm:text-5xl">
          From the Dyno desk
        </h1>
        <BlogList blogs={blogs} />
      </div>
    </SiteShell>
  );
}
