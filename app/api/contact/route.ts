import { NextResponse } from "next/server";
import { createLead } from "@/lib/db";
import { zodFieldErrors } from "@/lib/form-errors";
import { contactSchema } from "@/lib/form-schemas";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = contactSchema.parse(body);
    const lead = await createLead({
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      company: data.company || undefined,
      province: data.province || undefined,
      message: data.message,
    });
    return NextResponse.json({ ok: true, id: lead.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { fieldErrors: zodFieldErrors(err) },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Unable to submit inquiry." },
      { status: 400 }
    );
  }
}
