import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getUserById, updateUser } from "@/lib/db";
import { zodFieldErrors } from "@/lib/form-errors";
import { licenceNumberSchema } from "@/lib/form-schemas";
import { z } from "zod";

const bodySchema = z.object({
  licenceNumber: licenceNumberSchema,
});

export async function POST(req: Request) {
  const session = await requireSession("retailer");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserById(session.id);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.licenceNumber?.trim()) {
    return NextResponse.json({
      ok: true,
      licenceNumber: user.licenceNumber,
    });
  }

  try {
    const body = bodySchema.parse(await req.json());
    const updated = await updateUser(session.id, {
      licenceNumber: body.licenceNumber,
    });
    return NextResponse.json({
      ok: true,
      licenceNumber: updated?.licenceNumber,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { fieldErrors: zodFieldErrors(err) },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Could not save the licence number." },
      { status: 400 }
    );
  }
}
