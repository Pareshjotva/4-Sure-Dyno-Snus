import { NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const user = await authenticate(data.email, data.password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }
    const session = await createSession(user);
    return NextResponse.json({ ok: true, user: session });
  } catch {
    return NextResponse.json({ error: "Login failed." }, { status: 400 });
  }
}
