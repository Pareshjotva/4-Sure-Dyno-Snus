import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { getBlogs } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

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
        <div className="mt-8 space-y-4">
          {blogs.map((blog) => (
            <article key={blog.id} className="surface overflow-hidden rounded-2xl">
              {(blog.image || blog.imageTwo) && (
                <div className="grid grid-cols-2">
                  {blog.image && (
                    <div className="relative aspect-[4/3] bg-black">
                      <Image
                        src={blog.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width:768px) 50vw, 360px"
                      />
                    </div>
                  )}
                  {blog.imageTwo && (
                    <div className="relative aspect-[4/3] bg-black">
                      <Image
                        src={blog.imageTwo}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width:768px) 50vw, 360px"
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="p-5">
              <p className="text-xs uppercase tracking-wider text-cyan">
                {formatDate(blog.createdAt)}
              </p>
              <h2 className="mt-2 font-display text-3xl text-white">
                <Link href={`/blogs/${blog.slug}`} className="hover:text-cyan">
                  {blog.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                {blog.excerpt}
              </p>
              <Link
                href={`/blogs/${blog.slug}`}
                className="mt-3 inline-block text-sm font-semibold text-cyan"
              >
                Read post
              </Link>
              </div>
            </article>
          ))}
          {blogs.length === 0 && (
            <p className="text-sm text-slate-ink">No posts yet.</p>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
