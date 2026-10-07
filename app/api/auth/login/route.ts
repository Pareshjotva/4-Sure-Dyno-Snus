import { NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/auth";
import { zodFieldErrors } from "@/lib/form-errors";
import { loginSchema } from "@/lib/form-schemas";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const audience = body?.audience === "admin" ? "admin" : "retailer";
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
    if (user.role !== audience) {
      return NextResponse.json(
        {
          error:
            audience === "admin"
              ? "This sign-in is for admin accounts only."
              : "This is the retailer sign-in. Staff should use the admin sign-in.",
        },
        { status: 403 }
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
