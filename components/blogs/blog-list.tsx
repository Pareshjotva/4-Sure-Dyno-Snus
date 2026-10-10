"use client";

import { FilterBar, matchesQuery } from "@/components/ui/filter-bar";
import type { Blog } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function BlogList({ blogs }: { blogs: Blog[] }) {
  const [query, setQuery] = useState("");
  const visible = blogs.filter((blog) =>
    matchesQuery(query, blog.title, blog.excerpt, formatDate(blog.createdAt))
  );

  return (
    <div className="mt-8 space-y-4">
      <FilterBar query={query} onQuery={setQuery} placeholder="Search posts" />
      {visible.map((blog) => (
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
            <p className="mt-2 text-sm leading-relaxed text-white/75">{blog.excerpt}</p>
            <Link
              href={`/blogs/${blog.slug}`}
              className="mt-3 inline-block text-sm font-semibold text-cyan"
            >
              Read post
            </Link>
          </div>
        </article>
      ))}
      {visible.length === 0 && (
        <p className="text-sm text-slate-ink">
          {blogs.length === 0 ? "No posts yet." : "Nothing matches this filter."}
        </p>
      )}
    </div>
  );
}
