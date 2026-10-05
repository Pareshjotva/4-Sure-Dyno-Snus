import { NextResponse } from "next/server";
import { createSession, hashPassword } from "@/lib/auth";
import { createUser } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  company: z.string().min(2),
  phone: z.string().optional(),
  province: z.string().min(2),
  address: z.string().optional(),
  licenceNumber: z.string().min(3),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const passwordHash = await hashPassword(data.password);
    const user = await createUser({
      name: data.name,
      email: data.email,
      passwordHash,
      role: "retailer",
      company: data.company,
      phone: data.phone,
      province: data.province,
      address: data.address,
      licenceNumber: data.licenceNumber,
    });
    const session = await createSession(user);
    return NextResponse.json({ ok: true, user: session });
  } catch (err) {
    const message =
      err instanceof Error && err.message.includes("already")
        ? err.message
        : "Unable to create account. Check your details.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
