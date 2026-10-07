import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { deleteFaq, updateFaq } from "@/lib/db";
import { zodFieldErrors } from "@/lib/form-errors";
import { faqSchema } from "@/lib/form-schemas";
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
    const body = faqSchema.parse(await req.json());
    const faq = await updateFaq(id, {
      question: body.question,
      answer: body.answer,
      published: body.published ?? true,
      sortOrder: body.sortOrder,
    });
    if (!faq) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, faq });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { fieldErrors: zodFieldErrors(err) },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Unable to update the FAQ. Try again." },
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
  const ok = await deleteFaq(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
