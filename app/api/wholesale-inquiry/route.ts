import { NextResponse } from "next/server";
import { createWholesaleInquiry } from "@/lib/db";
import { zodFieldErrors } from "@/lib/form-errors";
import { wholesaleInquirySchema } from "@/lib/form-schemas";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = wholesaleInquirySchema.parse(body);
    const inquiry = await createWholesaleInquiry({
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      company: data.company,
      province: data.province,
      address: data.address || undefined,
      licenceNumber: data.licenceNumber || undefined,
      message: data.message,
    });
    return NextResponse.json({ ok: true, id: inquiry.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { fieldErrors: zodFieldErrors(err) },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Unable to submit wholesale inquiry." },
      { status: 400 }
    );
  }
}
