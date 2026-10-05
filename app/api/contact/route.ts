import { NextResponse } from "next/server";
import { createLead } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  province: z.string().optional(),
  message: z.string().min(5),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
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
    const message =
      err instanceof z.ZodError
        ? "Please check the form fields."
        : "Unable to submit inquiry.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
