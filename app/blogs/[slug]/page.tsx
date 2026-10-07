import { SiteShell } from "@/components/layout/site-shell";
import { getBlogBySlug } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);
  if (!blog || !blog.published) return { title: "Blog" };
  return { title: blog.title, description: blog.excerpt };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);
  if (!blog || !blog.published) notFound();

  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link href="/blogs" className="text-sm font-semibold text-cyan">
          ← All posts
        </Link>
        <p className="mt-6 text-xs uppercase tracking-wider text-cyan">
          {formatDate(blog.createdAt)}
        </p>
        <h1 className="mt-2 font-display text-4xl text-white sm:text-5xl">
          {blog.title}
        </h1>
        {(blog.image || blog.imageTwo) && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            {blog.image && (
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black">
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
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black">
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
        <p className="mt-4 text-lg text-white/80">{blog.excerpt}</p>
        <div className="mt-8 whitespace-pre-wrap text-sm leading-relaxed text-white/75">
          {blog.body}
        </div>
      </article>
    </SiteShell>
  );
}
