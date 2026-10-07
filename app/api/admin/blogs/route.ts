import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { createBlog } from "@/lib/db";
import { zodFieldErrors } from "@/lib/form-errors";
import { blogSchema } from "@/lib/form-schemas";
import { slugify } from "@/lib/slug";
import { z } from "zod";

export async function POST(req: Request) {
  const session = await requireSession("admin");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = blogSchema.parse(await req.json());
    const blog = await createBlog({
      title: body.title,
      slug: body.slug?.trim() || slugify(body.title),
      excerpt: body.excerpt,
      body: body.body,
      published: body.published ?? true,
      image: body.image || "",
      imageTwo: body.imageTwo || "",
    });
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
      { error: "Unable to create the blog post. Try again." },
      { status: 400 }
    );
  }
}
