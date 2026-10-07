import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { deleteBlog, updateBlog } from "@/lib/db";
import { zodFieldErrors } from "@/lib/form-errors";
import { blogSchema } from "@/lib/form-schemas";
import { slugify } from "@/lib/slug";
import { z } from "zod";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  try {
    const body = blogSchema.parse(await req.json());
    const blog = await updateBlog(id, {
      title: body.title,
      slug: body.slug?.trim() || slugify(body.title),
      excerpt: body.excerpt,
      body: body.body,
      published: body.published ?? true,
      image: body.image || "",
      imageTwo: body.imageTwo || "",
    });
    if (!blog) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, blog });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { fieldErrors: zodFieldErrors(err) },
        { status: 400 }
      );
    }
    if (err instanceof Error && err.message === "Slug already exists") {
      return NextResponse.json(
        { fieldErrors: { slug: "That slug is already used. Choose another." } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Unable to update the blog post. Try again." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await deleteBlog(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
