import { NextResponse } from "next/server";
import { createSession, hashPassword } from "@/lib/auth";
import { createUser } from "@/lib/db";
import { zodFieldErrors } from "@/lib/form-errors";
import { registerSchema } from "@/lib/form-schemas";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);
    const passwordHash = await hashPassword(data.password);
    const user = await createUser({
      name: data.name,
      email: data.email,
      passwordHash,
      role: "retailer",
      phone: data.phone,
      verificationReview: undefined,
    });
    const session = await createSession(user);
    return NextResponse.json({ ok: true, user: session });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { fieldErrors: zodFieldErrors(err) },
        { status: 400 }
      );
    }
    if (err instanceof Error && err.message.includes("already")) {
      return NextResponse.json(
        {
          fieldErrors: {
            email: "An account with this email already exists.",
          },
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Unable to create the account. Try again." },
      { status: 400 }
    );
  }
}
