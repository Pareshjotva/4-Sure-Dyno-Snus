import { NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/auth";
import { zodFieldErrors } from "@/lib/form-errors";
import { loginSchema } from "@/lib/form-schemas";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);
    const user = await authenticate(data.email, data.password);
    if (!user) {
      return NextResponse.json(
        {
          fieldErrors: {
            password: "That email and password do not match.",
          },
        },
        { status: 401 }
      );
    }
    const session = await createSession(user);
    return NextResponse.json({ ok: true, user: session });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { fieldErrors: zodFieldErrors(err) },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Login failed." }, { status: 400 });
  }
}
